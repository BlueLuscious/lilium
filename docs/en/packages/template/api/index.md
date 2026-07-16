# Template API

Status: **Definitions and bindings available**

`TemplateApi` is the complete contract for the future frozen `Template` object. It is stateless,
synchronous, and independent from Renderer and host implementations.

| Operation | Declaration responsibility | Availability |
| --- | --- | --- |
| `primitive()` | Create a portable primitive identity. | Implemented |
| `property()` | Create a typed property owned by one primitive. | Implemented |
| `slot()` | Create a named projection-point identity. | Slot phase |
| `value()` | Declare a static primitive property value. | Implemented |
| `binding()` | Declare a dynamic property evaluator and equality operation. | Implemented |
| `node()` | Declare a primitive node with ordered properties and children. | Implemented |
| `component()` | Declare a nested templated component and complete input evaluator. | Component phase |
| `outlet()` | Declare a slot outlet, slot-input evaluator, and optional fallback. | Slot phase |
| `define()` | Validate and normalize a complete reusable template program. | Implemented |
| `compose()` | Compose independent compatible Component and Template definitions. | Component phase |

The root exports `TemplateApi` as the complete target contract and `Template` as the frozen surface
whose methods already have real immutable behavior. New methods join the same object only when
their feature implementation is complete. See the
[Template ABI public object model](../../../architecture/template-abi.md#public-object-model).
