# `ComponentInputsType<Inputs>`

`ComponentInputsType<Inputs>` maps every declarative input key to a `ReadonlySignal` of its declared value type.

```text
{ label: string, disabled?: boolean }
    becomes
{ readonly label: ReadonlySignal<string>,
  readonly disabled: ReadonlySignal<boolean | undefined> }
```

All keys remain present so setup and compiled templates can read inputs through one stable object shape. `ComponentInputStore` privately owns the mutable Core signals, while each public property contains a frozen `ComponentInputSignal` wrapper that exposes only `get()` at both the TypeScript and JavaScript levels. Internal updates use complete normalized snapshots and batch all signal writes as one reactive change boundary.

The store captures its normalized key set from the initial snapshot. Every update must contain exactly that set: missing and additional keys are rejected before any signal write. Snapshot values are also read before the batch begins, preventing a throwing accessor from leaving a partially written store.

The internal `TComponentInputValue<Inputs, Key>` resolver preserves `undefined` when an optional property is converted into a required signal key. This avoids TypeScript removing `undefined` as a side effect of removing the optional property modifier.

## `ComponentInputValuesType<Inputs>`

`ComponentInputValuesType` is the immutable normalized value snapshot accepted by component creation and internal input updates. Every declared key is required. Optional declarations retain `undefined` in their value type, so clearing an input is explicit.

The programmatic low-level API requires normalized snapshots. A future `.lily` compiler or higher-level authoring API may normalize omitted optional inputs before calling the component runtime.

Input signals are created while the component scope is active and close with that scope. The stable input object and each read wrapper remain the same objects across updates, but reads after disposal follow Core's disposed-signal failure behavior.

See [Component](../component/index.md), [Setup](../setup/index.md), and [Instance](../instance/index.md).
