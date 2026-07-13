# Scheduler

Status: **Runtime implemented**

Scheduler is an internal core feature that deterministically executes renderer bindings and user effects. It is not an end-user queue API and is not exported from the package root.

## Compositions

- [Phases and cycles](phases.md) define ordering, reentry, deduplication, and flushing.
- [Scheduler Runtime](runtime/index.md) implements queues, ownership restoration, failures, and cycle detection.

## Internal contracts and types

- [`IScheduler`](contracts/internal/scheduler.md) owns queues and synchronous flushes.
- [`ISchedulerJob`](contracts/internal/scheduler-job.md) represents one identity-bearing work item.
- [`TSchedulerPhase`](types/internal/scheduler-phase.md) restricts executable phases to `render` and `effect`.
- [`TSchedulerQueueEntry`](types/internal/scheduler-queue-entry.md) distinguishes cancelled appearances from later enqueue operations.

## Boundaries

Signal writes and dependency invalidation are synchronous graph operations, not scheduler jobs. Computed values remain lazy and evaluate when scheduled consumers read them. Cleanup belongs to effect or ownership lifecycle. Consequently, neither `compute` nor `cleanup` is an executable queue phase.

The future renderer package will require a controlled adapter-facing bridge to create render jobs without exposing scheduler mutation to application code.
