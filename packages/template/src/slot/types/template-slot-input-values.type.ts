/**
 * @description Complete immutable value snapshot supplied by one slot outlet.
 * @remarks Every key is present; optional inputs preserve explicit `undefined` values.
 * @typeParam Inputs - Declarative slot input value shape.
 */
export type TemplateSlotInputValuesType<Inputs extends object> = Readonly<{
    [Key in keyof Inputs]-?: Inputs[Key];
}>;
