import type { TemplatedComponentDefinition } from "../../component/contracts/templated-component-definition.contract.js";
import type { TemplateDefinition } from "../../definition/contracts/template-definition.contract.js";
import type { TemplateDefinitionRegistry } from "../../definition/runtime/template-definition.registry.js";
import type { TemplateProjection } from "../contracts/template-projection.contract.js";
import type { TemplateSlot } from "../contracts/template-slot.contract.js";
import type { TemplateProjectionStateType } from "../types/template-projection-state.type.js";
import type { TemplateSlotRegistry } from "./template-slot.registry.js";

/**
 * @description Internal validator and immutable copier for component projection declarations.
 * @remarks Projection records retain definition and slot identities but allocate no Renderer,
 * ownership, reactive, or mounted state.
 */
export class TemplateProjectionFactory {
    /** @description Registry validating genuine normalized Template definitions. */
    readonly #definitions: TemplateDefinitionRegistry;

    /** @description Registry validating genuine slot identities. */
    readonly #slots: TemplateSlotRegistry;

    /** @description Genuine projection declarations created by this factory. */
    readonly #projections = new WeakSet<object>();

    /**
     * @description Constructs one projection factory over package identity registries.
     * @param slots - Registry validating projection slot identities.
     * @param definitions - Registry validating projection template identities.
     */
    constructor(slots: TemplateSlotRegistry, definitions: TemplateDefinitionRegistry) {
        this.#slots = slots;
        this.#definitions = definitions;
    }

    /**
     * @description Creates one frozen projection preserving its slot-to-state type relationship.
     * @typeParam ParentState - Read-only state of the supplying parent template.
     * @typeParam SlotInputs - Complete input shape supplied by the receiving slot.
     * @param slot - Genuine child slot identity receiving the projected content.
     * @param template - Genuine parent-owned template over parent and slot state.
     * @returns A new genuine immutable projection declaration.
     */
    create<ParentState extends object, SlotInputs extends object>(
        slot: TemplateSlot<SlotInputs>,
        template: TemplateDefinition<TemplateProjectionStateType<ParentState, SlotInputs>>,
    ): TemplateProjection<ParentState, SlotInputs> {
        this.#slots.assertSlot(slot);
        this.#definitions.assertDefinition(template);
        const projection = Object.freeze({ slot, template }) as TemplateProjection<
            ParentState,
            SlotInputs
        >;
        this.#projections.add(projection);
        return projection;
    }

    /**
     * @description Validates, copies, and freezes ordered projections for one component declaration.
     * @typeParam ParentState - Read-only state of the supplying parent template.
     * @typeParam ChildInputs - Declarative input shape of the nested component.
     * @typeParam ChildController - Public controller shape of the nested component.
     * @param component - Genuine composition declaring the accepted slot map.
     * @param candidates - Optional caller-owned ordered projection declarations.
     * @returns A frozen ordered projection array containing fresh immutable records.
     */
    copy<ParentState extends object, ChildInputs extends object, ChildController extends object>(
        component: TemplatedComponentDefinition<ChildInputs, ChildController>,
        candidates: unknown,
    ): readonly TemplateProjection<ParentState, object>[] {
        if (candidates === undefined) {
            return Object.freeze([]);
        }

        if (!Array.isArray(candidates)) {
            throw new TypeError("Template component projections must be an array.");
        }

        const projectedSlots = new Set<object>();
        const projections = candidates.map((candidate) => {
            this.#assertProjection(candidate);
            const slot = candidate.slot;
            this.#assertAcceptedSlot(component, slot);

            if (projectedSlots.has(slot)) {
                throw new TypeError(
                    `Template component projections contain duplicate slot "${slot.name}".`,
                );
            }

            projectedSlots.add(slot);
            return Object.freeze({
                slot,
                template: candidate.template,
            }) as TemplateProjection<ParentState, object>;
        });
        return Object.freeze(projections);
    }

    /**
     * @description Verifies that one projection targets a slot accepted by its composition.
     * @typeParam ChildInputs - Declarative input shape of the nested component.
     * @typeParam ChildController - Public controller shape of the nested component.
     * @param component - Composition exposing accepted slots by normalized name.
     * @param slot - Genuine slot identity supplied by one projection record.
     * @returns Nothing.
     */
    #assertAcceptedSlot<ChildInputs extends object, ChildController extends object>(
        component: TemplatedComponentDefinition<ChildInputs, ChildController>,
        slot: TemplateSlot<object>,
    ): void {
        if (!Object.hasOwn(component.slots, slot.name) || component.slots[slot.name] !== slot) {
            throw new TypeError(
                `Template component projection targets unknown slot "${slot.name}".`,
            );
        }
    }

    /**
     * @description Verifies one candidate is a genuine projection declaration.
     * @param candidate - Projection candidate supplied to a component declaration.
     * @returns Nothing.
     */
    #assertProjection(candidate: unknown): asserts candidate is TemplateProjection<object, object> {
        if (
            typeof candidate !== "object" ||
            candidate === null ||
            !this.#projections.has(candidate)
        ) {
            throw new TypeError("A template projection must be a genuine Template declaration.");
        }
    }
}
