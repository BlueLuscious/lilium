# Template Primitive

Primitive identities describe semantic host capabilities without containing host behavior.
Property ownership is explicit and uses the primitive object identity rather than a name lookup.

| Contract or type | Responsibility | Relationships |
| --- | --- | --- |
| `TemplatePrimitive<Properties>` | Portable primitive capability identity. | Owns compatible `TemplateProperty` identities. |
| `TemplateProperty<Primitive, Value>` | Typed property identity belonging to one primitive. | Used by static values and bindings. |
| `TemplateStaticValue<Primitive, Value>` | One value applied during instantiation. | Retains the application value by reference. |
| `TemplateNode<State, Primitive, Reference>` | Primitive instruction with ordered properties and children. | Participates in `TemplateInstructionType`. |
| `TemplateNodeOptionsType<State, Primitive>` | Caller input for `node()`. | Accepts unnormalized property instructions and children. |
| `TemplatePropertyInstructionType<State, Primitive, Reference>` | Static-value or dynamic-binding union. | Preserves primitive ownership across both value modes. |

Adapters map capabilities explicitly as defined by
[Primitive capabilities](../../../architecture/template-abi.md#primitive-capabilities).

`TemplateIdentityRegistry` retains genuine primitive and property objects in weak identity sets.
Names are trimmed for diagnostics, but equal names never make two capabilities equal. Property
creation and node declaration reject structural imitations and cross-primitive property use.
