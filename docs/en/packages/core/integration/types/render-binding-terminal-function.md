# `RenderBindingTerminalFunctionType`

`RenderBindingTerminalFunctionType` receives the original `unknown` error from failed binding work
and returns `void`.

Core invokes it once after failed tracked execution unwinds and before the original failure
finishes ownership error routing. Renderer uses it to terminalize the complete rendered occurrence,
not to retry work. If terminalization also throws, Core must preserve both failures according to
the accepted cleanup model.
