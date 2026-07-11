/**
 * @description Internal ordered phase assigned to a synchronous scheduler job.
 * @remarks Render jobs always execute before effect jobs within the same cycle.
 */
export type TSchedulerPhase = "render" | "effect";
