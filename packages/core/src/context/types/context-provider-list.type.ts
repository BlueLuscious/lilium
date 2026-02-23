import type { ContextProviderEntryType } from "./context-provider-entry.type";


/**
 * @description Public read-only collection of context providers attached to a render scope.
 * @remarks Provider order is preserved as declared by the component.
 */
export type ContextProviderListType = ReadonlyArray<ContextProviderEntryType<unknown>>;
