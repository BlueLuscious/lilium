import type { ViewNodeType } from "../types/view-node.type";
import type { ViewNodePropsType } from "../types/view-node-props.type";


/**
 * @description Serializable abstract node emitted by component render functions.
 * @remarks This node is renderer-agnostic and contains only structural data.
 */
export interface AbstractViewNode {
    /** @description Node semantic type interpreted by renderers. */
    type: ViewNodeType;

    /** @description Node props payload. */
    props: ViewNodePropsType;

    /** @description Ordered child nodes in render order. */
    children: AbstractViewNode[];

    /** @description Optional stable key used for identity during reconciliation. */
    key?: string;
}
