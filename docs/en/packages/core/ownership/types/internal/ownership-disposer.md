# `TOwnershipDisposer`

`TOwnershipDisposer` is the internal operation stored by ownership ledgers. It receives the unhandled error collection shared by one recursive disposal pass and returns `undefined` after attempting its entry.

Child scopes contribute directly to the same collection instead of throwing an intermediate aggregate. This prevents parent scopes from routing the same child failure through error boundaries more than once.

See the [Ownership Runtime](../../runtime/index.md).
