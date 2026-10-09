import { SearchNode } from '../types/game';

export interface LayoutedNode extends SearchNode {
  x: number;
  y: number;
  subtreeWidth: number;
}

/**
 * Computes 2D coordinates for search tree nodes in a hierarchical layout.
 */
export function computeTreeLayout(
  rootId: string,
  nodes: Record<string, SearchNode>,
  nodeSpacingX: number = 90,
  layerSpacingY: number = 100
): { layoutedNodes: Record<string, LayoutedNode>; width: number; height: number } {
  const layoutedNodes: Record<string, LayoutedNode> = {};

  // First pass: compute subtree widths bottom-up
  function computeSubtreeWidth(nodeId: string): number {
    const node = nodes[nodeId];
    if (!node || node.childIds.length === 0) {
      return nodeSpacingX;
    }

    let totalWidth = 0;
    for (const childId of node.childIds) {
      totalWidth += computeSubtreeWidth(childId);
    }
    return Math.max(nodeSpacingX, totalWidth);
  }

  // Second pass: assign (x, y) coordinates
  let minX = Infinity;
  let maxX = -Infinity;
  let maxY = 0;

  function assignPositions(nodeId: string, currentX: number, depth: number) {
    const node = nodes[nodeId];
    if (!node) return;

    const y = depth * layerSpacingY + 40;
    maxY = Math.max(maxY, y);

    if (node.childIds.length === 0) {
      layoutedNodes[nodeId] = {
        ...node,
        x: currentX + nodeSpacingX / 2,
        y,
        subtreeWidth: nodeSpacingX,
      };
      minX = Math.min(minX, layoutedNodes[nodeId].x);
      maxX = Math.max(maxX, layoutedNodes[nodeId].x);
      return;
    }

    // Children layout
    let childXCursor = currentX;
    const childWidths: number[] = [];

    for (const childId of node.childIds) {
      const child = nodes[childId];
      let cWidth = nodeSpacingX;
      if (child && child.childIds.length > 0) {
        cWidth = 0;
        for (const gcId of child.childIds) {
          cWidth += computeSubtreeWidth(gcId);
        }
        cWidth = Math.max(nodeSpacingX, cWidth);
      }
      childWidths.push(cWidth);
      assignPositions(childId, childXCursor, depth + 1);
      childXCursor += cWidth;
    }

    // Parent center is average of first and last child X
    const firstChild = layoutedNodes[node.childIds[0]];
    const lastChild = layoutedNodes[node.childIds[node.childIds.length - 1]];
    const parentX = firstChild && lastChild ? (firstChild.x + lastChild.x) / 2 : currentX + nodeSpacingX / 2;

    layoutedNodes[nodeId] = {
      ...node,
      x: parentX,
      y,
      subtreeWidth: childXCursor - currentX,
    };

    minX = Math.min(minX, parentX);
    maxX = Math.max(maxX, parentX);
  }

  assignPositions(rootId, 40, 0);

  // Normalize so minX starts with padding
  const offsetX = minX < 40 ? 40 - minX : 0;
  for (const id in layoutedNodes) {
    layoutedNodes[id].x += offsetX;
  }

  const totalWidth = Math.max(800, (maxX - minX) + 120);
  const totalHeight = maxY + 80;

  return { layoutedNodes, width: totalWidth, height: totalHeight };
}
