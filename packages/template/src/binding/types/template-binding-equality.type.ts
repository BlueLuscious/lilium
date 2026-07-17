/**
 * @description Equality operation deciding whether a dynamic binding value changed.
 * @remarks Renderer executes equality without reactive tracking. A thrown equality failure
 * rejects the candidate and follows normal terminal binding failure behavior.
 * @typeParam Value - Candidate and committed binding value type.
 * @param previous - Last successfully committed value.
 * @param next - Newly evaluated candidate value.
 * @returns Whether Renderer should preserve the current host value.
 */
export type TemplateBindingEqualityType<Value> = {
    /**
     * @description Compares one committed value with a newly evaluated candidate.
     * @param previous - Last successfully committed value.
     * @param next - Newly evaluated candidate value.
     * @returns Whether Renderer should preserve the current host value.
     */
    bivarianceHack(previous: Value, next: Value): boolean;
}["bivarianceHack"];
