import type {
    IScheduler,
    ISchedulerJob,
} from "../../../src/scheduler/contracts/internal/index.js";
import type { TSchedulerPhase } from "../../../src/scheduler/types/internal/index.js";

declare const job: ISchedulerJob;
declare const scheduler: IScheduler;

const phase: TSchedulerPhase = job.phase;
const result: undefined = job.execute();

scheduler.enqueue(job);
scheduler.enqueue(job);
scheduler.cancel(job);
scheduler.flush();

// @ts-expect-error Computed values are lazy and do not use a scheduler phase.
const computePhase: TSchedulerPhase = "compute";

// @ts-expect-error Cleanup belongs to resource lifecycle rather than a scheduler phase.
const cleanupPhase: TSchedulerPhase = "cleanup";

// @ts-expect-error Queue entries must implement the nominal scheduler job role.
scheduler.enqueue({ phase: "effect", execute: () => undefined });

void computePhase;
void cleanupPhase;
void phase;
void result;
