# `RenderBindingFunctionType`

`RenderBindingFunctionType` is a synchronous zero-argument operation returning `void`.

Reactive reads performed by the operation become binding dependencies. Returning asynchronous work
is unsupported because tracking, ownership, host mutation, and error routing must remain inside one
synchronous Core scheduling boundary.
