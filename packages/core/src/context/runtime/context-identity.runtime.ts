import type { Scope } from "../../ownership/contracts/scope/scope.contract.js";
import { ownershipContext } from "../../ownership/runtime/ownership-context.manager.js";
import type { ContextIdentity } from "../contracts/context-identity.contract.js";

/**
 * @description Internal immutable implementation of a portable context identity.
 * @remarks Provider values remain in ownership scopes; this object stores identity and an
 * optional default only, allowing reuse across isolated runtime scope trees.
 * @typeParam T - Value associated with this context identity.
 */
export class ContextIdentityRuntime<T> implements ContextIdentity<T> {
    /** @description Immutable default value when this identity was created with one. */
    readonly #defaultValue: T | undefined;

    /** @description Whether a default exists independently from its possible value. */
    readonly #hasDefault: boolean;

    /**
     * @description Creates one context identity in a valid required or defaulted state.
     * @param hasDefault - Whether missing provider lookup may return a default.
     * @param defaultValue - Immutable default value when configured.
     */
    private constructor(hasDefault: boolean, defaultValue?: T) {
        this.#hasDefault = hasDefault;
        this.#defaultValue = defaultValue;
        Object.freeze(this);
    }

    /**
     * @description Creates a context identity that requires an active provider.
     * @typeParam T - Value associated with the new context identity.
     * @returns An immutable required context identity runtime.
     */
    static required<T>(): ContextIdentityRuntime<T> {
        return new ContextIdentityRuntime<T>(false);
    }

    /**
     * @description Creates a context identity with one immutable default value.
     * @typeParam T - Value associated with the new context identity.
     * @param defaultValue - Value returned when no active provider exists.
     * @returns An immutable defaulted context identity runtime.
     */
    static withDefault<T>(defaultValue: T): ContextIdentityRuntime<T> {
        return new ContextIdentityRuntime(true, defaultValue);
    }

    /**
     * @description Resolves the nearest active provider or this identity's default.
     * @returns The nearest provided value or configured immutable default.
     */
    get(): T {
        const active = ownershipContext.active;

        if (active !== null) {
            const resolution = active.resolveContext(this);
            if (resolution.found) {
                return resolution.value;
            }
        }

        if (this.#hasDefault) {
            return this.#defaultValue as T;
        }

        throw new Error("No value is available for this context.");
    }

    /**
     * @description Registers one value on a compatible scope before its first execution.
     * @param scope - Core scope that stores the provider entry.
     * @param value - Value associated with this context identity on that scope.
     * @returns Nothing.
     */
    provide(scope: Scope, value: T): void {
        if (!ownershipContext.isScope(scope)) {
            throw new TypeError("The scope cannot store Lilium context providers.");
        }

        scope.provideContext(this, value);
    }
}
