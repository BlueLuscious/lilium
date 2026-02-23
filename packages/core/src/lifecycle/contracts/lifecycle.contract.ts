/**
 * @description Optional lifecycle hooks for a component definition.
 * @remarks Hooks are executed by the lifecycle manager during mount and unmount.
 */
export interface Lifecycle {
    /** @description Called once when the component instance is mounted. */
    onMount?(): void;

    /** @description Called once when the component instance is unmounted. */
    onUnmount?(): void;
}
