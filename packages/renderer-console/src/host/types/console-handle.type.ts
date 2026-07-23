/** @description Opaque logical parent and value identity owned by one Console host session. */
declare const CONSOLE_HANDLE: unique symbol;

/** @description Opaque logical handle exposed to Renderer only through its public host protocol. */
export type ConsoleHandleType = object & {
    /** @description Type-only nominal marker preventing external handle construction. */
    readonly [CONSOLE_HANDLE]: true;
};
