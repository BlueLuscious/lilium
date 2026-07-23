import type { TCompilerUnsupportedKeyword } from "../types/internal/compiler-unsupported-keyword.type.js";

/**
 * @description Immutable unsupported Lily keyword vocabulary and its dedicated milestone diagnostics.
 */
export const lilyUnsupportedKeywords: Readonly<
    Record<string, TCompilerUnsupportedKeyword | undefined>
> = Object.freeze({
    setup: Object.freeze({
        code: "LILY3001",
        message: "Inline setup declarations are not supported by the first compiler milestone.",
    }),
    script: Object.freeze({
        code: "LILY3001",
        message: "Inline script declarations are not supported by the first compiler milestone.",
    }),
    state: Object.freeze({
        code: "LILY3001",
        message: "Inline state declarations are not supported by the first compiler milestone.",
    }),
    input: Object.freeze({
        code: "LILY3001",
        message: "Inline input declarations are not supported by the first compiler milestone.",
    }),
    inputs: Object.freeze({
        code: "LILY3001",
        message: "Inline inputs declarations are not supported by the first compiler milestone.",
    }),
    controller: Object.freeze({
        code: "LILY3001",
        message:
            "Inline controller declarations are not supported by the first compiler milestone.",
    }),
    interface: Object.freeze({
        code: "LILY3003",
        message: "TypeScript declarations are not supported in Lily source.",
    }),
    type: Object.freeze({
        code: "LILY3003",
        message: "TypeScript declarations are not supported in Lily source.",
    }),
    enum: Object.freeze({
        code: "LILY3003",
        message: "TypeScript declarations are not supported in Lily source.",
    }),
    namespace: Object.freeze({
        code: "LILY3003",
        message: "TypeScript declarations are not supported in Lily source.",
    }),
    declare: Object.freeze({
        code: "LILY3003",
        message: "TypeScript declarations are not supported in Lily source.",
    }),
    component: Object.freeze({
        code: "LILY3004",
        message: "Nested component declarations are not supported by the first compiler milestone.",
    }),
    slot: Object.freeze({
        code: "LILY3004",
        message: "Slot declarations are not supported by the first compiler milestone.",
    }),
    outlet: Object.freeze({
        code: "LILY3004",
        message: "Outlet declarations are not supported by the first compiler milestone.",
    }),
    projection: Object.freeze({
        code: "LILY3004",
        message: "Projection declarations are not supported by the first compiler milestone.",
    }),
    project: Object.freeze({
        code: "LILY3004",
        message: "Projection declarations are not supported by the first compiler milestone.",
    }),
    if: Object.freeze({
        code: "LILY3005",
        message: "Conditional regions are not supported by the first compiler milestone.",
    }),
    when: Object.freeze({
        code: "LILY3005",
        message: "Conditional regions are not supported by the first compiler milestone.",
    }),
    switch: Object.freeze({
        code: "LILY3005",
        message: "Conditional regions are not supported by the first compiler milestone.",
    }),
    each: Object.freeze({
        code: "LILY3006",
        message: "Repetition regions are not supported by the first compiler milestone.",
    }),
    for: Object.freeze({
        code: "LILY3006",
        message: "Repetition regions are not supported by the first compiler milestone.",
    }),
    repeat: Object.freeze({
        code: "LILY3006",
        message: "Repetition regions are not supported by the first compiler milestone.",
    }),
    fragment: Object.freeze({
        code: "LILY3007",
        message: "Dynamic fragments are not supported by the first compiler milestone.",
    }),
    anchor: Object.freeze({
        code: "LILY3007",
        message: "Explicit anchors are not supported by the first compiler milestone.",
    }),
    async: Object.freeze({
        code: "LILY3009",
        message: "Async declarations are not supported by the first compiler milestone.",
    }),
    resource: Object.freeze({
        code: "LILY3009",
        message: "Resource declarations are not supported by the first compiler milestone.",
    }),
    style: Object.freeze({
        code: "LILY3011",
        message: "Style declarations are not supported by the first compiler milestone.",
    }),
    styles: Object.freeze({
        code: "LILY3011",
        message: "Style declarations are not supported by the first compiler milestone.",
    }),
    css: Object.freeze({
        code: "LILY3011",
        message: "CSS declarations are not supported by the first compiler milestone.",
    }),
    asset: Object.freeze({
        code: "LILY3011",
        message: "Asset declarations are not supported by the first compiler milestone.",
    }),
    transition: Object.freeze({
        code: "LILY3012",
        message: "Transition declarations are not supported by the first compiler milestone.",
    }),
    animation: Object.freeze({
        code: "LILY3012",
        message: "Animation declarations are not supported by the first compiler milestone.",
    }),
    animate: Object.freeze({
        code: "LILY3012",
        message: "Animation declarations are not supported by the first compiler milestone.",
    }),
    portal: Object.freeze({
        code: "LILY3012",
        message: "Portal declarations are not supported by the first compiler milestone.",
    }),
    hydration: Object.freeze({
        code: "LILY3012",
        message: "Hydration declarations are not supported by the first compiler milestone.",
    }),
    hydrate: Object.freeze({
        code: "LILY3012",
        message: "Hydration declarations are not supported by the first compiler milestone.",
    }),
    stream: Object.freeze({
        code: "LILY3012",
        message: "Streaming declarations are not supported by the first compiler milestone.",
    }),
    preprocess: Object.freeze({
        code: "LILY3013",
        message: "Preprocessor directives are not supported by the first compiler milestone.",
    }),
    macro: Object.freeze({
        code: "LILY3013",
        message: "Macro directives are not supported by the first compiler milestone.",
    }),
    plugin: Object.freeze({
        code: "LILY3013",
        message: "Plugin directives are not supported by the first compiler milestone.",
    }),
    hmr: Object.freeze({
        code: "LILY3013",
        message: "HMR directives are not supported by the first compiler milestone.",
    }),
});
