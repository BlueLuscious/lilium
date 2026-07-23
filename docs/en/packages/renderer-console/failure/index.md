# Renderer Console Failure Injection

Status: **Implemented**

Failure configuration reproduces host incompatibility and operation errors without importing any
Renderer implementation module. All configuration is host-local and resets for each opening
attempt.

## Types

| Type | Responsibility | Relationships |
| --- | --- | --- |
| `ConsoleFailureInjectionType` | Select one public host operation, one optional one-based occurrence, and the exact value to throw. | Supplied through `ConsoleHostOptionsType.failures`. |

## Runtime Concepts

| Concept | Responsibility | Relationships |
| --- | --- | --- |
| `ConsoleFailureInjector` | Normalize a failure plan, count operation attempts, and throw the exact scheduled value. | A fresh injector is created for every `ConsoleHost.open()` attempt. |

## Capability Omission

`ConsoleHostOptionsType.omittedPrimitives` and `omittedProperties` make configured exact identities
resolve as unsupported. Omitted identities must already belong to the host declaration set and
cannot appear twice. Renderer then reports its normal structured `missing-primitive` or
`missing-property` compatibility error before host value creation.

## Operation Failure

The accepted operations are `open`, `resolve-primitive`, `resolve-property`, `create`, `write`,
`place`, `remove`, `release`, and `close`. Occurrences are positive safe integers and default to
one. A plan cannot assign multiple failures to the same operation occurrence.

An injected operation records an attempted [trace entry](../trace/index.md) and throws the exact
configured value without recording completion. Injection occurs before mutation for ordinary
operations. Two terminal cleanup operations preserve the universal protocol exception:

- `release` marks the value terminal before throwing, so the handle cannot be reused;
- `close` marks the session terminal and releases its root claim before throwing.

These exceptions match the canonical [atomic host contract and terminal cleanup
rules](../../../architecture/renderer-protocol.md#atomic-host-contract).
