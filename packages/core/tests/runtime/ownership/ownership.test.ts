import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { OwnershipManager } from "../../../src/ownership/runtime/ownership.manager.js";
import { ownershipContext } from "../../../src/ownership/runtime/ownership-context.manager.js";

describe("ownership runtime", () => {
    test("restores nested active owners after success and failure", () => {
        const manager = new OwnershipManager();
        const parent = manager.scope();
        const child = parent.child();
        const failure = new Error("failure");

        parent.run(() => {
            assert.equal(ownershipContext.active, parent);

            child.run(() => {
                assert.equal(ownershipContext.active, child);
                return undefined;
            });

            assert.equal(ownershipContext.active, parent);
            return undefined;
        });

        assert.equal(ownershipContext.active, null);
        assert.throws(
            () =>
                parent.run(() => {
                    throw failure;
                }),
            (error) => error === failure,
        );
        assert.equal(ownershipContext.active, null);
    });

    test("disposes child scopes and cleanups in one LIFO ledger", () => {
        const manager = new OwnershipManager();
        const parent = manager.scope();
        const order: string[] = [];

        parent.cleanup(() => {
            order.push("parent:first");
            return undefined;
        });

        const child = parent.child();
        child.cleanup(() => {
            order.push("child");
            return undefined;
        });

        parent.cleanup(() => {
            order.push("parent:last");
            return undefined;
        });

        parent.dispose();
        parent.dispose();

        assert.deepEqual(order, ["parent:last", "child", "parent:first"]);
        assert.throws(() => parent.run(() => undefined));
        assert.throws(() => child.run(() => undefined));
    });

    test("attempts every cleanup and aggregates unhandled disposal errors", () => {
        const manager = new OwnershipManager();
        const scope = manager.scope();
        const first = new Error("first");
        const second = new Error("second");
        const order: string[] = [];

        scope.cleanup(() => {
            order.push("first");
            throw first;
        });
        scope.cleanup(() => {
            order.push("middle");
            return undefined;
        });
        scope.cleanup(() => {
            order.push("second");
            throw second;
        });

        assert.throws(
            () => scope.dispose(),
            (error) => {
                assert.ok(error instanceof AggregateError);
                assert.deepEqual(error.errors, [second, first]);
                return true;
            },
        );
        assert.deepEqual(order, ["second", "middle", "first"]);
        assert.doesNotThrow(() => scope.dispose());
    });

    test("routes handled and propagated failures through nearest boundaries", () => {
        const manager = new OwnershipManager();
        const root = manager.scope();
        const decisions: string[] = [];
        const original = new Error("owned failure");

        const outer = root.boundary((event) => {
            decisions.push("outer");
            assert.equal(event.error, original);
            return "handled";
        });
        const inner = outer.boundary((event) => {
            decisions.push("inner");
            assert.equal(event.error, original);
            assert.equal(event.owner, owner);
            return "propagate";
        });
        const owner = inner.child();

        assert.doesNotThrow(() =>
            owner.run(() => {
                throw original;
            }),
        );
        assert.deepEqual(decisions, ["inner", "outer"]);
    });

    test("routes disposal failures once and removes handled errors", () => {
        let untracked = false;
        const manager = new OwnershipManager((operation) => {
            untracked = true;
            return operation();
        });
        const root = manager.scope();
        const cleanupFailure = new Error("cleanup");
        const boundary = root.boundary((event) => {
            assert.equal(untracked, true);
            assert.equal(event.error, cleanupFailure);
            assert.equal(event.owner, boundary);
            return "handled";
        });

        boundary.cleanup(() => {
            throw cleanupFailure;
        });

        assert.doesNotThrow(() => root.dispose());
    });

    test("aggregates original and boundary handler failures", () => {
        const manager = new OwnershipManager();
        const root = manager.scope();
        const original = new Error("original");
        const handlerFailure = new Error("handler");
        const boundary = root.boundary(() => {
            throw handlerFailure;
        });

        assert.throws(
            () =>
                boundary.run(() => {
                    throw original;
                }),
            (error) => {
                assert.ok(error instanceof AggregateError);
                assert.deepEqual(error.errors, [original, handlerFailure]);
                return true;
            },
        );
    });

    test("rejects ownership mutation and nested execution during recovery", () => {
        const manager = new OwnershipManager();
        const root = manager.scope();
        const original = new Error("original");
        const boundary = root.boundary(() => {
            assert.throws(() => root.cleanup(() => undefined));
            assert.throws(() => root.child());
            assert.throws(() => root.run(() => undefined));
            assert.equal(ownershipContext.recovering, true);
            return "handled";
        });

        assert.doesNotThrow(() =>
            boundary.run(() => {
                throw original;
            }),
        );
    });

    test("rejects disposal while the scope or its subtree is active", () => {
        const manager = new OwnershipManager();
        const parent = manager.scope();
        const child = parent.child();
        let disposed = false;

        child.cleanup(() => {
            disposed = true;
            return undefined;
        });

        child.run(() => {
            assert.throws(() => parent.dispose());
            assert.equal(disposed, false);
            return undefined;
        });

        parent.dispose();
        assert.equal(disposed, true);
    });

    test("owns root resources and isolates active scopes across managers", () => {
        const first = new OwnershipManager();
        const second = new OwnershipManager();
        const firstScope = first.scope();
        let rootDisposed = false;

        first.own(() => {
            rootDisposed = true;
            return undefined;
        });

        firstScope.run(() => {
            assert.throws(() => second.own(() => undefined));
            return undefined;
        });

        first.dispose();
        first.dispose();
        assert.equal(rootDisposed, true);
        assert.throws(() => first.scope());
    });
});
