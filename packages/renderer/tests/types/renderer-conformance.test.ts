import type {
    RendererConformanceAdapter,
    RendererConformanceAssertions,
    RendererConformanceHost,
    RendererConformanceHostOptionsType,
    RendererConformanceScenario,
} from "../../src/conformance/index.js";
import { RendererConformance } from "../../src/conformance/index.js";

declare const adapter: RendererConformanceAdapter;
declare const assertions: RendererConformanceAssertions;
declare const host: RendererConformanceHost;
declare const options: RendererConformanceHostOptionsType;

const scenarios: readonly RendererConformanceScenario[] = RendererConformance.scenarios(adapter);

adapter.createHost(options);
host.operations({ name: "types" });
host.completedOperations({ name: "types" });
host.snapshot({ name: "types" });

for (const scenario of scenarios) {
    const name: string = scenario.name;
    scenario.run(assertions);
    void name;
}
