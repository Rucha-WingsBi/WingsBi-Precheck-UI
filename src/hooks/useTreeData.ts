import { useMemo, useCallback } from 'react';

interface TreeNode {
  id: string | number;
  parentId?: string | number;
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
  children?: TreeNode[];
  [key: string]: any;
}

interface UseTreeDataProps {
  data: any[];
  idField?: string;
  parentIdField?: string;
  expandedNodes?: Set<string | number>;
}

interface UseTreeDataReturn {
  treeData: TreeNode[];
  flattenedData: TreeNode[];
  toggleNode: (nodeId: string | number) => void;
  expandAll: () => void;
  collapseAll: () => void;
  getNodePath: (nodeId: string | number) => TreeNode[];
  getNodeLevel: (nodeId: string | number) => number;
}

export const useTreeData = ({
  data,
  idField = 'id',
  parentIdField = 'parentId',
  expandedNodes = new Set(),
}: UseTreeDataProps): UseTreeDataReturn => {
  
  // Build tree structure from flat data
  const treeData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const nodeMap = new Map<string | number, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // First pass: create all nodes
    data.forEach((item, index) => {
      const nodeId = item[idField] || index;
      const node: TreeNode = {
        ...item,
        id: nodeId,
        parentId: item[parentIdField],
        level: 0,
        hasChildren: false,
        isExpanded: expandedNodes.has(nodeId) || !!item.isExpanded,
        children: [],
      };
      nodeMap.set(nodeId, node);
    });

    // Second pass: build parent-child relationships and calculate levels
    nodeMap.forEach((node) => {
      if (node.parentId && nodeMap.has(node.parentId)) {
        const parent = nodeMap.get(node.parentId)!;
        parent.children!.push(node);
        parent.hasChildren = true;
        node.level = parent.level + 1;
      } else {
        rootNodes.push(node);
      }
    });

    // Sort children by a default order (you can customize this)
    const sortChildren = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          node.children.sort((a, b) => {
            // Sort by drawing number or any other field
            const aValue = a.drawingNumber || a.id;
            const bValue = b.drawingNumber || b.id;
            return String(aValue).localeCompare(String(bValue));
          });
          sortChildren(node.children);
        }
      });
    };

    sortChildren(rootNodes);
    return rootNodes;
  }, [data, idField, parentIdField, expandedNodes]);

  // Flatten tree for rendering (only visible nodes)
  const flattenedData = useMemo(() => {
    const flattened: TreeNode[] = [];

    const traverse = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        flattened.push(node);
        if (node.isExpanded && node.children && node.children.length > 0) {
          traverse(node.children);
        }
      });
    };

    traverse(treeData);
    return flattened;
  }, [treeData]);

  // Toggle node expansion
  const toggleNode = useCallback((nodeId: string | number) => {
    const findAndToggle = (nodes: TreeNode[]): boolean => {
      for (const node of nodes) {
        if (node.id === nodeId) {
          node.isExpanded = !node.isExpanded;
          return true;
        }
        if (node.children && findAndToggle(node.children)) {
          return true;
        }
      }
      return false;
    };

    findAndToggle(treeData);
  }, [treeData]);

  // Expand all nodes
  const expandAll = useCallback(() => {
    const expandRecursive = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.hasChildren) {
          node.isExpanded = true;
          if (node.children) {
            expandRecursive(node.children);
          }
        }
      });
    };

    expandRecursive(treeData);
  }, [treeData]);

  // Collapse all nodes
  const collapseAll = useCallback(() => {
    const collapseRecursive = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        node.isExpanded = false;
        if (node.children) {
          collapseRecursive(node.children);
        }
      });
    };

    collapseRecursive(treeData);
  }, [treeData]);

  // Get path to a specific node
  const getNodePath = useCallback((nodeId: string | number): TreeNode[] => {
    const path: TreeNode[] = [];

    const findPath = (nodes: TreeNode[], targetId: string | number): boolean => {
      for (const node of nodes) {
        path.push(node);
        if (node.id === targetId) {
          return true;
        }
        if (node.children && findPath(node.children, targetId)) {
          return true;
        }
        path.pop();
      }
      return false;
    };

    findPath(treeData, nodeId);
    return path;
  }, [treeData]);

  // Get node level
  const getNodeLevel = useCallback((nodeId: string | number): number => {
    const findLevel = (nodes: TreeNode[], targetId: string | number): number => {
      for (const node of nodes) {
        if (node.id === targetId) {
          return node.level;
        }
        if (node.children) {
          const level = findLevel(node.children, targetId);
          if (level !== -1) return level;
        }
      }
      return -1;
    };

    return findLevel(treeData, nodeId);
  }, [treeData]);

  return {
    treeData,
    flattenedData,
    toggleNode,
    expandAll,
    collapseAll,
    getNodePath,
    getNodeLevel,
  };
}; 