import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { ISchedulerJob } from "../../../src/scheduler/contracts/internal/scheduler/scheduler-job.contract.js";
import type { TSchedulerPhase } from "../../../src/scheduler/types/internal/scheduler/scheduler-phase.type.js";
import { SchedulerRuntime } from "../../../src/scheduler/runtime/scheduler.runtime.js";
import { OwnershipManager } from "../../../src/ownership/runtime/ownership.manager.js";
import { ownershipContext } from "../../../src/ownership/runtime/ownership-context.manager.js";

function job(phase: TSchedulerPhase, execute: () => void): ISchedulerJob {
    return {
        phase,
        execute: () => {
            execute();
            return undefined;
        },
    } as unknown as ISchedulerJob;
}

describe("scheduler runtime", () => {
    test("runs FIFO jobs once and skips cancelled appearances", () => {
        const scheduler = new SchedulerRuntime(new OwnershipManager());
        const order: string[] = [];
        const first = job("render", () => order.push("first"));
        const cancelled = job("render", () => order.push("cancelled"));
        const last = job("render", () => order.push("last"));

        scheduler.enqueue(first);
        scheduler.enqueue(first);
        scheduler.enqueue(cancelled);
        scheduler.enqueue(last);
        scheduler.cancel(cancelled);
        scheduler.cancel(cancelled);
        scheduler.flush();

        assert.deepEqual(order, ["first", "last"]);
    });

    test("preserves phase order and defers active-phase reentry", () => {
        const scheduler = new SchedulerRuntime(new OwnershipManager());
        const order: string[] = [];
        const deferredRender = job("render", () => order.push("render:next"));
        const joinedEffect = job("effect", () => order.push("effect:joined"));
        const initialEffect = job("effect", () => order.push("effect:initial"));
        const initialRender = job("render", () => {
            order.push("render:initial");
            scheduler.enqueue(deferredRender);
            scheduler.enqueue(joinedEffect);
        });

        scheduler.enqueue(initialEffect);
        scheduler.enqueue(initialRender);
        scheduler.flush();

        assert.deepEqual(order, [
            "render:initial",
            "effect:initial",
            "effect:joined",
            "render:next",
        ]);
    });

    test("allows one later appearance after a job begins and ignores recursive flush", () => {
        const scheduler = new SchedulerRuntime(new OwnershipManager());
        let executions = 0;
        let repeated: ISchedulerJob;

        repeated = job("effect", () => {
            executions += 1;
            scheduler.flush();

            if (executions === 1) {
                scheduler.enqueue(repeated);
                scheduler.enqueue(repeated);
            }
        });

        scheduler.enqueue(repeated);
        scheduler.flush();

        assert.equal(executions, 2);
    });

    test("restores a captured owner and continues after handled failures", () => {
        const ownership = new OwnershipManager();
        const scheduler = new SchedulerRuntime(ownership);
        const root = ownership.scope();
        const handled = new Error("handled");
        const order: string[] = [];
        const boundary = root.boundary((event) => {
            assert.equal(event.error, handled);
            order.push("boundary");
            return "handled";
        });

        boundary.run(() => {
            scheduler.enqueue(job("effect", () => {
                assert.equal(ownershipContext.active, boundary);
                order.push("failed");
                throw handled;
            }));
            scheduler.enqueue(job("effect", () => {
                assert.equal(ownershipContext.active, boundary);
                order.push("continued");
            }));
        });

        scheduler.flush();
        assert.deepEqual(order, ["failed", "boundary", "continued"]);
        assert.equal(ownershipContext.active, null);
    });

    test("aborts and clears pending work after an unhandled failure", () => {
        const scheduler = new SchedulerRuntime(new OwnershipManager());
        const failure = new Error("unhandled");
        const order: string[] = [];
        const remaining = job("effect", () => order.push("remaining"));

        scheduler.enqueue(job("render", () => {
            order.push("failed");
            throw failure;
        }));
        scheduler.enqueue(remaining);

        assert.throws(() => scheduler.flush(), (error) => error === failure);
        scheduler.flush();
        assert.deepEqual(order, ["failed"]);

        scheduler.enqueue(remaining);
        scheduler.flush();
        assert.deepEqual(order, ["failed", "remaining"]);
    });

    test("rejects owner capture across ownership runtimes", () => {
        const firstOwnership = new OwnershipManager();
        const secondScheduler = new SchedulerRuntime(new OwnershipManager());
        const scope = firstOwnership.scope();

        scope.run(() => {
            assert.throws(
                () => secondScheduler.enqueue(job("effect", () => undefined)),
                /across reactive runtimes/,
            );
        });
    });

    test("executes at most 100 cycles and clears the overflowing appearance", () => {
        const scheduler = new SchedulerRuntime(new OwnershipManager());
        let executions = 0;
        let repeated: ISchedulerJob;

        repeated = job("effect", () => {
            executions += 1;
            scheduler.enqueue(repeated);
        });

        scheduler.enqueue(repeated);
        assert.throws(() => scheduler.flush(), /100-cycle flush limit/);
        assert.equal(executions, 100);
        assert.doesNotThrow(() => scheduler.flush());
    });

    test("routes the cycle-limit failure through the overflowing job owner", () => {
        const ownership = new OwnershipManager();
        const scheduler = new SchedulerRuntime(ownership);
        const root = ownership.scope();
        let handled = false;
        let repeated: ISchedulerJob;
        const boundary = root.boundary((event) => {
            assert.match(String(event.error), /100-cycle flush limit/);
            handled = true;
            return "handled";
        });

        boundary.run(() => {
            repeated = job("effect", () => scheduler.enqueue(repeated));
            scheduler.enqueue(repeated);
        });

        assert.doesNotThrow(() => scheduler.flush());
        assert.equal(handled, true);
    });
});
