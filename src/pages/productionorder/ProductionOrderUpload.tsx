import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Alert,
  LinearProgress,
  Chip,
  Paper,
  Stack,
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
  Grid,
  Tooltip,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  History as HistoryIcon,
  Visibility as VisibilityIcon,
  PlaylistAddCheck as PlaylistAddCheckIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
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
} from "@mui/x-data-grid";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import * as XLSX from "xlsx";
import api from "../../services/api";
import { useDebounce } from "../../hooks/useDebounce";
import { usePageAccess, useProductionSeries } from "../../hooks/useMasterData";
import { isPageAccessible } from "../../utils/accessUtils";
import { getAutosizedColumns } from "../../utils/gridUtils";

// --- Sub-components imported from modular directory ---
import { UploadDropzone } from "./components/UploadDropzone";
import { UploadSummaryCard } from "./components/UploadSummaryCard";
import { HistoryStatCard } from "./components/HistoryStatCard";
import { ActiveFilterChips, type FilterChipItem } from "./components/ActiveFilterChips";

// --- Interfaces & Constants ---

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

interface PaginatedResponse<T> {
  data: T[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
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
  { id: 1, label: "Pending" },
  { id: 2, label: "Partial" },
  { id: 3, label: "Completed" },
];

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

  const handleNavigate = (path: string, routeState?: any) => {
    setAnchorEl(null);
    setTimeout(() => {
      navigate(path, { state: routeState });
    }, 0);
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
          color: "#667085",
          "&:hover": { backgroundColor: "#F2F4F7" },
        }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transitionDuration={0}
        disableRestoreFocus
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
            handleNavigate("/production-order/view", row);
          }}
        >
          <ListItemIcon>
            <VisibilityIcon fontSize="small" color={hasViewAccess ? "primary" : "disabled"} />
          </ListItemIcon>
          <ListItemText primary="View Available QRs" primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 500 }} />
        </MenuItem>

        <MenuItem
          disabled={!hasMakeAccess}
          onClick={(e) => {
            e.stopPropagation();
            handleNavigate("/precheck/make", row);
          }}
        >
          <ListItemIcon>
            <PlaylistAddCheckIcon fontSize="small" color={hasMakeAccess ? "success" : "disabled"} />
          </ListItemIcon>
          <ListItemText primary="Run Precheck" primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 500 }} />
        </MenuItem>

        <MenuItem
          disabled={!canDeleteOrEdit}
          onClick={(e) => {
            e.stopPropagation();
            handleNavigate(`/production-order/edit/${row.id}?from=${encodeURIComponent(location.pathname)}`, {
              ...row,
              from: location.pathname,
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

const ProductionOrderUpload: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: pageAccessData } = usePageAccess(
    user?.roleid ? Number(user.roleid) : null,
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [insertedRows, setInsertedRows] = useState<any[]>([]);
  const [view, setView] = useState<"upload" | "history">(
    location.state?.view || "history",
  );

  const queryClient = useQueryClient();

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

  // Filter states
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductionSeries, setSelectedProductionSeries] = useState<any[]>([]);
  const [selectedStatusList, setSelectedStatusList] = useState<any[]>([]);
  const { data: productionSeriesData = [] } = useProductionSeries();
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
  });

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

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 20,
  });

  // Handle automatic reload if coming from edit success
  React.useEffect(() => {
    if (location.state?.reload) {
      queryClient.invalidateQueries({ queryKey: ["productionOrders"] });
      navigate(location.pathname, {
        replace: true,
        state: { ...location.state, reload: false },
      });
    }
  }, [location.state, location.pathname, navigate, queryClient]);

  // Reset pagination page to 0 when filters change
  React.useEffect(() => {
    setPaginationModel((prev) => (prev.page === 0 ? prev : { ...prev, page: 0 }));
  }, [
    fromDate,
    toDate,
    debouncedSearchQuery,
    selectedProductionSeries,
    selectedStatusList,
  ]);

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const showSnackbar = (
    message: string,
    severity: "success" | "error" = "success",
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  // Helper to build payload object from all filter states
  const buildPayload = () => {
    const payload: any = {
      searchQuery: debouncedSearchQuery?.trim() || "",
      productionSeries: selectedProductionSeries.map((s: any) =>
        (s.productionSeries || s).toString()
      ),
      precheckStatus: selectedStatusList.map((s: any) =>
        (typeof s === "number" ? s : s.id).toString()
      ),
    };

    if (fromDate && toDate) {
      payload.dateFilterType = "range";
      payload.fromDate = format(fromDate, "yyyy-MM-dd");
      payload.toDate = format(toDate, "yyyy-MM-dd");
    }

    return payload;
  };

  // Fetch production orders with filters
  const {
    data: paginatedResponse,
    isLoading: isHistoryLoading,
  } = useQuery<PaginatedResponse<ProductionOrder>>({
    queryKey: [
      "productionOrders",
      fromDate,
      toDate,
      debouncedSearchQuery,
      selectedProductionSeries,
      selectedStatusList,
      paginationModel.page,
      paginationModel.pageSize,
    ],
    queryFn: async () => {
      const payload = buildPayload();
      const response = await api.post("/api/ProductionOrder/GetAll", payload, {
        params: {
          pageNumber: paginationModel.page + 1,
          pageSize: paginationModel.pageSize,
        },
      });
      if (Array.isArray(response.data)) {
        return {
          data: response.data,
          totalRecords: response.data.length,
          pageNumber: 1,
          pageSize: response.data.length,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });

  const productionOrders = paginatedResponse?.data || [];
  const totalRowCount = paginatedResponse?.totalRecords || 0;

  // Fetch status counts with filters
  const { data: statusCounts } = useQuery<StatusCount>({
    queryKey: [
      "productionOrderCounts",
      fromDate,
      toDate,
      debouncedSearchQuery,
      selectedProductionSeries,
      selectedStatusList,
    ],
    queryFn: async () => {
      const payload = buildPayload();
      const response = await api.post("/api/ProductionOrder/GetCounts", payload);
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

  // Client-side filtering fallback
  const filteredRows = React.useMemo(() => {
    let rows = productionOrders || [];
    if (selectedProductionSeries.length > 0) {
      const seriesNames = selectedProductionSeries.map((s: any) =>
        (s.productionSeries || s).toString().toLowerCase()
      );
      rows = rows.filter(
        (row) => row.productionSeries && seriesNames.includes(row.productionSeries.toLowerCase())
      );
    }
    if (selectedStatusList.length > 0) {
      const statusIds = selectedStatusList.map((s: any) =>
        typeof s === "number" ? s : s.id
      );
      rows = rows.filter(
        (row) => row.precheckStatus !== undefined && statusIds.includes(row.precheckStatus)
      );
    }
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
        (row.precheckStatus === 1 && "pending".includes(term)) ||
        (row.precheckStatus === 2 && "partial".includes(term)) ||
        (row.precheckStatus === 3 && "completed".includes(term))
    );
  }, [productionOrders, debouncedSearchQuery, selectedProductionSeries, selectedStatusList]);

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

      if (errors.length > 0) {
        return;
      }

      if (importedCount > 0) {
        const response = await api.post("/api/ProductionOrder/GetAll", {});
        const allRows = response.data?.data || (Array.isArray(response.data) ? response.data : []);
        const insertedPONumbers = result.insertedPONumbers || [];

        let newRows: ProductionOrder[] = [];

        if (insertedPONumbers.length > 0) {
          newRows = allRows.filter((row: ProductionOrder) =>
            insertedPONumbers.includes(row.productionOrderNumber)
          );
        } else {
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

  const processFileSelect = (file: File) => {
    setInsertedRows([]);
    setSelectedFile(file);
    setUploadResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const excelRows = XLSX.utils.sheet_to_json<any>(sheet);

      const normalizedData = excelRows.map((row: any, index: number) => {
        const newRow: any = { id: index };
        Object.keys(row).forEach((key) => {
          newRow[normalizeKey(key)] = row[key];
        });

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
      const basePayload = buildPayload();
      const exportPayload: any = { ...basePayload };

      if (exportMode === "custom") {
        exportPayload.selectedColumns = activeColumns.map((c) => c.key);
      }

      let exportedViaApi = false;
      try {
        const response = await api.post("/api/ProductionOrder/Export", exportPayload, {
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

  const previewColumns: GridColDef[] = [
    {
      field: "sr",
      headerName: "Sr No",
      width: 65,
      headerAlign: "center",
      align: "center",
      renderCell: (params: any) =>
        params.api.getSortedRowIds().indexOf(params.id) + 1,
    },
    {
      field: "productionorder",
      headerName: "PO Number",
      flex: 1,
      minWidth: 140,
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
      minWidth: 180,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "itemcode",
      headerName: "Item Code",
      flex: 1,
      minWidth: 140,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "itemdescription",
      headerName: "Item Description",
      flex: 2,
      minWidth: 200,
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
      minWidth: 90,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "end_id",
      headerName: "End ID",
      flex: 0.8,
      minWidth: 90,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "quantity",
      headerName: "Qty",
      flex: 0.6,
      minWidth: 70,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "buildnumber",
      headerName: "Build No",
      flex: 0.8,
      minWidth: 90,
      headerAlign: "center",
      align: "center",
      renderCell: (params: any) => params.value || "-",
    },
    {
      field: "mrirnumber",
      headerName: "MRIR No",
      flex: 0.8,
      minWidth: 120,
      headerAlign: "center",
      align: "center",
      renderCell: (params: any) => params.value || "-",
    },
    {
      field: "min",
      headerName: "MIN",
      flex: 0.8,
      minWidth: 120,
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
      flex: 0.8,
      minWidth: 120,
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
      headerName: "Sr.No",
      width: 60,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "productionOrderNumber",
      headerName: "PO Number",
      flex: 1,
      minWidth: 130,
      headerAlign: "left",
      align: "left",
      renderCell: (params) => (
        <Tooltip title={params.value || ""}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, color: "#101828", fontSize: "0.85rem" }}
          >
            {params.value}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: "projectNumber",
      headerName: "Project",
      flex: 0.8,
      minWidth: 90,
      headerAlign: "left",
      align: "left",
    },
    {
      field: "lnItemCode",
      headerName: "LN Item",
      flex: 1,
      minWidth: 140,
      headerAlign: "left",
      align: "left",
    },
    {
      field: "drawingNumber",
      headerName: "Drawing No.",
      flex: 1,
      minWidth: 150,
      headerAlign: "left",
      align: "left",
    },
    {
      field: "productionSeries",
      headerName: "Prod Series",
      flex: 0.7,
      minWidth: 85,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "quantity",
      headerName: "Qty",
      flex: 0.5,
      minWidth: 50,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "buildNumber",
      headerName: "Build No.",
      flex: 0.8,
      minWidth: 90,
      headerAlign: "center",
      align: "center",
      renderCell: (params: any) => params.value || "-",
    },
    {
      field: "mrirNumber",
      headerName: "MRIR No.",
      flex: 0.8,
      minWidth: 110,
      headerAlign: "center",
      align: "center",
      renderCell: (params: any) => params.value || "-",
    },
    {
      field: "precheckStatus",
      headerName: "Status",
      flex: 1,
      minWidth: 130,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const status = params.value || 1;
        const statusName = params.row.precheckStatusName || "Pending";

        let chipBg = "#FEF3F2";
        let chipColor = "#B42318";
        if (status === 4) {
          chipBg = "#F4EBFF";
          chipColor = "#6B288A";
        } else if (status === 3) {
          chipBg = "#ECFDF3";
          chipColor = "#027A48";
        } else if (status === 2) {
          chipBg = "#FFFAEB";
          chipColor = "#B54708";
        }

        return (
          <Chip
            label={statusName}
            size="small"
            sx={{
              backgroundColor: chipBg,
              color: chipColor,
              fontWeight: 600,
              fontSize: "0.75rem",
              borderRadius: "16px",
              height: 24,
            }}
          />
        );
      },
    },
    {
      field: "createdDate",
      headerName: "Created On",
      flex: 1.1,
      minWidth: 130,
      headerAlign: "center",
      align: "center",
      valueFormatter: (params) => formatDate(params.value),
    },
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
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 70,
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

  const historyTableRows = React.useMemo(() => {
    const rows = filteredRows || [];
    return rows.map((item: any, index: number) => ({
      ...item,
      sr: item.sr ? item.sr : (paginationModel.page * paginationModel.pageSize) + index + 1,
    }));
  }, [filteredRows, paginationModel.page, paginationModel.pageSize]);

  const autosizedHistoryColumns = React.useMemo(() => {
    return getAutosizedColumns(historyColumns, historyTableRows);
  }, [historyColumns, historyTableRows]);

  // Construct active filter chips
  const activeChips: FilterChipItem[] = React.useMemo(() => {
    const list: FilterChipItem[] = [];

    if (searchQuery.trim()) {
      list.push({
        id: "search",
        label: `PO / Search: "${searchQuery.trim()}"`,
        onRemove: () => setSearchQuery(""),
      });
    }

    selectedStatusList.forEach((st: any) => {
      const label = typeof st === "string" ? st : st.label || st.id;
      list.push({
        id: `status_${typeof st === "object" ? st.id : st}`,
        label: `Status: ${label}`,
        onRemove: () =>
          setSelectedStatusList((prev) =>
            prev.filter((item) => (typeof item === "object" ? item.id : item) !== (typeof st === "object" ? st.id : st))
          ),
      });
    });

    selectedProductionSeries.forEach((ser: any) => {
      const val = typeof ser === "object" ? ser.productionSeries || ser.id : ser;
      list.push({
        id: `series_${val}`,
        label: `Series: ${val}`,
        onRemove: () =>
          setSelectedProductionSeries((prev) =>
            prev.filter((item) => (typeof item === "object" ? item.productionSeries || item.id : item) !== val)
          ),
      });
    });

    if (fromDate || toDate) {
      const fromStr = fromDate ? format(fromDate, "dd/MM/yyyy") : "...";
      const toStr = toDate ? format(toDate, "dd/MM/yyyy") : "...";
      list.push({
        id: "dateRange",
        label: `Created On: ${fromStr} – ${toStr}`,
        onRemove: () => {
          setFromDate(null);
          setToDate(null);
        },
      });
    }

    return list;
  }, [searchQuery, selectedStatusList, selectedProductionSeries, fromDate, toDate]);

  const totalOrdersCount = counts.totalCount || totalRowCount;
  const pendingCount = counts.pendingCount || 0;
  const partialCount = counts.partialCount || 0;
  const completedCount = counts.completedCount || 0;

  const pendingPct = totalOrdersCount > 0 ? Math.round((pendingCount / totalOrdersCount) * 100) : 0;
  const partialPct = totalOrdersCount > 0 ? Math.round((partialCount / totalOrdersCount) * 100) : 0;
  const completedPct = totalOrdersCount > 0 ? Math.round((completedCount / totalOrdersCount) * 100) : 0;

  return (
    <Box
      sx={{
        py: { xs: 1, sm: 1.25 },
        px: { xs: 1.5, sm: 2 },
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#FAFAFA",
        width: "100%",
        boxSizing: "border-box",
        overflow: view === "history" ? "hidden" : "auto",
      }}
    >
      {/* Header Section */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 1 }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "primary.main",
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
            }}
          >
            {view === "upload" ? "Upload Production Orders" : "Production Order History"}
          </Typography>
          {view === "upload" && (
            <Typography variant="body2" sx={{ color: "#667085", mt: 0.5 }}>
              Import production orders from an Excel sheet.
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          {view === "upload" ? (
            <Button
              variant="outlined"
              size="small"
              startIcon={<HistoryIcon sx={{ fontSize: 18 }} />}
              onClick={() => setView("history")}
              sx={{
                borderColor: "#D0D5DD",
                color: "#344054",
                fontWeight: 600,
                fontSize: "0.875rem",
                borderRadius: "8px",
                px: 2,
                py: 0.75,
                textTransform: "none",
                "&:hover": { borderColor: "#98A2B3", backgroundColor: "#F9FAFB" },
              }}
            >
              Upload history ({totalRowCount})
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                size="small"
                onClick={handleOpenExportDialog}
                startIcon={<DownloadIcon sx={{ fontSize: 18 }} />}
                sx={{
                  borderColor: "#D0D5DD",
                  color: "#344054",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  borderRadius: "8px",
                  px: 2,
                  py: 0.75,
                  textTransform: "none",
                  "&:hover": { borderColor: "#98A2B3", backgroundColor: "#F9FAFB" },
                }}
              >
                Export
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<UploadIcon sx={{ fontSize: 18 }} />}
                onClick={() => setView("upload")}
                sx={{
                  backgroundColor: "primary.main",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  borderRadius: "8px",
                  px: 2.5,
                  py: 0.75,
                  textTransform: "none",
                  boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
                  "&:hover": { backgroundColor: "primary.dark" },
                }}
              >
                Upload Orders
              </Button>
            </>
          )}
        </Stack>
      </Stack>

      {/* Main View Content */}
      {view === "upload" ? (
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
          {/* Dropzone OR Upload Summary Card */}
          {!selectedFile && !uploadResult ? (
            <UploadDropzone
              onFileSelect={processFileSelect}
              isPending={uploadMutation.isPending}
              onDownloadTemplate={handleDownloadTemplate}
            />
          ) : (
            <UploadSummaryCard
              fileName={selectedFile?.name || "Uploaded File"}
              totalRows={uploadResult?.totalRows || previewRows.length || insertedRows.length}
              userName={user?.username || user?.email || "User"}
              importedCount={uploadResult?.imported || insertedRows.length}
              errorCount={uploadResult?.errors?.length || 0}
              skippedCount={uploadResult?.skipped || 0}
              onDownloadErrorReport={
                uploadResult?.errors && uploadResult.errors.length > 0
                  ? () => alert(uploadResult.errors.join("\n"))
                  : undefined
              }
              onUploadAnother={() => {
                setSelectedFile(null);
                setPreviewRows([]);
                setInsertedRows([]);
                setUploadResult(null);
              }}
              onConfirmImport={selectedFile && !uploadResult ? handleUpload : undefined}
              isPending={uploadMutation.isPending}
              attentionRows={uploadResult?.errors}
            />
          )}

          {uploadMutation.isPending && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

          {/* Excel Rows Preview DataGrid */}
          <Paper
            elevation={0}
            sx={{
              flexGrow: 1,
              minHeight: 300,
              borderRadius: "12px",
              border: "1px solid #E9EAEB",
              overflow: "hidden",
              p: 2,
              backgroundColor: "#ffffff",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, color: "#101828", mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}
            >
              <VisibilityIcon sx={{ color: "primary.main", fontSize: 20 }} />
              {uploadTableRows.length > 0
                ? `Rows Preview (${uploadTableRows.length} rows)`
                : "Choose a file to preview its content here"}
            </Typography>

            <Box sx={{ flex: 1, minHeight: 380, width: "100%", position: "relative" }}>
              <DataGrid
                rows={uploadTableRows}
                columns={autosizedPreviewColumns}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 50 } },
                }}
                density="compact"
                disableColumnFilter
                disableColumnMenu
                disableColumnSelector
                disableRowSelectionOnClick
                sx={{
                  height: "100%",
                  width: "100%",
                  border: "none",
                  "& .MuiDataGrid-virtualScroller": {
                    overflowX: "auto !important",
                    overflowY: "auto !important",
                  },
                  "& ::-webkit-scrollbar": {
                    height: "12px !important",
                    width: "10px !important",
                  },
                  "& ::-webkit-scrollbar-track": {
                    backgroundColor: "#F2F4F7 !important",
                    borderRadius: "6px !important",
                  },
                  "& ::-webkit-scrollbar-thumb": {
                    backgroundColor: "#98A2B3 !important",
                    borderRadius: "6px !important",
                    border: "2px solid #F2F4F7 !important",
                    "&:hover": { backgroundColor: "#667085 !important" },
                  },
                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor: "#F9FAFB",
                    color: "#475467",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    borderBottom: "1px solid #EAECF0",
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                  },
                  "& .MuiDataGrid-cell": {
                    fontSize: "0.85rem",
                    color: "#344054",
                    borderBottom: "1px solid #F2F4F7",
                  },
                }}
              />
            </Box>
          </Paper>
        </Box>
      ) : (
        /* History Tab Content */
        <Box sx={{ flexGrow: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Stat Cards Row */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.25}
            sx={{ mb: 1 }}
          >
            <HistoryStatCard
              title="Total orders"
              count={totalOrdersCount}
              indicatorColor="#6B288A"
              subtext="All series · all time"
            />
            <HistoryStatCard
              title="Pending"
              count={pendingCount}
              indicatorColor="#f03737ff"
              subtext={`${pendingPct}% · pending`}
            />
            <HistoryStatCard
              title="Partial"
              count={partialCount}
              indicatorColor="#F79009"
              subtext={`${partialPct}% · precheck in progress`}
            />
            <HistoryStatCard
              title="Completed"
              count={completedCount}
              indicatorColor="#12B76A"
              subtext={`${completedPct}% · verified`}
            />
          </Stack>

          {/* Filter Bar */}
          <Paper
            elevation={0}
            sx={{
              p: 1,
              mb: 0.75,
              borderRadius: "10px",
              border: "1px solid #E9EAEB",
              backgroundColor: "#ffffff",
            }}
          >
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Stack
                direction="row"
                spacing={1.5}
                flexWrap="wrap"
                alignItems="center"
              >
                {/* Search Field */}
                <TextField
                  placeholder="Search PO, LN Item Code, Drawing No, MRIR No..."
                  variant="outlined"
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" sx={{ color: "#667085" }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearchQuery("")}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                  sx={{
                    width: { xs: "100%", sm: 280 },
                    "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.85rem" },
                  }}
                />

                {/* Prod. Series Dropdown (Multi-Select with Checkboxes) */}
                <Autocomplete
                  multiple
                  disableCloseOnSelect
                  renderTags={() => null}
                  size="small"
                  options={productionSeriesData}
                  getOptionLabel={(option: any) => option.productionSeries || option.toString()}
                  isOptionEqualToValue={(option, value) =>
                    (option.productionSeries || option) === (value.productionSeries || value)
                  }
                  value={selectedProductionSeries}
                  onChange={(_, newValue) => setSelectedProductionSeries(newValue)}
                  renderOption={(props, option, { selected }) => {
                    const { key, ...optionProps } = props;
                    return (
                      <Box component="li" key={key} {...optionProps}>
                        <Checkbox
                          size="small"
                          sx={{ mr: 0.75, p: 0.15 }}
                          checked={selected}
                        />
                        {option.productionSeries || option.toString()}
                      </Box>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={selectedProductionSeries.length > 0 ? `Prod. Series · ${selectedProductionSeries.length}` : "Prod. Series"}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.85rem" } }}
                    />
                  )}
                  sx={{ minWidth: 150, maxWidth: 220 }}
                />

                {/* Status Dropdown (Multi-Select with Checkboxes) */}
                <Autocomplete
                  multiple
                  disableCloseOnSelect
                  renderTags={() => null}
                  size="small"
                  options={statusOptions}
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  value={selectedStatusList}
                  onChange={(_, newValue) => setSelectedStatusList(newValue)}
                  renderOption={(props, option, { selected }) => {
                    const { key, ...optionProps } = props;
                    return (
                      <Box component="li" key={key} {...optionProps}>
                        <Checkbox
                          size="small"
                          sx={{ mr: 0.75, p: 0.15 }}
                          checked={selected}
                        />
                        {option.label}
                      </Box>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={selectedStatusList.length > 0 ? `Status · ${selectedStatusList.length}` : "Status"}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.85rem" } }}
                    />
                  )}
                  sx={{ minWidth: 140, maxWidth: 200 }}
                />

                {/* Date Range Pickers */}
                <DatePicker
                  label="From Date"
                  value={fromDate}
                  onChange={(newValue) => setFromDate(newValue)}
                  slotProps={{
                    textField: { size: "small", sx: { width: 140, "& .MuiOutlinedInput-root": { borderRadius: "8px" } } },
                  }}
                />
                <DatePicker
                  label="To Date"
                  value={toDate}
                  onChange={(newValue) => setToDate(newValue)}
                  slotProps={{
                    textField: { size: "small", sx: { width: 140, "& .MuiOutlinedInput-root": { borderRadius: "8px" } } },
                  }}
                />

                <Button
                  size="small"
                  variant="text"
                  disabled={
                    !searchQuery &&
                    selectedProductionSeries.length === 0 &&
                    selectedStatusList.length === 0 &&
                    !fromDate &&
                    !toDate
                  }
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedProductionSeries([]);
                    setSelectedStatusList([]);
                    setFromDate(null);
                    setToDate(null);
                  }}
                  sx={{
                    color: "#667085",
                    fontWeight: 600,
                    textTransform: "none",
                    "&:hover": { color: "#101828", backgroundColor: "transparent" },
                  }}
                >
                  Clear
                </Button>
              </Stack>
            </LocalizationProvider>
          </Paper>

          {/* Active Filter Chips & Results Count */}
          <ActiveFilterChips
            chips={activeChips}
            onClearAll={() => {
              setSearchQuery("");
              setSelectedProductionSeries([]);
              setSelectedStatusList([]);
              setFromDate(null);
              setToDate(null);
            }}
            totalResults={totalRowCount}
          />

          {/* Data Grid Table */}
          <Paper
            elevation={0}
            sx={{
              flexGrow: 1,
              minHeight: 0,
              borderRadius: "12px",
              border: "1px solid #E9EAEB",
              backgroundColor: "#ffffff",
              overflow: "hidden",
              position: "relative",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <DataGrid
              rows={historyTableRows}
              columns={autosizedHistoryColumns}
              loading={isHistoryLoading}
              rowCount={totalRowCount}
              paginationMode="server"
              paginationModel={paginationModel}
              onPaginationModelChange={(newModel) => setPaginationModel(newModel)}
              pageSizeOptions={[10, 20, 50, 100]}
              filterModel={filterModel}
              onFilterModelChange={(newModel) => setFilterModel(newModel)}
              disableColumnFilter
              disableColumnMenu
              disableColumnSelector
              density="compact"
              disableRowSelectionOnClick
              getRowId={(row) => row.id || row.sr}
              sx={{
                flex: 1,
                height: "100%",
                width: "100%",
                border: "none",
                "& .MuiDataGrid-virtualScroller": {
                  overflowX: "auto !important",
                  overflowY: "auto !important",
                },
                "& ::-webkit-scrollbar": {
                  height: "12px !important",
                  width: "10px !important",
                },
                "& ::-webkit-scrollbar-track": {
                  backgroundColor: "#F2F4F7 !important",
                  borderRadius: "6px !important",
                },
                "& ::-webkit-scrollbar-thumb": {
                  backgroundColor: "#98A2B3 !important",
                  borderRadius: "6px !important",
                  border: "2px solid #F2F4F7 !important",
                  "&:hover": { backgroundColor: "#667085 !important" },
                },
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "#F9FAFB",
                  color: "#475467",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  borderBottom: "1px solid #EAECF0",
                  position: "sticky",
                  top: 0,
                  zIndex: 2,
                },
                "& .MuiDataGrid-cell": {
                  fontSize: "0.85rem",
                  color: "#344054",
                  borderBottom: "1px solid #F2F4F7",
                },
                "& .MuiDataGrid-cell:focus": { outline: "none !important" },
                "& .MuiDataGrid-cell:focus-within": { outline: "none !important" },
                "& .MuiDataGrid-columnHeader:focus": { outline: "none !important" },
              }}
            />
          </Paper>
        </Box>
      )}

      {/* Export Options Modal Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "16px", p: 1 },
        }}
      >
        <DialogTitle sx={{ pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box display="flex" alignItems="center" gap={1}>
            <DownloadIcon sx={{ color: "primary.main" }} />
            <Typography variant="h6" fontWeight="700" color="#101828">
              Export Production Order Data
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setExportDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2 }}>
          <FormControl component="fieldset" sx={{ width: "100%" }}>
            <Typography variant="subtitle2" fontWeight="600" color="#475467" sx={{ mb: 1 }}>
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
                control={<Radio size="small" sx={{ color: "primary.main", "&.Mui-checked": { color: "primary.main" } }} />}
                label={<Typography variant="body2" fontWeight="600">Export All Columns</Typography>}
              />
              <FormControlLabel
                value="custom"
                control={<Radio size="small" sx={{ color: "primary.main", "&.Mui-checked": { color: "primary.main" } }} />}
                label={<Typography variant="body2" fontWeight="600">Select Specific Columns to Export</Typography>}
              />
            </RadioGroup>

            {exportMode === "custom" && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: "12px",
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
                        sx={{ color: "primary.main", "&.Mui-checked": { color: "primary.main" } }}
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
                    variant="outlined"
                    sx={{ borderColor: "primary.main", color: "primary.main" }}
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
                            sx={{ color: "primary.main", "&.Mui-checked": { color: "primary.main" } }}
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
            sx={{ minWidth: 110, fontWeight: 600, borderRadius: "8px", textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={isExporting ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
            onClick={handleConfirmExportData}
            disabled={isExporting || (exportMode === "custom" && selectedExportColumns.length === 0)}
            sx={{
              minWidth: 110,
              fontWeight: 600,
              borderRadius: "8px",
              textTransform: "none",
              backgroundColor: "primary.main",
              "&:hover": { backgroundColor: "primary.dark" },
            }}
          >
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Success Modal */}
      <Dialog
        open={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        PaperProps={{
          sx: { borderRadius: "16px", p: 1, minWidth: 340, textAlign: "center" },
        }}
      >
        <DialogTitle
          sx={{
            pb: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <CheckCircleOutlineIcon sx={{ color: "#12B76A", fontSize: 56 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#101828" }}>
            Upload Successful!
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ textAlign: "center", mt: 1, color: "#475467" }}>
            Your production orders have been successfully imported.
            <br />
            Please check the history to verify the details.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button
            onClick={() => setShowSuccessPopup(false)}
            sx={{ color: "#667085", textTransform: "none", fontWeight: 600 }}
          >
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
            sx={{
              backgroundColor: "primary.main",
              color: "#ffffff",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              px: 3,
              "&:hover": { backgroundColor: "primary.dark" },
            }}
            autoFocus
          >
            View History
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === "error" ? null : 6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%", borderRadius: "8px" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductionOrderUpload;
