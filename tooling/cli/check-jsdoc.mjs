import { resolve } from "node:path";
import { checkJsdoc } from "../documentation/check-jsdoc.mjs";
import { reportCheck } from "../shared/report-check.mjs";

reportCheck(checkJsdoc(resolve(import.meta.dirname, "../..")), "Production JSDoc is valid.");
