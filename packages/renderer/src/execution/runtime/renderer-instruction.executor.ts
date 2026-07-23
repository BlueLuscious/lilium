import type { ComponentInputValuesType } from "@lilium/component";
import {
    ComponentIntegration,
    type ComponentOccurrence,
    type ComponentOccurrenceRuntime,
} from "@lilium/component/integration";
import type { ReactiveRuntime, Scope } from "@lilium/core";
import {
    CoreIntegration,
    type RenderBinding,
    type RenderBindingRuntime,
    type RenderBindingTerminalFunctionType,
} from "@lilium/core/integration";
import type {
    ComponentTemplateStateType,
    TemplateComponent,
    TemplateDefinition,
    TemplatedComponentDefinition,
    TemplateFragmentType,
    TemplateNode,
    TemplateOutlet,
    TemplatePrimitive,
    TemplateProjectionStateType,
    TemplateSlotInputValuesType,
} from "@lilium/template";
import { RendererHostProtocolValidator } from "../../host/runtime/renderer-host-protocol.validator.js";
import type { RendererSession } from "../../session/runtime/renderer-session.js";
import { RendererCleanupCollector } from "../../shared/runtime/renderer-cleanup.collector.js";
import type { IRendererPlaceableOccurrence } from "../contracts/internal/renderer-placeable-occurrence.contract.js";
import type { TRendererProjectionRequest } from "../types/internal/renderer-projection-request.type.js";
import { RendererComponentOccurrence } from "./renderer-component.occurrence.js";
import { RendererFragmentOccurrence } from "./renderer-fragment.occurrence.js";
import { RendererPrimitiveOccurrence } from "./renderer-primitive.occurrence.js";
import { RendererSlotInputStore } from "./renderer-slot-input.store.js";
import { RendererTemplateOccurrence } from "./renderer-template.occurrence.js";

/**
 * @description Executes normalized Template instructions through Core and Component bridges.
 * @typeParam Parent - Host value shape that can contain rendered values.
 * @typeParam Value - Concrete opaque host value shape created by primitive capabilities.
 */
export class RendererInstructionExecutor<Parent extends object, Value extends Parent> {
    /** @description Ready session whose preflight and host operations constrain execution. */
    readonly #session: RendererSession<Parent, Value>;
    /** @description Reactive runtime coordinating batching, signals, and occurrence ownership. */
    readonly #runtime: ReactiveRuntime;
    /** @description Narrow Core bridge used for tracked bindings and untracked equality. */
    readonly #bindings: RenderBindingRuntime;
    /** @description Narrow Component bridge used for protected headless occurrences. */
    readonly #components: ComponentOccurrenceRuntime;
    /** @description Owner finalizer delegated to every Core render binding. */
    readonly #terminalize: RenderBindingTerminalFunctionType;
    /** @description Shared validator for synchronous host mutation results. */
    readonly #protocol: RendererHostProtocolValidator = new RendererHostProtocolValidator();

    /**
     * @description Creates one instruction executor bound to genuine Core integration services.
     * @param session - Session already preflighted for the definition that will execute.
     * @param runtime - Genuine live Core runtime owning all reactive and scope resources.
     * @param terminalize - Finalizer invoked after failed dynamic binding work unwinds.
     */
    constructor(
        session: RendererSession<Parent, Value>,
        runtime: ReactiveRuntime,
        terminalize: RenderBindingTerminalFunctionType,
    ) {
        if (typeof terminalize !== "function") {
            throw new TypeError("A Renderer binding terminalizer must be a function.");
        }

        this.#session = session;
        this.#runtime = runtime;
        this.#bindings = CoreIntegration.createRuntime(runtime);
        this.#components = ComponentIntegration.createRuntime(runtime);
        this.#terminalize = terminalize;
    }

    /**
     * @description Constructs one preflighted Template and places its roots in one Core batch.
     * @typeParam State - Read-only state retained by the Template occurrence.
     * @param definition - Exact normalized Template identity accepted during preflight.
     * @param state - Exact application state used by dynamic declarations.
     * @param owner - Attachment scope owning bindings, nested occurrences, and host resources.
     * @returns Private Template occurrence, or undefined after a handled initial failure.
     */
    executeTemplate<State extends object>(
        definition: TemplateDefinition<State>,
        state: State,
        owner: Scope,
    ): RendererTemplateOccurrence<State, Parent, Value> | undefined {
        this.#session.assertPreflighted(definition);
        let occurrence: RendererTemplateOccurrence<State, Parent, Value> | undefined;

        this.#runtime.batch(() => {
            owner.run(() => {
                occurrence = this.#constructDefinition(
                    definition,
                    state,
                    owner,
                    new Map(),
                    this.#terminalize,
                );
                occurrence?.place(this.#session.host.root, null);
            });
        });

        return occurrence;
    }

    /**
     * @description Creates one preflighted root Component and places its visual in one Core batch.
     * @typeParam Inputs - Declarative input shape of the root Component.
     * @typeParam Controller - Public controller shape of the root Component.
     * @param definition - Exact templated Component identity accepted during preflight.
     * @param inputs - Complete initial root Component input snapshot.
     * @param owner - Application scope owning Component setup and its visual attachment.
     * @returns Private rendered Component occurrence, or undefined after handled setup failure.
     */
    executeComponent<Inputs extends object, Controller extends object>(
        definition: TemplatedComponentDefinition<Inputs, Controller>,
        inputs: ComponentInputValuesType<Inputs>,
        owner: Scope,
    ): RendererComponentOccurrence<Parent, Value, Inputs, Controller> | undefined {
        this.#session.assertPreflighted(definition);
        let rendered: RendererComponentOccurrence<Parent, Value, Inputs, Controller> | undefined;

        this.#runtime.batch(() => {
            owner.run(() => {
                const component = this.#components.create(definition.component, { inputs, owner });

                if (component === undefined) {
                    return;
                }

                const state: ComponentTemplateStateType<Inputs, Controller> = Object.freeze({
                    inputs: component.instance.inputs,
                    controller: component.instance.controller,
                });
                let visual:
                    | RendererTemplateOccurrence<
                          ComponentTemplateStateType<Inputs, Controller>,
                          Parent,
                          Value
                      >
                    | undefined;
                component.attachment.run(() => {
                    visual = this.#constructDefinition(
                        definition.template,
                        state,
                        component.attachment,
                        new Map(),
                        this.#terminalize,
                    );
                });

                if (visual === undefined) {
                    return;
                }

                rendered = new RendererComponentOccurrence(component, visual);
                rendered.place(this.#session.host.root, null);
            });
        });

        return rendered;
    }

    /**
     * @description Constructs one Template definition without placing its root fragment.
     * @typeParam State - Read-only state associated with this Template occurrence.
     * @param definition - Normalized Template definition being instantiated.
     * @param state - Exact state object evaluated by declarations in this definition.
     * @param owner - Semantic attachment owner active for this definition.
     * @param projections - Parent-supplied projections available to this Component visual.
     * @param terminalize - Finalizer for a dynamic binding owned by this Template occurrence.
     * @returns Detached occurrence, or undefined after a handled initial failure.
     */
    #constructDefinition<State extends object>(
        definition: TemplateDefinition<State>,
        state: State,
        owner: Scope,
        projections: ReadonlyMap<object, TRendererProjectionRequest>,
        terminalize: RenderBindingTerminalFunctionType,
    ): RendererTemplateOccurrence<State, Parent, Value> | undefined {
        const primitives = new Map<number, RendererPrimitiveOccurrence<Parent, Value>>();
        const components = new Map<number, ComponentOccurrence<object, object>>();
        const bindings: RenderBinding[] = [];
        const roots = this.#constructFragment(
            definition.roots,
            state,
            owner,
            projections,
            primitives,
            components,
            bindings,
            terminalize,
        );

        if (roots === undefined) {
            return undefined;
        }

        return new RendererTemplateOccurrence(state, roots, primitives, components, bindings);
    }

    /**
     * @description Constructs every ordered instruction in one fragment while it remains detached.
     * @typeParam State - Read-only state associated with the enclosing Template occurrence.
     * @param fragment - Ordered normalized instruction declarations.
     * @param state - Exact state object evaluated by declarations in this fragment.
     * @param owner - Semantic attachment owner active for this fragment.
     * @param projections - Projection requests available to outlet instructions.
     * @param primitives - Mutable primitive index for the enclosing Template occurrence.
     * @param components - Mutable Component index for the enclosing Template occurrence.
     * @param bindings - Mutable direct-binding ledger for the enclosing Template occurrence.
     * @param terminalize - Finalizer for dynamic bindings owned by this fragment.
     * @returns Ordered detached fragment, or undefined after a handled initial failure.
     */
    #constructFragment<State extends object>(
        fragment: TemplateFragmentType<State>,
        state: State,
        owner: Scope,
        projections: ReadonlyMap<object, TRendererProjectionRequest>,
        primitives: Map<number, RendererPrimitiveOccurrence<Parent, Value>>,
        components: Map<number, ComponentOccurrence<object, object>>,
        bindings: RenderBinding[],
        terminalize: RenderBindingTerminalFunctionType,
    ): RendererFragmentOccurrence<Parent, Value> | undefined {
        const roots: IRendererPlaceableOccurrence<Parent, Value>[] = [];

        for (const instruction of fragment) {
            let occurrence: IRendererPlaceableOccurrence<Parent, Value> | undefined;

            if (instruction.kind === "node") {
                occurrence = this.#constructNode(
                    instruction,
                    state,
                    owner,
                    projections,
                    primitives,
                    components,
                    bindings,
                    terminalize,
                );
            } else if (instruction.kind === "component") {
                occurrence = this.#constructComponent(
                    instruction,
                    state,
                    owner,
                    components,
                    bindings,
                    terminalize,
                );
            } else {
                occurrence = this.#constructOutlet(
                    instruction,
                    state,
                    owner,
                    projections,
                    primitives,
                    components,
                    bindings,
                    terminalize,
                );
            }

            if (occurrence === undefined) {
                return undefined;
            }

            roots.push(occurrence);
        }

        return new RendererFragmentOccurrence(roots);
    }

    /**
     * @description Creates one primitive, connects properties, and places its completed children.
     * @typeParam State - Read-only state associated with the enclosing Template occurrence.
     * @param node - Normalized primitive node declaration.
     * @param state - Exact state object evaluated by dynamic property bindings.
     * @param owner - Semantic attachment owner active for nested instruction work.
     * @param projections - Projection requests available to nested outlets.
     * @param primitives - Mutable primitive index for the enclosing Template occurrence.
     * @param components - Mutable Component index for the enclosing Template occurrence.
     * @param bindings - Mutable direct-binding ledger for the enclosing Template occurrence.
     * @param terminalize - Finalizer for dynamic properties owned by this node.
     * @returns Primitive occurrence, or undefined after a handled initial binding failure.
     */
    #constructNode<State extends object>(
        node: TemplateNode<State, TemplatePrimitive<object>, number>,
        state: State,
        owner: Scope,
        projections: ReadonlyMap<object, TRendererProjectionRequest>,
        primitives: Map<number, RendererPrimitiveOccurrence<Parent, Value>>,
        components: Map<number, ComponentOccurrence<object, object>>,
        bindings: RenderBinding[],
        terminalize: RenderBindingTerminalFunctionType,
    ): RendererPrimitiveOccurrence<Parent, Value> | undefined {
        if (primitives.has(node.reference)) {
            throw new TypeError("A Template primitive reference can be instantiated only once.");
        }

        const capability = this.#session.capabilities.primitive(node.primitive);
        const candidate: unknown = capability.create();
        this.#protocol.assertCreatedValue<Value>(candidate);

        const occurrence = new RendererPrimitiveOccurrence(
            node.reference,
            this.#session,
            this.#protocol,
            capability,
            candidate,
            owner,
        );
        primitives.set(node.reference, occurrence);

        for (const property of node.properties) {
            const propertyCapability = this.#session.capabilities.property(property.property);

            if (property.kind === "value") {
                const result: unknown = propertyCapability.write(candidate, property.value);
                this.#protocol.assertVoid("write", result);
                continue;
            }

            let initialized = false;
            let committed: unknown;
            const binding = this.#createBinding(
                () => {
                    const next = property.evaluate(state);

                    if (
                        initialized &&
                        this.#bindings.untrack(() => property.equal(committed, next))
                    ) {
                        return;
                    }

                    const result: unknown = propertyCapability.write(candidate, next);
                    this.#protocol.assertVoid("write", result);
                    committed = next;
                    initialized = true;
                },
                bindings,
                terminalize,
            );

            if (binding === undefined) {
                return undefined;
            }
        }

        const children = this.#constructFragment(
            node.children,
            state,
            owner,
            projections,
            primitives,
            components,
            bindings,
            terminalize,
        );

        if (children === undefined) {
            return undefined;
        }

        children.place(candidate, null);
        return occurrence;
    }

    /**
     * @description Creates one protected Component occurrence and its attachment-owned visual.
     * @typeParam State - Read-only state of the declaring parent Template occurrence.
     * @param instruction - Normalized nested Component declaration.
     * @param state - Supplying parent Template state.
     * @param owner - Parent attachment owning this nested Component occurrence.
     * @param components - Mutable Component index for the parent Template occurrence.
     * @param bindings - Mutable direct-binding ledger for the parent Template occurrence.
     * @param terminalize - Finalizer for parent-owned Component input binding failures.
     * @returns Nested Component occurrence, or undefined after a handled initial failure.
     */
    #constructComponent<State extends object>(
        instruction: TemplateComponent<State, number>,
        state: State,
        owner: Scope,
        components: Map<number, ComponentOccurrence<object, object>>,
        bindings: RenderBinding[],
        terminalize: RenderBindingTerminalFunctionType,
    ): RendererComponentOccurrence<Parent, Value> | undefined {
        if (components.has(instruction.reference)) {
            throw new TypeError("A nested Component reference can be instantiated only once.");
        }

        const composition = instruction.component as TemplatedComponentDefinition<object, object>;
        let initialInputs: ComponentInputValuesType<object> | undefined;
        let component: ComponentOccurrence<object, object> | undefined;
        let inputBinding: RenderBinding | undefined;

        if (instruction.inputs.kind === "value") {
            initialInputs = instruction.inputs.value as ComponentInputValuesType<object>;
        } else {
            const inputDeclaration = instruction.inputs;
            inputBinding = this.#createBinding(
                () => {
                    const next = inputDeclaration.evaluate(
                        state,
                    ) as ComponentInputValuesType<object>;

                    if (component === undefined) {
                        initialInputs = next;
                    } else {
                        component.updateInputs(next);
                    }
                },
                bindings,
                terminalize,
            );

            if (inputBinding === undefined) {
                return undefined;
            }
        }

        if (initialInputs === undefined) {
            throw new Error("A nested Component input binding produced no initial snapshot.");
        }

        component = this.#components.create(composition.component, {
            inputs: initialInputs,
            owner,
        });

        if (component === undefined) {
            return undefined;
        }

        const activeComponent = component;
        const childState: ComponentTemplateStateType<object, object> = Object.freeze({
            inputs: activeComponent.instance.inputs,
            controller: activeComponent.instance.controller,
        });
        const childProjections = new Map<object, TRendererProjectionRequest>();

        for (const projection of instruction.projections) {
            childProjections.set(projection.slot, {
                projection,
                state,
                owner,
            });
        }

        let visual:
            | RendererTemplateOccurrence<ComponentTemplateStateType<object, object>, Parent, Value>
            | undefined;
        let rendered: RendererComponentOccurrence<Parent, Value> | undefined;
        const terminalizeComponent = () => {
            if (rendered === undefined) {
                activeComponent.dispose();
            } else {
                rendered.dispose();
            }
        };
        activeComponent.attachment.run(() => {
            visual = this.#constructDefinition(
                composition.template,
                childState,
                activeComponent.attachment,
                childProjections,
                terminalizeComponent,
            );
        });

        if (visual === undefined) {
            return undefined;
        }

        components.set(instruction.reference, activeComponent);
        rendered = new RendererComponentOccurrence(
            activeComponent,
            visual,
            inputBinding === undefined ? [] : [inputBinding],
        );
        return rendered;
    }

    /**
     * @description Constructs selected projected content or the child-owned fallback fragment.
     * @typeParam State - Read-only state of the receiving child Template occurrence.
     * @param instruction - Normalized slot outlet declaration.
     * @param state - Receiving child Template state.
     * @param owner - Receiving child attachment owner.
     * @param projections - Parent-supplied projections available by exact slot identity.
     * @param primitives - Mutable primitive index for fallback declarations in this definition.
     * @param components - Mutable Component index for fallback declarations in this definition.
     * @param bindings - Mutable direct-binding ledger for this receiving Template occurrence.
     * @param terminalize - Finalizer for receiving child-owned binding failures.
     * @returns Selected content, or undefined after a handled initial failure.
     */
    #constructOutlet<State extends object>(
        instruction: TemplateOutlet<State, object, number>,
        state: State,
        owner: Scope,
        projections: ReadonlyMap<object, TRendererProjectionRequest>,
        primitives: Map<number, RendererPrimitiveOccurrence<Parent, Value>>,
        components: Map<number, ComponentOccurrence<object, object>>,
        bindings: RenderBinding[],
        terminalize: RenderBindingTerminalFunctionType,
    ): IRendererPlaceableOccurrence<Parent, Value> | undefined {
        const request = projections.get(instruction.slot);

        if (request === undefined) {
            return this.#constructFragment(
                instruction.fallback,
                state,
                owner,
                projections,
                primitives,
                components,
                bindings,
                terminalize,
            );
        }

        const projectionOwner = request.owner.child();
        owner.cleanup(() => {
            projectionOwner.dispose();
            return undefined;
        });
        let initialInputs: TemplateSlotInputValuesType<object> | undefined;
        let store: RendererSlotInputStore<object> | undefined;
        const slotBinding = this.#createBinding(
            () => {
                const next = instruction.inputs(state) as TemplateSlotInputValuesType<object>;

                if (store === undefined) {
                    initialInputs = next;
                } else {
                    store.update(next);
                }
            },
            bindings,
            terminalize,
        );

        if (slotBinding === undefined) {
            return undefined;
        }

        if (initialInputs === undefined) {
            throw new Error("A slot-input binding produced no initial snapshot.");
        }
        const activeInitialInputs = initialInputs;

        let projection:
            | RendererTemplateOccurrence<TemplateProjectionStateType<object, object>, Parent, Value>
            | undefined;
        const terminalizeProjection = () => {
            const cleanup = new RendererCleanupCollector();
            cleanup.attempt(() => slotBinding.dispose());
            cleanup.attempt(() => projection?.dispose());
            cleanup.attempt(() => projectionOwner.dispose());
            cleanup.throwIfAny("Projected Template terminal cleanup failed.");
        };
        projectionOwner.run(() => {
            store = new RendererSlotInputStore(this.#runtime, activeInitialInputs);
            const projectionState: TemplateProjectionStateType<object, object> = Object.freeze({
                parent: request.state,
                slot: store.inputs,
            });
            projection = this.#constructDefinition(
                request.projection.template,
                projectionState,
                projectionOwner,
                new Map(),
                terminalizeProjection,
            );
        });

        return projection;
    }

    /**
     * @description Creates one owned Core render binding and records its protected handle.
     * @param operation - Tracked synchronous Renderer operation.
     * @param bindings - Mutable direct-binding ledger for the active Template occurrence.
     * @param terminalize - Finalizer for the complete occurrence owning the binding.
     * @returns The initialized binding, or undefined after a handled initial failure.
     */
    #createBinding(
        operation: () => void,
        bindings: RenderBinding[],
        terminalize: RenderBindingTerminalFunctionType,
    ): RenderBinding | undefined {
        const binding = this.#bindings.create(operation, terminalize);

        if (binding === undefined) {
            return undefined;
        }

        bindings.push(binding);
        return binding;
    }
}
