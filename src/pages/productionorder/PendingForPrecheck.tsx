import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Chip,
  Paper,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  IconButton,
  TextField,
  Snackbar,
  Alert,
  Autocomplete,
  Dialog,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  PlaylistAddCheck as PlaylistAddCheckIcon,
  Today as TodayIcon,
  CalendarMonth as CalendarMonthIcon,
  DateRange as DateRangeIcon,
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
import api from "../../services/api";
import { useDebounce } from "../../hooks/useDebounce";
import {
  usePageAccess,
  useAllDrawingNumbers,
  useAllLnItemCodes,
  useProductionSeries,
} from "../../hooks/useMasterData";
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
  buildNumber?: string | null;
  snagSheetNo?: string | null;
}

interface StatusCount {
  totalCount: number;
  completedCount: number;
  pendingCount: number;
  partialCount: number;
}

const normalizeKey = (key: string) =>
  key.toLowerCase().replace(/\s+/g, "").replace(/_/g, "").trim();

const PendingIdDropdown: React.FC<{ ids: (number | string)[] }> = ({ ids }) => {
  const [selected, setSelected] = useState<number | string>("");
  return (
    <FormControl size="small" sx={{ width: 70, my: 0.25 }}>
      <Select
        value={selected}
        displayEmpty
        onChange={(e) => setSelected(e.target.value as number | string)}
        renderValue={(val) => (
          <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "primary.main", fontWeight: 500 }}>
            {val ? val : ""}
          </Typography>
        )}
        sx={{
          height: 28,
          fontSize: "0.8rem",
          "& .MuiSelect-select": { py: 0.25, display: "flex", alignItems: "center" },
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(168,0,90,0.3)" },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#A8005A" },
        }}
        MenuProps={{
          PaperProps: {
            sx: { maxHeight: 220, minWidth: 100 },
          },
        }}
      >
        {ids.map((idVal, idx) => (
          <MenuItem key={idx} value={idVal} dense sx={{ fontSize: "0.8rem" }}>
            {idVal}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

const PendingForPrecheck: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const location = useLocation();


  const queryClient = useQueryClient();

  const { data: pageAccessData } = usePageAccess(
    user?.roleid ? Number(user.roleid) : null,
  );

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

  // Master data lists for dropdown filters
  const { data: drawingNumbersList = [], isLoading: isDrawingsLoading } = useAllDrawingNumbers();
  const { data: lnItemCodesList = [] } = useAllLnItemCodes();
  const { data: productionSeriesList = [] } = useProductionSeries();

  // Fetch all PO data for dropdowns and ID number calculations
  const { data: allPoDataList = [] } = useQuery<any[]>({
    queryKey: ["allPoDataList"],
    queryFn: async () => {
      try {
        const response = await api.get("/api/ProductionOrder/GetAllPo");
        return Array.isArray(response.data) ? response.data : response.data?.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60 * 10,
  });

  // Extract unique PO objects list for rich dropdown filter
  const poObjectsList = React.useMemo(() => {
    const map = new Map<string, any>();
    allPoDataList.forEach((item: any) => {
      const poNum = item.productionOrderNumber || item.poNumber;
      if (poNum && !map.has(poNum)) {
        map.set(poNum, item);
      }
    });
    return Array.from(map.values());
  }, [allPoDataList]);

  // Combine LN Item Codes with associated drawing numbers and nomenclature
  const lnDrawingOptions = React.useMemo(() => {
    const map = new Map<string, any>();

    // 1. Populate from drawingNumbersList
    drawingNumbersList.forEach((d: any) => {
      if (d.lnItemCode && d.lnItemCode.trim() !== "") {
        const key = d.lnItemCode.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, d);
        }
      }
    });

    // 2. Populate from allPoDataList
    allPoDataList.forEach((item: any) => {
      if (item.lnItemCode && item.lnItemCode.trim() !== "") {
        const key = item.lnItemCode.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            id: item.lnItemCodeId || item.id || -Math.random(),
            lnItemCode: item.lnItemCode,
            drawingNumber: item.drawingNumber || "N/A",
            nomenclature: item.nomenclature || item.itemDescription || "",
          });
        }
      }
    });

    // 3. Populate from raw lnItemCodesList
    lnItemCodesList.forEach((item: any) => {
      const code = typeof item === "string" ? item : item.lnItemCode || item.code;
      if (code && code.trim() !== "") {
        const key = code.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, typeof item === "string" ? { id: -Math.random(), lnItemCode: code, drawingNumber: "N/A" } : item);
        }
      }
    });

    return Array.from(map.values());
  }, [drawingNumbersList, allPoDataList, lnItemCodesList]);

  // Filter states
  const [dateFilterMode, setDateFilterMode] = useState<"single" | "range">(
    "single",
  );
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<number | "">("");
  const [poNumber, setPoNumber] = useState("");
  const [selectedPoNumber, setSelectedPoNumber] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [selectedIdNumber, setSelectedIdNumber] = useState("");
  const [lnItemCode, setLnItemCode] = useState("");
  const [drawingNo, setDrawingNo] = useState("");
  const [selectedDrawingId, setSelectedDrawingId] = useState<number | null>(null);
  const [selectedDrawingNo, setSelectedDrawingNo] = useState<string>("");
  const [selectedLnCodeId, setSelectedLnCodeId] = useState<number | null>(null);
  const [selectedLnCode, setSelectedLnCode] = useState<string>("");
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<string>("");
  const [resetKey, setResetKey] = useState<number>(0);

  // Dynamically calculate distinct ID numbers list across all Assembly ID Number column data
  const calculatedIdNumbersList = React.useMemo(() => {
    const rows = poNumber?.trim()
      ? allPoDataList.filter(
        (item: any) =>
          (item.productionOrderNumber || item.poNumber)?.trim().toLowerCase() === poNumber.trim().toLowerCase()
      )
      : allPoDataList;

    const idSet = new Set<number>();

    rows.forEach((item: any) => {
      // 1. Direct idNumber
      if (item.idNumber !== undefined && item.idNumber !== null) {
        const directId = Number(item.idNumber);
        if (!isNaN(directId) && directId > 0) idSet.add(directId);
      }

      // 2. pendingIdNumbers array
      if (Array.isArray(item.pendingIdNumbers)) {
        item.pendingIdNumbers.forEach((pObj: any) => {
          const pId = typeof pObj === "object" ? Number(pObj.idNumber) : Number(pObj);
          if (!isNaN(pId) && pId > 0) idSet.add(pId);
        });
      }

      // 3. startIdNumber to endIdNumber range or quantity
      const startId = Number(item.startIdNumber ?? item.startId);
      let endId = Number(item.endIdNumber ?? item.endId);
      const qty = Number(item.quantity ?? item.qty);

      if (!isNaN(startId) && startId > 0) {
        if (!isNaN(endId) && endId >= startId) {
          for (let i = startId; i <= endId; i++) {
            idSet.add(i);
          }
        } else if (!isNaN(qty) && qty > 0) {
          endId = startId + qty - 1;
          for (let i = startId; i <= endId; i++) {
            idSet.add(i);
          }
        } else {
          idSet.add(startId);
        }
      }
    });

    return Array.from(idSet).sort((a, b) => a - b).map(String);
  }, [poNumber, allPoDataList]);

  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
  });
  const roleType = location.pathname.includes("store")
    ? "Store"
    : location.pathname.includes("pending-for-precheck")
      ? "Pending Precheck"
      : "QC";
  const roleId = roleType === "Store" ? 3 : roleType === "QC" ? 2 : undefined;

  // Reset filters when tab changes
  React.useEffect(() => {
    setDateFilterMode("single");
    setFilterDate(null);
    setFromDate(null);
    setToDate(null);
    setStatusFilter("");
    setPoNumber("");
    setSelectedPoNumber("");
    setIdNumber("");
    setSelectedIdNumber("");
    setLnItemCode("");
    setDrawingNo("");
    setSelectedDrawingId(null);
    setSelectedDrawingNo("");
    setSelectedLnCodeId(null);
    setSelectedLnCode("");
    setSelectedSeriesId(null);
    setSelectedSeries("");
    setFilterModel({ items: [] });
  }, [roleType]);

  // Debounced values for server-side filtering
  const debouncedPoNumber = useDebounce(poNumber, 500);
  const debouncedIdNumber = useDebounce(idNumber, 500);
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

  // Helper to build payload and query params from all filter states
  const buildPayloadOrParams = () => {
    if (roleType === "Pending Precheck") {
      const pendingPayload: any = {};
      if (selectedDrawingId) pendingPayload.assemblyDrawingNumberId = Number(selectedDrawingId);
      if (selectedSeriesId) pendingPayload.prodSeriesId = Number(selectedSeriesId);
      if (selectedPoNumber) pendingPayload.productionOrderNumber = selectedPoNumber;
      if (selectedIdNumber) pendingPayload.idNumber = Number(selectedIdNumber);
      if (selectedLnCode) pendingPayload.lnItemCode = selectedLnCode;
      if (statusFilter !== "") pendingPayload.statusId = Number(statusFilter);
      return pendingPayload;
    }

    const activeDrawingNo = selectedDrawingNo || debouncedDrawingNo;
    const activeLnCode = selectedLnCode || debouncedLnItemCode;
    const activePoNumber = selectedPoNumber || debouncedPoNumber;
    const activeIdNumber = selectedIdNumber || debouncedIdNumber.trim();

    const payload: any = {
      drawingNumberId: selectedDrawingId || null,
      drawingNumber: activeDrawingNo || null,
      lnItemCodeId: selectedLnCodeId || null,
      lnItemCode: activeLnCode || null,
      prodSeriesId: selectedSeriesId || null,
      productionSeries: selectedSeries ? selectedSeries.trim() : null,
      poNumber: activePoNumber || null,
      idNumber: activeIdNumber || null,
      statusId: statusFilter !== "" ? Number(statusFilter) : null,
      precheckStatus: statusFilter !== "" ? statusFilter : null,
      roleId: roleId !== undefined ? roleId : null,
    };

    if (dateFilterMode === "single" && filterDate) {
      payload.dateFilterType = "single";
      payload.filterDate = format(filterDate, "yyyy-MM-dd");
    } else if (dateFilterMode === "range" && fromDate && toDate) {
      payload.dateFilterType = "range";
      payload.fromDate = format(fromDate, "yyyy-MM-dd");
      payload.toDate = format(toDate, "yyyy-MM-dd");
    }

    return payload;
  };

  // Check if at least one filter is active for Pending Precheck tab (strictly dropdown selection)
  const hasPendingFilters = !!(
    selectedDrawingId ||
    selectedDrawingNo ||
    selectedSeriesId ||
    selectedSeries ||
    selectedPoNumber ||
    selectedIdNumber ||
    selectedLnCodeId ||
    selectedLnCode ||
    statusFilter !== ""
  );

  // Fetch production orders with filters using POST /api/Precheck/PendingPrecheck (or fallback)
  const {
    data: productionOrders,
    isFetching: isHistoryFetching,
    refetch,
  } = useQuery<ProductionOrder[]>({
    queryKey: [
      "productionOrders",
      dateFilterMode,
      filterDate,
      fromDate,
      toDate,
      statusFilter,
      selectedPoNumber,
      selectedIdNumber,
      selectedLnCodeId,
      selectedLnCode,
      selectedDrawingId,
      selectedDrawingNo,
      selectedSeriesId,
      selectedSeries,
      debouncedPoNumber,
      debouncedIdNumber,
      debouncedLnItemCode,
      debouncedDrawingNo,
      roleId,
      roleType,
    ],
    enabled: roleType !== "Pending Precheck" || hasPendingFilters,
    staleTime: 0,
    gcTime: 0,
    queryFn: async () => {
      const payload = buildPayloadOrParams();
      if (roleType === "Pending Precheck") {
        const response = await api.post("/api/Precheck/PendingPrecheck", payload);
        const rawData = Array.isArray(response.data) ? response.data : response.data?.data || [];
        const flattenedRows: any[] = [];
        let counter = 1;

        rawData.forEach((item: any) => {
          const pendingList = Array.isArray(item.pendingIdNumbers) ? item.pendingIdNumbers : [];

          if (pendingList.length > 0) {
            pendingList.forEach((pendingObj: any) => {
              const childs = Array.isArray(pendingObj?.childs) ? pendingObj.childs : [];

              if (childs.length > 0) {
                childs.forEach((child: any) => {
                  const statusVal = child.precheckStatus === "Updated"
                    ? "Partial"
                    : (child.precheckStatus || "Pending");

                  flattenedRows.push({
                    ...item,
                    ...child,
                    rootDrawingNumber: item.drawingNumber,
                    rootLnItemCode: item.lnItemCode,
                    rootProductionSeries: item.productionSeries,
                    id: child.precheckDetailsId || child.id || `${item.id || item.productionOrderNumber}-${pendingObj.idNumber || pendingObj}-${counter}`,
                    idNumber: child.idNumber ?? pendingObj.idNumber ?? pendingObj,
                    productionOrderNumber: child.productionOrderNumber || item.productionOrderNumber,
                    drawingNumber: child.drawingNumber || item.drawingNumber,
                    lnItemCode: child.lnItemCode || item.lnItemCode,
                    productionSeries: child.productionSeries || item.productionSeries,
                    quantity: child.quantity ?? item.quantity,
                    buildNumber: child.buildNumber ?? item.buildNumber,
                    remainingQuantity: child.remainingQuantity ?? item.remainingQuantity,
                    createdDate: child.createdDate || item.createdDate,
                    precheckStatus: statusVal,
                    precheckStatusName: statusVal,
                  });
                  counter++;
                });
              } else {
                const pId = typeof pendingObj === "object" ? (pendingObj.idNumber ?? pendingObj.id) : pendingObj;
                const pStatus = item.precheckStatusName || (item.precheckStatus === 2 || item.precheckStatus === "2" ? "Partial" : "Pending");
                flattenedRows.push({
                  ...item,
                  id: `${item.id || item.productionOrderNumber}-${pId || counter}`,
                  idNumber: pId,
                  productionOrderNumber: item.productionOrderNumber || item.poNumber,
                  drawingNumber: item.drawingNumber,
                  lnItemCode: item.lnItemCode,
                  productionSeries: item.productionSeries,
                  quantity: item.quantity,
                  buildNumber: item.buildNumber,
                  remainingQuantity: item.remainingQuantity,
                  createdDate: item.createdDate,
                  precheckStatus: pStatus,
                  precheckStatusName: pStatus,
                });
                counter++;
              }
            });
          } else {
            const pStatus = item.precheckStatusName || (item.precheckStatus === 2 || item.precheckStatus === "2" ? "Partial" : "Pending");
            flattenedRows.push({
              ...item,
              id: item.id || item.precheckDetailsId || `${item.productionOrderNumber}-${counter}`,
              idNumber: item.idNumber ?? item.startIdNumber ?? "-",
              productionOrderNumber: item.productionOrderNumber || item.poNumber,
              drawingNumber: item.drawingNumber,
              lnItemCode: item.lnItemCode,
              productionSeries: item.productionSeries,
              quantity: item.quantity,
              buildNumber: item.buildNumber,
              remainingQuantity: item.remainingQuantity,
              createdDate: item.createdDate,
              precheckStatus: pStatus,
              precheckStatusName: pStatus,
            });
            counter++;
          }
        });

        return flattenedRows;
      }

      // For QC and Store tabs, fetch from /api/ProductionOrder/GetAllPo
      const params: any = {};
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== null && v !== undefined) params[k] = v;
      });
      const response = await api.get("/api/ProductionOrder/GetAllPo", {
        params,
      });
      return response.data;
    },
  });

  // Fetch status counts with filters
  const { data: statusCounts, isFetching: isCountsFetching } =
    useQuery<StatusCount>({
      queryKey: [
        "productionOrderCounts",
        dateFilterMode,
        filterDate,
        fromDate,
        toDate,
        statusFilter,
        selectedPoNumber,
        selectedIdNumber,
        selectedDrawingId,
        selectedDrawingNo,
        selectedLnCodeId,
        selectedLnCode,
        selectedSeriesId,
        selectedSeries,
        debouncedPoNumber,
        debouncedIdNumber,
        debouncedLnItemCode,
        debouncedDrawingNo,
        roleId,
        roleType,
      ],
      enabled: roleType !== "Pending Precheck",
      staleTime: 0,
      gcTime: 0,
      queryFn: async () => {
        const payload = buildPayloadOrParams();
        const params: any = {};
        Object.entries(payload).forEach(([k, v]) => {
          if (v !== null && v !== undefined && v !== "") params[k] = v;
        });
        const response = await api.get("/api/ProductionOrder/GetCounts", {
          params,
        });
        return response.data;
      },
    });

  const isDataLoading = isHistoryFetching || isCountsFetching;

  const counts: StatusCount = React.useMemo(() => {
    if (roleType === "Pending Precheck") {
      const rows = productionOrders || [];
      let pending = 0;
      let partial = 0;

      rows.forEach((row: any) => {
        const st = String(row.precheckStatus || "").toLowerCase();
        if (
          st === "partial" ||
          st === "updated" ||
          st === "2" ||
          row.precheckStatus === 2
        ) {
          partial++;
        } else {
          pending++;
        }
      });

      return {
        totalCount: rows.length,
        pendingCount: pending,
        partialCount: partial,
        completedCount: 0,
      };
    }

    return statusCounts ?? {
      totalCount: 0,
      pendingCount: 0,
      partialCount: 0,
      completedCount: 0,
    };
  }, [roleType, productionOrders, statusCounts]);

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

  // Use server-side query results directly without any client-side re-filtering
  const filteredRows = productionOrders || [];

  const handleRefresh = () => {
    setFilterModel({ items: [] });
    refetch();
  };

  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleOpenExportDialog = () => {
    setExportDialogOpen(true);
  };

  const handleCloseExportDialog = () => {
    if (!isExporting) {
      setExportDialogOpen(false);
    }
  };

  const handleConfirmExport = async () => {
    setIsExporting(true);
    try {
      const payload = buildPayloadOrParams();

      let response;
      let fileName = "Production_Order_Data.xlsx";

      if (roleType === "Pending Precheck") {
        const exportPayload: any = { ...payload };
        if (exportPayload.drawingNumber !== undefined) {
          exportPayload.assemblyDrawingNumberId = exportPayload.drawingNumber;
          delete exportPayload.drawingNumber;
        }

        response = await api.post(
          "/api/Precheck/ExportPendingPrecheck",
          exportPayload,
          {
            responseType: "blob",
          },
        );
        fileName = "Pending_Precheck_Export.xlsx";
      } else {
        response = await api.get("/api/ProductionOrder/Export", {
          params: payload,
          responseType: "blob",
        });
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showSnackbar("Data exported successfully!");
      setExportDialogOpen(false);
    } catch (error) {
      console.error("Error Exporting Data:", error);
      showSnackbar("Failed to Export Data. Please try again.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => {
    handleOpenExportDialog();
  };

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

  const pendingPrecheckColumns: GridColDef[] = [
    {
      field: "sr",
      headerName: "Sr No",
      width: 60,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "productionOrderNumber",
      headerName: "Assembly PO Number",
      flex: 1,
      minWidth: 120,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Tooltip title={params.value || ""}>
          <Chip
            label={params.value || "-"}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Tooltip>
      ),
    },
    {
      field: "idNumber",
      headerName: "Assembly ID No",
      flex: 0.7,
      minWidth: 90,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => params.value ?? "-",
    },
    {
      field: "drawingNumber",
      headerName: "Drawing Number",
      flex: 1.2,
      minWidth: 180,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "lnItemCode",
      headerName: "LN Item Code",
      flex: 1,
      minWidth: 150,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "productionSeries",
      headerName: "Prod Series",
      flex: 0.7,
      minWidth: 80,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "quantity",
      headerName: "Qty",
      flex: 0.5,
      minWidth: 60,
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
      renderCell: (params) => params.value || "-",
    },
    {
      field: "mrirNumber",
      headerName: "MRIR No",
      flex: 0.8,
      minWidth: 120,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => params.value || "-",
    },
    {
      field: "remainingQuantity",
      headerName: "Remaining Qty",
      flex: 0.7,
      minWidth: 100,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (params.value !== undefined && params.value !== null ? params.value : "-"),
    },
    {
      field: "createdDate",
      headerName: "Created Date",
      flex: 1,
      minWidth: 130,
      headerAlign: "center",
      align: "center",
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: "precheckStatus",
      headerName: "Status",
      flex: 0.8,
      headerAlign: "center",
      align: "center",
      minWidth: 100,
      renderCell: (params) => {
        let statusStr = String(params.value || "Pending");
        if (statusStr.toLowerCase() === "updated") {
          statusStr = "Partial";
        }
        const isCompleted = statusStr.toLowerCase() === "completed" || statusStr === "3";
        const isPartial = statusStr.toLowerCase() === "partial" || statusStr === "2";
        const color = isCompleted ? "success" : isPartial ? "warning" : "error";

        return (
          <Chip
            label={statusStr}
            size="small"
            color={color}
            variant="filled"
          />
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      minWidth: 100,
      sortable: false,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const hasViewAccess = isPageAccessible(pageAccessData, "View Order Details");
        const hasMakeAccess = isPageAccessible(pageAccessData, "Make Precheck");

        const navState = {
          ...params.row,
          drawingNumber: params.row.rootDrawingNumber,
          lnItemCode: params.row.rootLnItemCode,
          productionSeries: params.row.rootProductionSeries,
          idNumber: params.row.idNumber,
        };

        return (
          <Box
            sx={{
              display: "flex",
              gap: 0.5,
              justifyContent: "center",
              width: "100%",
              "& .MuiIconButton-root": {
                outline: "none",
              },
            }}
          >
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
                    navigate("/production-order/view", { state: navState })
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
                    navigate("/precheck/make", { state: navState })
                  }
                  disabled={!hasMakeAccess}
                >
                  <PlaylistAddCheckIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  const historyColumns: GridColDef[] = [
    {
      field: "sr",
      headerName: "Sr No",
      width: 20,
    },
    {
      field: "productionOrderNumber",
      headerName: "PO Number",
      flex: 1,
      minWidth: 120,
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
    },
    {
      field: "lnItemCode",
      headerName: "LN Item Code",
      flex: 1,
      minWidth: 160,
    },
    {
      field: "drawingNumber",
      headerName: "Drawing Number",
      flex: 1,
      minWidth: 200,
    },
    {
      field: "productionSeries",
      headerName: "Prod Series",
      flex: 0.7,
      minWidth: 70,
    },
    {
      field: "startIdNumber",
      headerName: "Start ID",
      flex: 0.7,
      minWidth: 60,
    },
    {
      field: "endIdNumber",
      headerName: "End ID",
      flex: 0.7,
      minWidth: 60,
    },
    // {
    //   field: "pendingIdNumbersText",
    //   headerName: "Pending IDs",
    //   flex: 0.6,
    //   minWidth: 80,
    //   renderCell: (params) => {
    //     const list = params.row.pendingIdNumbers;
    //     if (!Array.isArray(list) || list.length === 0) return "-";
    //     return <PendingIdDropdown ids={list} />;
    //   },
    // },
    {
      field: "quantity",
      headerName: "Qty",
      flex: 0.5,
      minWidth: 40,
    },
    {
      field: "buildNumber",
      headerName: "Build No",
      flex: 0.8,
      minWidth: 90,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => params.value || "-",
    },
    {
      field: "mrirNumber",
      headerName: "MRIR No",
      flex: 0.8,
      minWidth: 120,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => params.value || "-",
    },
    {
      field: "precheckStatus",
      headerName: "Status",
      flex: 1,
      align: "center",
      minWidth: 90,
      renderCell: (params) => {
        const status = params.value || 1;
        const statusName = params.row.precheckStatusName || "Pending";
        const color =
          status === 3 ? "success" : status === 2 ? "warning" : "error";
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
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: "lastModifiedDate",
      headerName: "Modified Date",
      flex: 1.2,
      minWidth: 90,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: "days",
      headerName: "Aging Days",
      flex: 0.7,
      minWidth: 80,
      align: "center",

      valueGetter: (params) => {
        if (!params.row.modifiedDate) return "-";

        const modified = new Date(params.row.modifiedDate);
        const today = new Date();

        const diffTime = today.getTime() - modified.getTime();

        const diffDays = Math.floor(
          diffTime / (1000 * 60 * 60 * 24)
        );

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

  const filterProps = {
    roleType,
    dateFilterMode,
    setDateFilterMode,
    filterDate,
    setFilterDate,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    statusFilter,
    setStatusFilter,
    poNumber,
    setPoNumber,
    selectedPoNumber,
    setSelectedPoNumber,
    idNumber,
    setIdNumber,
    selectedIdNumber,
    setSelectedIdNumber,
    lnItemCode,
    setLnItemCode,
    drawingNo,
    setDrawingNo,
    selectedDrawingId,
    setSelectedDrawingId,
    selectedDrawingNo,
    setSelectedDrawingNo,
    selectedLnCodeId,
    setSelectedLnCodeId,
    selectedLnCode,
    setSelectedLnCode,
    selectedSeriesId,
    setSelectedSeriesId,
    selectedSeries,
    setSelectedSeries,
    resetKey,
    setResetKey,
    drawingNumbersList,
    isDrawingsLoading,
    lnItemCodesList,
    productionSeriesList,
    poObjectsList,
    lnDrawingOptions,
    calculatedIdNumbersList,
    filterModel,
    setFilterModel,
  };

  const commonTableProps = {
    productionOrders: filteredRows,
    isLoading: isDataLoading,
    counts,
    onRefresh: handleRefresh,
    onExport: handleExportExcel,
    filters: filterProps,
    columns: roleType === "Pending Precheck" ? pendingPrecheckColumns : historyColumns,
  };

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
        sx={{ mb: 0.25 }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          {/* Heading */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: "primary.main",
              fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.5rem" },
            }}
          >
            Pending For Precheck
          </Typography>

          {/* Toggle Buttons */}
          <ToggleButtonGroup
            value={roleType}
            exclusive
            onChange={(_, newValue) => {
              if (newValue === "QC") {
                navigate("/precheck/pending/qc");
              } else if (newValue === "Store") {
                navigate("/precheck/pending/store");
              } else if (newValue === "Pending Precheck") {
                navigate("/production-order/pending-for-precheck");
              }
            }}
            size="small"
            color="primary"
            sx={{
              gap: 1,
              "& .MuiToggleButton-root": {
                minWidth: 120,
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 1.5,
                borderColor: "divider",
                "&.Mui-selected": {
                  color: "#A8005A",
                  backgroundColor: "rgba(168, 0, 90, 0.12)",
                  borderColor: "#A8005A",
                  boxShadow: "0 2px 6px rgba(168, 0, 90, 0.25)",
                },
                "&.Mui-selected:hover": {
                  backgroundColor: "rgba(168, 0, 90, 0.16)",
                },
              },
            }}
          >
            <ToggleButton value="QC">QC</ToggleButton>
            <ToggleButton value="Store">Store</ToggleButton>
            <ToggleButton value="Pending Precheck">Pending Precheck</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Refresh & Export Buttons */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<DownloadIcon />}
            onClick={handleExportExcel}
            size="small"
          >
            Export
          </Button>
        </Box>
      </Stack>

      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <CommonTable {...commonTableProps} />
      </Box>

      {/* Styled Export Confirmation Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={handleCloseExportDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            boxShadow: "0 16px 40px rgba(168, 0, 90, 0.2)",
            border: "1px solid rgba(168, 0, 90, 0.12)",
          },
        }}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: "blur(4px)",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
            },
          },
        }}
      >
        <DialogContent sx={{ pt: 3, pb: 1, textCenter: "center" }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            {/* <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: "rgba(168, 0, 90, 0.1)",
                color: "#A8005A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DownloadIcon sx={{ fontSize: 30 }} />
            </Box> */}

            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "text.primary",
                textAlign: "center",
                fontSize: "1.15rem",
              }}
            >
              Export Production Order Data
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                textAlign: "center",
                px: 1,
                fontSize: "0.875rem",
                lineHeight: 1.5,
              }}
            >
              Do you want to export the Production Order data?
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
            pt: 2,
            justifyContent: "center",
            gap: 1.5,
          }}
        >
          <Button
            variant="outlined"
            size="small"
            onClick={handleCloseExportDialog}
            disabled={isExporting}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 0.75,
              textTransform: "none",
              fontWeight: 600,
              borderColor: "divider",
              color: "text.secondary",
              "&:hover": {
                borderColor: "grey.400",
                backgroundColor: "action.hover",
              },
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            size="small"
            onClick={handleConfirmExport}
            disabled={isExporting}
            startIcon={
              isExporting ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <DownloadIcon />
              )
            }
            sx={{
              borderRadius: 2,
              px: 3,
              py: 0.75,
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: "#A8005A",
              boxShadow: "0 4px 12px rgba(168, 0, 90, 0.3)",
              "&:hover": {
                backgroundColor: "#880048",
                boxShadow: "0 6px 16px rgba(168, 0, 90, 0.4)",
              },
            }}
          >
            {isExporting ? "Exporting..." : "Confirm Export"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

interface CommonTableProps {
  productionOrders: ProductionOrder[];
  isLoading: boolean;
  counts: StatusCount;
  onRefresh: () => void;
  onExport: () => void;
  columns: GridColDef[];
  filters: {
    roleType: string;
    dateFilterMode: "single" | "range";
    setDateFilterMode: (mode: "single" | "range") => void;
    filterDate: Date | null;
    setFilterDate: (date: Date | null) => void;
    fromDate: Date | null;
    setFromDate: (date: Date | null) => void;
    toDate: Date | null;
    setToDate: (date: Date | null) => void;
    statusFilter: number | "";
    setStatusFilter: (status: number | "") => void;
    poNumber: string;
    setPoNumber: (val: string) => void;
    selectedPoNumber: string;
    setSelectedPoNumber: (val: string) => void;
    idNumber: string;
    setIdNumber: (val: string) => void;
    selectedIdNumber: string;
    setSelectedIdNumber: (val: string) => void;
    lnItemCode: string;
    setLnItemCode: (val: string) => void;
    drawingNo: string;
    setDrawingNo: (val: string) => void;
    selectedDrawingId: number | null;
    setSelectedDrawingId: (id: number | null) => void;
    selectedDrawingNo: string;
    setSelectedDrawingNo: (val: string) => void;
    selectedLnCodeId: number | null;
    setSelectedLnCodeId: (id: number | null) => void;
    selectedLnCode: string;
    setSelectedLnCode: (val: string) => void;
    selectedSeriesId: number | null;
    setSelectedSeriesId: (id: number | null) => void;
    selectedSeries: string;
    setSelectedSeries: (val: string) => void;
    resetKey: number;
    setResetKey: React.Dispatch<React.SetStateAction<number>>;
    drawingNumbersList: any[];
    isDrawingsLoading: boolean;
    lnItemCodesList: any[];
    productionSeriesList: any[];
    poObjectsList: any[];
    lnDrawingOptions: any[];
    calculatedIdNumbersList: any[];
    filterModel: GridFilterModel;
    setFilterModel: (model: GridFilterModel) => void;
  };
}

const CommonTable: React.FC<CommonTableProps> = ({
  productionOrders,
  isLoading,
  counts,
  onRefresh,
  columns,
  filters,
}) => {
  const isPendingPrecheck = filters.roleType === "Pending Precheck";

  const hasActiveFilters = !!(
    (filters.dateFilterMode === "single" && filters.filterDate) ||
    (filters.dateFilterMode === "range" && (filters.fromDate || filters.toDate)) ||
    filters.statusFilter !== "" ||
    filters.poNumber.trim() ||
    filters.idNumber?.trim() ||
    filters.lnItemCode.trim() ||
    filters.drawingNo.trim() ||
    filters.selectedDrawingId ||
    filters.selectedDrawingNo ||
    filters.selectedLnCodeId ||
    filters.selectedLnCode ||
    filters.selectedSeriesId ||
    filters.selectedSeries
  );

  const autosizedColumns = React.useMemo(() => {
    if (isPendingPrecheck) return columns;
    const rows = isLoading
      ? []
      : (productionOrders || []).map((item, index) => ({
        ...item,
        sr: index + 1,
      }));
    return getAutosizedColumns(columns, rows);
  }, [columns, productionOrders, isLoading, isPendingPrecheck]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Paper elevation={1} sx={{ p: 0.75, mb: 0.25, width: "100%" }}>
          <Stack
            direction="row"
            spacing={1}
            flexWrap="nowrap"
            alignItems="center"
            sx={{ width: "100%" }}
          >
            {isPendingPrecheck ? (
              <>
                {/* Drawing No Dropdown Filter */}
                <Autocomplete
                  key={`dwg-${filters.resetKey}`}
                  size="small"
                  sx={{ flex: 1.2, minWidth: 130 }}
                  options={filters.drawingNumbersList || []}
                  loading={filters.isDrawingsLoading}
                  noOptionsText={
                    filters.isDrawingsLoading
                      ? "Loading drawing numbers..."
                      : "No drawing numbers found"
                  }
                  filterOptions={(options, { inputValue }) => {
                    if (!inputValue || inputValue.length < 2) return options.slice(0, 100);
                    const searchLower = inputValue.toLowerCase();
                    return options
                      .filter((opt: any) => {
                        const label = typeof opt === "string" ? opt : opt.drawingNumber || "";
                        return label.toLowerCase().includes(searchLower);
                      })
                      .slice(0, 100);
                  }}
                  getOptionLabel={(option: any) =>
                    typeof option === "string" ? option : option.drawingNumber || ""
                  }
                  isOptionEqualToValue={(option: any, value: any) => {
                    const optId = typeof option === "string" ? option : option.id;
                    const valId = typeof value === "string" ? value : value.id;
                    return optId === valId;
                  }}
                  value={
                    filters.drawingNumbersList?.find(
                      (d: any) =>
                        (filters.selectedDrawingId && d.id === filters.selectedDrawingId) ||
                        (filters.selectedDrawingNo && d.drawingNumber === filters.selectedDrawingNo)
                    ) || (filters.selectedDrawingNo ? { id: 0, drawingNumber: filters.selectedDrawingNo } : null)
                  }
                  onInputChange={(_, newInputValue, reason) => {
                    filters.setDrawingNo(newInputValue || "");
                    if (reason === "clear" || !newInputValue) {
                      filters.setSelectedDrawingId(null);
                      filters.setSelectedDrawingNo("");
                    }
                  }}
                  onChange={(_, newValue: any) => {
                    if (!newValue) {
                      filters.setSelectedDrawingId(null);
                      filters.setSelectedDrawingNo("");
                      filters.setDrawingNo("");
                    } else if (typeof newValue === "string") {
                      filters.setSelectedDrawingId(null);
                      filters.setSelectedDrawingNo(newValue);
                      filters.setDrawingNo(newValue);
                    } else {
                      filters.setSelectedDrawingId(newValue.id || null);
                      filters.setSelectedDrawingNo(newValue.drawingNumber || "");
                      filters.setDrawingNo(newValue.drawingNumber || "");
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Assembly Drawing Number"
                      variant="outlined"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {filters.isDrawingsLoading ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />

                {/* LN Item Code Dropdown Filter */}
                <Autocomplete
                  key={`ln-${filters.resetKey}`}
                  size="small"
                  sx={{ flex: 1, minWidth: 120 }}
                  options={filters.lnDrawingOptions || filters.lnItemCodesList || []}
                  filterOptions={(options, { inputValue }) => {
                    if (!inputValue) return options.slice(0, 100);
                    const searchLower = inputValue.toLowerCase();
                    return options
                      .filter((opt: any) => {
                        const code = typeof opt === "string" ? opt : opt.lnItemCode || opt.code || "";
                        const dwg = typeof opt === "string" ? "" : opt.drawingNumber || "";
                        return code.toLowerCase().includes(searchLower) || dwg.toLowerCase().includes(searchLower);
                      })
                      .slice(0, 100);
                  }}
                  getOptionLabel={(option: any) =>
                    typeof option === "string" ? option : option.lnItemCode || option.code || ""
                  }
                  isOptionEqualToValue={(option: any, value: any) => {
                    const optCode = typeof option === "string" ? option : option.lnItemCode || option.code;
                    const valCode = typeof value === "string" ? value : value.lnItemCode || value.code;
                    return optCode?.toLowerCase() === valCode?.toLowerCase();
                  }}
                  value={
                    (filters.lnDrawingOptions || []).find(
                      (item: any) =>
                        (filters.selectedLnCodeId && item.id === filters.selectedLnCodeId) ||
                        (filters.selectedLnCode && item.lnItemCode?.toLowerCase() === filters.selectedLnCode.toLowerCase())
                    ) || (filters.selectedLnCode ? filters.selectedLnCode : null)
                  }
                  onInputChange={(_, newInputValue, reason) => {
                    filters.setLnItemCode(newInputValue || "");
                    if (reason === "clear" || !newInputValue) {
                      filters.setSelectedLnCodeId(null);
                      filters.setSelectedLnCode("");
                    }
                  }}
                  onChange={(_, newValue: any) => {
                    if (!newValue) {
                      filters.setSelectedLnCodeId(null);
                      filters.setSelectedLnCode("");
                      filters.setLnItemCode("");
                    } else if (typeof newValue === "string") {
                      filters.setSelectedLnCodeId(null);
                      filters.setSelectedLnCode(newValue);
                      filters.setLnItemCode(newValue);
                    } else {
                      filters.setSelectedLnCodeId(newValue.id || null);
                      const code = newValue.lnItemCode || newValue.code || "";
                      filters.setSelectedLnCode(code);
                      filters.setLnItemCode(code);
                    }
                  }}
                  renderOption={(props, option: any) => {
                    const { key, ...optionProps } = props;
                    const code = typeof option === "string" ? option : option.lnItemCode || option.code || "";
                    const dwg = typeof option === "string" ? "" : option.drawingNumber && option.drawingNumber !== "N/A" ? option.drawingNumber : "";
                    const nomenclature = typeof option === "string" ? "" : option.nomenclature || option.itemDescription || "";

                    return (
                      <Box
                        component="li"
                        key={key || code}
                        {...optionProps}
                        sx={{
                          display: "flex !important",
                          flexDirection: "column !important",
                          alignItems: "flex-start !important",
                          textAlign: "left !important",
                          width: "100%",
                          py: 0.5,
                          px: 1.5,
                          borderBottom: "1px solid #f0f0f0",
                          "&:last-child": { borderBottom: "none" },
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", textAlign: "left", width: "100%" }}>
                          {code}
                        </Typography>
                        {(dwg || nomenclature) && (
                          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.75rem", textAlign: "left", width: "100%" }}>
                            {dwg ? `Drawing: ${dwg}` : ""} {dwg && nomenclature ? "|" : ""} {nomenclature}
                          </Typography>
                        )}
                      </Box>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="LN Item Code" variant="outlined" />
                  )}
                />

                {/* Prod Series Dropdown Filter */}
                <Autocomplete
                  key={`series-${filters.resetKey}`}
                  size="small"
                  sx={{ flex: 0.8, minWidth: 100 }}
                  options={filters.productionSeriesList || []}
                  getOptionLabel={(option: any) =>
                    typeof option === "string" ? option : option.productionSeries || option.seriesName || ""
                  }
                  value={
                    filters.productionSeriesList?.find(
                      (s: any) =>
                        (filters.selectedSeriesId && s.id === filters.selectedSeriesId) ||
                        (filters.selectedSeries && s.productionSeries === filters.selectedSeries)
                    ) || (filters.selectedSeries ? { id: 0, productionSeries: filters.selectedSeries } : null)
                  }
                  onChange={(_, newValue: any) => {
                    if (!newValue) {
                      filters.setSelectedSeriesId(null);
                      filters.setSelectedSeries("");
                    } else if (typeof newValue === "string") {
                      filters.setSelectedSeriesId(null);
                      filters.setSelectedSeries(newValue);
                    } else {
                      filters.setSelectedSeriesId(newValue.id || null);
                      filters.setSelectedSeries(newValue.productionSeries || newValue.seriesName || "");
                    }
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Prod Series" variant="outlined" />
                  )}
                />

                {/* PO Number Dropdown Filter */}
                <Autocomplete
                  key={`po-${filters.resetKey}`}
                  forcePopupIcon={true}
                  freeSolo
                  size="small"
                  sx={{ flex: 1, minWidth: 120 }}
                  options={filters.poObjectsList || []}
                  filterOptions={(options, { inputValue }) => {
                    if (!inputValue) return options.slice(0, 100);
                    const searchLower = inputValue.toLowerCase();
                    return options
                      .filter((opt: any) => {
                        const poNum = typeof opt === "string" ? opt : opt.productionOrderNumber || opt.poNumber || "";
                        return poNum.toLowerCase().includes(searchLower);
                      })
                      .slice(0, 100);
                  }}
                  getOptionLabel={(option: any) =>
                    typeof option === "string"
                      ? option
                      : option.productionOrderNumber || option.poNumber || ""
                  }
                  isOptionEqualToValue={(option: any, value: any) => {
                    const optVal = typeof option === "string" ? option : option.productionOrderNumber || option.poNumber;
                    const valVal = typeof value === "string" ? value : value.productionOrderNumber || value.poNumber;
                    return optVal === valVal;
                  }}
                  value={
                    filters.poObjectsList?.find(
                      (item: any) =>
                        (item.productionOrderNumber || item.poNumber) === (filters.selectedPoNumber || filters.poNumber)
                    ) || (filters.selectedPoNumber || filters.poNumber ? (filters.selectedPoNumber || filters.poNumber) : null)
                  }
                  onInputChange={(_, newInputValue) => {
                    filters.setPoNumber(newInputValue || "");
                    if (!newInputValue) {
                      filters.setSelectedPoNumber("");
                      filters.setIdNumber("");
                      filters.setSelectedIdNumber("");
                    }
                  }}
                  onChange={(_, newValue: any) => {
                    if (!newValue) {
                      filters.setPoNumber("");
                      filters.setSelectedPoNumber("");
                      filters.setIdNumber("");
                      filters.setSelectedIdNumber("");
                    } else if (typeof newValue === "string") {
                      filters.setPoNumber(newValue);
                      filters.setSelectedPoNumber(newValue);
                      filters.setIdNumber("");
                      filters.setSelectedIdNumber("");
                    } else {
                      const selectedPo = newValue.productionOrderNumber || newValue.poNumber || "";
                      filters.setPoNumber(selectedPo);
                      filters.setSelectedPoNumber(selectedPo);
                      filters.setIdNumber("");
                      filters.setSelectedIdNumber("");
                    }
                  }}
                  renderOption={(props, option: any) => {
                    const { key, ...optionProps } = props;
                    const poNum = typeof option === "string" ? option : option.productionOrderNumber || option.poNumber || "";
                    const lnCode = typeof option === "string" ? "" : option.lnItemCode || "-";
                    const dwg = typeof option === "string" ? "" : option.drawingNumber || "-";
                    const nomenclature = typeof option === "string" ? "" : option.nomenclature || option.itemDescription || "-";
                    const compType = typeof option === "string" ? "" : option.componentType || "-";

                    return (
                      <Box
                        component="li"
                        key={key || poNum}
                        {...optionProps}
                        sx={{
                          display: "flex !important",
                          flexDirection: "column !important",
                          alignItems: "flex-start !important",
                          textAlign: "left !important",
                          width: "100%",
                          py: 0.75,
                          px: 1.5,
                          borderBottom: "1px solid #f0f0f0",
                          "&:last-child": { borderBottom: "none" },
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 700,
                            color: "#A8005A",
                            fontSize: "0.875rem",
                            mb: 0.25,
                            textAlign: "left",
                            width: "100%",
                          }}
                        >
                          PO: {poNum}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            fontSize: "0.75rem",
                            lineHeight: 1.4,
                            wordBreak: "break-word",
                            textAlign: "left",
                            width: "100%",
                          }}
                        >
                          LN: {lnCode} | Drawing: {dwg} | Nomenclature: {nomenclature} | Component Type: {compType}
                        </Typography>
                      </Box>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="PO Number" variant="outlined" />
                  )}
                />

                {/* ID Number Dropdown Filter */}
                <Autocomplete
                  key={`id-${filters.resetKey}`}
                  forcePopupIcon={true}
                  freeSolo
                  size="small"
                  sx={{ flex: 0.8, minWidth: 90 }}
                  options={filters.calculatedIdNumbersList || []}
                  filterOptions={(options, { inputValue }) => {
                    if (!inputValue) return options.slice(0, 100);
                    const searchLower = inputValue.toLowerCase();
                    return options
                      .filter((opt: any) => String(opt).toLowerCase().includes(searchLower))
                      .slice(0, 100);
                  }}
                  value={filters.selectedIdNumber || filters.idNumber || null}
                  onInputChange={(_, newInputValue) => {
                    filters.setIdNumber(newInputValue || "");
                    if (!newInputValue) {
                      filters.setSelectedIdNumber("");
                    }
                  }}
                  onChange={(_, newValue) => {
                    const val = newValue ? String(newValue) : "";
                    filters.setIdNumber(val);
                    filters.setSelectedIdNumber(val);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="ID Number"
                      variant="outlined"
                    />
                  )}
                />

                {/* Status Dropdown Filter */}
                <FormControl size="small" sx={{ flex: 0.8, minWidth: 90 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.statusFilter}
                    label="Status"
                    onChange={(e) =>
                      filters.setStatusFilter(e.target.value as number | "")
                    }
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value={1}>Pending</MenuItem>
                    <MenuItem value={2}>Partial</MenuItem>
                  </Select>
                </FormControl>
              </>
            ) : (
              <>
                <ToggleButtonGroup
                  value={filters.dateFilterMode}
                  exclusive
                  onChange={(_, newMode) => {
                    if (newMode !== null) {
                      filters.setDateFilterMode(newMode);
                      filters.setFilterDate(null);
                      filters.setFromDate(null);
                      filters.setToDate(null);
                    }
                  }}
                  size="small"
                  sx={{ flexShrink: 0 }}
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

                {filters.dateFilterMode === "single" ? (
                  <>
                    <DatePicker
                      label="Filter Date"
                      value={filters.filterDate}
                      onChange={(newValue) => filters.setFilterDate(newValue)}
                      slotProps={{
                        textField: { size: "small", sx: { flex: 1, minWidth: 120 } },
                      }}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<TodayIcon />}
                      onClick={() => filters.setFilterDate(new Date())}
                      sx={{ flexShrink: 0 }}
                    >
                      Today
                    </Button>
                  </>
                ) : (
                  <>
                    <DatePicker
                      label="From Date"
                      value={filters.fromDate}
                      onChange={(newValue) => filters.setFromDate(newValue)}
                      slotProps={{
                        textField: { size: "small", sx: { flex: 1, minWidth: 120 } },
                      }}
                    />
                    <DatePicker
                      label="To Date"
                      value={filters.toDate}
                      onChange={(newValue) => filters.setToDate(newValue)}
                      slotProps={{
                        textField: { size: "small", sx: { flex: 1, minWidth: 120 } },
                      }}
                    />
                  </>
                )}

                <FormControl size="small" sx={{ flex: 0.8, minWidth: 80 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.statusFilter}
                    label="Status"
                    onChange={(e) =>
                      filters.setStatusFilter(e.target.value as number | "")
                    }
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value={1}>Pending</MenuItem>
                    <MenuItem value={2}>Partial</MenuItem>
                    <MenuItem value={3}>Completed</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="PO Number"
                  variant="outlined"
                  size="small"
                  value={filters.poNumber}
                  onChange={(e) => filters.setPoNumber(e.target.value)}
                  sx={{ flex: 1, minWidth: 90 }}
                />

                <TextField
                  label="LN Item Code"
                  variant="outlined"
                  size="small"
                  value={filters.lnItemCode}
                  onChange={(e) => filters.setLnItemCode(e.target.value)}
                  sx={{ flex: 1, minWidth: 90 }}
                />

                <TextField
                  label="Assembly Drawing Number"
                  variant="outlined"
                  size="small"
                  value={filters.drawingNo}
                  onChange={(e) => filters.setDrawingNo(e.target.value)}
                  sx={{ flex: 1.2, minWidth: 110 }}
                />
              </>
            )}

            {/* Clear Filters Button */}
            <Button
              size="small"
              variant="text"
              color="error"
              disabled={!hasActiveFilters}
              sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
              onClick={() => {
                filters.setFilterDate(null);
                filters.setFromDate(null);
                filters.setToDate(null);
                filters.setStatusFilter("");
                filters.setPoNumber("");
                filters.setSelectedPoNumber("");
                filters.setIdNumber("");
                filters.setSelectedIdNumber("");
                filters.setLnItemCode("");
                filters.setDrawingNo("");
                filters.setSelectedDrawingId(null);
                filters.setSelectedDrawingNo("");
                filters.setSelectedLnCodeId(null);
                filters.setSelectedLnCode("");
                filters.setSelectedSeriesId(null);
                filters.setSelectedSeries("");
                filters.setResetKey((prev) => prev + 1);
              }}
            >
              Clear Filters
            </Button>
          </Stack>
        </Paper>
      </LocalizationProvider>

      {isPendingPrecheck && !hasActiveFilters ? (
        <Paper
          elevation={2}
          sx={{
            flexGrow: 1,
            minHeight: 0,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            py: 8,
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(168,0,90,0.08) 0%, rgba(168,0,90,0.18) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 1,
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill="#A8005A" opacity="0.7" />
            </svg>
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "text.primary",
              fontSize: "1.1rem",
            }}
          >
            Search Pending Prechecks
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              maxWidth: 380,
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            Use the filters above to search by PO Number, Drawing Number, LN Item Code, or Production Series to view pending precheck records.
          </Typography>
        </Paper>
      ) : (
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
            <IconButton onClick={onRefresh} disabled={isLoading} size="small">
              <RefreshIcon fontSize="small" color="primary" />
            </IconButton>
          </Box>
          <DataGrid
            rows={
              isLoading
                ? []
                : (productionOrders || []).map((item, index) => ({
                  ...item,
                  sr: index + 1,
                }))
            }
            columns={autosizedColumns}
            loading={isLoading}
            pageSizeOptions={[5, 10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 50 } },
            }}
            filterModel={filters.filterModel}
            onFilterModelChange={(newModel) => filters.setFilterModel(newModel)}
            disableColumnFilter
            density="compact"
            disableRowSelectionOnClick
            getRowId={(row) => row.sr}
            slots={{
              footer: () => (
                <GridFooterContainer>
                  {!isLoading && (
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
                      {!isPendingPrecheck && (
                        <Chip
                          label={`Completed: ${counts.completedCount}`}
                          size="small"
                          color="success"
                          variant="filled"
                        />
                      )}
                    </Box>
                  )}
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
      )}
    </Box>
  );
};

// const QCView: React.FC<CommonTableProps> = (props) => {
//   return (
//     <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
//       <CommonTable {...props} />
//     </Box>
//   );
// };

// const StoreView: React.FC<CommonTableProps> = (props) => {
//   return (
//     <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
//       <CommonTable {...props} />
//     </Box>
//   );
// };

export default PendingForPrecheck;
