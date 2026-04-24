import React from 'react';

import type { TreeNode as TreeNodeType } from './TreeNode';

export interface TreeDragContextValue {
  draggedNode: TreeNodeType | null;
  setDraggedNode: (node: TreeNodeType | null) => void;
  moveNode: (
    sourceNodeId: string,
    targetParentNodeId: string | null,
    sourceOldParent?: string | null,
    sourceName?: string
  ) => Promise<void>;
}

export const TreeDragContext = React.createContext<TreeDragContextValue | null>(null);
