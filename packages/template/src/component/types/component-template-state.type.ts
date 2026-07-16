import type { ComponentControllerType, ComponentInputsType } from "@lilium/component";

/**
 * @description Frozen template state assembled from one initialized headless component instance.
 * @typeParam Inputs - Declarative component input value shape.
 * @typeParam Controller - Public controller object returned by component setup.
 */
export type ComponentTemplateStateType<
    Inputs extends object,
    Controller extends object,
> = Readonly<{
    /** @description Exact stable read-only reactive component inputs. */
    inputs: ComponentInputsType<Inputs>;

    /** @description Exact stable read-only public component controller. */
    controller: ComponentControllerType<Controller>;
}>;
