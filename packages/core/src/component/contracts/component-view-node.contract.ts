import type { ComponentNodeType } from "../types/component-node.type";
import type { AbstractViewNode } from "../../render/contracts/abstract-view-node.contract";
import type { ViewNodePropsType } from "../../render/types/view-node-props.type";


/**
 * @description Abstract node that references another component definition.
 * @remarks Core interprets this node and mounts/reconciles a component instance.
 */
export interface ComponentViewNode extends AbstractViewNode {
    /** @description Internal component-node discriminator. */
    type: ComponentNodeType;

    /** @description Target component definition identifier to instantiate. */
    componentId: string;

    /** @description Inputs/props forwarded to the mounted child component. */
    props: ViewNodePropsType;

    /** @description Optional stable key used to derive child identity. */
    key?: string;
}
