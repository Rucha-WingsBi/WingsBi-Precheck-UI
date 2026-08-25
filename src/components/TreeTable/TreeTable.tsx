import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Box,
  Stack,
  Tooltip,
  useTheme,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  AccountTree as TreeIcon,
} from "@mui/icons-material";
import { FixedSizeList as List } from "react-window";
import { useTreeData } from "../../hooks/useTreeData";

interface TreeTableColumn {
  id: string;
  label: string;
  minWidth?: number;
  align?: "left" | "center" | "right";
  format?: (value: any, row: any, index?: number) => React.ReactNode;
}

interface TreeTableProps {
  data: any[];
  columns: TreeTableColumn[];
  idField?: string;
  parentIdField?: string;
  height?: number;
  rowHeight?: number;
  enableVirtualization?: boolean;
  onRowClick?: (row: any) => void;
  renderRowActions?: (row: any) => React.ReactNode;
}

interface TreeRowProps {
  node: any;
  columns: TreeTableColumn[];
  onToggle: (nodeId: string | number) => void;
  onRowClick?: (row: any) => void;
  renderRowActions?: (row: any) => React.ReactNode;
  style?: React.CSSProperties;
  rowIndex?: number;
  isVirtualized?: boolean;
}

const TreeRow: React.FC<TreeRowProps> = React.memo(({
  node,
  columns,
  onToggle,
  onRowClick,
  renderRowActions,
  rowIndex,
  isVirtualized = false,
}) => {
  const theme = useTheme();

  // Automatically find the first column that is NOT serialNumber, level, or findNo to render the expander hierarchy
  const expanderIndex = useMemo(() => {
    const nonSrIndex = columns.findIndex((col) => col.id !== "serialNumber" && col.id !== "level" && col.id !== "findNo");
    return nonSrIndex !== -1 ? nonSrIndex : 0;
  }, [columns]);

  const handleRowClick = useCallback(() => {
    if (onRowClick) {
      onRowClick(node);
    }
  }, [node, onRowClick]);

  const handleToggleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggle(node.id);
    },
    [node.id, onToggle],
  );

  return (
    <tr
      onClick={handleRowClick}
      style={{
        cursor: onRowClick ? "pointer" : "default",
        backgroundColor:
          node.level > 0
            ? `rgba(37, 99, 235, 0.02)`
            : "inherit",
        transition: "background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
        height: "100%",
        display: "table-row",
        verticalAlign: "middle",
        outline: 0,
      }}
      className="tree-table-row"
    >
      {columns.map((column, index) => {
        const isExpander = index === expanderIndex;
        return (
          <td
            key={column.id}
            style={{
              width: column.minWidth,
              minWidth: column.minWidth,
              maxWidth: column.minWidth,
              paddingLeft: isExpander ? "24px" : "16px",
              paddingRight: "16px",
              paddingTop: "6px",
              paddingBottom: "6px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              boxSizing: "border-box",
              borderBottom: isVirtualized ? "none" : "1px solid #e2e8f0",
              fontFamily: 'Inter, "Helvetica Neue", Arial, sans-serif',
              fontSize: '0.8rem',
              color: '#334155',
              textAlign: column.align || "left",
              verticalAlign: "middle",
            }}
          >
            {isExpander && (
              <Stack direction="row" alignItems="center" spacing={1} sx={{ width: "100%", overflow: "hidden" }}>
                {node.hasChildren ? (
                  <IconButton
                    size="small"
                    onClick={handleToggleClick}
                    sx={{
                      p: 0.5,
                      color: theme.palette.primary.main,
                      flexShrink: 0,
                    }}
                  >
                    {node.isExpanded ? (
                      <ExpandMoreIcon />
                    ) : (
                      <ChevronRightIcon />
                    )}
                  </IconButton>
                ) : (
                  <Box sx={{ width: 24, height: 24, flexShrink: 0 }} />
                )}
                <Box
                  sx={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {column.format
                    ? column.format(node[column.id], node, rowIndex)
                    : node[column.id]}
                </Box>
              </Stack>
            )}
            {!isExpander && (
              <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                {column.format
                  ? column.format(node[column.id], node, rowIndex)
                  : node[column.id]}
              </Box>
            )}
            {index === columns.length - 1 && renderRowActions && (
              <Box sx={{ ml: 1, display: "inline-block" }}>{renderRowActions(node)}</Box>
            )}
          </td>
        );
      })}
    </tr>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.node === nextProps.node &&
    prevProps.columns === nextProps.columns &&
    prevProps.rowIndex === nextProps.rowIndex &&
    prevProps.isVirtualized === nextProps.isVirtualized
  );
});

const VirtualizedTreeRow: React.FC<{
  index: number;
  style: React.CSSProperties;
  data: {
    nodes: any[];
    columns: TreeTableColumn[];
    onToggle: (nodeId: string | number) => void;
    onRowClick?: (row: any) => void;
    renderRowActions?: (row: any) => React.ReactNode;
  };
}> = React.memo(({ index, style, data }) => {
  const { nodes, columns, onToggle, onRowClick, renderRowActions } = data;
  const node = nodes[index];

  return (
    <div
      style={{
        ...style,
        boxSizing: "border-box",
        borderBottom: "1px solid #e2e8f0",
        backgroundColor: "#ffffff",
      }}
    >
      <table
        style={{
          tableLayout: "fixed",
          width: "100%",
          height: "calc(100% - 1px)",
          margin: 0,
          border: "none",
          borderCollapse: "collapse",
          backgroundColor: "transparent",
        }}
      >
        <tbody>
          <TreeRow
            node={node}
            columns={columns}
            onToggle={onToggle}
            onRowClick={onRowClick}
            renderRowActions={renderRowActions}
            rowIndex={index}
            isVirtualized={true}
          />
        </tbody>
      </table>
    </div>
  );
}, (prevProps, nextProps) => {
  const prevNode = prevProps.data.nodes[prevProps.index];
  const nextNode = nextProps.data.nodes[nextProps.index];

  return (
    prevProps.index === nextProps.index &&
    prevNode === nextNode &&
    prevProps.data.columns === nextProps.data.columns &&
    prevProps.style.top === nextProps.style.top &&
    prevProps.style.height === nextProps.style.height
  );
});

export const TreeTable = React.forwardRef<any, TreeTableProps>(({
  data,
  columns,
  idField = "id",
  parentIdField = "parentId",
  height = 400,
  rowHeight = 53,
  enableVirtualization = false,
  onRowClick,
  renderRowActions,
}, ref) => {
  React.useImperativeHandle(ref, () => ({
    expandAll: handleExpandAll,
    collapseAll: handleCollapseAll,
  }));

  const [expandedNodes, setExpandedNodes] = useState<Set<string | number>>(
    () => {
      const initial = new Set<string | number>();
      if (data) {
        data.forEach((item) => {
          if (item.level === 0 || item.isExpanded) {
            initial.add(item[idField] || item.id);
          }
        });
      }
      return initial;
    },
  );

  useEffect(() => {
    if (data && data.length > 0) {
      setExpandedNodes((prev) => {
        if (prev.size > 0) return prev;
        const initial = new Set<string | number>();
        data.forEach((item) => {
          if (item.level === 0 || item.isExpanded) {
            initial.add(item[idField] || item.id);
          }
        });
        return initial;
      });
    }
  }, [data, idField]);

  const { treeData, flattenedData, toggleNode, expandAll, collapseAll } =
    useTreeData({
      data,
      idField,
      parentIdField,
      expandedNodes,
    });

  const handleToggle = useCallback(
    (nodeId: string | number) => {
      toggleNode(nodeId);
      setExpandedNodes((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(nodeId)) {
          newSet.delete(nodeId);
        } else {
          newSet.add(nodeId);
        }
        return newSet;
      });
    },
    [toggleNode],
  );

  const handleExpandAll = useCallback(() => {
    expandAll();
    const allNodeIds = new Set<string | number>();
    const collectIds = (nodes: any[]) => {
      nodes.forEach((node) => {
        if (node.hasChildren) {
          allNodeIds.add(node.id);
        }
        if (node.children) {
          collectIds(node.children);
        }
      });
    };
    collectIds(treeData);
    setExpandedNodes(allNodeIds);
  }, [expandAll, treeData]);

  const handleCollapseAll = useCallback(() => {
    collapseAll();
    setExpandedNodes(new Set());
  }, [collapseAll]);

  // Dynamic column widths state for interactive drag-resizing
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  // Sync initial column widths whenever columns prop changes
  useEffect(() => {
    setColWidths((prev) => {
      const next = { ...prev };
      columns.forEach((col) => {
        if (!next[col.id]) {
          next[col.id] = col.minWidth || 100;
        }
      });
      return next;
    });
  }, [columns]);

  const handleResizeStart = useCallback((e: React.MouseEvent, colId: string) => {
    e.preventDefault();
    e.stopPropagation();

    startXRef.current = e.clientX;
    const baseCol = columns.find((c) => c.id === colId);
    const initialWidth = colWidths[colId] || baseCol?.minWidth || 100;
    startWidthRef.current = initialWidth;
    isDraggingRef.current = true;

    // Add drag cursor styling to document body
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = moveEvent.clientX - startXRef.current;
      const minW = baseCol?.minWidth ? Math.min(baseCol.minWidth, 50) : 50;
      const newWidth = Math.max(minW, startWidthRef.current + deltaX);
      setColWidths((prev) => ({
        ...prev,
        [colId]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [columns, colWidths]);

  // Effective columns with live updated widths
  const effectiveColumns = useMemo(() => {
    return columns.map((col) => ({
      ...col,
      minWidth: colWidths[col.id] || col.minWidth || 100,
    }));
  }, [columns, colWidths]);

  const totalWidth = useMemo(() => {
    return effectiveColumns.reduce((sum, col) => sum + (col.minWidth || 100), 0);
  }, [effectiveColumns]);

  const expanderIndex = useMemo(() => {
    const nonSrIndex = columns.findIndex((col) => col.id !== "serialNumber" && col.id !== "level" && col.id !== "findNo");
    return nonSrIndex !== -1 ? nonSrIndex : 0;
  }, [columns]);

  if (!data || data.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <TreeIcon sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
        <Typography variant="h6" color="textSecondary">
          No data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", overflowX: "auto" }}>
      {/* Table Container */}
      <TableContainer
        sx={{
          width: "100%",
          minWidth: totalWidth,
          maxHeight: height,
          overflowY: enableVirtualization ? "hidden" : "auto",
          overflowX: "auto",
          "&::-webkit-scrollbar": {
            width: 6,
            height: 6,
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#f1f5f9",
            borderRadius: 3,
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#cbd5e1",
            borderRadius: 3,
            "&:hover": {
              backgroundColor: "#94a3b8",
            },
          },
        }}
      >
        <Table stickyHeader size="small" sx={{ width: "100%", tableLayout: "fixed" }}>
          <TableHead>
            <TableRow>
              {effectiveColumns.map((column, index) => {
                const isExpanderCol = index === expanderIndex;
                const colWidth = column.minWidth || 100;
                return (
                  <TableCell
                    key={column.id}
                    align={column.align || "left"}
                    onMouseDown={(e) => handleResizeStart(e, column.id)}
                    sx={{
                      width: colWidth,
                      minWidth: colWidth,
                      fontWeight: 700,
                      background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
                      borderBottom: "2px solid #cbd5e1",
                      boxShadow: "0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                      borderRadius: "0 !important",
                      borderTopLeftRadius: "0 !important",
                      borderTopRightRadius: "0 !important",
                      borderBottomLeftRadius: "0 !important",
                      borderBottomRightRadius: "0 !important",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      boxSizing: "border-box",
                      paddingLeft: isExpanderCol ? "28px" : "16px",
                      paddingRight: "16px",
                      paddingTop: "11px",
                      paddingBottom: "11px",
                      position: "relative",
                      cursor: "col-resize",
                      userSelect: "none",
                      zIndex: 3,
                      transition: "background-color 0.15s ease",
                      "&:hover": {
                        background: "#e2e8f0",
                      },
                      "&:hover .col-resizer-line": {
                        backgroundColor: "#a8005a",
                        width: 3,
                      },
                      "&:first-of-type": {
                        borderRadius: "0 !important",
                      },
                      "&:last-of-type": {
                        borderRadius: "0 !important",
                      },
                    }}
                  >
                    <Tooltip title={`Click and drag to resize column`} arrow placement="top">
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: column.align === "center" ? "center" : column.align === "right" ? "flex-end" : "flex-start", width: "100%", pr: 0.5 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            color: "#334155",
                            letterSpacing: "0.5px",
                            textTransform: "none",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {column.label}
                        </Typography>
                      </Box>
                    </Tooltip>
                    {/* Visual Drag Divider Line */}
                    <Box
                      className="col-resizer-line"
                      sx={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: 2,
                        backgroundColor: "#cbd5e1",
                        transition: "background-color 0.15s, width 0.15s",
                        zIndex: 2,
                      }}
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          {!enableVirtualization && (
            <TableBody>
              {flattenedData.map((node, index) => (
                <TreeRow
                  key={node.id}
                  node={node}
                  columns={effectiveColumns}
                  onToggle={handleToggle}
                  onRowClick={onRowClick}
                  renderRowActions={renderRowActions}
                  rowIndex={index}
                />
              ))}
            </TableBody>
          )}
        </Table>

        {enableVirtualization && (
          <List
            height={height - 56} // Subtract header height
            width="100%"
            itemCount={flattenedData.length}
            itemSize={rowHeight}
            overscanCount={15}
            style={{ overflowX: "hidden" }}
            itemData={{
              nodes: flattenedData,
              columns: effectiveColumns,
              onToggle: handleToggle,
              onRowClick,
              renderRowActions,
            }}
          >
            {VirtualizedTreeRow}
          </List>
        )}
      </TableContainer>
    </Box>
  );
});

export default TreeTable;
