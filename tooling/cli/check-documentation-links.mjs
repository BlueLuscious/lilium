import { join, resolve } from "node:path";
import { checkDocumentationLinks } from "../documentation/check-documentation-links.mjs";
import { reportCheck } from "../shared/report-check.mjs";

reportCheck(
    checkDocumentationLinks(
        resolve(import.meta.dirname, "../.."),
        join(resolve(import.meta.dirname, "../.."), "docs", "en"),
    ),
    "Documentation links are valid.",
);
