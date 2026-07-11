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

## `ComponentInputValuesType<Inputs>`

`ComponentInputValuesType` is the immutable normalized value snapshot accepted by component creation and internal input updates. Every declared key is required. Optional declarations retain `undefined` in their value type, so clearing an input is explicit.

The programmatic low-level API requires normalized snapshots. A future `.lily` compiler or higher-level authoring API may normalize omitted optional inputs before calling the component runtime.

See [Component](../component/index.md), [Setup](../setup/index.md), and [Instance](../instance/index.md).
