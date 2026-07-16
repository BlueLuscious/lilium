/**
 * @description Finalizes the rendered occurrence that owns a failed render binding.
 * @remarks Core invokes this operation once after failed tracked work unwinds and before the
 * original failure completes ownership error routing. Throwing adds a cleanup failure.
 * @param error - Original failure raised by binding work.
 * @returns Nothing.
 */
export type RenderBindingTerminalFunctionType = (error: unknown) => void;
