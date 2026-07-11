import type { ReadonlySignal } from "./readonly-signal.contract.js";

/**
 * @description Lazy memoized reactive value derived from other reactive sources.
 * @remarks A computed value evaluates on its first tracked or untracked read and
 * reevaluates on a later read only after one of its dependencies invalidates it.
 * @typeParam T - Value produced and cached by the computed object.
 */
export interface Computed<T> extends ReadonlySignal<T> {}
