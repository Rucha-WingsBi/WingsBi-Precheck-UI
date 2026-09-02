import React, { useState } from "react";
import {
  Box,
  Button,
  Card,

  Typography,
  Alert,
  LinearProgress,
  Chip,
  Paper,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  TextField,
  Snackbar,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Grid,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  History as HistoryIcon,
  Visibility as VisibilityIcon,
  PlaylistAddCheck as PlaylistAddCheckIcon,
  DateRange as DateRangeIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  DataGrid,
  type GridColDef,
  type GridFilterModel,
  GridFooterContainer,
  GridPagination,
} from "@mui/x-data-grid";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import * as XLSX from "xlsx";
import api from "../../services/api";
import { useDebounce } from "../../hooks/useDebounce";
import { usePageAccess } from "../../hooks/useMasterData";
import { isPageAccessible } from "../../utils/accessUtils";
import { getAutosizedColumns } from "../../utils/gridUtils";

interface ProductionOrder {
  id: number;
  productionOrderNumber: string;
  projectNumber?: string;
  projectDescription?: string;
  lnItemCode?: string;
  itemDescription?: string;
  productionSeries?: string;
  startIdNumber?: number;
  endIdNumber?: number;
  quantity?: number;
  drawingNumber?: string;
  createdDate?: string;
  precheckStatus?: number;
  precheckStatusName?: string;
  dateFilterType?: string;
  mrirNumber?: string;
  min?: string | null;
  buildNumber?: string | null;
  snagSheetNo?: string | null;
}

interface UploadResult {
  totalRows: number;
  imported: number;
  skipped: number;
  errors: string[];
  insertedPONumbers?: string[];
}

interface StatusCount {
  totalCount: number;
  completedCount: number;
  pendingCount: number;
  partialCount: number;
  uploadedCount: number;
}

const normalizeKey = (key: string) =>
  key.toLowerCase().replace(/\s+/g, "").replace(/_/g, "").trim();

const statusOptions = [
  { id: 4, label: "Pending-Planner" },
  { id: 1, label: "Pending" },
  { id: 2, label: "Partial" },
  { id: 3, label: "Completed" },
];

const RowActionsMenu: React.FC<{
  row: any;
  pageAccessData: any;
  deleteConfirmId: number | null;
  setDeleteConfirmId: (id: number | null) => void;
  deleteMutation: any;
}> = ({ row, pageAccessData, deleteConfirmId, setDeleteConfirmId, deleteMutation }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const hasViewAccess = isPageAccessible(pageAccessData, "View Order Details");
  const hasMakeAccess = isPageAccessible(pageAccessData, "Make Precheck");
  const isConfirming = deleteConfirmId === row.id;
  const canDeleteOrEdit = row.precheckStatus === 1 || row.precheckStatus === 4;

  if (isConfirming) {
    return (
      <Box sx={{ display: "flex", gap: 0.5 }}>
        <Tooltip title="Confirm Delete">
          <IconButton
            size="small"
            color="success"
            onClick={(e) => {
              e.stopPropagation();
              deleteMutation.mutate(row);
            }}
          >
            <CheckIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Cancel">
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteConfirmId(null);
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
      <IconButton
        size="small"
        onClick={handleOpen}
        sx={{
          color: "action.active",
          "&:hover": { backgroundColor: "action.hover" },
        }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          elevation: 3,
          sx: { minWidth: 170, borderRadius: 2, py: 0.5 },
        }}
      >
        <MenuItem
          disabled={!hasViewAccess}
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
            navigate("/production-order/view", { state: row });
          }}
        >
          <ListItemIcon>
            <VisibilityIcon fontSize="small" color={hasViewAccess ? "primary" : "disabled"} />
          </ListItemIcon>
          <ListItemText primary="View Availabe QRs" primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 500 }} />
        </MenuItem>

        <MenuItem
          disabled={!hasMakeAccess}
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
            navigate("/precheck/make", { state: row });
          }}
        >
          <ListItemIcon>
            <PlaylistAddCheckIcon fontSize="small" color={hasMakeAccess ? "success" : "disabled"} />
          </ListItemIcon>
          <ListItemText primary="Make Precheck" primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 500 }} />
        </MenuItem>

        <MenuItem
          disabled={!canDeleteOrEdit}
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
            navigate(`/production-order/edit/${row.id}?from=${encodeURIComponent(location.pathname)}`, {
              state: { ...row, from: location.pathname },
            });
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" color={canDeleteOrEdit ? "secondary" : "disabled"} />
          </ListItemIcon>
          <ListItemText primary="Edit Order" primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 500 }} />
        </MenuItem>

        <MenuItem
          disabled={!canDeleteOrEdit}
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
            setDeleteConfirmId(row.id);
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color={canDeleteOrEdit ? "error" : "disabled"} />
          </ListItemIcon>
          <ListItemText
            primary="Delete Order"
            primaryTypographyProps={{
              fontSize: "0.85rem",
              fontWeight: 500,
              color: canDeleteOrEdit ? "error.main" : undefined,
            }}
          />
        </MenuItem>
      </Menu>
    </Box>
  );
};

const ALL_EXPORTABLE_COLUMNS = [
  { key: "sr", label: "Sr No" },
  { key: "productionOrderNumber", label: "PO Number" },
  { key: "projectNumber", label: "Project" },
  { key: "projectDescription", label: "Project Description" },
  { key: "lnItemCode", label: "LN Item Code" },
  { key: "itemDescription", label: "Item Description" },
  { key: "drawingNumber", label: "Drawing Number" },
  { key: "productionSeries", label: "Prod Series" },
  { key: "startIdNumber", label: "Start ID" },
  { key: "endIdNumber", label: "End ID" },
  { key: "quantity", label: "Qty" },
  { key: "mrirNumber", label: "MRIR No" },
  { key: "buildNumber", label: "Build No" },
  { key: "status", label: "Status" },
  { key: "createdDate", label: "Created Date" },
  { key: "agingDays", label: "Aging Days" },
];

const ProductionOrderUpload: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: pageAccessData } = usePageAccess(
    user?.roleid ? Number(user.roleid) : null,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [showColumnPreview, setShowColumnPreview] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [insertedRows, setInsertedRows] = useState<any[]>([]);
  const location = useLocation();

  // Export Modal state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportMode, setExportMode] = useState<"all" | "custom">("all");
  const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const handleOpenExportDialog = () => {
    setExportMode("all");
    setSelectedExportColumns([]);
    setExportDialogOpen(true);
  };

  const handleToggleColumn = (colKey: string) => {
    if (selectedExportColumns.includes(colKey)) {
      setSelectedExportColumns(selectedExportColumns.filter((k) => k !== colKey));
    } else {
      setSelectedExportColumns([...selectedExportColumns, colKey]);
    }
  };

  const handleToggleSelectAllColumns = () => {
    if (selectedExportColumns.length === ALL_EXPORTABLE_COLUMNS.length) {
      setSelectedExportColumns([]);
    } else {
      setSelectedExportColumns(ALL_EXPORTABLE_COLUMNS.map((c) => c.key));
    }
  };

  const handleConfirmExportData = async () => {
    const activeColumns =
      exportMode === "all"
        ? ALL_EXPORTABLE_COLUMNS
        : ALL_EXPORTABLE_COLUMNS.filter((col) => selectedExportColumns.includes(col.key));

    if (exportMode === "custom" && activeColumns.length === 0) {
      showSnackbar("Please select at least one column to export.", "error");
      return;
    }

    setIsExporting(true);

    try {
      // Build API query parameters with selected columns sent in payload
      const columnKeys = activeColumns.map((c) => c.key);
      const columnLabels = activeColumns.map((c) => c.label);
      const baseParams = buildQueryParams();

      const exportParams = {
        ...baseParams,
        columns: columnKeys.join(","),
        columnNames: columnLabels.join(","),
        selectedColumns: columnKeys,
        exportAll: exportMode === "all",
      };

      let exportedViaApi = false;
      try {
        const response = await api.get("/api/ProductionOrder/Export", {
          params: exportParams,
          responseType: "blob",
        });

        if (response.status === 200 && response.data && response.data.size > 0) {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `Production_Orders_Export_${Date.now()}.xlsx`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          exportedViaApi = true;
        }
      } catch (apiErr) {
        console.warn("Server API export fallback to client-side XLSX generation:", apiErr);
      }

      // Non-blocking fallback client-side excel generation
      if (!exportedViaApi) {
        await new Promise((resolve) => setTimeout(resolve, 50));

        const rowsToExport = filteredRows || [];

        const excelData = rowsToExport.map((row: any, index: number) => {
          const rowData: Record<string, any> = {};

          activeColumns.forEach((col) => {
            switch (col.key) {
              case "sr":
                rowData["Sr No"] = index + 1;
                break;
              case "productionOrderNumber":
                rowData["PO Number"] = row.productionOrderNumber || row.productionorder || "-";
                break;
              case "projectNumber":
                rowData["Project"] = row.projectNumber || row.projectcode || "-";
                break;
              case "projectDescription":
                rowData["Project Description"] = row.projectDescription || row.projectdescription || "-";
                break;
              case "lnItemCode":
                rowData["LN Item Code"] = row.lnItemCode || row.itemcode || "-";
                break;
              case "itemDescription":
                rowData["Item Description"] = row.itemDescription || row.itemdescription || "-";
                break;
              case "drawingNumber":
                rowData["Drawing Number"] = row.drawingNumber || row.drawingnumber || "-";
                break;
              case "productionSeries":
                rowData["Prod Series"] = row.productionSeries || row.series || "-";
                break;
              case "startIdNumber":
                rowData["Start ID"] = row.startIdNumber || row.id_num || "-";
                break;
              case "endIdNumber":
                rowData["End ID"] = row.endIdNumber || row.end_id || "-";
                break;
              case "quantity":
                rowData["Qty"] = row.quantity || 0;
                break;
              case "mrirNumber":
                rowData["MRIR No"] = row.mrirNumber || row.mrirnumber || "-";
                break;
              case "buildNumber":
                rowData["Build No"] = row.buildNumber || row.buildnumber || "-";
                break;
              case "status":
                rowData["Status"] = row.precheckStatusName || row.status || "Pending";
                break;
              case "createdDate":
                rowData["Created Date"] = formatDate(row.createdDate);
                break;
              case "agingDays": {
                if (!row.createdDate) {
                  rowData["Aging Days"] = "-";
                } else {
                  const created = new Date(row.createdDate);
                  const diffDays = Math.floor((new Date().getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
                  rowData["Aging Days"] = diffDays;
                }
                break;
              }
              default:
                break;
            }
          });

          return rowData;
        });

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Production Orders");
        XLSX.writeFile(workbook, `Production_Orders_Export_${Date.now()}.xlsx`);
      }

      setExportDialogOpen(false);
      showSnackbar("Data exported successfully to Excel");
    } catch (err) {
      console.error("Export error:", err);
      showSnackbar("Failed to export data. Please try again.", "error");
    } finally {
      setIsExporting(false);
    }
  };
  const [view, setView] = useState<"upload" | "history">(
    location.state?.view || "history",
  );

  const queryClient = useQueryClient();

  // Handle automatic reload if coming from edit success
  React.useEffect(() => {
    if (location.state?.reload) {
      queryClient.invalidateQueries({ queryKey: ["productionOrders"] });
      // Clear state to prevent extra reloads
      navigate(location.pathname, {
        replace: true,
        state: { ...location.state, reload: false },
      });
    }
  }, [location.state, location.pathname, navigate, queryClient]);

  // Filter states
  const [showDateFields, setShowDateFields] = useState(false);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
  });

  // Debounced values for server-side filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const showSnackbar = (
    message: string,
    severity: "success" | "error" = "success",
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  // Helper to build query params from all filter states
  const buildQueryParams = () => {
    const params: any = {};

    // Date Filters (Range mode)
    if (fromDate && toDate) {
      params.dateFilterType = "range";
      params.fromDate = format(fromDate, "yyyy-MM-dd");
      params.toDate = format(toDate, "yyyy-MM-dd");
    }

    // Text Filters & Status (Server-side)
    if (debouncedSearchQuery?.trim()) {
      const term = debouncedSearchQuery.trim();
      params.searchQuery = term;
      params.poNumber = term;
      params.lnItemCode = term;
      params.drawingNumber = term;

      const termLower = term.toLowerCase();
      if ("pending-planner".includes(termLower)) params.precheckStatus = 4;
      else if ("pending".includes(termLower)) params.precheckStatus = 1;
      else if ("partial".includes(termLower)) params.precheckStatus = 2;
      else if ("completed".includes(termLower)) params.precheckStatus = 3;
    }

    return params;
  };

  // Fetch production orders with filters
  const {
    data: productionOrders,
    isLoading: isHistoryLoading,
    refetch,
  } = useQuery<ProductionOrder[]>({
    queryKey: [
      "productionOrders",
      fromDate,
      toDate,
      debouncedSearchQuery,
    ],
    queryFn: async () => {
      const params = buildQueryParams();
      const response = await api.get("/api/ProductionOrder/GetAll", { params });
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });

  // Fetch status counts with filters
  const { data: statusCounts } = useQuery<StatusCount>({
    queryKey: [
      "productionOrderCounts",
      fromDate,
      toDate,
      debouncedSearchQuery,
    ],
    queryFn: async () => {
      const params = buildQueryParams();
      const response = await api.get("/api/ProductionOrder/GetCounts", {
        params,
      });
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });
  const counts: StatusCount = statusCounts ?? {
    totalCount: 0,
    pendingCount: 0,
    partialCount: 0,
    completedCount: 0,
    uploadedCount: 0,
  };

  // Use server data directly (Pure Server-Side Filtering) with Client-Side Fallback
  const filteredRows = React.useMemo(() => {
    const rows = productionOrders || [];
    if (!debouncedSearchQuery?.trim()) return rows;
    const term = debouncedSearchQuery.trim().toLowerCase();
    return rows.filter(
      (row) =>
        row.productionOrderNumber?.toLowerCase().includes(term) ||
        row.lnItemCode?.toLowerCase().includes(term) ||
        row.drawingNumber?.toLowerCase().includes(term) ||
        row.projectNumber?.toLowerCase().includes(term) ||
        row.itemDescription?.toLowerCase().includes(term) ||
        row.precheckStatusName?.toLowerCase().includes(term) ||
        (row.precheckStatus === 4 && "pending-planner".includes(term)) ||
        (row.precheckStatus === 1 && "pending".includes(term)) ||
        (row.precheckStatus === 2 && "partial".includes(term)) ||
        (row.precheckStatus === 3 && "completed".includes(term)),
    );
  }, [productionOrders, debouncedSearchQuery]);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/api/ProductionOrder/Upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: async (data) => {
      const result = data.result || {};
      setUploadResult(result);

      const errors = result.errors || [];
      const importedCount = result.imported || 0;

      // Do NOT show success popup if errors occurred or 0 items were imported
      if (errors.length > 0) {
        return;
      }

      if (importedCount > 0) {
        const response = await api.get("/api/ProductionOrder/GetAll");
        const allRows = response.data;
        const insertedPONumbers = result.insertedPONumbers || [];

        let newRows: ProductionOrder[] = [];

        if (insertedPONumbers.length > 0) {
          newRows = allRows.filter((row: ProductionOrder) =>
            insertedPONumbers.includes(row.productionOrderNumber),
          );
        } else {
          // Fallback: If no explicit IDs, assume the most recently created IDs are the new ones.
          // Sort by ID descending to get the newest first.
          const sortedRows = [...allRows].sort((a, b) => b.id - a.id);
          newRows = sortedRows.slice(0, importedCount);
        }

        const formattedRows = newRows.map((row: ProductionOrder) => ({
          id: row.id,
          sr: row.id,
          productionorder: row.productionOrderNumber,
          projectcode: row.projectNumber,
          projectdescription: row.projectDescription,
          itemcode: row.lnItemCode,
          itemdescription: row.itemDescription,
          series: row.productionSeries,
          id_num: row.startIdNumber,
          end_id: row.endIdNumber,
          quantity: row.quantity,
          mrirnumber: row.mrirNumber,
          buildnumber: row.buildNumber,
          min: (row as any).min || (row as any).minNumber || (row as any).minNo || "-",
          snagsheetno: row.snagSheetNo,
          status:
            row.precheckStatusName ||
            (row.precheckStatus === 4
              ? "Pending-Planner"
              : row.precheckStatus === 1
                ? "Pending"
                : row.precheckStatus === 2
                  ? "Partial"
                  : row.precheckStatus === 3
                    ? "Completed"
                    : "Uploaded"),
        }));

        setInsertedRows(formattedRows);
        setPreviewRows([]);
        setSelectedFile(null);
        setShowSuccessPopup(true);
        queryClient.invalidateQueries({ queryKey: ["productionOrders"] });
      }
    },

    onError: (error: any) => {
      setUploadResult({
        totalRows: 0,
        imported: 0,
        skipped: 0,
        errors: [error.response?.data?.message || "Upload failed"],
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (row: ProductionOrder) => {
      const payload = {
        productionOrderNumber: row.productionOrderNumber,
        idNumber: row.startIdNumber,
        quantity: row.quantity,
      };
      const response = await api.post("/api/ProductionOrder/DeleteProductionOrder", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productionOrders"] });
      queryClient.invalidateQueries({ queryKey: ["productionOrderCounts"] });
      setDeleteConfirmId(null);
      showSnackbar("Production Order deleted successfully");
    },
    onError: (error: any) => {
      showSnackbar(error.response?.data?.message || "Failed to Delete Production Order", "error");
      setDeleteConfirmId(null);
    },
  });


  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    if (!file.name.endsWith(".xls") && !file.name.endsWith(".xlsx")) {
      alert("Only .xls and .xlsx files are allowed");
      return;
    }

    setInsertedRows([]);
    setSelectedFile(file);
    setUploadResult(null);
    setShowColumnPreview(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const excelRows = XLSX.utils.sheet_to_json<any>(sheet);
      console.log("Headers:", Object.keys(excelRows[0]));

      const normalizedData = excelRows.map((row: any, index: number) => {
        const newRow: any = { id: index };
        Object.keys(row).forEach((key) => {
          newRow[normalizeKey(key)] = row[key];
        });

        // Map "snagsheetnumber" (from Excel column "Snag Sheet Number") to "snagsheetno"
        if (newRow["snagsheetnumber"] !== undefined) {
          newRow["snagsheetno"] = newRow["snagsheetnumber"];
        }

        const minVal =
          newRow["min"] ??
          newRow["minnumber"] ??
          newRow["minno"] ??
          newRow["min_no"] ??
          newRow["materialindentnumber"] ??
          newRow["materialindentno"];
        if (minVal !== undefined) {
          newRow["min"] = minVal;
        }

        // Map Status column variations or default to "Uploaded" for preview
        const statusVal =
          newRow["status"] ??
          newRow["precheckstatus"] ??
          newRow["precheckstatusname"];
        if (statusVal !== undefined) {
          newRow["status"] = statusVal;
        } else {
          newRow["status"] = "Uploaded";
        }

        const startId = (newRow["startidnumber"] || newRow["startid"] || "")
          .toString()
          .replace(/[^a-zA-Z0-9]/g, "");

        const match = startId.match(/^([A-Za-z]+)(\d+)$/);
        if (match) {
          newRow["series"] = match[1];
          newRow["id_num"] = match[2];
        } else if (startId) {
          newRow["id_num"] = startId.slice(-4);
          newRow["series"] = startId.slice(0, -4);
        }

        // Map quantity/qty
        const qtyVal = newRow["quantity"] !== undefined ? newRow["quantity"] : newRow["qty"];
        if (qtyVal !== undefined) {
          newRow["quantity"] = qtyVal;
        }

        const endId = (newRow["endidnumber"] || newRow["endid"] || "")
          .toString()
          .replace(/[^a-zA-Z0-9]/g, "");
        const endMatch = endId.match(/^([A-Za-z]+)(\d+)$/);
        if (endMatch) {
          newRow["end_id"] = endMatch[2];
        } else if (endId) {
          newRow["end_id"] = endId.slice(-4);
        } else {
          const startNum = parseInt(newRow["id_num"]);
          const quantityVal = parseInt(newRow["quantity"]);
          if (!isNaN(startNum) && !isNaN(quantityVal)) {
            newRow["end_id"] = (startNum + quantityVal - 1).toString();
          }
        }

        return newRow;
      });

      setPreviewRows(normalizedData);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    uploadMutation.mutate(selectedFile);
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get("/api/ProductionOrder/DownloadTemplate", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Production_Order_Template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading template:", error);
      alert("Failed to download template. Please try again.");
    }
  };

  const handleExportExcel = () => {
    handleOpenExportDialog();
  };

  const previewColumns: GridColDef[] = [
    {
      field: "sr",
      headerName: "Sr No",
      width: 60,
      headerAlign: "center",
      align: "center",
      renderCell: (params: any) =>
        params.api.getSortedRowIds().indexOf(params.id) + 1,
    },
    {
      field: "productionorder",
      headerName: "Production Order",
      flex: 1,
      minWidth: 150,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "projectcode",
      headerName: "Project Code",
      flex: 1,
      minWidth: 120,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "projectdescription",
      headerName: "Project Description",
      flex: 1.5,
      minWidth: 200,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "itemcode",
      headerName: "Item Code",
      flex: 1,
      minWidth: 150,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "itemdescription",
      headerName: "Item Description",
      flex: 2,
      minWidth: 250,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "series",
      headerName: "Prod Series",
      flex: 0.8,
      minWidth: 100,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "id_num",
      headerName: "Start ID",
      flex: 0.8,
      minWidth: 100,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "end_id",
      headerName: "End ID",
      flex: 0.8,
      minWidth: 100,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "quantity",
      headerName: "Qty",
      flex: 0.6,
      minWidth: 80,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "buildnumber",
      headerName: "Build No",
      flex: 0.8,
      minWidth: 100,
      headerAlign: "center",
      align: "center",
      renderCell: (params: any) => params.value || "-",
    },
    {
      field: "mrirnumber",
      headerName: "MRIR No",
      flex: 0.6,
      minWidth: 150,
      headerAlign: "center",
      align: "center",
      renderCell: (params: any) => params.value || "-",
    },
    {
      field: "min",
      headerName: "MIN",
      flex: 0.6,
      minWidth: 150,
      headerAlign: "center",
      align: "center",
      renderCell: (params: any) => params.value || "-",
    },
    {
      field: "snagsheetno",
      headerName: "Snag Sheet Number",
      flex: 0.8,
      minWidth: 120,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.6,
      minWidth: 150,
      headerAlign: "center",
      align: "center",
      renderCell: (params: any) => params.value || "Uploaded",
    },
  ];

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  const historyColumns: GridColDef[] = [
    {
      field: "sr",
      headerName: "Sr No",
      width: 70,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "productionOrderNumber",
      headerName: "PO Number",
      flex: 1,
      minWidth: 120,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Tooltip title={params.value || ""}>
          <Chip
            label={params.value}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Tooltip>
      ),
    },
    {
      field: "projectNumber",
      headerName: "Project",
      flex: 0.8,
      minWidth: 90,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "lnItemCode",
      headerName: "LN Item",
      flex: 1,
      minWidth: 160,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "drawingNumber",
      headerName: "Drawing",
      flex: 1,
      minWidth: 200,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "productionSeries",
      headerName: "Prod Series",
      flex: 0.7,
      minWidth: 70,
      headerAlign: "center",
      align: "center",
    },
    // {
    //   field: "startIdNumber",
    //   headerName: "Start ID",
    //   flex: 0.7,
    //   minWidth: 60,
    //   headerAlign: "center",
    //   align: "center",
    // },
    // {
    //   field: "endIdNumber",
    //   headerName: "End ID",
    //   flex: 0.7,
    //   minWidth: 60,
    //   headerAlign: "center",
    //   align: "center",
    // },
    {
      field: "quantity",
      headerName: "Qty",
      flex: 0.5,
      minWidth: 40,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "buildNumber",
      headerName: "Build No",
      flex: 0.8,
      minWidth: 90,
      headerAlign: "center",
      align: "center",
      renderCell: (params: any) => params.value || "-",
    },
    {
      field: "mrirNumber",
      headerName: "MRIR No",
      flex: 0.8,
      minWidth: 120,
      headerAlign: "center",
      align: "center",
      renderCell: (params: any) => params.value || "-",
    },
    {
      field: "precheckStatus",
      headerName: "Status",
      flex: 1,
      minWidth: 150,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const status = params.value || 1;
        const statusName = params.row.precheckStatusName || "Pending";
        const color =
          status === 4
            ? "info"
            : status === 3
              ? "success"
              : status === 2
                ? "warning"
                : "error";
        return (
          <Chip
            label={statusName}
            size="small"
            color={color}
            variant="filled"
          />
        );
      },
    },
    {
      field: "createdDate",
      headerName: "Created Date",
      flex: 1.2,
      minWidth: 90,
      headerAlign: "center",
      align: "center",
      valueFormatter: (params) => formatDate(params.value),
    },
    // {
    //   field: "modifiedDate",
    //   headerName: "Modified Date",
    //   flex: 1.2,
    //   minWidth: 90,
    //   headerAlign: "center",
    //   align: "center",
    //   valueFormatter: (params) => formatDate(params.value),
    // },
    {
      field: "days",
      headerName: "Aging Days",
      flex: 0.7,
      minWidth: 80,
      headerAlign: "center",
      align: "center",
      valueGetter: (params) => {
        if (!params.row.createdDate) return "-";

        const created = new Date(params.row.createdDate);
        const today = new Date();

        const diffTime = today.getTime() - created.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 90,
      sortable: false,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <RowActionsMenu
          row={params.row}
          pageAccessData={pageAccessData}
          deleteConfirmId={deleteConfirmId}
          setDeleteConfirmId={setDeleteConfirmId}
          deleteMutation={deleteMutation}
        />
      ),
    },
  ];

  const uploadTableRows = insertedRows.length > 0 ? insertedRows : previewRows;

  const autosizedPreviewColumns = React.useMemo(() => {
    return getAutosizedColumns(previewColumns, uploadTableRows);
  }, [previewColumns, uploadTableRows]);

  const autosizedHistoryColumns = React.useMemo(() => {
    const historyRows = (filteredRows || []).map((item: any, index: number) => ({
      ...item,
      sr: index + 1,
    }));
    return getAutosizedColumns(historyColumns, historyRows);
  }, [historyColumns, filteredRows]);

  return (
    <Box
      sx={{
        p: { xs: 0.5, sm: 1 },
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "100%",
        overflowY: "auto",
        scrollbarGutter: "stable",
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1, flexShrink: 0 }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          {view === "upload" && (
            <IconButton
              onClick={() => setView("history")}
              size="small"
              sx={{ color: "primary.main" }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography
            variant="h4"
            sx={{
              color: "primary.main",
              fontWeight: 600,
              fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.5rem" },
            }}
          >
            {view === "history" ? "Production Order History" : "Upload Production Order"}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {view === "upload" && (
            <Chip
              icon={<HistoryIcon sx={{ fontSize: "1.75rem " }} />}
              label={`${(productionOrders?.length || 0).toLocaleString()} orders uploaded`}
              variant="outlined"
              size="medium"
              onClick={() => setView("history")}
              sx={{
                borderRadius: 3,
                px: 1.5,
                height: 48,
                fontSize: "0.925rem",
                fontWeight: 600,
                borderColor: "#cbd5e1",
                color: "#334155",
                backgroundColor: "#ffffff",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                "&:hover": { backgroundColor: "#f8fafc", borderColor: "#94a3b8" },
              }}
            />
          )}
          {view === "history" && (
            <>
              <Box
                onClick={() => setView("upload")}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  cursor: "pointer",
                  color: "primary.main",
                  transition: "color 0.2s",
                  "&:hover": {
                    color: "primary.dark",
                  },
                }}
              >
                <IconButton
                  size="small"
                  color="primary"
                  sx={{ p: 0.5 }}
                >
                  <ArrowBackIcon fontSize="small" />
                </IconButton>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    textDecoration: "underline",
                  }}
                >
                  Upload Order
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                color="success"
                onClick={handleExportExcel}
                startIcon={<DownloadIcon sx={{ fontSize: "1rem !important" }} />}
                sx={{ px: 1, py: 0.25, fontSize: "0.75rem", minWidth: "auto" }}
              >
                Export
              </Button>
            </>
          )}
        </Stack>
      </Stack>

      {view === "upload" && (
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            mt: 1,
          }}
        >
          {/* Top Validation Error Alert */}
          {uploadResult && uploadResult.errors.length > 0 && (
            <Alert
              severity="error"
              sx={{
                width: "100%",
                mb: 2,
                borderRadius: 3,
                boxShadow: "0 4px 12px rgba(220, 38, 38, 0.12)",
                border: "1px solid",
                borderColor: "#fca5a5",
                backgroundColor: "#fef2f2",
                "& .MuiAlert-message": { width: "100%", pr: 1 },
              }}
              onClose={() => setUploadResult(null)}
            >
              <Typography variant="subtitle2" fontWeight="700" color="#991b1b" sx={{ mb: 0.75, fontSize: "0.95rem" }}>
                Upload Validation Errors ({uploadResult.errors.length}):
              </Typography>
              <Box
                sx={{
                  maxHeight: 160,
                  overflowY: "auto",
                  width: "100%",
                  pr: 1.5,
                  "&::-webkit-scrollbar": {
                    width: "6px",
                  },
                  "&::-webkit-scrollbar-track": {
                    backgroundColor: "#fee2e2",
                    borderRadius: "3px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "#f87171",
                    borderRadius: "3px",
                    "&:hover": {
                      backgroundColor: "#ef4444",
                    },
                  },
                }}
              >
                {uploadResult.errors.map((err, idx) => (
                  <Typography key={idx} variant="body2" color="#b91c1c" sx={{ my: 0.35, fontSize: "0.85rem", lineHeight: 1.4 }}>
                    • {err}
                  </Typography>
                ))}
              </Box>
            </Alert>
          )}

          <Card elevation={0} sx={{ width: "100%", maxWidth: "100%", borderRadius: 4, background: "transparent" }}>
            <Box
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: showColumnPreview ? 2.5 : 12,
                px: 5,
                borderRadius: 4,
                border: "2px dashed",
                borderColor: isDragging ? "#6d28d9" : "#a78bfa",
                backgroundColor: isDragging ? "#ede9fe" : "#f5f3ff",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                textAlign: "center",
                minHeight: showColumnPreview ? 180 : 540,
                "&:hover": {
                  backgroundColor: "#ede9fe",
                  borderColor: "#7c3aed",
                },
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept=".xlsx,.xls"
                onChange={handleFileChange}
              />

              {/* Soft Purple Circular Icon Container */}
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  backgroundColor: "#ede9fe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#6d28d9",
                  mb: 2.5,
                }}
              >
                <UploadIcon sx={{ fontSize: 32 }} />
              </Box>

              {/* Main Title */}
              <Typography
                variant="h5"
                fontWeight="700"
                color="#1e1b4b"
                sx={{ fontSize: "1.35rem", mb: 1 }}
              >
                Click to upload or drag & drop your Excel file
              </Typography>

              {/* Subtitle */}
              <Typography variant="body1" color="#64748b" sx={{ fontSize: "0.95rem", mb: 2.5 }}>
                Supports .xlsx and .xls · up to 10MB
              </Typography>

              {/* File Chip if selected */}
              {selectedFile && (
                <Box
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  sx={{ mb: 2 }}
                >
                  <Chip
                    label={selectedFile.name}
                    color="secondary"
                    variant="filled"
                    size="medium"
                    onDelete={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setSelectedFile(null);
                      setPreviewRows([]);
                      setShowColumnPreview(false);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    sx={{ fontWeight: 600, bgcolor: "#7c3aed", color: "#fff", py: 0.5, px: 0.5 }}
                  />
                </Box>
              )}

              {/* Post-Upload Controls (Preview & Confirm) */}
              {selectedFile && (
                <Box
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                  mb={1.5}
                  flexWrap="wrap"
                  justifyContent="center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Typography variant="body2" color="#475569" fontWeight="500" sx={{ fontSize: "0.85rem" }}>
                    Do you want to preview columns?
                  </Typography>
                  <Button
                    variant={showColumnPreview ? "contained" : "outlined"}
                    color="secondary"
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => setShowColumnPreview(!showColumnPreview)}
                    sx={{ height: 32, fontWeight: 600, borderRadius: 2 }}
                  >
                    {showColumnPreview ? "Hide Preview" : "Preview Columns"}
                  </Button>

                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<CheckIcon />}
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending}
                    sx={{ height: 32, px: 2.5, fontWeight: 700, borderRadius: 2 }}
                  >
                    {uploadMutation.isPending ? "Importing..." : "Confirm Import"}
                  </Button>
                </Box>
              )}

              {/* Divider Line */}
              <Divider sx={{ width: "90%", borderColor: "#ddd6fe", my: 2 }} />

              {/* Footer Template Download Link */}
              <Typography
                variant="body2"
                color="#64748b"
                sx={{ fontSize: "0.9rem" }}
                onClick={(e) => e.stopPropagation()}
              >
                Don't have the template?{" "}
                <Typography
                  component="span"
                  variant="body2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadTemplate();
                  }}
                  sx={{
                    color: "#5b21b6",
                    fontWeight: 700,
                    cursor: "pointer",
                    textDecoration: "underline",
                    "&:hover": { color: "#4c1d95" },
                  }}
                >
                  Click here to download it
                </Typography>
              </Typography>

              {uploadMutation.isPending && (
                <LinearProgress sx={{ width: "90%", mt: 2, borderRadius: 1 }} />
              )}
            </Box>
          </Card>
        </Box>
      )}

      <Dialog
        open={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          sx: { borderRadius: 2, minWidth: 320, textAlign: "center" },
        }}
      >
        <DialogTitle
          id="alert-dialog-title"
          sx={{
            pb: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          <CheckCircleOutlineIcon color="success" sx={{ fontSize: 48 }} />
          <Typography variant="h6" fontWeight="600">
            Upload Successful!
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            id="alert-dialog-description"
            sx={{ textAlign: "center", mt: 1 }}
          >
            Your production orders have been successfully imported.
            <br />
            Please check the history to verify the details.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 2.5 }}>
          <Button onClick={() => setShowSuccessPopup(false)} color="inherit">
            Close
          </Button>
          <Button
            onClick={() => {
              setShowSuccessPopup(false);
              setSelectedFile(null);
              setPreviewRows([]);
              setInsertedRows([]);
              setUploadResult(null);
              setView("history");
              queryClient.invalidateQueries({ queryKey: ["productionOrders"] });
            }}
            variant="contained"
            color="primary"
            autoFocus
          >
            View History
          </Button>
        </DialogActions>
      </Dialog>

      {view === "upload" ? (
        showColumnPreview && (
          <Box
            sx={{
              flexGrow: 1,
              minHeight: 650,
              height: 650,
              width: "100%",
              maxWidth: "100%",
              display: "flex",
              flexDirection: "column",
              mt: 1,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                mb: 0.5,
                fontWeight: 600,
                color: "text.primary",
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexShrink: 0,
              }}
            >
              <VisibilityIcon color="primary" fontSize="small" />
              {previewRows.length > 0
                ? `Excel Content Preview (${previewRows.length} rows)`
                : "Choose a file to preview its content here"}
            </Typography>
            <Paper
              elevation={2}
              sx={{
                flexGrow: 1,
                minHeight: 600,
                height: 600,
                width: "100%",
                overflow: "hidden",
              }}
            >
              <DataGrid
                rows={uploadTableRows}
                columns={autosizedPreviewColumns}
                pageSizeOptions={[5, 10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 50 } },
                }}
                density="compact"
                disableColumnMenu
                disableColumnFilter
                disableRowSelectionOnClick
                sx={{
                  border: "none",
                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor: "grey.100",
                    color: "text.primary",
                    fontWeight: 800,
                    fontSize: "0.875rem",
                  },
                  "& .MuiDataGrid-cell": {
                    fontSize: "0.875rem",
                  },
                }}
              />
            </Paper>
          </Box>
        )
      ) : (
        <Box
          sx={{
            flexGrow: 1,
            minHeight: 0,
            width: "100%",
            maxWidth: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >


          {/* Filter Controls */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Paper elevation={1} sx={{ p: 0.75, mb: 0.25, flexShrink: 0 }}>
              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
                alignItems="center"
              >


                {/* Unified Status / PO / LN Item / Drawing No Search Bar */}
                <TextField

                  placeholder="Search Status, PO, LN Item, Drawing No..."
                  variant="outlined"
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ width: 380 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setSearchQuery("")}
                          edge="end"
                        >
                          <ClearIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}

                />
                {/* Date Filter Button & Range Fields */}
                <Button
                  size="small"
                  variant={showDateFields || fromDate || toDate ? "contained" : "outlined"}
                  startIcon={<DateRangeIcon fontSize="small" />}
                  onClick={() => setShowDateFields(!showDateFields)}
                  sx={{ height: 40, px: 1.5 }}
                >
                  Date
                </Button>

                {(showDateFields || fromDate || toDate) && (
                  <>
                    <DatePicker
                      label="From Date"
                      value={fromDate}
                      onChange={(newValue) => setFromDate(newValue)}
                      slotProps={{
                        textField: { size: "small", sx: { width: 160 } },
                      }}
                    />
                    <DatePicker
                      label="To Date"
                      value={toDate}
                      onChange={(newValue) => setToDate(newValue)}
                      slotProps={{
                        textField: { size: "small", sx: { width: 160 } },
                      }}
                    />
                  </>
                )}
              </Stack>
            </Paper>
          </LocalizationProvider>

          <Paper
            elevation={2}
            sx={{
              flexGrow: 1,
              minHeight: 0,
              width: "100%",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <DataGrid
              rows={(filteredRows || []).map((item, index) => ({
                ...item,
                sr: index + 1,
              }))}
              columns={autosizedHistoryColumns}
              loading={isHistoryLoading}
              pageSizeOptions={[5, 10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 50 } },
              }}
              filterModel={filterModel}
              onFilterModelChange={(newModel) => setFilterModel(newModel)}
              disableColumnMenu
              disableColumnFilter
              density="compact"
              disableRowSelectionOnClick
              getRowId={(row) => row.sr}
              slots={{
                footer: () => (
                  <GridFooterContainer>
                    <Box
                      sx={{
                        flexGrow: 1,
                        display: "flex",
                        gap: 1,
                        ml: 2,
                        alignItems: "center",
                      }}
                    >
                      <Chip
                        label={`Total: ${counts.totalCount}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={`Pending-Planner: ${counts.uploadedCount}`}
                        size="small"
                        color="info"
                        variant="filled"
                      />
                      <Chip
                        label={`Pending: ${counts.pendingCount}`}
                        size="small"
                        color="error"
                        variant="filled"
                      />
                      <Chip
                        label={`Partial: ${counts.partialCount}`}
                        size="small"
                        color="warning"
                        variant="filled"
                      />
                      <Chip
                        label={`Completed: ${counts.completedCount}`}
                        size="small"
                        color="success"
                        variant="filled"
                      />
                    </Box>
                    <GridPagination />
                  </GridFooterContainer>
                ),
              }}
              sx={{
                border: "none",
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "grey.100",
                  color: "text.primary",
                  fontWeight: 800,
                  fontSize: "0.875rem",
                },
                "& .MuiDataGrid-cell": {
                  fontSize: "0.875rem",
                },
                "& .MuiDataGrid-cell:focus": {
                  outline: "none !important",
                },
                "& .MuiDataGrid-cell:focus-within": {
                  outline: "none !important",
                },
                "& .MuiDataGrid-columnHeader:focus": {
                  outline: "none !important",
                },
              }}
            />
          </Paper>
        </Box>
      )}

      {/* Export Options Modal */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 },
        }}
      >
        <DialogTitle sx={{ pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box display="flex" alignItems="center" gap={1}>
            <DownloadIcon color="primary" />
            <Typography variant="h6" fontWeight="700" color="primary.main">
              Export Production Order Data
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setExportDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2 }}>
          <FormControl component="fieldset" sx={{ width: "100%" }}>
            <Typography variant="subtitle2" fontWeight="600" color="text.secondary" sx={{ mb: 1 }}>
              Choose Export Option:
            </Typography>

            <RadioGroup
              value={exportMode}
              onChange={(e) => {
                const newMode = e.target.value as "all" | "custom";
                setExportMode(newMode);
                if (newMode === "custom") {
                  setSelectedExportColumns([]);
                }
              }}
              sx={{ mb: 2 }}
            >
              <FormControlLabel
                value="all"
                control={<Radio size="small" />}
                label={<Typography variant="body2" fontWeight="600">Export All Columns</Typography>}
              />
              <FormControlLabel
                value="custom"
                control={<Radio size="small" />}
                label={<Typography variant="body2" fontWeight="600">Select Specific Columns to Export</Typography>}
              />
            </RadioGroup>

            {exportMode === "custom" && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5} pb={1} borderBottom="1px solid #e2e8f0">
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={selectedExportColumns.length === ALL_EXPORTABLE_COLUMNS.length}
                        indeterminate={
                          selectedExportColumns.length > 0 &&
                          selectedExportColumns.length < ALL_EXPORTABLE_COLUMNS.length
                        }
                        onChange={handleToggleSelectAllColumns}
                      />
                    }
                    label={
                      <Typography variant="body2" fontWeight="700">
                        {selectedExportColumns.length === ALL_EXPORTABLE_COLUMNS.length ? "Deselect All" : "Select All Columns"}
                      </Typography>
                    }
                  />
                  <Chip
                    label={`${selectedExportColumns.length} / ${ALL_EXPORTABLE_COLUMNS.length} selected`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>

                <Grid container spacing={1}>
                  {ALL_EXPORTABLE_COLUMNS.map((col) => (
                    <Grid item xs={6} sm={4} key={col.key}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={selectedExportColumns.includes(col.key)}
                            onChange={() => handleToggleColumn(col.key)}
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontSize: "0.85rem" }}>{col.label}</Typography>}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </FormControl>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            onClick={() => setExportDialogOpen(false)}
            disabled={isExporting}
            sx={{ minWidth: 110, fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            color="success"
            startIcon={isExporting ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
            onClick={handleConfirmExportData}
            disabled={isExporting || (exportMode === "custom" && selectedExportColumns.length === 0)}
            sx={{ minWidth: 110, fontWeight: 600 }}
          >
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'error' ? null : 6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductionOrderUpload;
