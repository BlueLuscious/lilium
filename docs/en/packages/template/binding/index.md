# Template Binding

A binding is an immutable declaration, not a live reactive consumer. Renderer later creates one
Core render binding for each normalized declaration.

| Contract or type | Responsibility | Relationships |
| --- | --- | --- |
| `TemplateBinding<State, Primitive, Value, Reference>` | Dynamic property declaration with evaluator, equality, and references. | Targets one `TemplateProperty` and normalized primitive node. |
| `TemplateBindingEvaluatorType<State, Value>` | Pure synchronous candidate evaluator. | Receives only read-only occurrence state. |
| `TemplateBindingEqualityType<Value>` | Candidate equality operation. | Renderer executes it untracked before host mutation. |
| `TemplateBindingOptionsType<Value>` | Optional caller input for binding equality. | Defaults to `Object.is` when omitted. |

Evaluation, tracking, equality, and failure semantics remain canonical in
[Dynamic bindings](../../../architecture/template-abi.md#dynamic-bindings).
