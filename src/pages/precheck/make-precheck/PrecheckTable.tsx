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
  FileDownload as FileDownloadIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  FilterList as FilterListIcon,
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
  onExportBom?: () => void;
  isExportEnabled?: boolean;
  filterRemainingOnly?: boolean;
  onToggleFilter?: () => void;
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
  onExportBom,
  isExportEnabled,
  filterRemainingOnly = false,
  onToggleFilter,
}) => {
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<HTMLElement | null>(null);
  const [activeMenuRow, setActiveMenuRow] = React.useState<{ item: GridItem; index: number } | null>(null);
  const [confirmUndoItem, setConfirmUndoItem] = React.useState<GridItem | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = React.useState<GridItem | null>(null);

  const remainingCount = React.useMemo(() => {
    if (!searchResults || searchResults.length === 0) return 0;
    return searchResults.filter((item) => {
      const status = (item.precheckStatus || "").toLowerCase();
      const isRej = item.isRejected || status === "rejected";
      const isComplete =
        !isRej &&
        (item.isPrecheckComplete ||
          status === "verified" ||
          status === "completed" ||
          (item.remainingQuantity === 0 || item.remainingQuantity === null || item.remainingQuantity === undefined));
      return !isRej && !isComplete;
    }).length;
  }, [searchResults]);

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
             Parts To be verified 
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#667085", fontSize: "0.8rem", fontWeight: 500 }}
          >
            {searchResults.length > 0 ? `${searchResults.length} Parts` : ""}
          </Typography>
        </Box>

        {/* Right End:   Filter Button */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {onToggleFilter && (
            <Button
              variant={filterRemainingOnly ? "contained" : "outlined"}
              size="small"
              onClick={onToggleFilter}
              disabled={!searchResults || searchResults.length === 0}
              startIcon={<FilterListIcon fontSize="small" />}
              sx={{
                height: 28,
                borderRadius: "6px",
                borderColor: filterRemainingOnly ? "primary.main" : "#D0D5DD",
                backgroundColor: filterRemainingOnly ? "primary.main" : "#FFFFFF",
                color: filterRemainingOnly ? "#FFFFFF" : "#344054",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.75rem",
                px: 1.25,
                "&:hover": {
                  borderColor: filterRemainingOnly ? "primary.dark" : "#98A2B3",
                  backgroundColor: filterRemainingOnly ? "primary.dark" : "#F9FAFB",
                },
              }}
            >
              {filterRemainingOnly ? "All Parts" : `Pending Parts${remainingCount > 0 ? ` (${remainingCount})` : ""}`}
            </Button>
          )}
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
              <SortableTableHeader label="Item Code" columnKey="lnItemCode" sortColumn={orderBy} sortDirection={order} onSort={onRequestSort} align="center" minWidth={110} />
              <SortableTableHeader label="Part Number" columnKey="drawingNumber" sortColumn={orderBy} sortDirection={order} onSort={onRequestSort} align="center" minWidth={140} />
              <SortableTableHeader label="Item Description" columnKey="nomenclature" sortColumn={orderBy} sortDirection={order} onSort={onRequestSort} align="center" minWidth={95} />
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
                }

                const scannedQty = item.scannedQuantity ?? 0;
                const totalQty = item.quantity ?? 1;
                const remQty = item.remainingQuantity;

                const isPartial =
                  !isRej &&
                  !isComplete &&
                  (statusLower === "updated" ||
                    statusLower === "partial" ||
                    item.isUpdated ||
                    Boolean(item.qrCode) ||
                    (scannedQty > 0 && scannedQty < totalQty) ||
                    (remQty !== undefined &&
                      remQty !== null &&
                      remQty > 0 &&
                      remQty < totalQty));

                let textColor = "#3d3f42ff"; // pending
                if (isRej) {
                  textColor = "#DC2626"; // rejected
                } else if (isComplete) {
                  textColor = "#059669"; // completed
                } else if (isPartial) {
                  textColor = "#D97706"; // partial
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
                        transition: "background-color 0.2s ease",
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: `${rowHoverBg} !important`,
                        },
                        "& .MuiTableCell-root": {
                          py: "1px !important",
                          px: 0.5,
                          height: 24,
                          fontSize: "0.72rem",
                          color: textColor,
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
                    <TableRow sx={{ height: "auto" }}>
                      <TableCell
                        style={{ padding: 0 }}
                        colSpan={14}
                      >
                        <Collapse
                          in={expandedRows.has(index)}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box
                            sx={{
                              width: "100%",
                              backgroundColor: "#F8FAFC",
                              borderTop: "1px solid #EAECF0",
                              borderBottom: "1px solid #EAECF0",
                            }}
                          >
                            <Table
                              size="small"
                              aria-label="additional-details"
                              sx={{ width: "100%" }}
                            >
                              <TableHead>
                                <TableRow sx={{ backgroundColor: "#F2F4F7" }}>
                                  <TableCell align="center" sx={{ fontWeight: 700, color: "#344054", fontSize: "0.75rem", py: 1, px: 1, borderBottom: "1px solid #EAECF0", whiteSpace: "nowrap" }}>
                                    Status
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 700, color: "#344054", fontSize: "0.75rem", py: 1, px: 1, borderBottom: "1px solid #EAECF0", whiteSpace: "nowrap" }}>
                                    IR Number
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 700, color: "#344054", fontSize: "0.75rem", py: 1, px: 1, borderBottom: "1px solid #EAECF0", whiteSpace: "nowrap" }}>
                                    MSN Number
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 700, color: "#344054", fontSize: "0.75rem", py: 1, px: 1, borderBottom: "1px solid #EAECF0", whiteSpace: "nowrap" }}>
                                    MRIR Number
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 700, color: "#344054", fontSize: "0.75rem", py: 1, px: 1, borderBottom: "1px solid #EAECF0", whiteSpace: "nowrap" }}>
                                    Build No
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 700, color: "#344054", fontSize: "0.75rem", py: 1, px: 1, borderBottom: "1px solid #EAECF0", whiteSpace: "nowrap" }}>
                                    Quantity
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 700, color: "#344054", fontSize: "0.75rem", py: 1, px: 1, borderBottom: "1px solid #EAECF0", whiteSpace: "nowrap" }}>
                                    Remaining Qty
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 700, color: "#344054", fontSize: "0.75rem", py: 1, px: 1, borderBottom: "1px solid #EAECF0", whiteSpace: "nowrap" }}>
                                    PO Number
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 700, color: "#344054", fontSize: "0.75rem", py: 1, px: 1, borderBottom: "1px solid #EAECF0", whiteSpace: "nowrap" }}>
                                    Unit
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 700, color: "#344054", fontSize: "0.75rem", py: 1, px: 1, borderBottom: "1px solid #EAECF0", whiteSpace: "nowrap" }}>
                                    FAN/MAN No
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 700, color: "#344054", fontSize: "0.75rem", py: 1, px: 1, borderBottom: "1px solid #EAECF0", whiteSpace: "nowrap" }}>
                                    Disposition
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 700, color: "#344054", fontSize: "0.75rem", py: 1, px: 1, borderBottom: "1px solid #EAECF0", whiteSpace: "nowrap" }}>
                                    Username
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 700, color: "#344054", fontSize: "0.75rem", py: 1, px: 1, borderBottom: "1px solid #EAECF0", whiteSpace: "nowrap" }}>
                                    Created Date
                                  </TableCell>
                                  <TableCell align="center" sx={{ width: 32, py: 0.5, px: 0.5, borderBottom: "1px solid #EAECF0" }}>
                                    <IconButton
                                      size="small"
                                      onClick={() => onRowExpand(index)}
                                      title="Hide Additional Details"
                                      sx={{ p: 0.25, color: "#667085", "&:hover": { color: "#101828", backgroundColor: "#E4E7EC" } }}
                                    >
                                      <KeyboardArrowUpIcon fontSize="small" />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                <TableRow sx={{ backgroundColor: "#FFFFFF" }}>
                                  <TableCell align="center" sx={{ fontSize: "0.75rem", color: "#475467", py: 1, px: 1, whiteSpace: "nowrap" }}>
                                    {item.isRejected
                                      ? "rejected"
                                      : item.precheckStatus || (item.qrCode ? "qrcodegenerated" : "N/A")}
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontSize: "0.75rem", color: "#475467", py: 1, px: 1, whiteSpace: "nowrap" }}>
                                    {item.ir || "Not-Applicable"}
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontSize: "0.75rem", color: "#475467", py: 1, px: 1, whiteSpace: "nowrap" }}>
                                    {item.msn || "Not-Applicable"}
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontSize: "0.75rem", color: "#475467", py: 1, px: 1, whiteSpace: "nowrap" }}>
                                    {item.mrirNumber || "N/A"}
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontSize: "0.75rem", color: "#475467", py: 1, px: 1, whiteSpace: "nowrap" }}>
                                    N/A
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontSize: "0.75rem", color: "#475467", py: 1, px: 1, whiteSpace: "nowrap" }}>
                                    {item.quantity ?? "N/A"}
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontSize: "0.75rem", color: "#475467", py: 1, px: 1, whiteSpace: "nowrap" }}>
                                    {item.remainingQuantity ?? "N/A"}
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontSize: "0.75rem", color: "#475467", py: 1, px: 1, whiteSpace: "nowrap" }}>
                                    {item.productionOrderNumber || "N/A"}
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontSize: "0.75rem", color: "#475467", py: 1, px: 1, whiteSpace: "nowrap" }}>
                                    {item.unit || "N/A"}
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontSize: "0.75rem", color: "#475467", py: 1, px: 1, whiteSpace: "nowrap" }}>
                                    N/A
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontSize: "0.75rem", color: "#475467", py: 1, px: 1, whiteSpace: "nowrap" }}>
                                    {item.disposition || (item.isRejected ? "Rejected" : "Accepted")}
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontSize: "0.75rem", color: "#475467", py: 1, px: 1, whiteSpace: "nowrap" }}>
                                    {item.username || "N/A"}
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontSize: "0.75rem", color: "#475467", py: 1, px: 1, whiteSpace: "nowrap" }}>
                                    {formatDate(item.modifiedDate || "") || "N/A"}
                                  </TableCell>
                                  <TableCell align="center" sx={{ width: 32, py: 0.5, px: 0.5, borderBottom: "none" }} />
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
                  <RemoveIcon fontSize="small" color="primary" />
                ) : (
                  <AddIcon fontSize="small" color="primary" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={expandedRows.has(activeMenuRow.index) ? "Hide Additional Details" : "Additional Details"}
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
