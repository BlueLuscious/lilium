/** @description Synchronous host operation associated with one Renderer protocol violation. */
export type RendererHostOperationType =
    | "open"
    | "resolve-primitive"
    | "resolve-property"
    | "create"
    | "write"
    | "place"
    | "remove"
    | "release"
    | "close";
