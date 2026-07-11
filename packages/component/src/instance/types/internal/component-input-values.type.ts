import type { TComponentInputValue } from "../../../inputs/types/internal/component-input-value.type.js";

/**
 * @description Complete internal value snapshot used to update component input signals.
 * @remarks Optional declarations become required keys whose values still include
 * `undefined`. This distinguishes a cleared optional input from an omitted update.
 * @typeParam Inputs - Declarative input value shape of the component.
 */
export type TComponentInputValues<Inputs extends object> = Readonly<{
    [Key in keyof Inputs]: TComponentInputValue<Inputs, Key>;
}> & {
    readonly [Key in keyof Inputs]-?: unknown;
};
