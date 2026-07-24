/** @description Explicit options that fully identify one Lily compilation input. */
export type CompilerOptionsType = Readonly<{
    /**
     * @description Caller-owned source identity used by diagnostics, generated maps, and tooling.
     * @remarks The compiler normalizes path separators but performs no path resolution or I/O.
     */
    filename: string;
}>;
