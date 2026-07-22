import type {
    TemplateComponent,
    TemplateDefinition,
    TemplatedComponentDefinition,
    TemplateFragmentType,
    TemplateInstructionType,
    TemplateOutlet,
    TemplatePrimitive,
    TemplateProjection,
    TemplateProperty,
} from "@lilium/template";
import type { TRendererPrimitiveRequirement } from "../types/internal/renderer-primitive-requirement.type.js";

/** @description Collects reachable host capability requirements from normalized Template graphs. */
export class RendererRequirementCollector {
    /**
     * @description Collects ordered unique requirements for one standalone Template definition.
     * @typeParam State - Read-only state accepted by the Template occurrence.
     * @param definition - Normalized immutable Template program.
     * @returns Ordered requirements in first-reachable-declaration order.
     */
    collectTemplate<State extends object>(
        definition: TemplateDefinition<State>,
    ): readonly TRendererPrimitiveRequirement[] {
        return this.#collect(definition);
    }

    /**
     * @description Collects ordered unique requirements for one templated Component definition.
     * @typeParam Inputs - Declarative component input value shape.
     * @typeParam Controller - Public component controller object.
     * @param definition - Immutable compatible Component and Template composition.
     * @returns Ordered requirements in first-reachable-declaration order.
     */
    collectComponent<Inputs extends object, Controller extends object>(
        definition: TemplatedComponentDefinition<Inputs, Controller>,
    ): readonly TRendererPrimitiveRequirement[] {
        return this.#collect(definition.template);
    }

    /**
     * @description Traverses one normalized graph with occurrence-specific projection selection.
     * @param definition - Root Template definition to inspect.
     * @returns Frozen ordered capability requirements.
     */
    #collect(definition: TemplateDefinition<object>): readonly TRendererPrimitiveRequirement[] {
        const requirements = new Map<
            TemplatePrimitive<object>,
            {
                /** @description Exact portable primitive identity required by the graph. */
                primitive: TemplatePrimitive<object>;
                /** @description Unique required properties keyed by exact identity. */
                properties: Map<TemplateProperty, TemplateProperty>;
                /** @description Whether any occurrence supplies host-producing children. */
                requiresChildren: boolean;
            }
        >();
        const activeDefinitions = new Set<TemplateDefinition<object>>();

        /**
         * @description Visits one Template definition while guarding malformed recursive graphs.
         * @param current - Definition whose roots must be traversed.
         * @param projections - Projection declarations selected for this occurrence's outlets.
         * @returns Whether the definition produces at least one host value.
         */
        const visitDefinition = (
            current: TemplateDefinition<object>,
            projections: ReadonlyMap<object, TemplateProjection<object, object>>,
        ): boolean => {
            if (activeDefinitions.has(current)) {
                throw new TypeError("A recursive Template definition cannot be preflighted.");
            }

            activeDefinitions.add(current);

            try {
                return visitFragment(current.roots, projections);
            } finally {
                activeDefinitions.delete(current);
            }
        };

        /**
         * @description Visits one ordered fragment and accumulates whether it produces host roots.
         * @param fragment - Ordered normalized Template instructions.
         * @param projections - Projection declarations selected for surrounding outlets.
         * @returns Whether any instruction produces at least one host value.
         */
        const visitFragment = (
            fragment: TemplateFragmentType<object>,
            projections: ReadonlyMap<object, TemplateProjection<object, object>>,
        ): boolean => {
            let producesValues = false;

            for (const instruction of fragment) {
                producesValues = visitInstruction(instruction, projections) || producesValues;
            }

            return producesValues;
        };

        /**
         * @description Visits one normalized instruction and records its reachable requirements.
         * @param instruction - Primitive, Component, or outlet declaration.
         * @param projections - Projection declarations selected for surrounding outlets.
         * @returns Whether this instruction produces at least one host value.
         */
        const visitInstruction = (
            instruction: TemplateInstructionType<object>,
            projections: ReadonlyMap<object, TemplateProjection<object, object>>,
        ): boolean => {
            if (instruction.kind === "node") {
                let requirement = requirements.get(instruction.primitive);

                if (requirement === undefined) {
                    requirement = {
                        primitive: instruction.primitive,
                        properties: new Map(),
                        requiresChildren: false,
                    };
                    requirements.set(instruction.primitive, requirement);
                }

                for (const property of instruction.properties) {
                    requirement.properties.set(property.property, property.property);
                }

                if (visitFragment(instruction.children, projections)) {
                    requirement.requiresChildren = true;
                }

                return true;
            }

            if (instruction.kind === "component") {
                return visitComponent(instruction);
            }

            return visitOutlet(instruction, projections);
        };

        /**
         * @description Visits one nested component with its occurrence-specific projections.
         * @param instruction - Normalized nested component declaration.
         * @returns Whether its selected visual definition produces at least one host value.
         */
        const visitComponent = (instruction: TemplateComponent<object, number>): boolean => {
            const composition = instruction.component as TemplatedComponentDefinition<
                object,
                object
            >;
            const projections = new Map<object, TemplateProjection<object, object>>();

            for (const projection of instruction.projections) {
                projections.set(projection.slot, projection);
            }

            return visitDefinition(composition.template, projections);
        };

        /**
         * @description Visits the selected projection or fallback branch for one outlet.
         * @param instruction - Normalized slot outlet declaration.
         * @param projections - Projection declarations selected for this component occurrence.
         * @returns Whether the selected branch produces at least one host value.
         */
        const visitOutlet = (
            instruction: TemplateOutlet<object, object, number>,
            projections: ReadonlyMap<object, TemplateProjection<object, object>>,
        ): boolean => {
            const projection = projections.get(instruction.slot);

            if (projection !== undefined) {
                return visitDefinition(projection.template, new Map());
            }

            return visitFragment(instruction.fallback, projections);
        };

        visitDefinition(definition, new Map());

        return Object.freeze(
            [...requirements.values()].map((requirement) =>
                Object.freeze({
                    primitive: requirement.primitive,
                    properties: Object.freeze([...requirement.properties.values()]),
                    requiresChildren: requirement.requiresChildren,
                }),
            ),
        ) as readonly TRendererPrimitiveRequirement[];
    }
}
