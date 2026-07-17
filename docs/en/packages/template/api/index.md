# Template API

Status: **Complete declaration API available**

`TemplateApi` is the complete contract implemented by the frozen `Template` object. It is
stateless, synchronous, and independent from Renderer and host implementations.

| Operation | Declaration responsibility | Availability |
| --- | --- | --- |
| `primitive()` | Create a portable primitive identity. | Implemented |
| `property()` | Create a typed property owned by one primitive. | Implemented |
| `slot()` | Create a named projection-point identity. | Implemented |
| `value()` | Declare a static primitive property value. | Implemented |
| `binding()` | Declare a dynamic property evaluator and equality operation. | Implemented |
| `node()` | Declare a primitive node with ordered properties and children. | Implemented |
| `component()` | Declare a nested templated component with static or dynamic complete inputs. | Implemented |
| `outlet()` | Declare a slot outlet, slot-input evaluator, and optional fallback. | Implemented |
| `projection()` | Declare typed parent-owned content for one child slot. | Implemented |
| `define()` | Validate and normalize a complete reusable template program. | Implemented |
| `compose()` | Compose independent compatible Component and Template definitions. | Implemented |

The root exports `TemplateApi` as the complete target contract and `Template` as its frozen
implementation. Every method creates immutable identities or declarations and performs no
Renderer, ownership, or host work. See the
[Template ABI public object model](../../../architecture/template-abi.md#public-object-model).

The built distribution exports only the `Template` runtime value. Its verified method snapshot is
`primitive`, `property`, `slot`, `value`, `binding`, `node`, `component`, `outlet`, `projection`,
`define`, and `compose`; additions or removals require an explicit ABI decision.
