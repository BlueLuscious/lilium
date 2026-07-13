/**
 * @description Internal value resolver that preserves `undefined` for optional inputs.
 * @remarks Resolving the value outside a required mapped property avoids TypeScript's
 * implicit removal of `undefined` when the optional property modifier is removed.
 * @typeParam Inputs - Declarative input value shape of the component.
 * @typeParam Key - Input key whose runtime value type is resolved.
 */
export type TComponentInputValue<
    Inputs extends object,
    Key extends keyof Inputs,
    // biome-ignore lint/complexity/noBannedTypes: Empty-object assignability detects optional keys.
> = {} extends Pick<Inputs, Key> ? Exclude<Inputs[Key], undefined> | undefined : Inputs[Key];
