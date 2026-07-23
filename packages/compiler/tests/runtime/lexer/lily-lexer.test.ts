import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LilyLexer } from "../../../src/lexer/runtime/lily-lexer.js";

describe("LilyLexer", () => {
    it("emits deterministic significant and comment tokens with exact spans", () => {
        const labelInterpolation = "$" + "{controller.label.get()}";
        const source = [
            "// leading",
            "behavior { Comportamiento } from './behavior.js';",
            "/* retained */",
            `template { node Flor { bind Texto = \`🌺 ${labelInterpolation}\`; } }`,
        ].join("\r\n");

        const result = new LilyLexer(source, "src/flor.lily").lex();
        const comments = result.tokens.filter((token) => token.kind.endsWith("comment"));
        const template = result.tokens.find((token) => token.kind === "template");
        const behavior = result.tokens.find((token) => token.lexeme === "behavior");

        assert.equal(result.diagnostics.length, 0);
        assert.deepEqual(
            comments.map((token) => [token.kind, token.lexeme]),
            [
                ["line-comment", "// leading"],
                ["block-comment", "/* retained */"],
            ],
        );
        assert.equal(template?.lexeme, `\`🌺 ${labelInterpolation}\``);
        assert.deepEqual(
            behavior?.span.start,
            { offset: 12, line: 2, column: 1 },
            "CRLF must count as one logical break without rewriting offsets.",
        );
        assert.equal(result.tokens.at(-1)?.kind, "eof");
    });

    it("preserves line and column semantics across LF and CRLF sources", () => {
        const lf = new LilyLexer("template {\nnode Root {}\n}", "lf.lily").lex();
        const crlf = new LilyLexer("template {\r\nnode Root {}\r\n}", "crlf.lily").lex();
        const lfNode = lf.tokens.find((token) => token.lexeme === "node");
        const crlfNode = crlf.tokens.find((token) => token.lexeme === "node");

        assert.deepEqual(
            [lfNode?.span.start.line, lfNode?.span.start.column],
            [crlfNode?.span.start.line, crlfNode?.span.start.column],
        );
        assert.notEqual(lfNode?.span.start.offset, crlfNode?.span.start.offset);
    });

    it("reports independent lexical failures in deterministic source order", () => {
        const source = "'open\n@ /* open";
        const result = new LilyLexer(source, "invalid.lily").lex();

        assert.deepEqual(
            result.diagnostics.map((diagnostic) => diagnostic.code),
            ["LILY1003", "LILY1001", "LILY1002"],
        );
        assert.deepEqual(
            result.diagnostics.map((diagnostic) => diagnostic.filename),
            ["invalid.lily", "invalid.lily", "invalid.lily"],
        );
        assert.ok(result.tokens.every(Object.isFrozen));
        assert.ok(result.diagnostics.every(Object.isFrozen));
    });

    it("diagnoses unterminated nested template substitutions", () => {
        const result = new LilyLexer(
            "bind Label = `Count: ${controller.count.get()",
            "template.lily",
        ).lex();

        assert.deepEqual(
            result.diagnostics.map((diagnostic) => diagnostic.code),
            ["LILY1003"],
        );
    });
});
