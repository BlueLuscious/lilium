import type { AbstractViewNode } from "./abstract-view-node.contract";


/**
 * @description Root wrapper for the last rendered abstract tree.
 */
export interface AbstractViewTree {
    /** @description Root node of the rendered tree. */
    root: AbstractViewNode;
}
