import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Collapse,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { CustomPagination } from "../../../components/CustomPagination";

import {
  Cancel as CancelIcon,
  Undo as UndoIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from "@mui/icons-material";
import type { GridItem } from "./types";
import { formatDate, formatQuantity, getStatusBadgeChip } from "./utils";
import { COLOUR_ROLES, commonTableRowStyle } from "../../../components/tableStyles";
import { SortableTableHeader } from "../../../components/SortableTableHeader";
import { ComponentTypeChip } from "../../../components/ComponentTypeChip";

interface PrecheckTableProps {
  paginatedResults: GridItem[];
  filteredResults: GridItem[];
  searchResults: GridItem[];
  isLoading: boolean;
  showResults: boolean;
  page: number;
  rowsPerPage: number;
  selectedRow: number | null;
  expandedRows: Set<number>;
  maxPrecheckDetailsIdMap: Record<string, number>;
  onChangePage: (_: unknown, newPage: number) => void;
  onChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRowExpand: (index: number) => void;
  onRowDoubleClick: (index: number) => void;
  onAddRow: (item: GridItem) => void;
  onEditClick: (item: GridItem) => void;
  onUndoScan: (item: GridItem) => void;
  onRemarksChange: (item: GridItem, newRemarks: string) => void;
  onUndoPrecheck: (item: GridItem) => void;
  onDeletePrecheck: (item: GridItem) => void;
  orderBy: string;
  order: "asc" | "desc";
  onRequestSort: (property: string) => void;
}

const PrecheckTable: React.FC<PrecheckTableProps> = ({
  paginatedResults,
  filteredResults,
  searchResults,
  isLoading,
  showResults,
  page,
  rowsPerPage,
  selectedRow,
  expandedRows,
  onChangePage,
  onChangeRowsPerPage,
  onRowExpand,
  onRowDoubleClick,
  onEditClick,
  onUndoScan,
  onUndoPrecheck,
  onDeletePrecheck,
  orderBy,
  order,
  onRequestSort,
}) => {
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<HTMLElement | null>(null);
  const [activeMenuRow, setActiveMenuRow] = React.useState<{ item: GridItem; index: number } | null>(null);
  const [confirmUndoItem, setConfirmUndoItem] = React.useState<GridItem | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = React.useState<GridItem | null>(null);

  const isEditDeleteEnabled = true;
  return (
    <Paper
      elevation={0}
      sx={{
        mt: 0.25,
        mb: 0.5,
        borderRadius: "16px",
        border: "1px solid #EAECF0",
        backgroundColor: "#FFFFFF",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        width: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* BOM Lines Header Bar */}
      <Box
        sx={{
          px: 2,
          py: 0.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #EAECF0",
          backgroundColor: "#FFFFFF",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography

            sx={{ fontWeight: 700, fontSize: "0.8rem", color: "#101828" }}
          >
            BOM lines
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#667085", fontSize: "0.8rem", fontWeight: 500 }}
          >
            {searchResults.length > 0 ? `${searchResults.length} lines` : ""}
          </Typography>
        </Box>
      </Box>

      <TableContainer
        sx={{
          overflow: "auto",
          width: "100%",
          minHeight: searchResults.length > 0 ? 200 : 80,
          maxHeight: "calc(100vh - 330px)",
        }}
      >
        <Table
          stickyHeader
          sx={{
            width: "100%",
            "& .MuiTableCell-head": {
              backgroundColor: "#F9FAFB",
              color: "#475467",
              fontWeight: 600,
              fontSize: "0.75rem",
              borderBottom: "1px solid #EAECF0",
              py: 0.75,
            },
          }}
          size="small"
        >
          <TableHead>
            <TableRow sx={{ backgroundColor: COLOUR_ROLES.headerBg }}>
              <SortableTableHeader label="Sr. No." columnKey="sr" sortColumn={orderBy} sortDirection={order} onSort={onRequestSort} align="center" minWidth={45} />
              <SortableTableHeader label="Position No" columnKey="findNo" sortColumn={orderBy} sortDirection={order} onSort={onRequestSort} align="center" minWidth={20} />
              <SortableTableHeader label="LN Item Code" columnKey="lnItemCode" sortColumn={orderBy} sortDirection={order} onSort={onRequestSort} align="center" minWidth={110} />
              <SortableTableHeader label="Drawing No." columnKey="drawingNumber" sortColumn={orderBy} sortDirection={order} onSort={onRequestSort} align="center" minWidth={140} />
              <SortableTableHeader label="Nomenclature" columnKey="nomenclature" sortColumn={orderBy} sortDirection={order} onSort={onRequestSort} align="center" minWidth={95} />
              <SortableTableHeader label="Unit" columnKey="unit" sortColumn={orderBy} sortDirection={order} onSort={onRequestSort} align="center" minWidth={90} />
              <SortableTableHeader label="Qty" columnKey="quantity" sortColumn={orderBy} sortDirection={order} onSort={onRequestSort} align="center" minWidth={40} />
              <SortableTableHeader label="Rem Qty" columnKey="remainingQuantity" sortColumn={orderBy} sortDirection={order} onSort={onRequestSort} align="center" minWidth={75} />
              <SortableTableHeader label="ID Number" columnKey="idNumber" sortColumn={orderBy} sortDirection={order} onSort={onRequestSort} align="center" minWidth={75} />
              <SortableTableHeader label="IR" columnKey="ir" sortColumn={orderBy} sortDirection={order} onSort={onRequestSort} align="center" minWidth={55} />
              <SortableTableHeader label="MSN" columnKey="msn" sortColumn={orderBy} sortDirection={order} onSort={onRequestSort} align="center" minWidth={55} />
              <SortableTableHeader label="MRIR Number" columnKey="mrirNumber" sortColumn={orderBy} sortDirection={order} onSort={onRequestSort} align="center" minWidth={75} />
              <SortableTableHeader label="Type" columnKey="componentType" sortColumn={orderBy} sortDirection={order} onSort={onRequestSort} align="center" minWidth={75} />
              <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: COLOUR_ROLES.headerBg, color: COLOUR_ROLES.textSecondary, fontSize: "0.75rem", borderBottom: `1px solid ${COLOUR_ROLES.hairline}`, py: 0.5, px: 1, minWidth: 75 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={14} align="center" sx={{ height: 150 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : paginatedResults.length > 0 ? (
              paginatedResults.map((item, index) => {
                const itemKey = `${item.drawingNumber}-${item.lnItemCode || ""}`;
                const isSelected = selectedRow === page * rowsPerPage + index;
                const statusLower = (item.precheckStatus || "").toLowerCase();
                const isRej = item.isRejected || statusLower === "rejected";

                const remQtyNum =
                  item.remainingQuantity !== undefined && item.remainingQuantity !== null
                    ? Number(item.remainingQuantity)
                    : null;
                const isZeroRemQty = remQtyNum !== null && remQtyNum === 0;

                const isComplete =
                  !isRej &&
                  (statusLower === "completed" ||
                    statusLower === "verified" ||
                    isZeroRemQty ||
                    (item.isPrecheckComplete && (remQtyNum === null || remQtyNum === 0)));

                const isUpdated =
                  !isRej &&
                  !isComplete &&
                  (statusLower === "updated" ||
                    item.isUpdated ||
                    Boolean(item.qrCode));

                let rowBg = "#FFFFFF";
                let rowHoverBg = "#F8FAFC";

                if (isSelected) {
                  rowBg = "#E3F2FD";
                  rowHoverBg = "#E3F2FD";
                } else if (isRej) {
                  rowBg = "#FDE8E8";
                  rowHoverBg = "#FDE8E8";
                } else if (isComplete) {
                  rowBg = "#ECFDF5";
                  rowHoverBg = "#ECFDF5";
                } else if (isUpdated) {
                  rowBg = "#FFF7ED";
                  rowHoverBg = "#FFF7ED";
                } else {
                  const scannedQty = item.scannedQuantity ?? 0;
                  const totalQty = item.quantity ?? 1;
                  const remQty = item.remainingQuantity;
                  if (
                    (scannedQty > 0 && scannedQty < totalQty) ||
                    (remQty !== undefined &&
                      remQty !== null &&
                      remQty > 0 &&
                      remQty < totalQty)
                  ) {
                    rowBg = "#FFFBEB";
                    rowHoverBg = "#FFFBEB";
                  }
                }

                return (
                  <React.Fragment
                    key={`${item.sr}-${item.drawingNumber}-${item.isRejected ? "rejected" : "normal"}-${item.duplicateRowId || item.originalRowId || "none"}-${index}`}
                  >
                    <TableRow
                      hover
                      onDoubleClick={() => onRowDoubleClick(index)}
                      sx={{
                        ...commonTableRowStyle,
                        height: 24,
                        maxHeight: 24,
                        backgroundColor: rowBg,
                        opacity: isRej ? 0.7 : 1,
                        transition:
                          "opacity 0.4s ease-out, background-color 0.2s ease",
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: `${rowHoverBg} !important`,
                        },
                        "& .MuiTableCell-root": {
                          py: "1px !important",
                          px: 0.5,
                          height: 24,
                          fontSize: "0.72rem",
                          color: isRej ? "error.main" : "inherit",
                        },
                      }}
                    >
                      <TableCell
                        align="center"
                        sx={{ py: 0.1, px: 0.5, fontSize: "0.72rem" }}
                      >
                        {item.sr}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.1, px: 0.5, fontSize: "0.72rem" }}
                      >
                        {item.findNo}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.1, px: 0.5, fontSize: "0.72rem" }}
                      >
                        {item.lnItemCode}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.1, px: 0.5, fontSize: "0.72rem", whiteSpace: "nowrap" }}
                      >
                        {item.drawingNumber}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.1, px: 0.5, fontSize: "0.72rem", whiteSpace: "nowrap" }}
                      >
                        {item.nomenclature}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.1, px: 0.5, fontSize: "0.72rem", whiteSpace: "nowrap" }}
                      >
                        {item.unit}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.1, px: 0.5, fontSize: "0.72rem" }}
                      >
                        {item.quantity}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.1, px: 0.5, fontSize: "0.72rem", whiteSpace: "nowrap" }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 0.75,
                            fontSize: "0.72rem",
                          }}
                        >
                          {["BATCH", "FIM", "SI"].includes(item.componentType?.toUpperCase() || "") ? (
                            <>
                              {formatQuantity(item.remainingQuantity) !== "-" ? (
                                <Typography
                                  variant="caption"
                                  sx={{ fontSize: "0.72rem" }}
                                >
                                  {formatQuantity(item.remainingQuantity)}
                                </Typography>
                              ) : (
                                "-"
                              )}
                            </>
                          ) : (
                            "-"
                          )}
                        </Box>
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.1, px: 0.5, fontSize: "0.72rem", whiteSpace: "nowrap" }}
                      >
                        {item.idNumber || "-"}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.1, px: 0.5, fontSize: "0.72rem", whiteSpace: "nowrap" }}
                      >
                        {item.ir || "-"}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.1, px: 0.5, fontSize: "0.72rem", whiteSpace: "nowrap" }}
                      >
                        {item.msn || "-"}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.1, px: 0.5, fontSize: "0.72rem", whiteSpace: "nowrap", textAlign: "center" }}
                      >
                        {item.mrirNumber || "-"}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.1, px: 0.5, fontSize: "0.72rem" }}
                      >
                        <ComponentTypeChip type={item.componentType} />
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.1, px: 0.5, fontSize: "0.72rem" }}
                      >
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuAnchorEl(e.currentTarget);
                            setActiveMenuRow({ item, index });
                          }}
                          sx={{
                            color: "#667085",
                            p: 0.25,
                            "&:hover": { backgroundColor: "#F2F4F7", color: "#101828" },
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow sx={{ height: 'auto' }}>
                      <TableCell
                        style={{ paddingBottom: 0, paddingTop: 0 }}
                        colSpan={14}
                      >
                        <Collapse
                          in={expandedRows.has(index)}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box
                            sx={{
                              margin: 1,
                              p: 1.5,
                              backgroundColor: "grey.50",
                              borderRadius: "6px",
                              border: "1px solid",
                              borderColor: "grey.200",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 0.75,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 700,
                                  color: "primary.main",
                                  fontSize: "0.8rem",
                                }}
                              >
                                Additional Details
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => onRowExpand(index)}
                                title="Close Additional Details"
                                sx={{
                                  p: 0.25,
                                  color: "#667085",
                                  "&:hover": { color: "#101828", backgroundColor: "grey.200" },
                                }}
                              >
                                <KeyboardArrowUpIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            <Table
                              size="small"
                              aria-label="additional-details"
                              sx={{ width: "100%" }}
                            >
                              <TableHead>
                                <TableRow sx={{ backgroundColor: "grey.100" }}>
                                  <TableCell
                                    sx={{
                                      fontWeight: 600,
                                      color: "text.primary",
                                      fontSize: "0.75rem",
                                      py: 0.5,
                                      px: 1.5,
                                      textAlign: "center",
                                    }}
                                  >
                                    Remarks
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontWeight: 600,
                                      color: "text.primary",
                                      fontSize: "0.75rem",
                                      py: 0.5,
                                      px: 1.5,
                                      textAlign: "center",
                                    }}
                                  >
                                    User
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontWeight: 600,
                                      color: "text.primary",
                                      fontSize: "0.75rem",
                                      py: 0.5,
                                      px: 1.5,
                                      textAlign: "center",
                                    }}
                                  >
                                    Rejected By
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontWeight: 600,
                                      color: "text.primary",
                                      fontSize: "0.75rem",
                                      py: 0.5,
                                      px: 1.5,
                                      textAlign: "center",
                                    }}
                                  >
                                    Date
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontWeight: 600,
                                      color: "text.primary",
                                      fontSize: "0.75rem",
                                      py: 0.5,
                                      px: 1.5,
                                      textAlign: "center",
                                    }}
                                  >
                                    Status
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                <TableRow>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      color: "#344054",
                                      py: 0.5,
                                      px: 1.5,
                                      textAlign: "center",
                                    }}
                                  >
                                    {item.remarks || (
                                      <Typography
                                        component="span"
                                        sx={{
                                          color: "#98A2B3",
                                          fontStyle: "italic",
                                          fontSize: "0.75rem",
                                        }}
                                      >
                                        No remarks
                                      </Typography>
                                    )}
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      color: "#344054",
                                      py: 0.5,
                                      px: 1.5,
                                      textAlign: "center",
                                    }}
                                  >
                                    {item.username || "-"}
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      color: "#344054",
                                      py: 0.5,
                                      px: 1.5,
                                      textAlign: "center",
                                    }}
                                  >
                                    {item.rejectedUserName || "-"}
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      color: "#344054",
                                      py: 0.5,
                                      px: 1.5,
                                      textAlign: "center",
                                    }}
                                  >
                                    {formatDate(item.modifiedDate || "")}
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      color: "#344054",
                                      py: 0.5,
                                      px: 1.5,
                                      textAlign: "center",
                                    }}
                                  >
                                    {(() => {
                                      const statusStr = (item.isRejected || item.precheckStatus?.toLowerCase() === "rejected")
                                        ? "Rejected"
                                        : (item.precheckStatus || "-");
                                      if (statusStr === "-") return "-";
                                      const statusLower = statusStr.toLowerCase();
                                      let bg = "#F3F4F6";
                                      let color = "#374151";
                                      let borderColor = "#E5E7EB";

                                      if (statusLower === "rejected") {
                                        bg = "#FEF2F2";
                                        color = "#B42318";
                                        borderColor = "#FCA5A5";
                                      } else if (statusLower === "completed" || statusLower === "verified") {
                                        bg = "#ECFDF5";
                                        color = "#027A48";
                                        borderColor = "#A7F3D0";
                                      } else if (statusLower === "updated") {
                                        bg = "#FFF7ED";
                                        color = "#B45309";
                                        borderColor = "#D97706";
                                      }

                                      return (
                                        <Chip
                                          label={statusStr}
                                          size="small"
                                          variant="outlined"
                                          sx={{
                                            fontSize: "0.7rem",
                                            height: 20,
                                            fontWeight: 600,
                                            borderRadius: "12px",
                                            backgroundColor: bg,
                                            color: color,
                                            borderColor: borderColor,
                                          }}
                                        />
                                      );
                                    })()}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })
            ) : showResults ? (
              <TableRow>
                <TableCell colSpan={14} align="center" sx={{ height: 150 }}>
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={14}
                  align="center"
                  sx={{ height: 350, color: "text.secondary" }}
                >
                  Enter search criteria and  to see BOM
                  details
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {(filteredResults.length > 0 || searchResults.length > 0) && (
        <CustomPagination
          page={page}
          pageSize={rowsPerPage}
          totalCount={filteredResults.length}
          pageSizeOptions={[5, 10, 25, 50]}
          onPageChange={(newPage) => onChangePage(null, newPage)}
          onPageSizeChange={(newSize) => {
            const fakeEvent = { target: { value: String(newSize) } } as React.ChangeEvent<HTMLInputElement>;
            onChangeRowsPerPage(fakeEvent);
          }}
        />
      )}

      {/* 3-Dot Action Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => {
          setMenuAnchorEl(null);
          setActiveMenuRow(null);
        }}
        transitionDuration={0}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          elevation: 3,
          sx: { minWidth: 170, borderRadius: "8px", py: 0.5 },
        }}
      >
        {activeMenuRow && (
          <>
            {/* View / Hide Details */}
            <MenuItem
              onClick={() => {
                onRowExpand(activeMenuRow.index);
                setMenuAnchorEl(null);
                setActiveMenuRow(null);
              }}
              sx={{ py: 0.75, px: 1.5 }}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                {expandedRows.has(activeMenuRow.index) ? (
                  <KeyboardArrowUpIcon fontSize="small" color="primary" />
                ) : (
                  <KeyboardArrowDownIcon fontSize="small" color="primary" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={expandedRows.has(activeMenuRow.index) ? "Hide Details" : "View Details"}
                primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 500 }}
              />
            </MenuItem>

            {/* Undo Precheck */}
            {!activeMenuRow.item.isRejected &&
              activeMenuRow.item.precheckDetailsId &&
              activeMenuRow.item.precheckDetailsId > 0 &&
              !activeMenuRow.item.isUpdated && (
                <MenuItem
                  disabled={
                    !isEditDeleteEnabled ||
                    activeMenuRow.item.precheckStatus?.toLowerCase() === "pending"
                  }
                  onClick={() => {
                    setConfirmUndoItem(activeMenuRow.item);
                    setMenuAnchorEl(null);
                    setActiveMenuRow(null);
                  }}
                  sx={{ py: 0.75, px: 1.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <UndoIcon fontSize="small" color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Undo Precheck"
                    primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 500 }}
                  />
                </MenuItem>
              )}

            {/* Delete Precheck */}
            {!activeMenuRow.item.isRejected &&
              activeMenuRow.item.precheckDetailsId &&
              activeMenuRow.item.precheckDetailsId > 0 &&
              !activeMenuRow.item.isUpdated && (
                <MenuItem
                  disabled={!isEditDeleteEnabled}
                  onClick={() => {
                    setConfirmDeleteItem(activeMenuRow.item);
                    setMenuAnchorEl(null);
                    setActiveMenuRow(null);
                  }}
                  sx={{ py: 0.75, px: 1.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <DeleteIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Delete Precheck"
                    primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 500, color: "error.main" }}
                  />
                </MenuItem>
              )}

            {/* Reject Component */}
            {activeMenuRow.item.readyForRejection && !activeMenuRow.item.isRejected && (
              <MenuItem
                onClick={() => {
                  onEditClick(activeMenuRow.item);
                  setMenuAnchorEl(null);
                  setActiveMenuRow(null);
                }}
                sx={{ py: 0.75, px: 1.5 }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <CancelIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText
                  primary="Reject Component"
                  primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 500, color: "error.main" }}
                />
              </MenuItem>
            )}

            {/* Undo Scan */}
            {!activeMenuRow.item.isRejected &&
              activeMenuRow.item.qrCode &&
              !activeMenuRow.item.isSubmitted &&
              activeMenuRow.item.isUpdated && (
                <MenuItem
                  onClick={() => {
                    onUndoScan(activeMenuRow.item);
                    setMenuAnchorEl(null);
                    setActiveMenuRow(null);
                  }}
                  sx={{ py: 0.75, px: 1.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <UndoIcon fontSize="small" color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Undo Scan"
                    primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 500 }}
                  />
                </MenuItem>
              )}
          </>
        )}
      </Menu>

      {/* Confirm Undo Precheck Dialog */}
      <Dialog
        open={Boolean(confirmUndoItem)}
        onClose={() => setConfirmUndoItem(null)}
        PaperProps={{ sx: { borderRadius: "12px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem" }}>Confirm Undo Precheck</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "0.875rem", color: "#344054" }}>
            Are you sure you want to undo precheck for Part Number: <strong>{confirmUndoItem?.drawingNumber}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmUndoItem(null)} variant="outlined" color="inherit" size="small" sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (confirmUndoItem) {
                onUndoPrecheck(confirmUndoItem);
              }
              setConfirmUndoItem(null);
            }}
            variant="contained"
            color="warning"
            size="small"
            sx={{ textTransform: "none" }}
          >
            Undo Precheck
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Precheck Dialog */}
      <Dialog
        open={Boolean(confirmDeleteItem)}
        onClose={() => setConfirmDeleteItem(null)}
        PaperProps={{ sx: { borderRadius: "12px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", color: "error.main" }}>Confirm Delete Precheck</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "0.875rem", color: "#344054" }}>
            Are you sure you want to delete precheck for Part Number: <strong>{confirmDeleteItem?.drawingNumber}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmDeleteItem(null)} variant="outlined" color="inherit" size="small" sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (confirmDeleteItem) {
                onDeletePrecheck(confirmDeleteItem);
              }
              setConfirmDeleteItem(null);
            }}
            variant="contained"
            color="error"
            size="small"
            sx={{ textTransform: "none" }}
          >
            Delete Precheck
          </Button>
        </DialogActions>
      </Dialog>

    </Paper>
  );
};

export default React.memo(PrecheckTable);
