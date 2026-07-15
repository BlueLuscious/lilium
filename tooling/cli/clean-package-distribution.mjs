import { resolve } from "node:path";
import { cleanPackageDistribution } from "../workspace/clean-package-distribution.mjs";

cleanPackageDistribution(resolve(import.meta.dirname, "../.."), process.cwd());
