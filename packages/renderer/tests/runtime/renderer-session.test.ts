import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { RendererSessionManager } from "../../src/session/runtime/renderer-session.manager.js";
import { createTestHost } from "./renderer-host.fixture.js";

describe("renderer sessions", () => {
    test("claims each host and root identity until its session closes", () => {
        const fixture = createTestHost([]);
        const firstManager = new RendererSessionManager(fixture.host);
        const secondManager = new RendererSessionManager(fixture.host);
        const root = { name: "main" };
        const first = firstManager.open(root);

        assert.throws(
            () => secondManager.open(root),
            (error: unknown) =>
                error instanceof Error &&
                error.name === "RendererRootClaimError" &&
                "root" in error &&
                error.root === root,
        );
        assert.equal(fixture.counters.open, 1);

        first.close();
        first.close();

        const replacement = secondManager.open(root);
        assert.equal(fixture.counters.open, 2);
        assert.equal(fixture.counters.close, 1);
        replacement.close();
    });

    test("keeps closed sessions terminal", () => {
        const fixture = createTestHost([]);
        const session = new RendererSessionManager(fixture.host).open({ name: "main" });

        session.close();

        assert.equal(session.closed, true);
        assert.throws(() => session.host, /not ready/i);
        assert.throws(() => session.capabilities, /not ready/i);
        assert.throws(
            () => session.preflightTemplate({ roots: [] } as never),
            /exactly once while open/i,
        );
    });

    test("releases a root claim when host opening violates the protocol", () => {
        const root = { name: "main" };
        let valid = false;
        const fixture = createTestHost([]);
        const host = {
            open(candidate: typeof root) {
                if (!valid) {
                    return Promise.resolve(candidate);
                }

                return fixture.host.open(candidate);
            },
        } as never;
        const manager = new RendererSessionManager(host);

        assert.throws(
            () => manager.open(root),
            (error: unknown) =>
                error instanceof Error &&
                error.name === "RendererProtocolError" &&
                "operation" in error &&
                error.operation === "open",
        );

        valid = true;
        const session = manager.open(root);
        session.close();
    });
});
