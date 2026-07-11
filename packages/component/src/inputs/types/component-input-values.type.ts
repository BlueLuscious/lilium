import type { TComponentInputValue } from "./internal/component-input-value.type.js";

/**
 * @description Complete immutable value snapshot used to create or update component inputs.
 * @remarks Every declared key is required. Optional declarations preserve `undefined` as
 * a value so input removal is explicit and cannot be confused with an omitted update.
 * @typeParam Inputs - Declarative input value shape of the component.
 */
export type ComponentInputValuesType<Inputs extends object> = Readonly<{
    [Key in keyof Inputs]: TComponentInputValue<Inputs, Key>;
}> & {
    readonly [Key in keyof Inputs]-?: unknown;
};
