import React, { useState, useMemo, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
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
  Autocomplete,
  CircularProgress,
  IconButton,
  Chip,
  Tabs,
  Tab,
  Stack,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  Grid,
  Collapse,
  InputAdornment,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  FileDownload as FileDownloadIcon,
  QrCode as QrCodeIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Settings as SettingsIcon,
  MoreVert as MoreVertIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  CalendarToday as CalendarTodayIcon,
} from "@mui/icons-material";
import { CustomPagination } from "../../components/CustomPagination";
import { EmptyState } from "../../components/EmptyState";
import { MultiSelectFilter } from "../../components/MultiSelectFilter";
import { COLOUR_ROLES, commonTableRowStyle } from "../../components/tableStyles";
import { SortableTableHeader } from "../../components/SortableTableHeader";
import { ComponentTypeChip } from "../../components/ComponentTypeChip";
import { StatusChip } from "../../components/StatusChip";

import {

  viewPrecheckByParameters,
  exportViewPrecheckDetails,
} from "../../store/slices/precheckSlice";
import {
  getConsumedIn,
  exportConsumedIn,
} from "../../store/slices/qrcodeSlice";
import {
  useProductionSeries,
  useAllDrawingNumbers,
  useAllLnItemCodes,
  useLnItemCodeSearch,
  useDrawingNumbers,
} from "../../hooks/useMasterData";
import {
  usePONumbers,
  type ProductionOrderMaster,
} from "../../hooks/usePONumbers";
import { useDebounce } from "../../hooks/useDebounce";
import type { RootState, AppDispatch } from "../../store/store";

interface ColumnDef {
  field: string;
  headerName: string;
  minWidth?: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

const PRECHECK_COLUMNS: ColumnDef[] = [
  { field: "sr", headerName: "SR", minWidth: 60, align: "center", sortable: true },
  { field: "productionOrderNumber", headerName: "PO Number", minWidth: 140, align: "left", sortable: true },
  { field: "lnItemCode", headerName: "LN Item Code", minWidth: 140, align: "left", sortable: true },
  { field: "drawingNumber", headerName: "Drawing No.", minWidth: 150, align: "left", sortable: true },
  { field: "productionSeries", headerName: "Prod Series", minWidth: 110, align: "center", sortable: true },
  { field: "quantity", headerName: "Qty", minWidth: 70, align: "center", sortable: true },
  { field: "idNumber", headerName: "ID Number", minWidth: 110, align: "center", sortable: true },
  { field: "irNumber", headerName: "IR", minWidth: 100, align: "center", sortable: false },
  { field: "msnNumber", headerName: "MSN", minWidth: 100, align: "center", sortable: false },
  { field: "componentType", headerName: "Type", minWidth: 95, align: "center", sortable: false },
  { field: "status", headerName: "Status", minWidth: 110, align: "center", sortable: false },
  { field: "details", headerName: "Details", minWidth: 80, align: "center", sortable: false },
];

const CONSUMED_IN_COLUMNS: ColumnDef[] = [
  { field: "sr", headerName: "Sr No", minWidth: 60, align: "center", sortable: true },
  { field: "idNumber", headerName: "ID Number", minWidth: 110, align: "center", sortable: true },
  { field: "consumedInDrawingNumber", headerName: "Consumed IN Drawing Number", minWidth: 220, align: "left", sortable: true },
  { field: "quantity", headerName: "Quantity", minWidth: 80, align: "center", sortable: true },
  { field: "poNumber", headerName: "PO Number", minWidth: 140, align: "left", sortable: true },
  { field: "irNumber", headerName: "IR Number", minWidth: 100, align: "center", sortable: false },
  { field: "msnNumber", headerName: "MSN Number", minWidth: 110, align: "center", sortable: false },
  { field: "date", headerName: "Date", minWidth: 140, align: "center", sortable: true },
  { field: "username", headerName: "Username", minWidth: 120, align: "center", sortable: true },
  { field: "isRejected", headerName: "Is Rejected", minWidth: 100, align: "center", sortable: false },
  { field: "rejectionRemarks", headerName: "Remarks", minWidth: 140, align: "left", sortable: false },
];

const ALL_PRECHECK_EXPORT_COLUMNS = [
  { key: "productionOrderNumber", label: "PO Number" },
  { key: "lnItemCode", label: "LN Item Code" },
  { key: "drawingNumber", label: "Drawing No." },
  { key: "productionSeries", label: "Prod Series" },
  { key: "nomenclature", label: "Nomenclature" },
  { key: "quantity", label: "Qty" },
  { key: "idNumber", label: "ID Number" },
  { key: "irNumber", label: "IR Number" },
  { key: "msnNumber", label: "MSN Number" },
  { key: "mrirNumber", label: "MRIR Number" },
  { key: "componentType", label: "Component Type" },
  { key: "status", label: "Status" },
];

const ALL_CONSUMED_EXPORT_COLUMNS = [
  { key: "idNumber", label: "ID Number" },
  { key: "consumedInDrawingNumber", label: "Consumed IN Drawing" },
  { key: "quantity", label: "Quantity" },
  { key: "poNumber", label: "PO Number" },
  { key: "irNumber", label: "IR Number" },
  { key: "msnNumber", label: "MSN Number" },
  { key: "date", label: "Date" },
  { key: "username", label: "Username" },
  { key: "isRejected", label: "Is Rejected" },
  { key: "rejectionRemarks", label: "Remarks" },
];

export const ViewPrecheck: React.FC<{ hideHeader?: boolean }> = ({ hideHeader = false }) => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();

  // ── Active Tab ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"precheck" | "consumed">(
    location.pathname.includes("consumed") ? "consumed" : "precheck"
  );

  // ── Redux & Local Loading States ───────────────────────────────────────────
  const { isLoading: isPrecheckLoading } = useSelector((state: RootState) => state.precheck);
  const { loading: isConsumedLoading, isDownloading } = useSelector((state: RootState) => state.qrcode);
  const [isExportLoading, setIsExportLoading] = useState(false);
  const isExporting = isExportLoading || isDownloading;

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  // ── Precheck tab filter states ─────────────────────────────────────────────
  const [combinedSearch, setCombinedSearch] = useState("");        // PO / Drawing / LN search
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);    // Pending | Partial | Completed
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [fromDateFocused, setFromDateFocused] = useState(false);
  const [toDateFocused, setToDateFocused] = useState(false);

  // ── Consumed tab / shared filter states ───────────────────────────────────
  const [selectedLnItemCode, setSelectedLnItemCode] = useState<string[]>([]);
  const [lnSearchText, setLnSearchText] = useState("");
  const debouncedLnSearch = useDebounce(lnSearchText, 300);
  const [idNumber, setIdNumber] = useState("");
  const [selectedProductionSeries, setSelectedProductionSeries] = useState<string[]>([]);
  const [selectedDrawing, setSelectedDrawing] = useState<string[]>([]);
  const [selectedPO, setSelectedPO] = useState<string[]>([]);

  // ── Master data hooks ──────────────────────────────────────────────────────
  const { data: productionSeriesData = [] } = useProductionSeries();
  const { data: allDrawingNumbers = [] } = useAllDrawingNumbers();
  const { data: allLnItemCodesData = [] } = useAllLnItemCodes();
  const { data: searchedLnCodes = [] } = useLnItemCodeSearch(debouncedLnSearch);

  const [poSearchText, setPOSearchText] = useState("");
  const effectivePoSearch = poSearchText.trim() || (selectedDrawing.length > 0 ? selectedDrawing[0] : "");
  const debouncedPOSearch = useDebounce(effectivePoSearch, 300);
  const { data: assemblyDrawingNumbers = [] } = useDrawingNumbers("", debouncedPOSearch);
  const { data: poNumbers = [] } = usePONumbers(debouncedPOSearch);

  // ── Options Derivation for MultiSelectFilter ────────────────────────────────
  const prodSeriesOptions = useMemo(() => {
    if (!productionSeriesData) return [];
    return productionSeriesData
      .map((item: any) => (typeof item === "string" ? item : item.productionSeries || item.productionSeriesName || item.name))
      .filter(Boolean);
  }, [productionSeriesData]);

  const drawingOptions = useMemo(() => {
    if (!allDrawingNumbers || !Array.isArray(allDrawingNumbers)) return [];
    return allDrawingNumbers;
  }, [allDrawingNumbers]);

  const lnOptions = drawingOptions;

  const poOptions = useMemo(() => {
    if (poNumbers && Array.isArray(poNumbers) && poNumbers.length > 0) return poNumbers;
    return drawingOptions;
  }, [poNumbers, drawingOptions]);

  const consumedAssemblyOptions = useMemo(() => {
    if (selectedDrawing.length > 0) {
      const selectedStr = selectedDrawing[0].trim().toLowerCase();
      const matchedDrawing = (allDrawingNumbers || []).find(
        (d: any) =>
          d.drawingNumber?.trim().toLowerCase() === selectedStr ||
          d.lnItemCode?.trim().toLowerCase() === selectedStr
      );
      if (
        matchedDrawing?.parentDrawingNumbers &&
        Array.isArray(matchedDrawing.parentDrawingNumbers) &&
        matchedDrawing.parentDrawingNumbers.length > 0
      ) {
        return matchedDrawing.parentDrawingNumbers;
      }
    }
    return poOptions;
  }, [selectedDrawing, allDrawingNumbers, poOptions]);

  // ── Row expansion (precheck tab) ───────────────────────────────────────────
  const [expandedRows, setExpandedRows] = useState<Set<number | string>>(new Set());

  const toggleRowExpand = (rowId: number | string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  // ── Results State ──────────────────────────────────────────────────────────
  const [precheckResults, setPrecheckResults] = useState<any[]>([]);
  const [consumedResults, setConsumedResults] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [hasAppliedFilters, setHasAppliedFilters] = useState<boolean>(false);

  // ── Sorting State ──────────────────────────────────────────────────────────
  const [orderBy, setOrderBy] = useState<string>("sr");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  // ── Pagination State ───────────────────────────────────────────────────────
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ── Details Expansion State ────────────────────────────────────────────────

  // ── Export Dialog State & Handlers ─────────────────────────────────────────
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportMode, setExportMode] = useState<"all" | "custom">("all");
  const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>([]);

  const activeExportColumns = useMemo(() => {
    return activeTab === "precheck" ? ALL_PRECHECK_EXPORT_COLUMNS : ALL_CONSUMED_EXPORT_COLUMNS;
  }, [activeTab]);

  const handleOpenExportDialog = () => {
    setSelectedExportColumns(activeExportColumns.map((c) => c.key));
    setExportMode("all");
    setExportDialogOpen(true);
  };

  const handleToggleSelectAllColumns = () => {
    if (selectedExportColumns.length === activeExportColumns.length) {
      setSelectedExportColumns([]);
    } else {
      setSelectedExportColumns(activeExportColumns.map((c) => c.key));
    }
  };

  const handleToggleColumn = (key: string) => {
    setSelectedExportColumns((prev) => {
      const updated = prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key];
      return activeExportColumns.map((c) => c.key).filter((k) => updated.includes(k));
    });
  };

  // ── Format date helper ─────────────────────────────────────────────────────
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
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

  // ── Fetch Precheck Details from API (Using ViewPrechekByParameters) ────────
  const fetchPrecheckData = (
    pNum: number = page + 1,
    pSize: number = rowsPerPage,
    searchOverride?: string,
    seriesOverride?: string[],
    statusOverride?: string[],
    fromDateOverride?: string,
    toDateOverride?: string
  ) => {
    const searchVal = searchOverride !== undefined ? searchOverride : combinedSearch;
    const seriesVal = seriesOverride !== undefined ? seriesOverride : selectedProductionSeries;
    const statusVal = statusOverride !== undefined ? statusOverride : selectedStatus;
    const fromVal = fromDateOverride !== undefined ? fromDateOverride : dateFrom;
    const toVal = toDateOverride !== undefined ? toDateOverride : dateTo;

    const payload: any = {
      pageNumber: pNum,
      pageSize: pSize,
      searchQuery: searchVal.trim(),
      prodSeries: seriesVal,
      status: statusVal,
      fromDate: fromVal ? fromVal : null,
      toDate: toVal ? toVal : null,
    };

    dispatch(viewPrecheckByParameters(payload))
      .then((result: any) => {
        if (result.payload) {
          const rawList = Array.isArray(result.payload)
            ? result.payload
            : result.payload.data || result.payload.items || [];
          const total = Array.isArray(result.payload)
            ? result.payload.length
            : result.payload.totalRecords ?? result.payload.totalCount ?? result.payload.total ?? rawList.length;
          setTotalRecords(total);
          const mapped = rawList.map((item: any, index: number) => ({
            ...item,
            id: item.precheckDetailsId ?? item.id ?? index + 1,
            sr: (pNum - 1) * pSize + index + 1,
            modifiedDate: item.modifiedDate
              ? formatDate(item.modifiedDate)
              : item.createdDate
                ? formatDate(item.createdDate)
                : "",
            rawDate: item.modifiedDate || item.createdDate || "",
          }));
          setPrecheckResults(mapped);
        } else {
          setPrecheckResults([]);
          setTotalRecords(0);
        }
      })
      .catch((err: any) => {
        setPrecheckResults([]);
        setTotalRecords(0);
        const msg = err?.message || err?.response?.data?.message;
        if (msg) {
          setSnackbar({
            open: true,
            message: msg,
            severity: "error",
          });
        }
      });
  };

  const debouncedCombinedSearch = useDebounce(combinedSearch, 400);
  const debouncedIdNumber = useDebounce(idNumber, 400);
  const isInitialSearchRef = useRef(true);

  // Auto-fetch API when user types 3+ characters in precheck search bar or clears search
  useEffect(() => {
    if (isInitialSearchRef.current) {
      isInitialSearchRef.current = false;
      return;
    }
    if (activeTab === "precheck") {
      const trimmed = debouncedCombinedSearch.trim();
      if (trimmed.length >= 3 || (trimmed.length === 0 && precheckResults.length > 0)) {
        if (trimmed.length >= 3) setHasAppliedFilters(true);
        setPage(0);
        fetchPrecheckData(1, rowsPerPage, trimmed);
      }
    }
  }, [debouncedCombinedSearch]);

  // Auto-fetch API when user types 3+ characters in consumed tab idNumber or clears it
  useEffect(() => {
    if (activeTab === "consumed") {
      const trimmed = debouncedIdNumber.trim();
      if (trimmed.length >= 3 || (trimmed.length === 0 && consumedResults.length > 0)) {
        if (trimmed.length >= 3) setHasAppliedFilters(true);
        setPage(0);
        fetchConsumedData();
      }
    }
  }, [debouncedIdNumber]);

  // Auto-populate parent drawing in Assembly No dropdown for Consumed In tab when a drawing is selected
  useEffect(() => {
    if (activeTab === "consumed" && selectedDrawing.length > 0) {
      const selectedStr = selectedDrawing[0].trim().toLowerCase();
      const matchedDrawing = (allDrawingNumbers || []).find(
        (d: any) =>
          d.drawingNumber?.trim().toLowerCase() === selectedStr ||
          d.lnItemCode?.trim().toLowerCase() === selectedStr
      );
      if (
        matchedDrawing?.parentDrawingNumbers &&
        Array.isArray(matchedDrawing.parentDrawingNumbers) &&
        matchedDrawing.parentDrawingNumbers.length > 0
      ) {
        if (selectedPO.length === 0 || !matchedDrawing.parentDrawingNumbers.includes(selectedPO[0])) {
          setSelectedPO([matchedDrawing.parentDrawingNumbers[0]]);
        }
      }
    }
  }, [selectedDrawing, allDrawingNumbers, activeTab]);

  const isPrecheckDropdownSelected = selectedProductionSeries.length > 0 || selectedStatus.length > 0 || !!dateFrom || !!dateTo;
  const isConsumedDropdownSelected = selectedLnItemCode.length > 0 && selectedDrawing.length > 0 && selectedProductionSeries.length > 0;

  // ── Fetch Consumed In Details from API ────────────────────────────────────
  const fetchConsumedData = () => {
    const params: any = {};
    if (selectedProductionSeries.length > 0) {
      params.ProdSeries = selectedProductionSeries;
    }
    if (idNumber.trim()) {
      params.IdNumber = parseInt(idNumber.trim());
    }
    if (selectedDrawing.length > 0) {
      params.DrawingNumber = selectedDrawing[0];
    }
    if (selectedPO.length > 0) {
      params.ProductionOrderNumber = selectedPO[0];
    }
    if (selectedLnItemCode.length > 0) {
      params.LnItemCode = selectedLnItemCode[0];
    }

    dispatch(getConsumedIn(params))
      .then((result: any) => {
        if (result.payload && Array.isArray(result.payload)) {
          const mapped = result.payload.map((item: any, index: number) => ({
            ...item,
            id: item.id ?? index + 1,
            sr: index + 1,
            consumedInDrawingNumber: item.consumedInDrawingNumber || item.consumedInDrawing || item.drawingNumber || "",
            poNumber: item.poNumber || item.consumedInProductionOrderNumber || item.productionOrderNumber || "",
            date: item.date ? formatDate(item.date) : "",
            rawDate: item.date || "",
            rejectionRemarks: item.rejectionReason || item.rejectionRemarks || item.remarks || "",
          }));
          setConsumedResults(mapped);
        } else {
          setConsumedResults([]);
        }
      })
      .catch((err: any) => {
        setConsumedResults([]);
        const msg = err?.message || err?.response?.data?.message;
        if (msg) {
          setSnackbar({
            open: true,
            message: msg,
            severity: "error",
          });
        }
      });
  };

  const handleExport = () => {
    setIsExportLoading(true);
    if (activeTab === "precheck") {
      const selectedCols =
        exportMode === "custom"
          ? ALL_PRECHECK_EXPORT_COLUMNS.filter((col) => selectedExportColumns.includes(col.key)).map((col) => col.key)
          : ALL_PRECHECK_EXPORT_COLUMNS.map((c) => c.key);

      const exportParams: any = {
        searchQuery: combinedSearch.trim(),
        productionSeries: selectedProductionSeries,
        status: selectedStatus,
        fromDate: dateFrom || null,
        toDate: dateTo || null,
        documentType: [],
        selectedColumns: selectedCols,
      };

      dispatch(exportViewPrecheckDetails(exportParams))
        .unwrap()
        .catch((err: any) => {
          setSnackbar({
            open: true,
            message: err?.message || err?.response?.data?.message || "Failed to export precheck details",
            severity: "error",
          });
        })
        .finally(() => setIsExportLoading(false));
    } else {
      const selectedCols =
        exportMode === "custom"
          ? ALL_CONSUMED_EXPORT_COLUMNS.filter((col) => selectedExportColumns.includes(col.key)).map((col) => col.key)
          : ALL_CONSUMED_EXPORT_COLUMNS.map((c) => c.key);

      const exportParams: any = {
        searchQuery: idNumber.trim() || combinedSearch.trim(),
        productionSeries: selectedProductionSeries,
        status: [],
        fromDate: dateFrom || null,
        toDate: dateTo || null,
        documentType: ["ConsumedIn"],
        selectedColumns: selectedCols,
      };

      dispatch(exportViewPrecheckDetails(exportParams))
        .unwrap()
        .catch((err: any) => {
          setSnackbar({
            open: true,
            message: err?.message || err?.response?.data?.message || "Failed to export consumed details",
            severity: "error",
          });
        })
        .finally(() => setIsExportLoading(false));
    }
  };

  const handleApplyFilters = () => {
    setHasAppliedFilters(true);
    setPage(0);
    if (activeTab === "precheck") {
      fetchPrecheckData(1, rowsPerPage);
    } else {
      fetchConsumedData();
    }
  };

  const handleClearAll = () => {
    setHasAppliedFilters(false);
    // Precheck filters
    setCombinedSearch("");
    setSelectedStatus([]);
    setDateFrom("");
    setDateTo("");
    // Consumed / shared filters
    setSelectedPO([]);
    setSelectedLnItemCode([]);
    setSelectedDrawing([]);
    setSelectedProductionSeries([]);
    setIdNumber("");
    // Results
    setPrecheckResults([]);
    setConsumedResults([]);
    // Expanded rows
    setExpandedRows(new Set());
    setPage(0);
  };

  // ── Derived Data ───────────────────────────────────────────────────────────
  const currentRawData = activeTab === "precheck" ? precheckResults : consumedResults;
  const visibleColumns = activeTab === "precheck" ? PRECHECK_COLUMNS : CONSUMED_IN_COLUMNS;

  // LN Item Codes options derived from drawing numbers master data, LN API, search, and consumed results
  const lnItemCodeOptions = useMemo(() => {
    const set = new Set<string>();

    // 1. From allDrawingNumbers master data
    if (Array.isArray(allDrawingNumbers)) {
      allDrawingNumbers.forEach((d: any) => {
        if (d.lnItemCode && typeof d.lnItemCode === "string" && d.lnItemCode.trim() !== "" && d.lnItemCode !== "-") {
          set.add(d.lnItemCode.trim());
        }
      });
    }

    // 2. From allLnItemCodesData
    const allLnList = Array.isArray(allLnItemCodesData)
      ? allLnItemCodesData
      : (allLnItemCodesData as any)?.data || (allLnItemCodesData as any)?.$values || [];
    if (Array.isArray(allLnList)) {
      allLnList.forEach((item: any) => {
        const code = typeof item === "string" ? item : item.lnItemCode || item.code;
        if (code && typeof code === "string" && code.trim() !== "" && code !== "-") {
          set.add(code.trim());
        }
      });
    }

    // 3. From searchedLnCodes
    const searchedList = Array.isArray(searchedLnCodes)
      ? searchedLnCodes
      : (searchedLnCodes as any)?.data || (searchedLnCodes as any)?.$values || [];
    if (Array.isArray(searchedList)) {
      searchedList.forEach((item: any) => {
        const code = typeof item === "string" ? item : item.lnItemCode || item.code;
        if (code && typeof code === "string" && code.trim() !== "" && code !== "-") {
          set.add(code.trim());
        }
      });
    }

    // 4. From consumedResults
    if (Array.isArray(consumedResults)) {
      consumedResults.forEach((row: any) => {
        if (row.lnItemCode && typeof row.lnItemCode === "string" && row.lnItemCode.trim() !== "" && row.lnItemCode !== "-") {
          set.add(row.lnItemCode.trim());
        }
      });
    }

    return Array.from(set).sort();
  }, [allDrawingNumbers, allLnItemCodesData, searchedLnCodes, consumedResults]);

  // ── Filtered Rows  ──────────────────────────────
  const filteredData = currentRawData;

  // ── Client-side Sorted Rows ────────────────────────────────────────────────
  const sortedData = useMemo(() => {
    if (!orderBy || orderBy === "sr" || filteredData.length <= 1) return filteredData;
    return [...filteredData].sort((a, b) => {
      let aVal = a[orderBy];
      let bVal = b[orderBy];
      if (orderBy === "quantity") {
        const numA = Number(aVal) || 0;
        const numB = Number(bVal) || 0;
        return order === "asc" ? numA - numB : numB - numA;
      }
      const strA = String(aVal || "").toLowerCase();
      const strB = String(bVal || "").toLowerCase();
      if (strA < strB) return order === "asc" ? -1 : 1;
      if (strA > strB) return order === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, orderBy, order]);

  // ── Paginated Rows ─────────────────────────────────────────────────────────
  const paginatedRows = useMemo(() => {
    if (activeTab === "precheck") {
      return sortedData;
    }
    const start = page * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [activeTab, sortedData, page, rowsPerPage]);

  const handleRequestSort = (field: string) => {
    const isAsc = orderBy === field && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(field);
  };

  // ── Active Filter Chips ────────────────────────────────────────────────────
  const activeChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onRemove: () => void }> = [];

    if (activeTab === "precheck") {
      if (combinedSearch.trim()) {
        chips.push({
          id: "search",
          label: `Search: "${combinedSearch.trim()}"`,
          onRemove: () => {
            setCombinedSearch("");
            setPage(0);
            fetchPrecheckData(1, rowsPerPage, "", selectedProductionSeries, selectedStatus, dateFrom, dateTo);
          },
        });
      }
      selectedProductionSeries.forEach((s) => {
        chips.push({
          id: `series-${s}`,
          label: `Series: ${s}`,
          onRemove: () => {
            const nextSeries = selectedProductionSeries.filter((v) => v !== s);
            setSelectedProductionSeries(nextSeries);
            setPage(0);
            fetchPrecheckData(1, rowsPerPage, combinedSearch, nextSeries, selectedStatus, dateFrom, dateTo);
          },
        });
      });
      selectedStatus.forEach((st) => {
        chips.push({
          id: `status-${st}`,
          label: `Status: ${st}`,
          onRemove: () => {
            const nextStatus = selectedStatus.filter((v) => v !== st);
            setSelectedStatus(nextStatus);
            setPage(0);
            fetchPrecheckData(1, rowsPerPage, combinedSearch, selectedProductionSeries, nextStatus, dateFrom, dateTo);
          },
        });
      });
      if (dateFrom) {
        chips.push({
          id: "dateFrom",
          label: `From: ${dateFrom}`,
          onRemove: () => {
            setDateFrom("");
            setPage(0);
            fetchPrecheckData(1, rowsPerPage, combinedSearch, selectedProductionSeries, selectedStatus, "", dateTo);
          },
        });
      }
      if (dateTo) {
        chips.push({
          id: "dateTo",
          label: `To: ${dateTo}`,
          onRemove: () => {
            setDateTo("");
            setPage(0);
            fetchPrecheckData(1, rowsPerPage, combinedSearch, selectedProductionSeries, selectedStatus, dateFrom, "");
          },
        });
      }
    }

    return chips;
  }, [activeTab, combinedSearch, selectedProductionSeries, selectedStatus, dateFrom, dateTo, page, rowsPerPage]);

  // ── Cell Content Renderer ──────────────────────────────────────────────────
  const renderCellContent = (colField: string, row: any, idx: number) => {
    if (colField === "sr") {
      return page * rowsPerPage + idx + 1;
    }

    if (colField === "productionOrderNumber") {
      return row.productionOrderNumber || row.poNumber || "-";
    }

    if (colField === "productionSeries") {
      return row.productionSeries || row.prodSeries || "-";
    }

    if (colField === "componentType") {
      return <ComponentTypeChip type={row.componentType} />;
    }

    if (colField === "status") {
      if (activeTab === "precheck") {
        const displayStatus = row.isRejected
          ? "Rejected"
          : row.precheckStatus || row.status || (row.isPrecheckComplete ? "Completed" : "Pending");
        return <StatusChip status={displayStatus} />;
      } else {
        return <StatusChip status={row.status} />;
      }
    }

    if (colField === "isRejected") {
      const isRej = row.isRejected === true || row.isRejected === "Yes" || row.isRejected === "Rejected";
      return <StatusChip status={isRej ? "Rejected" : "Active"} label={isRej ? "Yes" : "No"} />;
    }

    // Details column (directly toggle expanded sub-table)
    if (colField === "details") {
      const rowKey = row.id ?? row.sr;
      const isExpanded = expandedRows.has(rowKey);
      return (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            toggleRowExpand(rowKey);
          }}
          sx={{
            color: isExpanded ? "primary.main" : "#667085",
            p: 0.5,
            "&:hover": { backgroundColor: "grey.100", color: "#101828" },
          }}
        >
          {isExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
        </IconButton>
      );
    }



    const val = row[colField];
    if (val === null || val === undefined || String(val).trim() === "" || String(val).trim() === "null") {
      return "-";
    }
    return val;
  };

  const handleConfirmExportData = () => {
    setExportDialogOpen(false);
    handleExport();
  };


  return (
    <Box
      sx={{
        py: hideHeader ? 0 : 0.5,
        px: hideHeader ? 0 : { xs: 1, sm: 2 },
        maxWidth: 1600,
        mx: "auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%", borderRadius: "8px", boxShadow: 3 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      {/* 1. Page Header */}
      {!hideHeader && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1}
          sx={{ mb: 0.5 }}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "primary.main",
                fontSize: { xs: "1.2rem", sm: "1.4rem" },
                lineHeight: 1.2,
              }}
            >
              Precheck History
            </Typography>
            <Typography variant="body2" sx={{ color: "#667085", mt: 0.5 }}>
              {activeTab === "consumed"
                ? "Search, filter, and inspect past precheck inspection records and status reports."
                : "Search, filter, and inspect precheck inspection records and status reports."}
            </Typography>
          </Box>

          {activeTab === "precheck" && (
            <Button
              variant="outlined"
              size="small"
              startIcon={isExporting ? <CircularProgress size={16} color="inherit" /> : <FileDownloadIcon fontSize="small" />}
              onClick={handleOpenExportDialog}
              disabled={isExporting || !hasAppliedFilters}
              sx={{
                height: 32,
                borderRadius: "6px",
                borderColor: "grey.300",
                color: "text.secondary",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.8rem",
                backgroundColor: "background.paper",
                "&:hover": { borderColor: "grey.400", backgroundColor: "grey.50" },
              }}
            >
              Export
            </Button>
          )}
        </Stack>
      )}

      {/* 2. Tabs Bar */}
      <Box sx={{ borderBottom: "1px solid #EAECF0", mb: 0.5 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => {
            setActiveTab(newValue);
            setHasAppliedFilters(false);
            setPage(0);
          }}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            minHeight: 34,
            "& .MuiTab-root": {
              fontWeight: 600,
              fontSize: "0.85rem",
              textTransform: "none",
              minWidth: 90,
              py: 0.5,
            },
            "& .MuiTab-root.Mui-selected": { color: "primary.main" },
            "& .MuiTabs-indicator": {
              backgroundColor: "primary.main",
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
          }}
        >
          <Tab label="Prechecks" value="precheck" />
          <Tab label="Consumed In" value="consumed" />
        </Tabs>
      </Box>

      {/* 3. Unified Single Outer Paper Container */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: "1px solid #EAECF0",
          backgroundColor: "#ffffff",
          overflow: "hidden",
          mb: 1,
        }}
      >
        {/* Section 1: Filter Bar & Active Chips */}
        <Box sx={{ pt: 1, px: 1, pb: 0.5, borderBottom: "1px solid #EAECF0" }}>
          {/* ── Precheck Tab Filters ─────────────────────────────────────────── */}
          {activeTab === "precheck" && (
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-end",
                gap: 1,
                flexWrap: "nowrap",
                width: "100%",
                overflowX: "auto",
                overflowY: "hidden",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                pt: 1.5,
                pb: 0.5,
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              {/* Combined Search */}
              <TextField
                size="small"
                placeholder="Search PO No. , Drawing No. , LN Item Code…"
                value={combinedSearch}
                onChange={(e) => { setCombinedSearch(e.target.value); setPage(0); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "#98A2B3", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  endAdornment: combinedSearch ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => { setCombinedSearch(""); setPage(0); }}
                        edge="end"
                        sx={{ p: 0.25, color: "#98A2B3", "&:hover": { color: "#344054" } }}
                      >
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
                sx={{
                  flex: "1 1 340px",
                  minWidth: 260,
                  "& .MuiOutlinedInput-root": {
                    fontSize: "0.825rem",
                    height: 38,
                    backgroundColor: "background.paper",
                    borderRadius: "6px",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#D0D5DD" },
                  },
                }}
              />

              {/* Production Series */}
              <MultiSelectFilter
                label="Prod Series"
                value={selectedProductionSeries}
                options={prodSeriesOptions}
                onChange={(newValue) => {
                  setSelectedProductionSeries(newValue);
                  setPage(0);
                }}
                flex="0 0 150px"
                minWidth={120}
              />

              {/* Status */}
              <MultiSelectFilter
                label="Status"
                value={selectedStatus}
                options={["Pending", "Partial", "Completed"]}
                onChange={(newValue) => {
                  setSelectedStatus(newValue);
                  setPage(0);
                }}
                flex="0 0 120px"
                minWidth={100}
              />

              {/* Date From */}
              <TextField
                size="small"
                type={fromDateFocused || Boolean(dateFrom) ? "date" : "text"}
                label="From Date"
                InputLabelProps={{ shrink: Boolean(fromDateFocused || dateFrom) }}
                value={dateFrom}
                onFocus={() => setFromDateFocused(true)}
                onBlur={() => setFromDateFocused(false)}
                onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                inputProps={{ title: "From Date" }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end" sx={{ cursor: "pointer" }}>
                      <CalendarTodayIcon
                        sx={{ fontSize: 16, color: "#667085" }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setFromDateFocused(true);
                          const root = e.currentTarget.closest(".MuiInputBase-root") as HTMLElement;
                          const input = root?.querySelector("input") as HTMLInputElement | null;
                          if (input) {
                            input.type = "date";
                            input.focus();
                            setTimeout(() => {
                              if ("showPicker" in input) {
                                try { (input as any).showPicker(); } catch {}
                              }
                            }, 10);
                          }
                        }}
                        onClick={(e) => {
                          setFromDateFocused(true);
                          const root = e.currentTarget.closest(".MuiInputBase-root") as HTMLElement;
                          const input = root?.querySelector("input") as HTMLInputElement | null;
                          if (input) {
                            input.type = "date";
                            input.focus();
                            setTimeout(() => {
                              if ("showPicker" in input) {
                                try { (input as any).showPicker(); } catch {}
                              }
                            }, 10);
                          }
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  flex: "0 0 148px",
                  minWidth: 140,
                  position: "relative",
                  "& .MuiOutlinedInput-root": {
                    height: 38,
                    backgroundColor: "background.paper",
                    borderRadius: "6px",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#D0D5DD" },
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: "0.82rem",
                    bgcolor: "#ffffff",
                    px: 0.5,
                    color: "#98A2B3",
                    "&.MuiInputLabel-shrink": {
                      fontSize: "0.75rem",
                      color: "#667085",
                    },
                    "&.Mui-focused": { color: "primary.main" },
                  },
                  "& .MuiOutlinedInput-input": {
                    py: "8.5px",
                    px: 1.5,
                    fontSize: "0.82rem",
                    color: dateFrom ? "#344054" : "#98A2B3",
                  },
                  "& input::-webkit-calendar-picker-indicator": {
                    position: "absolute",
                    right: 8,
                    top: 8,
                    width: 24,
                    height: 24,
                    opacity: 0,
                    cursor: "pointer",
                  },
                }}
              />

              {/* Date To */}
              <TextField
                size="small"
                type={toDateFocused || Boolean(dateTo) ? "date" : "text"}
                label="To Date"
                InputLabelProps={{ shrink: Boolean(toDateFocused || dateTo) }}
                value={dateTo}
                onFocus={() => setToDateFocused(true)}
                onBlur={() => setToDateFocused(false)}
                onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                inputProps={{ title: "To Date" }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end" sx={{ cursor: "pointer" }}>
                      <CalendarTodayIcon
                        sx={{ fontSize: 16, color: "#667085" }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setToDateFocused(true);
                          const root = e.currentTarget.closest(".MuiInputBase-root") as HTMLElement;
                          const input = root?.querySelector("input") as HTMLInputElement | null;
                          if (input) {
                            input.type = "date";
                            input.focus();
                            setTimeout(() => {
                              if ("showPicker" in input) {
                                try { (input as any).showPicker(); } catch {}
                              }
                            }, 10);
                          }
                        }}
                        onClick={(e) => {
                          setToDateFocused(true);
                          const root = e.currentTarget.closest(".MuiInputBase-root") as HTMLElement;
                          const input = root?.querySelector("input") as HTMLInputElement | null;
                          if (input) {
                            input.type = "date";
                            input.focus();
                            setTimeout(() => {
                              if ("showPicker" in input) {
                                try { (input as any).showPicker(); } catch {}
                              }
                            }, 10);
                          }
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  flex: "0 0 148px",
                  minWidth: 140,
                  position: "relative",
                  "& .MuiOutlinedInput-root": {
                    height: 38,
                    backgroundColor: "background.paper",
                    borderRadius: "6px",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#D0D5DD" },
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: "0.82rem",
                    bgcolor: "#ffffff",
                    px: 0.5,
                    color: "#98A2B3",
                    "&.MuiInputLabel-shrink": {
                      fontSize: "0.75rem",
                      color: "#667085",
                    },
                    "&.Mui-focused": { color: "primary.main" },
                  },
                  "& .MuiOutlinedInput-input": {
                    py: "8.5px",
                    px: 1.5,
                    fontSize: "0.82rem",
                    color: dateTo ? "#344054" : "#98A2B3",
                  },
                  "& input::-webkit-calendar-picker-indicator": {
                    position: "absolute",
                    right: 8,
                    top: 8,
                    width: 24,
                    height: 24,
                    opacity: 0,
                    cursor: "pointer",
                  },
                }}
              />

              {/* Apply Button */}
              <Button
                size="small"
                variant="contained"
                onClick={handleApplyFilters}
                disabled={!isPrecheckDropdownSelected || isPrecheckLoading}
                sx={{
                  flex: "0 0 auto",
                  backgroundColor: "primary.main",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  borderRadius: "6px",
                  px: 2,
                  height: 38,
                  textTransform: "none",
                  boxShadow: "none",
                  minWidth: 65,
                  "&:hover": { backgroundColor: "primary.dark", boxShadow: "none" },
                }}
              >
                Apply
              </Button>

              {/* Clear Button */}
              <Button
                size="small"
                variant="outlined"
                onClick={handleClearAll}
                sx={{
                  flex: "0 0 auto",
                  color: "#667085",
                  borderColor: "#D0D5DD",
                  backgroundColor: "#ffffff",
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  height: 38,
                  px: 1.5,
                  minWidth: 55,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "#98A2B3",
                    backgroundColor: "#F9FAFB",
                    color: "#101828",
                  },
                }}
              >
                Clear
              </Button>
            </Box>
          )}

          {/* ── Consumed Tab Filters  ────────────────────────────── */}
          {activeTab === "consumed" && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "nowrap",
                width: "100%",
                overflowX: "auto",
                overflowY: "hidden",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                pt: 1.5,
                pb: 0.5,
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              {/* 1. LN Item Code (Searchable Autocomplete) */}
              <Autocomplete
                size="small"
                options={lnOptions}
                value={selectedLnItemCode.length > 0 ? selectedLnItemCode[0] : null}
                onChange={(_, newValue) => {
                  if (newValue && typeof newValue !== "string") {
                    const lnVal = newValue.lnItemCode || newValue.drawingNumber;
                    setSelectedLnItemCode(lnVal ? [String(lnVal)] : []);
                    if (newValue.drawingNumber) {
                      setSelectedDrawing([String(newValue.drawingNumber)]);
                    }
                  } else if (typeof newValue === "string") {
                    setSelectedLnItemCode([newValue]);
                  } else {
                    setSelectedLnItemCode([]);
                  }
                  setPage(0);
                }}
                onInputChange={(_, newInputValue, reason) => {
                  if (reason === "input") {
                    setLnSearchText(newInputValue);
                  }
                }}
                getOptionLabel={(option: any) =>
                  typeof option === "string" || typeof option === "number" ? String(option) : option?.lnItemCode || option?.drawingNumber || ""
                }
                filterOptions={(options, { inputValue }) => {
                  if (!inputValue || inputValue.trim() === "") return options.slice(0, 100);
                  const searchLower = inputValue.toLowerCase().trim();
                  return options
                    .filter((opt: any) => {
                      const label = typeof opt === "string" || typeof opt === "number" ? String(opt) : opt?.lnItemCode || opt?.drawingNumber || "";
                      return label.toLowerCase().includes(searchLower);
                    })
                    .slice(0, 100);
                }}
                renderOption={(props: any, option: any) => {
                  const { key, ...optionProps } = props;
                  const lnCode = typeof option === "string" || typeof option === "number" ? String(option) : option?.lnItemCode || option?.drawingNumber || "";
                  const dwgNum = typeof option === "object" ? option?.drawingNumber : "";

                  return (
                    <li {...optionProps} key={key}>
                      <Box sx={{ display: "flex", flexDirection: "column", width: "100%", py: 0.1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main", fontSize: "0.82rem" }}>
                          {lnCode}
                        </Typography>
                        {dwgNum ? (
                          <Typography variant="caption" sx={{ color: "#667085", fontSize: "0.72rem", lineHeight: 1.2 }}>
                            Drawing: {dwgNum}
                          </Typography>
                        ) : null}
                      </Box>
                    </li>
                  );
                }}
                ListboxProps={{
                  style: { maxHeight: "260px" },
                  sx: {
                    "& .MuiAutocomplete-option": {
                      minHeight: "28px !important",
                      py: "3px !important",
                      px: "10px !important",
                      fontSize: "0.82rem",
                    },
                  },
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="LN Item Code *"
                    size="small"
                    variant="outlined"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        fontSize: "0.825rem",
                        height: 38,
                        backgroundColor: "background.paper",
                        borderRadius: "6px",
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#D0D5DD" },
                      },
                    }}
                  />
                )}
                sx={{ flex: "1 1 140px", minWidth: 110 }}
              />

              {/* 2. Drawing Number (Searchable Autocomplete) */}
              <Autocomplete
                size="small"
                options={drawingOptions}
                value={selectedDrawing.length > 0 ? selectedDrawing[0] : null}
                onChange={(_, newValue) => {
                  if (newValue && typeof newValue !== "string") {
                    const dwgVal = newValue.drawingNumber || newValue.lnItemCode;
                    setSelectedDrawing(dwgVal ? [String(dwgVal)] : []);
                    if (newValue.lnItemCode || newValue.lnitemcode) {
                      setSelectedLnItemCode([String(newValue.lnItemCode || newValue.lnitemcode)]);
                    }
                  } else if (typeof newValue === "string") {
                    setSelectedDrawing([newValue]);
                  } else {
                    setSelectedDrawing([]);
                  }
                  setPage(0);
                }}
                getOptionLabel={(option: any) =>
                  typeof option === "string" || typeof option === "number" ? String(option) : option?.label || option?.drawingNumber || ""
                }
                filterOptions={(options, { inputValue }) => {
                  if (!inputValue || inputValue.trim() === "") return options.slice(0, 100);
                  const searchLower = inputValue.toLowerCase().trim();
                  return options
                    .filter((opt: any) => {
                      const label = typeof opt === "string" || typeof opt === "number" ? String(opt) : opt?.label || opt?.drawingNumber || "";
                      return label.toLowerCase().includes(searchLower);
                    })
                    .slice(0, 100);
                }}
                renderOption={(props: any, option: any) => {
                  const { key, ...optionProps } = props;
                  const dwgNum = typeof option === "string" || typeof option === "number" ? String(option) : option?.drawingNumber || option?.lnItemCode || "";
                  const lnCode = typeof option === "object" ? option?.lnItemCode : "";

                  return (
                    <li {...optionProps} key={key}>
                      <Box sx={{ display: "flex", flexDirection: "column", width: "100%", py: 0.1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main", fontSize: "0.82rem" }}>
                          {dwgNum}
                        </Typography>
                        {lnCode ? (
                          <Typography variant="caption" sx={{ color: "#667085", fontSize: "0.72rem", lineHeight: 1.2 }}>
                            LN: {lnCode}
                          </Typography>
                        ) : null}
                      </Box>
                    </li>
                  );
                }}
                ListboxProps={{
                  style: { maxHeight: "260px" },
                  sx: {
                    "& .MuiAutocomplete-option": {
                      minHeight: "28px !important",
                      py: "3px !important",
                      px: "10px !important",
                      fontSize: "0.82rem",
                    },
                  },
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Drawing No. *"
                    size="small"
                    variant="outlined"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        fontSize: "0.825rem",
                        height: 38,
                        backgroundColor: "background.paper",
                        borderRadius: "6px",
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#D0D5DD" },
                      },
                    }}
                  />
                )}
                sx={{ flex: "1 1 145px", minWidth: 115 }}
              />

              {/* 3. Production Series (Searchable Autocomplete) */}
              <Autocomplete
                size="small"
                options={prodSeriesOptions}
                value={selectedProductionSeries.length > 0 ? selectedProductionSeries[0] : null}
                onChange={(_, newValue) => {
                  const val = typeof newValue === "string" ? newValue : newValue ? ((newValue as any).id ?? (newValue as any).label) : null;
                  setSelectedProductionSeries(val ? [String(val)] : []);
                  setPage(0);
                }}
                getOptionLabel={(option: any) =>
                  typeof option === "string" || typeof option === "number" ? String(option) : option?.label || option?.productionSeries || ""
                }
                filterOptions={(options, { inputValue }) => {
                  if (!inputValue || inputValue.trim() === "") return options.slice(0, 100);
                  const searchLower = inputValue.toLowerCase().trim();
                  return options
                    .filter((opt: any) => {
                      const label = typeof opt === "string" || typeof opt === "number" ? String(opt) : opt?.label || opt?.productionSeries || "";
                      return label.toLowerCase().includes(searchLower);
                    })
                    .slice(0, 100);
                }}
                renderOption={(props: any, option: any) => {
                  const { key, ...optionProps } = props;
                  const label = typeof option === "string" || typeof option === "number" ? String(option) : option?.label || option?.productionSeries || "";
                  return (
                    <li {...optionProps} key={key}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#101828", fontSize: "0.82rem" }}>
                        {label}
                      </Typography>
                    </li>
                  );
                }}
                ListboxProps={{
                  style: { maxHeight: "260px" },
                  sx: {
                    "& .MuiAutocomplete-option": {
                      minHeight: "26px !important",
                      py: "2px !important",
                      px: "8px !important",
                      fontSize: "0.82rem",
                    },
                  },
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Prod Series *"
                    size="small"
                    variant="outlined"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        fontSize: "0.825rem",
                        height: 38,
                        backgroundColor: "background.paper",
                        borderRadius: "6px",
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#D0D5DD" },
                      },
                    }}
                  />
                )}
                sx={{ flex: "1 1 115px", minWidth: 90 }}
              />

              {/* 4. Assembly No (Text Input) */}
              <TextField
                placeholder="Assembly No"
                size="small"
                variant="outlined"
                value={selectedPO.length > 0 ? selectedPO[0] : ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedPO(val ? [val] : []);
                  setPOSearchText(val);
                  setPage(0);
                }}
                InputProps={{
                  endAdornment: selectedPO.length > 0 && selectedPO[0] ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedPO([]);
                          setPOSearchText("");
                          setPage(0);
                        }}
                        edge="end"
                        sx={{ p: 0.25, color: "#98A2B3", "&:hover": { color: "#344054" } }}
                      >

                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
                sx={{
                  flex: "1 1 125px",
                  minWidth: 100,
                  "& .MuiOutlinedInput-root": {
                    fontSize: "0.825rem",
                    height: 38,
                    backgroundColor: "background.paper",
                    borderRadius: "6px",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#D0D5DD" },
                  },
                }}
              />

              {/* 5. ID Number */}
              <TextField
                placeholder="ID Number..."
                size="small"
                variant="outlined"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                InputProps={{
                  endAdornment: idNumber ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setIdNumber("")}
                        edge="end"
                        sx={{ p: 0.25, color: "#98A2B3", "&:hover": { color: "#344054" } }}
                      >
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
                sx={{
                  flex: "1 1 10px",
                  minWidth: 75,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "6px",
                    fontSize: "0.825rem",
                    height: 38,
                    backgroundColor: "background.paper",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#D0D5DD" },
                  },
                }}
              />

              {/* Apply Button */}
              <Button
                size="small"
                variant="contained"
                onClick={handleApplyFilters}
                disabled={!isConsumedDropdownSelected || isConsumedLoading}
                sx={{
                  flex: "0 0 auto",
                  backgroundColor: "primary.main",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  borderRadius: "6px",
                  px: 2,
                  height: 38,
                  textTransform: "none",
                  boxShadow: "none",
                  minWidth: 65,
                  "&:hover": { backgroundColor: "primary.dark", boxShadow: "none" },
                }}
              >
                Apply
              </Button>

              {/* Clear Button */}
              <Button
                size="small"
                variant="outlined"
                onClick={handleClearAll}
                sx={{
                  flex: "0 0 auto",
                  color: "#667085",
                  borderColor: "#D0D5DD",
                  backgroundColor: "#ffffff",
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  height: 38,
                  px: 1.5,
                  minWidth: 55,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "#98A2B3",
                    backgroundColor: "#F9FAFB",
                    color: "#101828",
                  },
                }}
              >
                Clear
              </Button>
            </Box>
          )}

          {/* Active Filter Chips Bar & Results Counter */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mt: activeChips.length > 0 ? 0.75 : 0.5,
              pt: activeChips.length > 0 ? 0.5 : 0,
              borderTop: activeChips.length > 0 ? "1px solid #F2F4F7" : "none",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            {activeChips.length > 0 ? (
              <Stack direction="row" spacing={0.75} flexWrap="wrap" alignItems="center">
                {activeChips.map((chip) => (
                  <Chip
                    key={chip.id}
                    label={chip.label}
                    onDelete={chip.onRemove}
                    size="small"
                    sx={{
                      backgroundColor: "#F2F4F7",
                      color: "#344054",
                      fontWeight: 600,
                      fontSize: "0.775rem",
                      height: 24,
                      borderRadius: "14px",
                      border: "1px solid #E9EAEB",
                      "& .MuiChip-deleteIcon": {
                        color: "#667085",
                        fontSize: 13,
                        "&:hover": { color: "#344054" },
                      },
                    }}
                  />
                ))}
                <Button
                  variant="text"
                  size="small"
                  onClick={handleClearAll}
                  sx={{
                    color: "primary.main",
                    fontWeight: 600,
                    fontSize: "0.775rem",
                    textTransform: "none",
                    p: 0,
                    minWidth: "auto",
                    "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
                  }}
                >
                  Clear all
                </Button>
              </Stack>
            ) : <Box />}

            {/* Results Count Display */}
            <Typography variant="body2" sx={{ color: "#667085", fontSize: "0.8rem", fontWeight: 500, ml: "auto" }}>
              {filteredData.length.toLocaleString()} {filteredData.length === 1 ? "result" : "results"}
            </Typography>
          </Box>
        </Box>

        {/* Section 2: Data Table */}
        <TableContainer
          sx={{
            overflowX: "auto",
            minHeight: 350,
            maxHeight: "calc(100vh - 290px)",
          }}
        >
          <Table stickyHeader size="small" sx={{ width: "100%", minWidth: 1300 }}>
            {/* Table Head */}
            <TableHead>
              <TableRow sx={{ backgroundColor: COLOUR_ROLES.headerBg }}>
                {visibleColumns.map((col) => (
                  <SortableTableHeader
                    key={col.field}
                    label={col.headerName}
                    columnKey={col.field}
                    sortColumn={orderBy}
                    sortDirection={order}
                    onSort={col.sortable !== false ? handleRequestSort : undefined}
                    align={col.align || "center"}
                    minWidth={col.minWidth}
                    isSortable={col.sortable !== false}
                  />
                ))}
              </TableRow>
            </TableHead>

            {/* Table Body */}
            <TableBody>
              {isPrecheckLoading || isConsumedLoading ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length} align="center" sx={{ height: 280, borderBottom: "none" }}>
                    <CircularProgress size={32} color="primary" />
                    <Typography variant="body2" sx={{ color: "#667085", mt: 1 }}>
                      Loading precheck records...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedRows.length > 0 ? (
                paginatedRows.map((row: any, idx: number) => {
                  const rowKey = row.id ?? row.sr;
                  const isExpanded = activeTab === "precheck" && expandedRows.has(rowKey);

                  const statusLower = (row.precheckStatus || row.status || "").toLowerCase();
                  const isRej = row.isRejected || statusLower === "rejected";

                  const remQtyNum =
                    row.remainingQuantity !== undefined && row.remainingQuantity !== null
                      ? Number(row.remainingQuantity)
                      : null;
                  const isZeroRemQty = remQtyNum !== null && remQtyNum === 0;

                  const isComplete =
                    !isRej &&
                    (statusLower === "completed" ||
                      statusLower === "verified" ||
                      isZeroRemQty ||
                      (row.isPrecheckComplete && (remQtyNum === null || remQtyNum === 0)));

                  const isUpdated =
                    !isRej &&
                    !isComplete &&
                    (statusLower === "updated" ||
                      row.isUpdated ||
                      Boolean(row.qrCode));
                  const isShort =
                    !isRej &&
                    !isComplete &&
                    !isUpdated &&
                    (statusLower === "short" || statusLower === "partial");

                  let rowBg = "#FFFFFF";
                  let rowHoverBg = "#F8FAFC";
                  if (isRej) {
                    rowBg = "#FDE8E8";
                    rowHoverBg = "#FDE8E8";
                  } else if (isUpdated) {
                    rowBg = "#FFF7ED";
                    rowHoverBg = "#FFF7ED";
                  } else if (isShort) {
                    rowBg = "#FFFBEB";
                    rowHoverBg = "#FFFBEB";
                  }

                  return (
                    <React.Fragment key={rowKey ?? idx}>
                      {/* Main row */}
                      <TableRow
                        hover
                        sx={{
                          ...commonTableRowStyle,
                          backgroundColor: rowBg,
                          opacity: isRej ? 0.7 : 1,
                          transition: "background-color 0.2s ease, opacity 0.4s ease",
                          "&:hover": {
                            backgroundColor: `${rowHoverBg} !important`,
                          },
                        }}
                      >
                        {visibleColumns.map((col) => (
                          <TableCell
                            key={col.field}
                            align={col.align || "center"}
                            sx={{
                              fontSize: "0.775rem",
                              color: COLOUR_ROLES.textMain,
                              py: 0.15,
                              px: 0.75,
                              minWidth: col.minWidth,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {renderCellContent(col.field, row, idx)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Expanded sub-table (precheck tab only) */}
                      {activeTab === "precheck" && (
                        <TableRow sx={{ height: "auto" }}>
                          <TableCell
                            colSpan={visibleColumns.length}
                            style={{ paddingBottom: 0, paddingTop: 0 }}
                          >
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
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
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 700,
                                    color: "primary.main",
                                    display: "block",
                                    mb: 0.75,
                                    fontSize: "0.8rem",
                                  }}
                                >
                                  Additional Details
                                </Typography>
                                <Table size="small" sx={{ width: "100%" }}>
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
                                        MRIR Number
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
                                        Nomenclature
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
                                        Date
                                      </TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    <TableRow>
                                      <TableCell sx={{ fontSize: "0.75rem", color: "#344054", py: 0.5, px: 1.5, textAlign: "center" }}>
                                        {row.mrirNumber || "-"}
                                      </TableCell>
                                      <TableCell sx={{ fontSize: "0.75rem", color: "#344054", py: 0.5, px: 1.5, textAlign: "center" }}>
                                        {row.nomenclature || "-"}
                                      </TableCell>
                                      <TableCell sx={{ fontSize: "0.75rem", color: "#344054", py: 0.5, px: 1.5, textAlign: "center" }}>
                                        {row.remarks || <Typography component="span" sx={{ color: "#98A2B3", fontStyle: "italic", fontSize: "0.75rem" }}>No remarks</Typography>}
                                      </TableCell>
                                      <TableCell sx={{ fontSize: "0.75rem", color: "#344054", py: 0.5, px: 1.5, textAlign: "center" }}>
                                        {row.username || "-"}
                                      </TableCell>
                                      <TableCell sx={{ fontSize: "0.75rem", color: "#344054", py: 0.5, px: 1.5, textAlign: "center" }}>
                                        {row.modifiedDate || "-"}
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <EmptyState colSpan={visibleColumns.length} title={activeChips.length > 0 ? "No Matching Records found" : "Apply filters to search"} />
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Section 3: Footer Pagination */}
        <CustomPagination
          page={page}
          pageSize={rowsPerPage}
          totalCount={activeTab === "precheck" ? (totalRecords || filteredData.length) : filteredData.length}
          onPageChange={(newPage) => {
            setPage(newPage);
            if (activeTab === "precheck") {
              fetchPrecheckData(newPage + 1, rowsPerPage);
            }
          }}
          onPageSizeChange={(newSize) => {
            setRowsPerPage(newSize);
            setPage(0);
            if (activeTab === "precheck") {
              fetchPrecheckData(1, newSize);
            }
          }}
        />

      </Paper>



      {/* Export Options Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => !isDownloading && setExportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "16px", p: 1 },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: 700,
            color: "#101828",
            fontSize: "1.1rem",
            pb: 1,
          }}
        >
          Export {activeTab === "precheck" ? "Precheck Details" : "Consumed In Details"}
          <IconButton size="small" onClick={() => setExportDialogOpen(false)} disabled={isDownloading}>
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
                  setSelectedExportColumns(activeExportColumns.map((c) => c.key));
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
                        checked={selectedExportColumns.length === activeExportColumns.length}
                        indeterminate={
                          selectedExportColumns.length > 0 &&
                          selectedExportColumns.length < activeExportColumns.length
                        }
                        onChange={handleToggleSelectAllColumns}
                        sx={{ color: "primary.main", "&.Mui-checked": { color: "primary.main" } }}
                      />
                    }
                    label={
                      <Typography variant="body2" fontWeight="700">
                        {selectedExportColumns.length === activeExportColumns.length ? "Deselect All" : "Select All Columns"}
                      </Typography>
                    }
                  />
                  <Chip
                    label={`${selectedExportColumns.length} / ${activeExportColumns.length} selected`}
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: "primary.main", color: "primary.main" }}
                  />
                </Box>

                <Grid container spacing={1}>
                  {activeExportColumns.map((col) => (
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
            startIcon={isExporting ? <CircularProgress size={18} color="inherit" /> : <FileDownloadIcon fontSize="small" />}
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
    </Box>
  );
};

export default ViewPrecheck;
