/**
 * @description Internal base contract for Core services.
 * A Core service is an entity that participates in the Core lifecycle
 * and represents a stable subsystem of the framework.
 * @remarks This interface exists to provide architectural clarity and enable
 * introspection, instrumentation, and future extensibility.
 */
export interface ICoreService {
    /**
     * @description A stable semantic identifier for the service.
     * Used for debugging, inspection, and tooling.
     */
    readonly name: string;
}
