/**
 * @description Internal context lookup result with explicit provider presence.
 * @remarks The discriminant preserves a provided `undefined` value as a successful lookup.
 * @typeParam T - Value associated with the resolved context identity.
 */
export type TContextResolution<T> =
    | {
        /** @description Discriminant indicating that a provider was found. */
        readonly found: true;

        /** @description Value stored by the nearest matching provider. */
        readonly value: T;
    }
    | {
        /** @description Discriminant indicating that no provider was found. */
        readonly found: false;
    };
