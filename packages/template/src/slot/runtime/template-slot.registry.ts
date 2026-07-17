import type { TemplateSlot } from "../contracts/template-slot.contract.js";

/** @description Canonical diagnostic name assigned to an unnamed slot identity. */
const DEFAULT_TEMPLATE_SLOT_NAME = "default";

/**
 * @description Internal creator and nominal validator for immutable Template slot identities.
 * @remarks Weak identity rejects structural imitations without retaining slots after application
 * code releases every definition and composition that references them.
 */
export class TemplateSlotRegistry {
    /** @description Genuine slot identities created by this package instance. */
    readonly #slots = new WeakSet<object>();

    /**
     * @description Creates one frozen named slot identity.
     * @typeParam Inputs - Complete value shape supplied by the receiving outlet.
     * @param name - Optional name normalized to the canonical default when omitted.
     * @returns A new nominal typed slot identity.
     */
    create<Inputs extends object = object>(name?: string): TemplateSlot<Inputs> {
        const slot = Object.freeze({ name: this.#normalizeName(name) });
        this.#slots.add(slot);
        return slot as unknown as TemplateSlot<Inputs>;
    }

    /**
     * @description Verifies that a candidate is a genuine slot identity.
     * @param slot - Candidate supplied to an outlet or projection declaration.
     * @returns Nothing.
     */
    assertSlot(slot: unknown): asserts slot is TemplateSlot<object> {
        if (typeof slot !== "object" || slot === null || !this.#slots.has(slot)) {
            throw new TypeError("A template slot must be a genuine Template identity.");
        }
    }

    /**
     * @description Normalizes one optional slot name.
     * @param name - Optional caller-provided slot name.
     * @returns The canonical default name or a trimmed non-empty explicit name.
     */
    #normalizeName(name: string | undefined): string {
        if (name === undefined) {
            return DEFAULT_TEMPLATE_SLOT_NAME;
        }

        if (typeof name !== "string" || name.trim().length === 0) {
            throw new TypeError("A template slot name must be a non-empty string.");
        }

        return name.trim();
    }
}
