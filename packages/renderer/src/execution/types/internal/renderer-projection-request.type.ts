import type { Scope } from "@lilium/core";
import type { TemplateProjection } from "@lilium/template";

/** @description Parent-owned projection context supplied to one nested Component occurrence. */
export type TRendererProjectionRequest = Readonly<{
    /** @description Genuine projection declaration selected by exact slot identity. */
    projection: TemplateProjection<object, object>;

    /** @description Supplying parent Template state retained by projected content. */
    state: object;

    /** @description Supplying parent attachment that semantically owns projected content. */
    owner: Scope;
}>;
