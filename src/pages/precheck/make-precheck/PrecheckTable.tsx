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
  TextField,
  Button,
  IconButton,
  Chip,
  Collapse,
  CircularProgress,

  Tooltip,
  TableSortLabel,
} from "@mui/material";
import { CustomPagination } from "../../../components/CustomPagination";

import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  Undo as UndoIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  ViewColumn as ViewColumnIcon,
} from "@mui/icons-material";
import type { GridItem } from "./types";
import { formatDate, formatQuantity, getComponentTypeChip, getStatusBadgeChip } from "./utils";

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
  maxPrecheckDetailsIdMap,
  onChangePage,
  onChangeRowsPerPage,
  onRowExpand,
  onRowDoubleClick,
  onAddRow,
  onEditClick,
  onUndoScan,
  onRemarksChange,
  onUndoPrecheck,
  onDeletePrecheck,
  orderBy,
  order,
  onRequestSort,
}) => {
  const [deleteConfirmSr, setDeleteConfirmSr] = React.useState<number | null>(null);
  const [undoConfirmSr, setUndoConfirmSr] = React.useState<number | null>(null);

  const user = useSelector((state: RootState) => state.auth.user);
  const isEditDeleteEnabled = user?.role?.toLowerCase() === "admin" || user?.role?.toLowerCase() === "head";
  return (
    <Paper
      elevation={0}
      sx={{
        mt: 0.5,
        mb: 1,
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
          py: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #EAECF0",
          backgroundColor: "#FFFFFF",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, fontSize: "1.0625rem", color: "#101828" }}
          >
            BOM lines
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#667085", fontSize: "0.875rem", fontWeight: 500 }}
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
          maxHeight: "calc(100vh - 360px)",
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
              fontSize: "0.8125rem",
              borderBottom: "1px solid #EAECF0",
              py: 1.25,
            },
          }}
          size="small"
        >
          <TableHead>
            <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#f5f5f5",
                  py: 0.3,
                  px: 0.8,
                  fontSize: "0.85rem",
                  minWidth: 50,
                }}
              >
                <TableSortLabel
                  active={orderBy === "sr"}
                  direction={orderBy === "sr" ? order : "asc"}
                  onClick={() => onRequestSort("sr")}
                >
                  Sr.No
                </TableSortLabel>
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#f5f5f5",
                  py: 0.3,
                  px: 0.8,
                  fontSize: "0.85rem",
                  minWidth: 20,
                }}
              >
                <TableSortLabel
                  active={orderBy === "findNo"}
                  direction={orderBy === "findNo" ? order : "asc"}
                  onClick={() => onRequestSort("findNo")}
                >
                  Position No
                </TableSortLabel>
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#f5f5f5",
                  py: 0.3,
                  px: 0.8,
                  fontSize: "0.85rem",
                  minWidth: 120,
                }}
              >
                <TableSortLabel
                  active={orderBy === "lnItemCode"}
                  direction={orderBy === "lnItemCode" ? order : "asc"}
                  onClick={() => onRequestSort("lnItemCode")}
                >
                  LN Item Code
                </TableSortLabel>
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#f5f5f5",
                  py: 0.3,
                  px: 0.8,
                  fontSize: "0.85rem",
                  minWidth: 150,
                  whiteSpace: "nowrap",
                }}
              >
                <TableSortLabel
                  active={orderBy === "drawingNumber"}
                  direction={orderBy === "drawingNumber" ? order : "asc"}
                  onClick={() => onRequestSort("drawingNumber")}
                >
                  Drawing Number
                </TableSortLabel>
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#f5f5f5",
                  py: 0.3,
                  px: 0.8,
                  fontSize: "0.85rem",
                  minWidth: 100,
                  whiteSpace: "nowrap",
                }}
              >
                <TableSortLabel
                  active={orderBy === "nomenclature"}
                  direction={orderBy === "nomenclature" ? order : "asc"}
                  onClick={() => onRequestSort("nomenclature")}
                >
                  Nomenclature
                </TableSortLabel>
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#f5f5f5",
                  py: 0.3,
                  px: 0.8,
                  fontSize: "0.85rem",
                  minWidth: 100,
                  whiteSpace: "nowrap",
                }}
              >
                <TableSortLabel
                  active={orderBy === "unit"}
                  direction={orderBy === "unit" ? order : "asc"}
                  onClick={() => onRequestSort("unit")}
                >
                  Unit
                </TableSortLabel>
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#f5f5f5",
                  py: 0.3,
                  px: 0.8,
                  fontSize: "0.85rem",
                  minWidth: 40,
                }}
              >
                <TableSortLabel
                  active={orderBy === "quantity"}
                  direction={orderBy === "quantity" ? order : "asc"}
                  onClick={() => onRequestSort("quantity")}
                >
                  Qty
                </TableSortLabel>
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#f5f5f5",
                  py: 0.3,
                  px: 0.8,
                  fontSize: "0.85rem",
                  minWidth: 80,
                  whiteSpace: "nowrap",
                }}
              >
                <TableSortLabel
                  active={orderBy === "remainingQuantity"}
                  direction={orderBy === "remainingQuantity" ? order : "asc"}
                  onClick={() => onRequestSort("remainingQuantity")}
                >
                  Rem Qty
                </TableSortLabel>
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#f5f5f5",
                  py: 0.3,
                  px: 0.8,
                  fontSize: "0.85rem",
                  minWidth: 80,
                  whiteSpace: "nowrap",
                }}
              >
                <TableSortLabel
                  active={orderBy === "idNumber"}
                  direction={orderBy === "idNumber" ? order : "asc"}
                  onClick={() => onRequestSort("idNumber")}
                >
                  ID Number
                </TableSortLabel>
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#f5f5f5",
                  py: 0.3,
                  px: 0.8,
                  fontSize: "0.85rem",
                  minWidth: 60,
                  whiteSpace: "nowrap",
                }}
              >
                <TableSortLabel
                  active={orderBy === "ir"}
                  direction={orderBy === "ir" ? order : "asc"}
                  onClick={() => onRequestSort("ir")}
                >
                  IR
                </TableSortLabel>
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#f5f5f5",
                  py: 0.3,
                  px: 0.8,
                  fontSize: "0.85rem",
                  minWidth: 60,
                  whiteSpace: "nowrap",
                }}
              >
                <TableSortLabel
                  active={orderBy === "msn"}
                  direction={orderBy === "msn" ? order : "asc"}
                  onClick={() => onRequestSort("msn")}
                >
                  MSN
                </TableSortLabel>
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#f5f5f5",
                  py: 0.3,
                  px: 0.8,
                  fontSize: "0.85rem",
                  minWidth: 80,
                  whiteSpace: "nowrap",
                }}
              >
                <TableSortLabel
                  active={orderBy === "mrirNumber"}
                  direction={orderBy === "mrirNumber" ? order : "asc"}
                  onClick={() => onRequestSort("mrirNumber")}
                >
                  MRIR Number
                </TableSortLabel>
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#F9FAFB",
                  py: 0.8,
                  px: 0.8,
                  fontSize: "0.85rem",
                  minWidth: 80,
                }}
              >
                <TableSortLabel
                  active={orderBy === "componentType"}
                  direction={orderBy === "componentType" ? order : "asc"}
                  onClick={() => onRequestSort("componentType")}
                >
                  Type
                </TableSortLabel>
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#f5f5f5",
                  py: 0.3,
                  px: 0.8,
                  fontSize: "0.85rem",
                  minWidth: 120,
                }}
              >
                <TableSortLabel
                  active={orderBy === "remarks"}
                  direction={orderBy === "remarks" ? order : "asc"}
                  onClick={() => onRequestSort("remarks")}
                >
                  Remarks
                </TableSortLabel>
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#f5f5f5",
                  py: 0.3,
                  px: 0.8,
                  fontSize: "0.85rem",
                  minWidth: 140,
                }}
              >
                Actions
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#f5f5f5",
                  py: 0.3,
                  px: 0.8,
                  fontSize: "0.85rem",
                  minWidth: 40,
                }}
              >
                Details
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={16} align="center" sx={{ height: 150 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : paginatedResults.length > 0 ? (
              paginatedResults.map((item, index) => {
                const itemKey = `${item.drawingNumber}-${item.lnItemCode || ""}`;
                return (
                  <React.Fragment
                    key={`${item.sr}-${item.drawingNumber}-${item.isRejected ? "rejected" : "normal"}-${item.duplicateRowId || item.originalRowId || "none"}-${index}`}
                  >
                    <TableRow
                      hover
                      onDoubleClick={() => onRowDoubleClick(index)}
                      sx={{
                        backgroundColor: item.isRejected
                          ? "#e0e0e0"
                          : item.isPrecheckComplete ||
                            item.precheckStatus?.toLowerCase() ===
                            "completed"
                            ? "#f0f0f0"
                            : selectedRow === page * rowsPerPage + index
                              ? "#e3f2fd"
                              : "inherit",
                        opacity: item.isRejected
                          ? 0.6
                          : item.precheckStatus?.toLowerCase() === "pending"
                            ? 1
                            : item.precheckStatus?.toLowerCase() ===
                              "updated" || item.isUpdated
                              ? item.drawingNumber &&
                                maxPrecheckDetailsIdMap[itemKey] &&
                                item.precheckDetailsId ===
                                maxPrecheckDetailsIdMap[itemKey]
                                ? 1
                                : 0.4
                              : item.isPrecheckComplete ||
                                item.precheckStatus?.toLowerCase() ===
                                "completed"
                                ? 1
                                : 1,
                        transition:
                          "opacity 0.6s ease-out, background-color 0.3s ease",
                        height: 42,
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: item.isRejected
                            ? "#d0d0d0"
                            : item.isPrecheckComplete
                              ? "#f0f0f0"
                              : selectedRow === page * rowsPerPage + index
                                ? "#bbdefb"
                                : "#f5f5f5",
                        },
                        "& .MuiTableCell-root": {
                          color: item.isRejected ? "error.main" : "inherit",
                        },
                      }}
                    >
                      <TableCell
                        align="center"
                        sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                      >
                        {item.sr}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                      >
                        {item.findNo}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                      >
                        {item.lnItemCode}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem", whiteSpace: "nowrap" }}
                      >
                        {item.drawingNumber}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem", whiteSpace: "nowrap" }}
                      >
                        {item.nomenclature}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem", whiteSpace: "nowrap" }}
                      >
                        {item.unit}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                      >
                        {item.quantity}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem", whiteSpace: "nowrap" }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                            fontSize: "0.75rem",
                          }}
                        >
                          {item.componentType?.toUpperCase() === "BATCH" || item.componentType?.toUpperCase() === "FIM" ? (
                            <>
                              {formatQuantity(item.remainingQuantity) !== "-" && (
                                <Typography
                                  variant="caption"
                                  sx={{ fontSize: "0.75rem" }}
                                >
                                  {formatQuantity(item.remainingQuantity)}
                                </Typography>
                              )}
                              {item.componentType?.toUpperCase() === "BATCH" &&
                                item.precheckDetailsId !== undefined &&
                                item.precheckDetailsId ===
                                maxPrecheckDetailsIdMap[itemKey] &&
                                !(
                                  item.isRejected &&
                                  (item.remainingQuantity ??
                                    item.quantity ??
                                    0) === 0
                                ) &&
                                !item.isAddDisabled &&
                                (item.remainingQuantity ??
                                  item.quantity ??
                                  0) > 0 && (
                                  <Button
                                    sx={{
                                      color: "primary.main",
                                      fontWeight: "bold",
                                      cursor: "pointer",
                                      minWidth: "auto",
                                      padding: "0 4px",
                                    }}
                                    size="small"
                                    onClick={() => onAddRow(item)}
                                  >
                                    Add
                                  </Button>
                                )}
                              {formatQuantity(item.remainingQuantity) === "-" &&
                                !(
                                  item.componentType?.toUpperCase() === "BATCH" &&
                                  item.precheckDetailsId !== undefined &&
                                  item.precheckDetailsId ===
                                  maxPrecheckDetailsIdMap[itemKey] &&
                                  !(
                                    item.isRejected &&
                                    (item.remainingQuantity ??
                                      item.quantity ??
                                      0) === 0
                                  ) &&
                                  !item.isAddDisabled &&
                                  (item.remainingQuantity ??
                                    item.quantity ??
                                    0) > 0
                                ) && "-"}
                            </>
                          ) : (
                            "-"
                          )}
                        </Box>
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem", whiteSpace: "nowrap" }}
                      >
                        {item.idNumber || "-"}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem", whiteSpace: "nowrap" }}
                      >
                        {item.ir || "-"}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem", whiteSpace: "nowrap" }}
                      >
                        {item.msn || "-"}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem", whiteSpace: "nowrap", textAlign: "center" }}
                      >
                        {item.mrirNumber || "-"}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                      >
                        {getComponentTypeChip(
                          item.componentType || "",
                          item.isRejected,
                        )}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                      >
                        <TextField
                          size="small"
                          value={item.remarks || ""}
                          onChange={(e) =>
                            onRemarksChange(item, e.target.value)
                          }
                          placeholder="Add remarks"
                          variant="outlined"
                          multiline
                          maxRows={2}
                          sx={{
                            width: "100%",
                            "& .MuiOutlinedInput-root": {
                              fontSize: "0.75rem",
                              py: 0.2,
                              color: item.isRejected
                                ? "error.main"
                                : "inherit",
                              "& .MuiInputBase-input": {
                                color: item.isRejected
                                  ? "error.main"
                                  : "inherit",
                                WebkitTextFillColor: item.isRejected
                                  ? "#d32f2f"
                                  : "inherit",
                              },
                            },
                          }}
                          disabled={
                            item.isPrecheckComplete || item.isSubmitted
                          }
                        />
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            justifyContent: "center",
                            alignItems: "center",
                            width: "100%",
                          }}
                        >
                          {/* Show database Undo/Remove and Delete icon buttons when precheckDetailsId is present and greater than 0 */}
                          {!item.isRejected && item.precheckDetailsId && item.precheckDetailsId > 0 && !item.isUpdated && (
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                              {undoConfirmSr === item.sr ? (
                                <>
                                  <Tooltip title="Confirm Undo">
                                    <IconButton
                                      size="small"
                                      color="success"
                                      onClick={() => {
                                        onUndoPrecheck(item);
                                        setUndoConfirmSr(null);
                                      }}
                                    >
                                      <CheckIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Cancel">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => setUndoConfirmSr(null)}
                                    >
                                      <CloseIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              ) : deleteConfirmSr === item.sr ? (
                                <>
                                  <Tooltip title="Confirm Delete">
                                    <IconButton
                                      size="small"
                                      color="success"
                                      onClick={() => {
                                        onDeletePrecheck(item);
                                        setDeleteConfirmSr(null);
                                      }}
                                    >
                                      <CheckIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Cancel">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => setDeleteConfirmSr(null)}
                                    >
                                      <CloseIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              ) : (
                                <>
                                  {item.precheckStatus?.toLowerCase() !== "pending" ? (
                                    <Tooltip title={isEditDeleteEnabled ? "Undo Precheck" : "Only Admin or Head can undo precheck"}>
                                      <span>
                                        <IconButton
                                          size="small"
                                          color="warning"
                                          onClick={() => {
                                            setUndoConfirmSr(item.sr);
                                            setDeleteConfirmSr(null);
                                          }}
                                          disabled={!isEditDeleteEnabled}
                                        >
                                          <UndoIcon fontSize="small" />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  ) : (
                                    <Tooltip title="Undo Precheck">
                                      <span>
                                        <IconButton
                                          size="small"
                                          color="warning"
                                          disabled
                                        >
                                          <UndoIcon fontSize="small" />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  )}
                                  <Tooltip title={isEditDeleteEnabled ? "Delete Precheck" : "Only Admin or Head can delete precheck"}>
                                    <span>
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => {
                                          setDeleteConfirmSr(item.sr);
                                          setUndoConfirmSr(null);
                                        }}
                                        disabled={!isEditDeleteEnabled}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                </>
                              )}
                            </Box>
                          )}

                          {/* Show Reject button only when ready for rejection */}
                          {item.readyForRejection && !item.isRejected && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => onEditClick(item)}
                              startIcon={<EditIcon />}
                              sx={{
                                minWidth: "auto",
                                px: 1.5,
                                py: 0.5,
                                fontSize: "0.75rem",
                                fontWeight: "bold",
                                textTransform: "none",
                                backgroundColor: "#fff",
                                border: "1px solid",
                                borderColor: "error.main",
                                "&:hover": {
                                  backgroundColor: "#fff5f5",
                                  borderColor: "error.dark",
                                  boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
                                },
                                boxShadow: "0px 1px 2px rgba(0,0,0,0.05)",
                              }}
                              title="Click to Reject Component"
                            >
                              Reject
                            </Button>
                          )}

                          {/* Show Rejected chip for rejected items */}
                          {item.isRejected && (
                            <Chip
                              label="Rejected"
                              size="small"
                              color="error"
                              variant="outlined"
                              icon={<CancelIcon />}
                            />
                          )}

                          {/* Show Undo button if scanned and not yet submitted */}
                          {!item.isRejected && item.qrCode && !item.isSubmitted && item.isUpdated && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              onClick={() => onUndoScan(item)}
                              startIcon={<UndoIcon sx={{ fontSize: 14 }} />}
                              sx={{
                                minWidth: "55px",
                                height: "28px",
                                px: 1.5,
                                py: 0.5,
                                fontSize: "0.75rem",
                                fontWeight: "bold",
                                textTransform: "none",
                                backgroundColor: "#fff",
                                border: "1px solid",
                                borderColor: "warning.main",
                                "&:hover": {
                                  backgroundColor: "#fffde7",
                                  borderColor: "warning.dark",
                                  boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
                                },
                                boxShadow: "0px 1px 2px rgba(0,0,0,0.05)",
                              }}
                              title="Click to Undo Scan"
                            >
                              Undo
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => onRowExpand(index)}
                          sx={{ p: 0.2 }}
                        >
                          {expandedRows.has(index) ? (
                            <ExpandLessIcon fontSize="small" />
                          ) : (
                            <ExpandMoreIcon fontSize="small" />
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow sx={{ height: 'auto' }}>
                      <TableCell
                        style={{ paddingBottom: 0, paddingTop: 0 }}
                        colSpan={16}
                      >
                        <Collapse
                          in={expandedRows.has(index)}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box sx={{ margin: 0.5 }}>
                            <Table
                              size="small"
                              aria-label="additional-details"
                              sx={{ width: "100%" }}
                            >
                              <TableHead>
                                <TableRow>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      fontWeight: "bold",
                                      py: 0.2,
                                      px: 0.8,
                                    }}
                                  >
                                    Remarks
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      fontWeight: "bold",
                                      py: 0.2,
                                      px: 0.8,
                                    }}
                                  >
                                    User
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      fontWeight: "bold",
                                      py: 0.2,
                                      px: 0.8,
                                    }}
                                  >
                                    Date
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      fontWeight: "bold",
                                      py: 0.2,
                                      px: 0.8,
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
                                      py: 0.2,
                                      px: 0.8,
                                    }}
                                  >
                                    {item.remarks || "-"}
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      py: 0.2,
                                      px: 0.8,
                                    }}
                                  >
                                    {item.username || "-"}
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      py: 0.2,
                                      px: 0.8,
                                    }}
                                  >
                                    {formatDate(item.modifiedDate || "")}
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      py: 0.2,
                                      px: 0.8,
                                    }}
                                  >
                                    {item.precheckStatus ? (
                                      <Chip
                                        label={item.precheckStatus}
                                        size="small"
                                        variant="outlined"
                                        color={
                                          item.precheckStatus.toLowerCase() ===
                                            "completed"
                                            ? "success"
                                            : item.precheckStatus.toLowerCase() ===
                                              "updated"
                                              ? "warning"
                                              : item.precheckStatus.toLowerCase() ===
                                                "pending"
                                                ? "default"
                                                : "default"
                                        }
                                        sx={{
                                          fontSize: "0.7rem",
                                          height: 20,
                                        }}
                                      />
                                    ) : (
                                      "-"
                                    )}
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
                <TableCell colSpan={16} align="center" sx={{ height: 150 }}>
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={16}
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

    </Paper>
  );
};

export default React.memo(PrecheckTable);
