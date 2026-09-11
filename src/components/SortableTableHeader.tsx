import React from "react";
import { TableCell, Box } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { COLOUR_ROLES } from "./tableStyles";

export interface SortableTableHeaderProps {
  label: string;
  columnKey?: string;
  sortKey?: string;
  sortColumn?: string | null;
  activeSortColumn?: string | null;
  sortDirection?: "asc" | "desc";
  onSort?: (columnKey: string) => void;
  align?: "left" | "center" | "right";
  width?: number | string;
  minWidth?: number | string;
  isSortable?: boolean;
}

export const SortableTableHeader: React.FC<SortableTableHeaderProps> = ({
  label,
  columnKey,
  sortKey,
  sortColumn,
  activeSortColumn,
  sortDirection = "asc",
  onSort,
  align = "left",
  width,
  minWidth,
  isSortable = true,
}) => {
  const effectiveKey = columnKey || sortKey || "";
  const effectiveSortCol = sortColumn ?? activeSortColumn ?? "";
  const isSorted = Boolean(effectiveKey && effectiveSortCol === effectiveKey);

  const handleClick = () => {
    if (isSortable && onSort && effectiveKey) {
      onSort(effectiveKey);
    }
  };

  return (
    <TableCell
      align={align}
      onClick={handleClick}
      sx={{
        fontWeight: 700,
        backgroundColor: COLOUR_ROLES.headerBg,
        color: COLOUR_ROLES.textSecondary,
        fontSize: "0.8rem",
        borderBottom: `1px solid ${COLOUR_ROLES.hairline}`,
        py: 0.75,
        px: 1.25,
        width,
        minWidth,
        cursor: isSortable && onSort ? "pointer" : "default",
        userSelect: "none",
        whiteSpace: "nowrap",
        "&:hover": {
          color: isSortable && onSort ? COLOUR_ROLES.primary : COLOUR_ROLES.textSecondary,
        },
      }}
    >
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.4,
          justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
          width: "100%",
        }}
      >
        <span>{label}</span>
        {isSortable && onSort && (
          isSorted ? (
            sortDirection === "asc" ? (
              <ArrowUpwardIcon sx={{ fontSize: 13, color: COLOUR_ROLES.primary }} />
            ) : (
              <ArrowDownwardIcon sx={{ fontSize: 13, color: COLOUR_ROLES.primary }} />
            )
          ) : (
            <ArrowDownwardIcon sx={{ fontSize: 13, color: "#9CA3AF", opacity: 0.4 }} />
          )
        )}
      </Box>
    </TableCell>
  );
};
