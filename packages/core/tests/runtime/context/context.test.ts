import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { Scope } from "../../../src/index.js";
import { ContextRuntime } from "../../../src/context/runtime/context.runtime.js";
import { OwnershipManager } from "../../../src/ownership/runtime/ownership.manager.js";

const foreignScope: Scope = {
    boundary() {
        throw new Error("not implemented");
    },
    child() {
        return this;
    },
    cleanup() {},
    dispose() {},
    run(operation) {
        operation();
    },
};

describe("context runtime", () => {
    test("resolves the nearest provider through the active owner chain", () => {
        const manager = new OwnershipManager();
        const root = manager.scope();
        const child = root.child();
        const context = ContextRuntime.required<string>();

        context.provide(root, "root");
        context.provide(child, "child");

        root.run(() => {
            assert.equal(context.get(), "root");

            child.run(() => {
                assert.equal(context.get(), "child");
                return undefined;
            });

            return undefined;
        });
    });

    test("distinguishes an explicit undefined provider from absence", () => {
        const manager = new OwnershipManager();
        const scope = manager.scope();
        const context = ContextRuntime.withDefault<string | undefined>("default");

        context.provide(scope, undefined);
        scope.run(() => {
            assert.equal(context.get(), undefined);
            return undefined;
        });
    });

    test("uses immutable defaults and rejects missing required contexts", () => {
        const required = ContextRuntime.required<string>();
        const optional = ContextRuntime.withDefault("default");
        const undefinedDefault = ContextRuntime.withDefault(undefined);

        assert.equal(optional.get(), "default");
        assert.equal(undefinedDefault.get(), undefined);
        assert.throws(() => required.get());
        assert.equal(Object.isFrozen(optional), true);
    });

    test("keeps one context identity isolated across runtime scope trees", () => {
        const firstManager = new OwnershipManager();
        const secondManager = new OwnershipManager();
        const firstScope = firstManager.scope();
        const secondScope = secondManager.scope();
        const context = ContextRuntime.required<string>();

        context.provide(firstScope, "first");
        context.provide(secondScope, "second");

        firstScope.run(() => {
            assert.equal(context.get(), "first");
            secondScope.run(() => {
                assert.equal(context.get(), "second");
                return undefined;
            });
            assert.equal(context.get(), "first");
            return undefined;
        });
    });

    test("rejects duplicate, late, foreign, and disposed providers", () => {
        const manager = new OwnershipManager();
        const duplicate = manager.scope();
        const late = manager.scope();
        const disposed = manager.scope();
        const context = ContextRuntime.required<number>();

        context.provide(duplicate, 1);
        assert.throws(() => context.provide(duplicate, 2));

        late.run(() => undefined);
        assert.throws(() => context.provide(late, 1));

        disposed.dispose();
        assert.throws(() => context.provide(disposed, 1));
        assert.throws(() => context.provide(foreignScope, 1));
    });

    test("resolves context from the active boundary during recovery", () => {
        const manager = new OwnershipManager();
        const root = manager.scope();
        const context = ContextRuntime.required<string>();
        context.provide(root, "recovery value");

        const boundary = root.boundary(() => {
            assert.equal(context.get(), "recovery value");
            return "handled";
        });

        assert.doesNotThrow(() => boundary.run(() => {
            throw new Error("handled");
        }));
    });
});
