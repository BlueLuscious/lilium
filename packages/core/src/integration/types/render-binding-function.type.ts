/**
 * @description Synchronous tracked work performed by one reactive render binding.
 * @remarks Reading reactive sources registers dependencies. Returning a Promise is unsupported.
 * @returns Nothing.
 */
export type RenderBindingFunctionType = () => void;
