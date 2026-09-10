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
  TableSortLabel,
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
} from "@mui/icons-material";
import { CustomPagination } from "../../components/CustomPagination";
import { EmptyState } from "../../components/EmptyState";
import { MultiSelectFilter } from "../../components/MultiSelectFilter";

import {
  viewPrecheckDetails,
  viewPrecheckByParameters,
  exportPrecheckDetails,
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
  { field: "sr", headerName: "SR", minWidth: 55, align: "center", sortable: true },
  { field: "lnItemCode", headerName: "LN Item Code", minWidth: 140, align: "left", sortable: true },
  { field: "drawingNumber", headerName: "Drawing No.", minWidth: 150, align: "left", sortable: true },
  { field: "nomenclature", headerName: "Nomenclature", minWidth: 160, align: "left", sortable: true },
  { field: "quantity", headerName: "Qty", minWidth: 70, align: "center", sortable: true },
  { field: "idNumber", headerName: "ID Number", minWidth: 110, align: "center", sortable: true },
  { field: "irNumber", headerName: "IR", minWidth: 90, align: "center", sortable: false },
  { field: "msnNumber", headerName: "MSN", minWidth: 90, align: "center", sortable: false },
  { field: "mrirNumber", headerName: "MRIR Number", minWidth: 120, align: "center", sortable: false },
  { field: "componentType", headerName: "Type", minWidth: 90, align: "center", sortable: false },
  { field: "status", headerName: "Status", minWidth: 105, align: "center", sortable: false },
  { field: "details", headerName: "Details", minWidth: 80, align: "center", sortable: false },
];

const CONSUMED_IN_COLUMNS: ColumnDef[] = [
  { field: "sr", headerName: "Sr No", minWidth: 60, align: "center", sortable: true },
  { field: "idNumber", headerName: "ID Number", minWidth: 100, align: "center", sortable: true },
  { field: "consumedInDrawingNumber", headerName: "Consumed IN Drawing Number", minWidth: 220, align: "left", sortable: true },
  { field: "quantity", headerName: "Quantity", minWidth: 80, align: "center", sortable: true },
  { field: "poNumber", headerName: "PO Number", minWidth: 130, align: "left", sortable: true },
  { field: "irNumber", headerName: "IR Number", minWidth: 95, align: "center", sortable: false },
  { field: "msnNumber", headerName: "MSN Number", minWidth: 105, align: "center", sortable: false },
  { field: "date", headerName: "Date", minWidth: 130, align: "center", sortable: true },
  { field: "username", headerName: "Username", minWidth: 110, align: "center", sortable: true },
  { field: "isRejected", headerName: "Is Rejected", minWidth: 100, align: "center", sortable: false },
  { field: "rejectionRemarks", headerName: "Remarks", minWidth: 130, align: "left", sortable: false },
];

export const ViewPrecheck: React.FC<{ hideHeader?: boolean }> = ({ hideHeader = false }) => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();

  // ── Active Tab ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"precheck" | "consumed">(
    location.pathname.includes("consumed") ? "consumed" : "precheck"
  );

  // ── Redux Loading States ───────────────────────────────────────────────────
  const { isLoading: isPrecheckLoading } = useSelector((state: RootState) => state.precheck);
  const { loading: isConsumedLoading, isDownloading } = useSelector((state: RootState) => state.qrcode);

  // ── Precheck tab filter states ─────────────────────────────────────────────
  const [combinedSearch, setCombinedSearch] = useState("");        // PO / Drawing / LN search
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);    // Pending | Partial | Completed
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

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
  const debouncedPOSearch = useDebounce(poSearchText, 400);
  const { data: poNumbers = [] } = usePONumbers(debouncedPOSearch);

  // ── Options Derivation for MultiSelectFilter ────────────────────────────────
  const prodSeriesOptions = useMemo(() => {
    if (!productionSeriesData) return [];
    return productionSeriesData
      .map((item: any) => (typeof item === "string" ? item : item.productionSeries || item.productionSeriesName || item.name))
      .filter(Boolean);
  }, [productionSeriesData]);

  const drawingOptions = useMemo(() => {
    if (!allDrawingNumbers) return [];
    return allDrawingNumbers
      .map((item: any) => (typeof item === "string" ? item : item.drawingNumber || item.lnItemCode))
      .filter(Boolean);
  }, [allDrawingNumbers]);

  const poOptions = useMemo(() => {
    if (!poNumbers) return [];
    return poNumbers
      .map((item: any) => (typeof item === "string" ? item : item.productionOrderNumber))
      .filter(Boolean);
  }, [poNumbers]);

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

  // ── Sorting State ──────────────────────────────────────────────────────────
  const [orderBy, setOrderBy] = useState<string>("sr");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  // ── Pagination State ───────────────────────────────────────────────────────
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // ── Details Modal & Action Menu State ─────────────────────────────────────
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeMenuRow, setActiveMenuRow] = useState<any | null>(null);

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
  const fetchPrecheckData = (pNum: number = page + 1, pSize: number = rowsPerPage) => {
    const payload: any = {
      pageNumber: pNum,
      pageSize: pSize,
      searchQuery: combinedSearch.trim(),
      prodSeries: selectedProductionSeries,
      status: selectedStatus.length > 0 ? selectedStatus[0] : "",
      fromDate: dateFrom ? dateFrom : null,
      toDate: dateTo ? dateTo : null,
    };

    dispatch(viewPrecheckByParameters(payload))
      .then((result: any) => {
        if (result.payload) {
          const rawList = Array.isArray(result.payload)
            ? result.payload
            : result.payload.data || result.payload.items || [];
          const total = Array.isArray(result.payload)
            ? result.payload.length
            : result.payload.totalCount || result.payload.totalRecords || result.payload.total || rawList.length;
          setTotalRecords(total);
          const mapped = rawList.map((item: any, index: number) => ({
            ...item,
            id: item.id ?? index + 1,
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
      .catch(() => {
        setPrecheckResults([]);
        setTotalRecords(0);
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
        setPage(0);
        fetchPrecheckData();
      }
    }
  }, [debouncedCombinedSearch]);

  // Auto-fetch API when user types 3+ characters in consumed tab idNumber or clears it
  useEffect(() => {
    if (activeTab === "consumed") {
      const trimmed = debouncedIdNumber.trim();
      if (trimmed.length >= 3 || (trimmed.length === 0 && consumedResults.length > 0)) {
        setPage(0);
        fetchConsumedData();
      }
    }
  }, [debouncedIdNumber]);

  const isPrecheckDropdownSelected = selectedProductionSeries.length > 0 || selectedStatus.length > 0 || !!dateFrom || !!dateTo;
  const isConsumedDropdownSelected = selectedLnItemCode.length > 0 || selectedDrawing.length > 0 || selectedProductionSeries.length > 0 || selectedPO.length > 0;

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
      .catch(() => setConsumedResults([]));
  };

  const handleExport = () => {
    if (activeTab === "precheck") {
      const exportParams: any = {
        prodSeries: selectedProductionSeries,
        searchTerm: combinedSearch.trim(),
        status: selectedStatus.length > 0 ? selectedStatus[0] : "",
        fromDate: dateFrom || undefined,
        toDate: dateTo || undefined,
      };
      dispatch(exportPrecheckDetails(exportParams))
        .unwrap()
        .catch((err) => alert(err.message || "Failed to export precheck details"));
    } else {
      if (selectedDrawing.length === 0 || selectedProductionSeries.length === 0) {
        alert("Please select both Drawing Number and Production Series before exporting");
        return;
      }
      const params: any = {
        ProdSeries: selectedProductionSeries,
        DrawingNumber: selectedDrawing[0],
      };
      if (idNumber) params.IdNumber = parseInt(idNumber);
      if (selectedPO.length > 0) params.ProductionOrderNumber = selectedPO[0];
      if (selectedLnItemCode.length > 0) params.LnItemCode = selectedLnItemCode[0];
      dispatch(exportConsumedIn(params));
    }
  };

  const handleApplyFilters = () => {
    setPage(0);
    if (activeTab === "precheck") {
      fetchPrecheckData(1, rowsPerPage);
    } else {
      fetchConsumedData();
    }
  };

  const handleClearAll = () => {
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
    if (!orderBy) return filteredData;
    return [...filteredData].sort((a, b) => {
      let aVal = a[orderBy];
      let bVal = b[orderBy];
      if (orderBy === "sr" || orderBy === "quantity") {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else {
        aVal = String(aVal || "").toLowerCase();
        bVal = String(bVal || "").toLowerCase();
      }
      if (order === "asc") return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      else return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    });
  }, [filteredData, orderBy, order]);

  // ── Paginated Rows ─────────────────────────────────────────────────────────
  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, page, rowsPerPage]);

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
        chips.push({ id: "search", label: `Search: "${combinedSearch.trim()}"`, onRemove: () => setCombinedSearch("") });
      }
      selectedProductionSeries.forEach((s) => {
        chips.push({ id: `series-${s}`, label: `Series: ${s}`, onRemove: () => setSelectedProductionSeries((prev) => prev.filter((v) => v !== s)) });
      });
      selectedStatus.forEach((st) => {
        chips.push({ id: `status-${st}`, label: `Status: ${st}`, onRemove: () => setSelectedStatus((prev) => prev.filter((v) => v !== st)) });
      });
      if (dateFrom) {
        chips.push({ id: "dateFrom", label: `From: ${dateFrom}`, onRemove: () => setDateFrom("") });
      }
      if (dateTo) {
        chips.push({ id: "dateTo", label: `To: ${dateTo}`, onRemove: () => setDateTo("") });
      }
    } else {
      selectedLnItemCode.forEach((code) => {
        chips.push({ id: `ln-${code}`, label: `LN Code: ${code}`, onRemove: () => setSelectedLnItemCode((prev) => prev.filter((v) => v !== code)) });
      });
      selectedDrawing.forEach((dr) => {
        chips.push({ id: `dr-${dr}`, label: `Drawing: ${dr}`, onRemove: () => setSelectedDrawing((prev) => prev.filter((v) => v !== dr)) });
      });
      selectedProductionSeries.forEach((s) => {
        chips.push({ id: `series-${s}`, label: `Series: ${s}`, onRemove: () => setSelectedProductionSeries((prev) => prev.filter((v) => v !== s)) });
      });
      selectedPO.forEach((po) => {
        chips.push({ id: `po-${po}`, label: `Assembly No: ${po}`, onRemove: () => setSelectedPO((prev) => prev.filter((v) => v !== po)) });
      });
      if (idNumber.trim()) {
        chips.push({ id: "idNum", label: `ID: ${idNumber.trim()}`, onRemove: () => setIdNumber("") });
      }
    }

    return chips;
  }, [activeTab, combinedSearch, selectedProductionSeries, selectedStatus, dateFrom, dateTo, selectedPO, selectedLnItemCode, selectedDrawing, idNumber]);

  // ── Cell Content Renderer ──────────────────────────────────────────────────
  const renderCellContent = (colField: string, row: any, idx: number) => {
    if (colField === "sr") {
      return page * rowsPerPage + idx + 1;
    }

    if (colField === "componentType") {
      const type = (row.componentType || "").toUpperCase();
      switch (type) {
        case "ID":
          return <Chip icon={<QrCodeIcon fontSize="small" />} label="ID" size="small" color="primary" variant="outlined" sx={{ height: 22, fontSize: "0.725rem" }} />;
        case "BATCH":
          return <Chip icon={<InventoryIcon fontSize="small" />} label="BATCH" size="small" color="secondary" variant="outlined" sx={{ height: 22, fontSize: "0.725rem" }} />;
        case "FIM":
          return <Chip icon={<CategoryIcon fontSize="small" />} label="FIM" size="small" color="success" variant="outlined" sx={{ height: 22, fontSize: "0.725rem" }} />;
        case "SI":
          return <Chip icon={<SettingsIcon fontSize="small" />} label="SI" size="small" color="warning" variant="outlined" sx={{ height: 22, fontSize: "0.725rem" }} />;
        default:
          return <Chip label={type || "N/A"} size="small" variant="outlined" sx={{ height: 22, fontSize: "0.725rem" }} />;
      }
    }

    if (colField === "status") {
      if (activeTab === "precheck") {
        // Precheck tab: REJECTED / ACTIVE chip
        return row.isRejected ? (
          <Chip label="REJECTED" size="small" sx={{ backgroundColor: "#FEF3F2", color: "#B42318", fontWeight: 700, fontSize: "0.725rem", height: 22, letterSpacing: "0.02em" }} />
        ) : (
          <Chip label="ACTIVE" size="small" sx={{ backgroundColor: "#ECFDF3", color: "#027A48", fontWeight: 700, fontSize: "0.725rem", height: 22, letterSpacing: "0.02em" }} />
        );
      } else {
        // Consumed tab: existing chip logic
        return row.status === "Rejected" ? (
          <Chip label="Rejected" size="small" sx={{ backgroundColor: "#FEF3F2", color: "#B42318", fontWeight: 700, fontSize: "0.725rem", height: 22 }} />
        ) : (
          <Chip label="Completed" size="small" sx={{ backgroundColor: "#ECFDF3", color: "#027A48", fontWeight: 700, fontSize: "0.725rem", height: 22 }} />
        );
      }
    }

    if (colField === "isRejected") {
      const isRej = row.isRejected === true || row.isRejected === "Yes" || row.isRejected === "Rejected";
      return isRej ? (
        <Chip label="Yes" size="small" sx={{ backgroundColor: "#FEF3F2", color: "#B42318", fontWeight: 700, fontSize: "0.725rem", height: 22 }} />
      ) : (
        <Chip label="No" size="small" sx={{ backgroundColor: "#ECFDF3", color: "#027A48", fontWeight: 700, fontSize: "0.725rem", height: 22 }} />
      );
    }

    // Details column (3-dots menu icon matching ViewComponents)
    if (colField === "details") {
      const rowKey = row.id ?? row.sr;
      const isExpanded = expandedRows.has(rowKey);
      return (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setMenuAnchorEl(e.currentTarget);
            setActiveMenuRow(row);
          }}
          sx={{
            color: "text.muted",
            p: 0.5,
            "&:hover": { backgroundColor: "grey.100", color: "text.primary" },
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      );
    }

    if (colField === "actions") {
      return (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRow(row);
              setDetailDialogOpen(true);
            }}
            sx={{
              borderColor: "#D0D5DD",
              color: "primary.main",
              fontWeight: 600,
              fontSize: "0.75rem",
              borderRadius: "6px",
              py: 0.25,
              px: 1,
              minWidth: "auto",
              height: 26,
              textTransform: "none",
              "&:hover": { borderColor: "primary.main", backgroundColor: "#F4EBFF" },
            }}
          >
            View
          </Button>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setMenuAnchorEl(e.currentTarget);
              setActiveMenuRow(row);
            }}
            sx={{ color: "#667085", p: 0.25 }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      );
    }

    return row[colField] ?? "";
  };

  // ── JSX ────────────────────────────────────────────────────────────────────
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
          </Box>

          <Button
            variant="outlined"
            size="small"
            startIcon={isDownloading ? <CircularProgress size={16} color="inherit" /> : <FileDownloadIcon fontSize="small" />}
            onClick={handleExport}
            disabled={isDownloading}
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
        </Stack>
      )}

      {/* 2. Tabs Bar */}
      <Box sx={{ borderBottom: "1px solid #EAECF0", mb: 0.5 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => {
            setActiveTab(newValue);
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
        <Box sx={{ p: 1, pb: 0.5, borderBottom: "1px solid #EAECF0" }}>
          {/* ── Precheck Tab Filters ─────────────────────────────────────────── */}
          {activeTab === "precheck" && (
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
                py: 0.25,
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
                }}
                sx={{
                  flex: "1 1 200px",
                  minWidth: 160,
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
                type="date"
                placeholder="From Date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                inputProps={{ title: "From Date" }}
                sx={{
                  flex: "0 0 148px",
                  minWidth: 140,
                  "& .MuiOutlinedInput-root": {
                    height: 38,
                  },
                  "& .MuiOutlinedInput-input": {
                    py: "8.5px",
                    px: 1.5,
                    fontSize: "0.82rem",
                    color: dateFrom ? "#344054" : "#98A2B3",
                  },
                }}
              />

              {/* Date To */}
              <TextField
                size="small"
                type="date"
                placeholder="To Date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                inputProps={{ title: "To Date" }}
                sx={{
                  flex: "0 0 148px",
                  minWidth: 140,
                  "& .MuiOutlinedInput-root": {
                    height: 38,
                  },
                  "& .MuiOutlinedInput-input": {
                    py: "8.5px",
                    px: 1.5,
                    fontSize: "0.82rem",
                    color: dateTo ? "#344054" : "#98A2B3",
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
                variant="text"
                onClick={handleClearAll}
                sx={{
                  flex: "0 0 auto",
                  color: "#667085",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  height: 38,
                  px: 1,
                  minWidth: 55,
                  textTransform: "none",
                  "&:hover": { color: "#101828", backgroundColor: "transparent" },
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
                py: 0.25,
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              {/* 1. LN Item Code */}
              <MultiSelectFilter
                label="LN Item Code"
                value={selectedLnItemCode}
                options={lnItemCodeOptions}
                onChange={(newValue) => {
                  setSelectedLnItemCode(newValue);
                  setPage(0);
                }}
                flex="0 0 160px"
                minWidth={130}
              />

              {/* 2. Drawing Number */}
              <MultiSelectFilter
                label="Drawing No."
                value={selectedDrawing}
                options={drawingOptions}
                onChange={(newValue) => {
                  setSelectedDrawing(newValue);
                  setPage(0);
                }}
                flex="0 0 170px"
                minWidth={140}
              />

              {/* 3. Production Series */}
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

              {/* 4. Assembly No */}
              <MultiSelectFilter
                label="Assembly No"
                value={selectedPO}
                options={poOptions}
                onChange={(newValue) => {
                  setSelectedPO(newValue);
                  setPage(0);
                }}
                flex="0 0 150px"
                minWidth={120}
              />

              {/* 5. ID Number */}
              <TextField
                placeholder="ID Number..."
                size="small"
                variant="outlined"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                sx={{
                  flex: "0 0 130px",
                  minWidth: 100,
                  "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.85rem", height: 38 },
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
                  fontSize: "0.85rem",
                  borderRadius: "8px",
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
                variant="text"
                onClick={handleClearAll}
                sx={{
                  flex: "0 0 auto",
                  color: "#667085",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  height: 38,
                  minWidth: 55,
                  textTransform: "none",
                  "&:hover": { color: "#101828", backgroundColor: "transparent" },
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
        <TableContainer sx={{ overflowX: "auto", maxHeight: "calc(100vh - 290px)" }}>
          <Table stickyHeader size="small">
            {/* Table Head */}
            <TableHead>
              <TableRow sx={{ backgroundColor: "grey.50", height: 42 }}>
                {visibleColumns.map((col) => {
                  const isSortActive = orderBy === col.field;
                  return (
                    <TableCell
                      key={col.field}
                      align={col.align || "center"}
                      sx={{
                        fontWeight: 600,
                        color: "text.primary",
                        fontSize: "0.8rem",
                        py: 1,
                        px: 1.5,
                        borderBottom: "1px solid",
                        borderColor: "grey.200",
                        minWidth: col.minWidth || "auto",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col.sortable !== false ? (
                        <TableSortLabel
                          active={isSortActive}
                          direction={isSortActive ? order : "asc"}
                          onClick={() => handleRequestSort(col.field)}
                          sx={{
                            fontWeight: 600,
                            color: isSortActive ? "primary.main" : "text.primary",
                            "& .MuiTableSortLabel-icon": { color: "primary.main !important" },
                          }}
                        >
                          {col.headerName}
                        </TableSortLabel>
                      ) : (
                        col.headerName
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>

            {/* Table Body */}
            <TableBody>
              {isPrecheckLoading || isConsumedLoading ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : paginatedRows.length > 0 ? (
                paginatedRows.map((row: any, idx: number) => {
                  const rowKey = row.id ?? row.sr;
                  const isExpanded = activeTab === "precheck" && expandedRows.has(rowKey);

                  return (
                    <React.Fragment key={rowKey ?? idx}>
                      {/* Main row */}
                      <TableRow
                        hover
                        sx={{
                          height: 40,
                          "&:hover": { backgroundColor: "grey.50" },
                        }}
                      >
                        {visibleColumns.map((col) => (
                          <TableCell
                            key={col.field}
                            align={col.align || "center"}
                            sx={{
                              fontSize: "0.8rem",
                              color: "#344054",
                              py: 0.75,
                              px: 1.5,
                              borderBottom: "1px solid",
                              borderColor: "grey.100",
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

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogTitle
          sx={{ pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <Typography variant="h6" fontWeight="700" color="primary.main">
            Precheck Record Details
          </Typography>
          <IconButton size="small" onClick={() => setDetailDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2 }}>
          {selectedRow && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">PO Number</Typography>
                <Typography variant="body2" fontWeight="600">
                  {selectedRow.productionOrderNumber || selectedRow.poNumber || "-"}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Drawing Number</Typography>
                <Typography variant="body2" fontWeight="600">
                  {selectedRow.drawingNumber || selectedRow.consumedInDrawingNumber || "-"}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">LN Item Code</Typography>
                <Typography variant="body2" fontWeight="600">
                  {selectedRow.lnItemCode || "-"}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">ID Number</Typography>
                <Typography variant="body2" fontWeight="600">
                  {selectedRow.idNumber || "-"}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Quantity</Typography>
                <Typography variant="body2" fontWeight="600">
                  {selectedRow.quantity || "-"}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Typography variant="body2" fontWeight="600" color="primary.main">
                  {selectedRow.isRejected ? "Rejected" : selectedRow.isPrecheckComplete ? "Completed" : "Active"}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">IR Number</Typography>
                <Typography variant="body2" fontWeight="600">
                  {selectedRow.irNumber || "-"}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">MSN Number</Typography>
                <Typography variant="body2" fontWeight="600">
                  {selectedRow.msnNumber || "-"}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">MRIR Number</Typography>
                <Typography variant="body2" fontWeight="600">
                  {selectedRow.mrirNumber || "-"}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Nomenclature</Typography>
                <Typography variant="body2" fontWeight="600">
                  {selectedRow.nomenclature || "-"}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Remarks</Typography>
                <Typography variant="body2" fontWeight="600">
                  {selectedRow.remarks || "-"}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Verified / Created By</Typography>
                <Typography variant="body2" fontWeight="600">
                  {selectedRow.username || "-"}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button
            variant="contained"
            size="small"
            onClick={() => setDetailDialogOpen(false)}
            sx={{ borderRadius: "8px", backgroundColor: "primary.main", textTransform: "none", fontWeight: 600 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Row Kebab Overflow Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
        transitionDuration={0}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{ sx: { minWidth: 110, borderRadius: "6px", py: 0.25 } }}
      >
        <MenuItem
          onClick={() => {
            setMenuAnchorEl(null);
            if (activeMenuRow) {
              const rowKey = activeMenuRow.id ?? activeMenuRow.sr;
              toggleRowExpand(rowKey);
            }
          }}
          sx={{ py: 0.35, px: 1, minHeight: 28 }}
        >
          <ListItemIcon sx={{ minWidth: 20, "& .MuiSvgIcon-root": { fontSize: 15 } }}>
            {activeMenuRow && expandedRows.has(activeMenuRow.id ?? activeMenuRow.sr) ? (
              <KeyboardArrowUpIcon color="primary" />
            ) : (
              <KeyboardArrowDownIcon />
            )}
          </ListItemIcon>
          <ListItemText
            primary={
              activeMenuRow && expandedRows.has(activeMenuRow.id ?? activeMenuRow.sr)
                ? "Hide Details"
                : "View Details"
            }
            primaryTypographyProps={{ fontSize: "0.725rem", fontWeight: 500 }}
          />
        </MenuItem>

        <MenuItem
          onClick={() => {
            setMenuAnchorEl(null);
            if (activeMenuRow) {
              setSelectedRow(activeMenuRow);
              setDetailDialogOpen(true);
            }
          }}
          sx={{ py: 0.35, px: 1, minHeight: 28 }}
        >
          <ListItemIcon sx={{ minWidth: 20, "& .MuiSvgIcon-root": { fontSize: 15 } }}>
            <VisibilityIcon color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="View Record"
            primaryTypographyProps={{ fontSize: "0.725rem", fontWeight: 500 }}
          />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ViewPrecheck;
