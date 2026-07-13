# Signal Runtime

`SignalRuntime<T>` is the internal owned implementation of [`Signal<T>`](../index.md). It is not exported from the Core package root.

## Read flow

`get()` first verifies that ownership disposal has not closed the signal. It then reports the signal as a source to the runtime tracker and returns the latest accepted value. A read without an active consumer creates no graph edge; a tracked read follows the runtime-isolation rules documented by [Dependency Tracking](../../tracking/index.md).

## Write flow

`set(candidate)` executes the configured equality function through `untrack()`. Equality or updater failures leave the stored value unchanged and propagate to the imperative caller. An equal candidate is discarded. A changed candidate replaces the value and synchronously invalidates a stable snapshot of connected consumers.

`update(updater)` executes the updater untracked with the latest stored value, then sends its result through the same `set()` equality and invalidation flow.

Signals are shallow cells. Mutating a stored object without an explicit write changes that object but performs no equality check or graph invalidation.

## Ownership cleanup

Construction registers one disposer under the active scope or runtime root. Disposal permanently closes reads and writes and asks the tracker to remove every source-consumer edge. Source-side disconnection prevents longer-lived consumers from retaining a disposed signal.

See [Tracking Runtime](../../tracking/runtime/index.md) and [Ownership Runtime](../../../ownership/runtime/index.md).
