# `ComponentInputsType<Inputs>`

`ComponentInputsType<Inputs>` maps every declarative input key to a `ReadonlySignal` of its declared value type.

```text
{ label: string, disabled?: boolean }
    becomes
{ readonly label: ReadonlySignal<string>,
  readonly disabled: ReadonlySignal<boolean | undefined> }
```

All keys remain present so setup and compiled templates can read inputs through one stable object shape. The future component engine owns the mutable input signals; component code receives only read capability. Internal updates use complete normalized snapshots and batch all signal writes as one reactive change boundary.

The internal `TComponentInputValue<Inputs, Key>` resolver preserves `undefined` when an optional property is converted into a required signal key. This avoids TypeScript removing `undefined` as a side effect of removing the optional property modifier.

See [Component](../component/index.md), [Setup](../setup/index.md), and [Instance](../instance/index.md).
