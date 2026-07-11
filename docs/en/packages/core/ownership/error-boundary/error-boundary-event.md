# `ErrorBoundaryEvent`

`ErrorBoundaryEvent` is the immutable object delivered to an error boundary handler.

Its `error` member is `unknown`, allowing user, framework, renderer, platform, and future package errors without a closed inheritance hierarchy. Its `owner` member identifies the nearest scope that owned the failed operation or is `null` for runtime-root failures.

See [`ErrorBoundary`](index.md).
