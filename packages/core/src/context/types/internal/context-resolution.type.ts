/**
 * @description Internal context lookup result with explicit provider presence.
 * @remarks The discriminant preserves a provided `undefined` value as a successful lookup.
 * @typeParam T - Value associated with the resolved context identity.
 */
export type TContextResolution<T> =
    | {
        readonly found: true;
        readonly value: T;
    }
    | {
        readonly found: false;
    };
