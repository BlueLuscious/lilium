# `ComponentInputsType<Inputs>`

`ComponentInputsType<Inputs>` maps every declarative input key to a `ReadonlySignal` of its declared value type.

```text
{ label: string, disabled?: boolean }
    becomes
{ readonly label: ReadonlySignal<string>,
  readonly disabled: ReadonlySignal<boolean | undefined> }
```

All keys remain present so setup and compiled templates can read inputs through one stable object shape. The future component engine owns the mutable input signals; component code receives only read capability.

See [Component](../component/index.md) and [Setup](../setup/index.md).
