import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
    RendererConformance,
    type RendererConformanceAssertions,
} from "@lilium/renderer/conformance";
import { rendererConsoleConformanceAdapter } from "./renderer-conformance.adapter.js";

const assertions: RendererConformanceAssertions = {
    deepEqual(actual, expected) {
        assert.deepEqual(actual, expected);
    },
    equal(actual, expected) {
        assert.equal(actual, expected);
    },
    ok(value): asserts value {
        assert.ok(value);
    },
    throws(action, validate) {
        assert.throws(action, validate);
    },
};

describe("Renderer Console shared conformance", () => {
    for (const scenario of RendererConformance.scenarios(rendererConsoleConformanceAdapter)) {
        test(scenario.name, () => scenario.run(assertions));
    }
});
