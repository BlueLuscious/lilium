# `ComponentControllerType<Controller>`

`ComponentControllerType<Controller>` is the read-only public object returned by component setup.

It prevents replacement of exposed properties while allowing methods to update internal reactive state. Promise-like controller types resolve to `never`, preserving synchronous setup semantics.

The controller is behavioral rather than visual. A template may bind to its signals and invoke its methods, while a headless consumer may use it without any renderer.

See [Component](../component/index.md) and [Setup](../setup/index.md).
