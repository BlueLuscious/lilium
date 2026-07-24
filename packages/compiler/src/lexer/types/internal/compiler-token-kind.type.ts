/**
 * @description Internal lexical categories emitted by deterministic Lily tokenization.
 */
export type TCompilerTokenKind =
    | "identifier"
    | "number"
    | "string"
    | "template"
    | "punctuator"
    | "operator"
    | "line-comment"
    | "block-comment"
    | "invalid"
    | "eof";
