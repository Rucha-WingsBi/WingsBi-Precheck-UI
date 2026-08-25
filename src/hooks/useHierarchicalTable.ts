import { useState, useMemo, useCallback } from "react";

export interface HierarchicalRow {
  id: string | number;
  parentId: string | number | null;
  level: number;
  [key: string]: any;
}

interface UseHierarchicalTableProps<T extends HierarchicalRow> {
  data: T[];
  defaultExpanded?: boolean;
}

export const useHierarchicalTable = <T extends HierarchicalRow>({
  data,
  defaultExpanded = false,
}: UseHierarchicalTableProps<T>) => {
  // Store expanded row IDs
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string | number>>(
    () => {
      return defaultExpanded ? new Set(data.map((d) => d.id)) : new Set();
    },
  );

  // Toggle expansion for a single row
  const toggleRow = useCallback((rowId: string | number) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }, []);

  // Compute visible rows based on expansion state
  const visibleRows = useMemo(() => {
    if (!data || data.length === 0) return [];

    const childrenMap = new Map<string | number | null, T[]>();

    data.forEach((item) => {
      const pid = item.parentId ?? "ROOT"; // Use 'ROOT' for null/undefined parents
      if (!childrenMap.has(pid)) {
        childrenMap.set(pid, []);
      }
      childrenMap.get(pid)!.push(item);
    });

    const result: T[] = [];

    // Recursive function to flatten the visible tree
    const traverse = (parentId: string | number | null) => {
      // 'ROOT' key for top-level items
      const lookupId = parentId ?? "ROOT";
      const children = childrenMap.get(lookupId);

      if (!children) return;

      children.forEach((child) => {
        // Add child to result
        result.push(child);

        // If this child is expanded, traverse its children
        if (expandedRowIds.has(child.id)) {
          traverse(child.id);
        }
      });
    };
    traverse(null);
    return result;
  }, [data, expandedRowIds]);

  return {
    visibleRows,
    expandedRowIds,
    toggleRow,
    setExpandedRowIds,
  };
};
