import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import { checkDocumentationLinks } from "../../../tooling/documentation/check-documentation-links.mjs";

function createDocumentation(context, source) {
    const root = mkdtempSync(join(tmpdir(), "lilium-documentation-"));
    const documentationRoot = join(root, "docs", "en");
    mkdirSync(documentationRoot, { recursive: true });
    writeFileSync(join(documentationRoot, "index.md"), source);
    context.after(() => rmSync(root, { force: true, recursive: true }));
    return { documentationRoot, root };
}

describe("documentation link checker", () => {
    test("accepts existing local links and external links", (context) => {
        const fixture = createDocumentation(
            context,
            "[Local](target.md) [External](https://lilium.dev)\n",
        );
        writeFileSync(join(fixture.documentationRoot, "target.md"), "# Target\n");
        assert.deepEqual(checkDocumentationLinks(fixture.root, fixture.documentationRoot), []);
    });

    test("reports missing local targets", (context) => {
        const fixture = createDocumentation(context, "[Missing](missing.md)\n");
        assert.deepEqual(checkDocumentationLinks(fixture.root, fixture.documentationRoot), [
            `${join("docs", "en", "index.md")}: broken link missing.md`,
        ]);
    });
});
