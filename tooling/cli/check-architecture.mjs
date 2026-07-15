import { resolve } from "node:path";
import { checkArchitecture } from "../architecture/check-architecture.mjs";
import { reportCheck } from "../shared/report-check.mjs";

reportCheck(
    checkArchitecture(resolve(import.meta.dirname, "../..")),
    "Architecture boundaries are valid.",
);
