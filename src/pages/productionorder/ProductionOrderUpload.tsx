import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  LinearProgress,
  Chip,
  Paper,
  Stack,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButtonGroup,
  ToggleButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  IconButton,
  TextField,
  Snackbar,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  History as HistoryIcon,
  Visibility as VisibilityIcon,
  PlaylistAddCheck as PlaylistAddCheckIcon,
  Today as TodayIcon,
  CalendarMonth as CalendarMonthIcon,
  DateRange as DateRangeIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
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

const ProductionOrderUpload: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: pageAccessData } = usePageAccess(
    user?.roleid ? Number(user.roleid) : null,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [insertedRows, setInsertedRows] = useState<any[]>([]);
  const location = useLocation();
  const [view, setView] = useState<"upload" | "history">(
    location.state?.view || "history",
  );
  const [uploadMode, setUploadMode] = useState<"import" | "update">("import");

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
  const [dateFilterMode, setDateFilterMode] = useState<"single" | "range">(
    "single",
  );
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<number | "">("");
  const [poNumber, setPoNumber] = useState("");
  const [lnItemCode, setLnItemCode] = useState("");
  const [drawingNo, setDrawingNo] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
  });

  const hasActiveFilters = !!(
    (dateFilterMode === "single" && filterDate) ||
    (dateFilterMode === "range" && (fromDate || toDate)) ||
    statusFilter !== "" ||
    poNumber.trim() ||
    lnItemCode.trim() ||
    drawingNo.trim()
  );

  // Debounced values for server-side filtering
  const debouncedPoNumber = useDebounce(poNumber, 500);
  const debouncedLnItemCode = useDebounce(lnItemCode, 500);
  const debouncedDrawingNo = useDebounce(drawingNo, 500);
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

    // Date Filters
    if (dateFilterMode === "single" && filterDate) {
      params.dateFilterType = "single";
      params.filterDate = format(filterDate, "yyyy-MM-dd");
    } else if (dateFilterMode === "range" && fromDate && toDate) {
      params.dateFilterType = "range";
      params.fromDate = format(fromDate, "yyyy-MM-dd");
      params.toDate = format(toDate, "yyyy-MM-dd");
    }

    // Status Filter
    if (statusFilter !== "") {
      params.precheckStatus = statusFilter;
    }

    // Text Filters (Server-side)
    if (debouncedPoNumber?.trim()) {
      params.poNumber = debouncedPoNumber.trim();
    }
    if (debouncedLnItemCode?.trim()) {
      params.lnItemCode = debouncedLnItemCode.trim();
    }
    if (debouncedDrawingNo?.trim()) {
      params.drawingNumber = debouncedDrawingNo.trim();
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
      dateFilterMode,
      filterDate,
      fromDate,
      toDate,
      statusFilter,
      debouncedPoNumber,
      debouncedLnItemCode,
      debouncedDrawingNo,
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
      dateFilterMode,
      filterDate,
      fromDate,
      toDate,
      statusFilter,
      debouncedPoNumber,
      debouncedLnItemCode,
      debouncedDrawingNo,
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

  // Use server data directly (Pure Server-Side Filtering) with Client-Side Fallback for Drawing No
  const filteredRows = React.useMemo(() => {
    const rows = productionOrders || [];
    if (!debouncedDrawingNo?.trim()) return rows;
    const term = debouncedDrawingNo.trim().toLowerCase();
    return rows.filter((row) =>
      row.drawingNumber?.toLowerCase().includes(term)
    );
  }, [productionOrders, debouncedDrawingNo]);

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
      setUploadResult(data.result);
      const response = await api.get("/api/ProductionOrder/GetAll");
      const allRows = response.data;
      const insertedPONumbers = data.result.insertedPONumbers || [];
      const importedCount = data.result.imported || 0;

      let newRows: ProductionOrder[] = [];

      if (insertedPONumbers.length > 0) {
        newRows = allRows.filter((row: ProductionOrder) =>
          insertedPONumbers.includes(row.productionOrderNumber),
        );
      } else if (importedCount > 0) {
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

  const handleRefresh = () => {
    setFilterModel({ items: [] });
    refetch();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.name.endsWith(".xls") && !file.name.endsWith(".xlsx")) {
      alert("Only .xls and .xlsx files are allowed");
      return;
    }

    setInsertedRows([]);
    setSelectedFile(file);
    setUploadResult(null);

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

        // Map MIN column variations (e.g. MIN, MIN Number, MIN No)
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

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (uploadMode === "update") {
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);

        await api.post("/api/ProductionOrder/UpdateMinStatus", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setPreviewRows([]);
        setSelectedFile(null);
        setShowSuccessPopup(true);
        queryClient.invalidateQueries({ queryKey: ["productionOrders"] });
        refetch();
      } catch (error: any) {
        alert(error.response?.data?.message || "Update failed");
      }

      return;
    }

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

  const handleExportExcel = async () => {
    try {
      // Use the helper which now uses debounced values (pure server-side)
      const params = buildQueryParams();

      // if (filterModel && filterModel.items) {
      //   filterModel.items.forEach((item) => {
      //     if (item.value) {
      //       params[item.field] = item.value;
      //     }
      //   });
      // }

      // Add confirmation to prevent accidental/auto exports
      const confirmExport = window.confirm(
        "Do you want to export the Production Order data?",
      );
      if (!confirmExport) return;

      const response = await api.get("/api/ProductionOrder/Export", {
        params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Production_Order_Data.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error Exporting Data:", error);
      alert("Failed to Export Data. Please try again.");
    }
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
      width: 20,
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
      flex: 1,
      minWidth: 200,
      sortable: false,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const hasViewAccess = isPageAccessible(pageAccessData, "View Order Details");
        const hasMakeAccess = isPageAccessible(pageAccessData, "Make Precheck");
        const isConfirming = deleteConfirmId === params.row.id;
        const canDeleteOrEdit = params.row.precheckStatus === 1 || params.row.precheckStatus === 4;

        return (
          <Box
            sx={{
              display: "flex",
              gap: 0.5,
              "& .MuiIconButton-root": {
                outline: "none",
              },
            }}
          >
            {isConfirming ? (
              <>
                <Tooltip title="Confirm Delete">
                  <IconButton
                    size="small"
                    color="success"
                    onClick={() => deleteMutation.mutate(params.row)}
                  >
                    <CheckIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Cancel">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteConfirmId(null)}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <>
                <Tooltip
                  title={
                    hasViewAccess
                      ? "View BOM Details"
                      : "You do not have permission to view precheck details"
                  }
                  PopperProps={{ disablePortal: true }}
                  disableFocusListener
                >
                  <span>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() =>
                        navigate("/production-order/view", { state: params.row })
                      }
                      disabled={!hasViewAccess}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip
                  title={
                    hasMakeAccess
                      ? "Make Precheck"
                      : "You do not have permission to perform precheck"
                  }
                  PopperProps={{ disablePortal: true }}
                  disableFocusListener
                >
                  <span>
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() =>
                        navigate("/precheck/make", { state: params.row })
                      }
                      disabled={!hasMakeAccess}
                    >
                      <PlaylistAddCheckIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <IconButton
                  size="small"
                  color="secondary"
                  onClick={() =>
                    navigate(
                      `/production-order/edit/${params.row.id}?from=${encodeURIComponent(location.pathname)}`,
                      {
                        state: { ...params.row, from: location.pathname },
                      },
                    )
                  }
                  disabled={!canDeleteOrEdit}
                  title="Edit Production Order"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => setDeleteConfirmId(params.row.id)}
                  disabled={!canDeleteOrEdit}
                  title="Delete Production Order"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </>
            )}
          </Box>
        );
      },

    },
  ];

  const uploadTableRows = insertedRows.length > 0 ? insertedRows : previewRows;

  const autosizedPreviewColumns = React.useMemo(() => {
    return getAutosizedColumns(previewColumns, uploadTableRows);
  }, [previewColumns, uploadTableRows]);

  const autosizedHistoryColumns = React.useMemo(() => {
    const historyRows = (filteredRows || []).map((item, index) => ({
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
        overflow: "hidden",
        scrollbarGutter: "stable",
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 0.25, flexShrink: 0 }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: "primary.main",
              fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.5rem" },
            }}
          >
            Production Order Management
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {view === "history" && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<UploadIcon />}
              onClick={() => {
                setView("upload");
                setUploadMode("import");
              }}
            >
              Import
            </Button>
          )}

          {view === "history" && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<UploadIcon />}
              onClick={() => {
                setView("upload");
                setUploadMode("update");
              }}
            >
              Update
            </Button>
          )}
          <Button
            variant={view === "history" ? "contained" : "outlined"}
            size="small"
            startIcon={<HistoryIcon sx={{ fontSize: "1rem !important" }} />}
            onClick={() => {
              setView("history");
            }}
            sx={{ px: 1, py: 0.25, fontSize: "0.75rem", minWidth: "auto" }}
          >
            History ({productionOrders?.length || 0})
          </Button>
          {view === "history" && (
            <Button
              variant={view === "history" ? "contained" : "outlined"}
              size="small"
              color="success"
              onClick={handleExportExcel}
              startIcon={<DownloadIcon sx={{ fontSize: "1rem !important" }} />}
              sx={{ px: 1, py: 0.25, fontSize: "0.75rem", minWidth: "auto" }}
            >
              Export
            </Button>
          )}
        </Stack>
      </Stack>

      {view === "upload" && (
        <Card
          elevation={1}
          sx={{ mb: 0.5, flexShrink: 0 }}
        >
          <CardContent
            sx={{
              py: 0.5,
              px: 0.5,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minHeight: 48,
              boxSizing: "border-box",
              "&:last-child": { pb: 0.5 }
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Box>
                  <Button
                    variant="outlined"
                    component="label"
                    size="small"
                    startIcon={<UploadIcon />}
                    sx={{ px: 0 }}
                  //disabled={view === "history"}
                  >
                    {selectedFile
                      ? "Change Excel"
                      : uploadMode === "update"
                        ? "Select Excel for Update"
                        : "Select Excel File"}
                    <input
                      type="file"
                      hidden
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                    // disabled={view === "history"}
                    />
                  </Button>
                </Box>

                {selectedFile && (
                  <Chip
                    label={selectedFile.name}
                    color="primary"
                    variant="filled"
                    size="small"
                    onDelete={() => {
                      setSelectedFile(null);
                      setPreviewRows([]);
                    }}
                    sx={{ maxWidth: 200 }}
                  />
                )}

                {selectedFile && (
                  <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                )}

                {selectedFile && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: "success.main",
                        whiteSpace: "nowrap",
                      }}
                    >
                      STEP 2:
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={handleUpload}
                      disabled={uploadMutation.isPending}
                      color="success"
                      size="small"
                      startIcon={<UploadIcon />}
                      sx={{ px: 2, fontWeight: 600, height: 30 }}
                    >
                      {uploadMutation.isPending ? "Importing..." : "Confirm"}
                    </Button>
                  </Box>
                )}
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                {uploadResult && (
                  <Alert
                    severity={
                      uploadResult.imported === 0 && uploadResult.errors.length > 0
                        ? "error"
                        : uploadResult.errors.length > 0
                          ? "warning"
                          : "success"
                    }
                    onClose={() => setUploadResult(null)}
                    sx={{
                      py: 0,
                      px: 1,
                      display: "flex",
                      alignItems: "center",
                      "& .MuiAlert-message": { py: 0.25 },
                      "& .MuiAlert-icon": { py: 0.25, mr: 0.5, fontSize: "1.1rem" },
                      "& .MuiAlert-action": { py: 0, my: 0, mr: -0.5 }
                    }}
                  >
                    <Typography variant="caption" fontWeight="600" sx={{ whiteSpace: "nowrap" }}>
                      Import Summary: {uploadResult.imported} Imported | {uploadResult.skipped} Skipped
                    </Typography>
                  </Alert>
                )}

                <Button
                  variant="text"
                  color="primary"
                  size="small"
                  startIcon={<DownloadIcon fontSize="small" />}
                  onClick={handleDownloadTemplate}
                  sx={{
                    fontWeight: 600,
                    textDecoration: "underline",
                    fontSize: "0.75rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  Template
                </Button>
              </Box>
            </Box>

            {uploadMutation.isPending && <LinearProgress sx={{ mt: 2 }} />}

            {view === "upload" && uploadResult && uploadResult.errors.length > 0 && (
              <Alert
                severity="error"
                sx={{ mt: 1 }}
                onClose={() => setUploadResult(null)}
              >
                <Box sx={{ maxHeight: 150, overflow: "auto" }}>
                  {uploadResult.errors.map((err, idx) => (
                    <Typography
                      key={idx}
                      variant="body2"
                      color="error"
                      sx={{ my: 0.5 }}
                    >
                      • {err}
                    </Typography>
                  ))}
                </Box>
              </Alert>
            )}
          </CardContent>
        </Card>
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
            {uploadMode === "update"
              ? "Update Successful!"
              : "Upload Successful!"}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            id="alert-dialog-description"
            sx={{ textAlign: "center", mt: 1 }}
          >
            {uploadMode === "update"
              ? "Your production orders have been successfully updated."
              : "Your production orders have been successfully imported."}
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
          <Typography
            variant="subtitle2"
            sx={{
              mb: 0.25,
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
              minHeight: 0,
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
          <Typography
            variant="subtitle2"
            sx={{
              mb: 0.25,
              fontWeight: 600,
              color: "text.primary",
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexShrink: 0,
            }}
          >
            Production Orders History
          </Typography>

          {/* Filter Controls */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Paper elevation={1} sx={{ p: 0.75, mb: 0.25, flexShrink: 0 }}>
              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
                alignItems="center"
              >
                {/* Date Filter Mode Toggle */}
                <ToggleButtonGroup
                  value={dateFilterMode}
                  exclusive
                  onChange={(_, newMode) => {
                    if (newMode !== null) {
                      setDateFilterMode(newMode);
                      setFilterDate(null);
                      setFromDate(null);
                      setToDate(null);
                    }
                  }}
                  size="small"
                >
                  <ToggleButton value="single">
                    <CalendarMonthIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Single Date
                  </ToggleButton>
                  <ToggleButton value="range">
                    <DateRangeIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Date Range
                  </ToggleButton>
                </ToggleButtonGroup>

                {/* Date Pickers based on mode */}
                {dateFilterMode === "single" ? (
                  <>
                    <DatePicker
                      label="Filter Date"
                      value={filterDate}
                      onChange={(newValue) => setFilterDate(newValue)}
                      slotProps={{
                        textField: { size: "small", sx: { width: 180 } },
                      }}
                    />
                    {/* <Button
                      size="small"
                      variant="outlined"
                      startIcon={<TodayIcon />}
                      onClick={() => setFilterDate(new Date())}
                    >
                      Today
                    </Button> */}
                  </>
                ) : (
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

                {/* Status Filter */}
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) =>
                      setStatusFilter(e.target.value as number | "")
                    }
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value={4}>Pending-Planner</MenuItem>
                    <MenuItem value={1}>Pending</MenuItem>
                    <MenuItem value={2}>Partial</MenuItem>
                    <MenuItem value={3}>Completed</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="PO Number"
                  variant="outlined"
                  size="small"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  sx={{ width: 120 }}
                />

                <TextField
                  label="LN Item Code"
                  variant="outlined"
                  size="small"
                  value={lnItemCode}
                  onChange={(e) => setLnItemCode(e.target.value)}
                  sx={{ width: 120 }}
                />

                <TextField
                  label="Drawing No"
                  variant="outlined"
                  size="small"
                  value={drawingNo}
                  onChange={(e) => setDrawingNo(e.target.value)}
                  sx={{ width: 150 }}
                />

                {/* Clear Filters Button */}
                <Button
                  size="small"
                  variant="text"
                  color="error"
                  disabled={!hasActiveFilters}
                  onClick={() => {
                    setFilterDate(null);
                    setFromDate(null);
                    setToDate(null);
                    setStatusFilter("");
                    setPoNumber("");
                    setLnItemCode("");
                    setDrawingNo("");
                  }}
                >
                  Clear Filters
                </Button>
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
            <Box sx={{ position: "absolute", right: 8, top: 4, zIndex: 1 }}>
              <IconButton
                onClick={handleRefresh}
                disabled={isHistoryLoading}
                size="small"
              >
                <RefreshIcon fontSize="small" color="primary" />
              </IconButton>
            </Box>
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
