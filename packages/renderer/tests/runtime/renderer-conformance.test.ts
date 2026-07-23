import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
    RendererConformance,
    type RendererConformanceAssertions,
} from "../../src/conformance/index.js";
import { rendererConformanceAdapter } from "./renderer-conformance.adapter.js";

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

describe("renderer host-neutral conformance", () => {
    for (const scenario of RendererConformance.scenarios(rendererConformanceAdapter)) {
        test(scenario.name, () => scenario.run(assertions));
    }
});
