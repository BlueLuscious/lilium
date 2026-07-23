import type { ConsoleRootType } from "../types/console-root.type.js";
import type { ConsoleValueSnapshot } from "./console-value-snapshot.contract.js";

/** @description Immutable recursive observation of one active external Console root. */
export interface ConsoleRootSnapshot {
    /** @description Exact external root identity associated with the active session. */
    readonly root: ConsoleRootType;

    /** @description Ordered logical values currently attached to the session root. */
    readonly children: readonly ConsoleValueSnapshot[];
}
