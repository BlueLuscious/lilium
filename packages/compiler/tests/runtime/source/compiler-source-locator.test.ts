import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CompilerSourceLocator } from "../../../src/source/runtime/compiler-source-locator.js";

describe("CompilerSourceLocator", () => {
    it("counts CRLF as one line break while preserving original UTF-16 offsets", () => {
        const locator = new CompilerSourceLocator("first\r\nsecond\nthird\rfourth");

        assert.deepEqual(locator.position(7), {
            offset: 7,
            line: 2,
            column: 1,
        });
        assert.deepEqual(locator.position(14), {
            offset: 14,
            line: 3,
            column: 1,
        });
        assert.deepEqual(locator.position(20), {
            offset: 20,
            line: 4,
            column: 1,
        });
    });

    it("counts columns and offsets in UTF-16 code units", () => {
        const locator = new CompilerSourceLocator("🌺x");

        assert.deepEqual(locator.position(2), {
            offset: 2,
            line: 1,
            column: 3,
        });
    });

    it("rejects offsets and spans outside the supplied source", () => {
        const locator = new CompilerSourceLocator("lily");

        assert.throws(() => locator.position(-1), RangeError);
        assert.throws(() => locator.position(5), RangeError);
        assert.throws(() => locator.span(3, 2), RangeError);
    });
});
