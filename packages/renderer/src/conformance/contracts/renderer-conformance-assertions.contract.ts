/** @description Minimal test-runner-neutral assertions required by Renderer conformance scenarios. */
export interface RendererConformanceAssertions {
    /**
     * @description Asserts structural equality between two observations.
     * @param actual - Observed value.
     * @param expected - Required value.
     * @returns Nothing when both values are structurally equal.
     */
    deepEqual(actual: unknown, expected: unknown): void;

    /**
     * @description Asserts strict equality between two observations.
     * @param actual - Observed value.
     * @param expected - Required value.
     * @returns Nothing when both values are strictly equal.
     */
    equal(actual: unknown, expected: unknown): void;

    /**
     * @description Asserts that one value is present and truthy.
     * @param value - Candidate value.
     * @returns Nothing after narrowing a truthy value.
     */
    ok(value: unknown): asserts value;

    /**
     * @description Asserts that one action throws a value accepted by a predicate.
     * @param action - Synchronous action expected to throw.
     * @param validate - Predicate accepting only the expected failure.
     * @returns Nothing after validating the thrown value.
     */
    throws(action: () => void, validate: (error: unknown) => boolean): void;
}
