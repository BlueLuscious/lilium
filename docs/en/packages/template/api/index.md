# Template API

Status: **Contract declared**

`TemplateApi` is the complete contract for the future frozen `Template` object. It is stateless,
synchronous, and independent from Renderer and host implementations.

| Operation | Declaration responsibility |
| --- | --- |
| `primitive()` | Create a portable primitive identity. |
| `property()` | Create a typed property owned by one primitive. |
| `slot()` | Create a named projection-point identity. |
| `value()` | Declare a static primitive property value. |
| `binding()` | Declare a dynamic property evaluator and equality operation. |
| `node()` | Declare a primitive node with ordered properties and children. |
| `component()` | Declare a nested templated component and complete input evaluator. |
| `outlet()` | Declare a slot outlet, slot-input evaluator, and optional fallback. |
| `define()` | Validate and normalize a complete reusable template program. |
| `compose()` | Compose independent compatible Component and Template definitions. |

The root currently exports `TemplateApi` as a type. It will export the `Template` runtime value
only when these operations have real immutable behavior in Phase 01. See the
[Template ABI public object model](../../../architecture/template-abi.md#public-object-model).
