/**
 * @description Read-only public controller exposed by a headless component setup.
 * @remarks Promise-like controllers resolve to never because component setup is
 * strictly synchronous. Controller methods may still mutate owned reactive state.
 * @typeParam Controller - Object shape returned by component setup.
 */
export type ComponentControllerType<Controller extends object> =
    Controller extends PromiseLike<unknown>
        ? never
        : Readonly<Controller>;
