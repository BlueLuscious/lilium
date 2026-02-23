import type { ContextProviderEntryType } from "../context-provider-entry.type";


/**
 * @description Internal type-erased context provider entry.
 * @remarks Used by runtime scope management when provider value types are unknown.
 */
export type TContextProviderAnyEntry = ContextProviderEntryType<unknown>;
