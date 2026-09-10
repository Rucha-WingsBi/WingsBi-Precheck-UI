import React, { useState, useMemo } from "react";
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
  Checkbox,
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
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
} from "@mui/icons-material";
import { CustomPagination } from "../../components/CustomPagination";

import {
  viewPrecheckDetails,
  exportPrecheckDetails,
} from "../../store/slices/precheckSlice";
import {
  getConsumedIn,
  exportConsumedIn,
} from "../../store/slices/qrcodeSlice";
import {
  useProductionSeries,
  useAllDrawingNumbers,
} from "../../hooks/useMasterData";
import {
  usePONumbers,
  type ProductionOrderMaster,
} from "../../hooks/usePONumbers";
import { MultiSelectFilter } from "../../components/MultiSelectFilter";
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
  const [statusFilter, setStatusFilter] = useState<string>("");    // Pending | Partial | Completed
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // ── Consumed tab / shared filter states ───────────────────────────────────
  const [selectedLnItemCode, setSelectedLnItemCode] = useState<string | null>(null);
  const [idNumber, setIdNumber] = useState("");
  const [selectedProductionSeries, setSelectedProductionSeries] = useState<Array<string | number>>([]);

  // ── Master data hooks ──────────────────────────────────────────────────────
  const { data: productionSeriesData = [] } = useProductionSeries();
  const { data: allDrawingNumbers = [] } = useAllDrawingNumbers();

  const [selectedPO, setSelectedPO] = useState<ProductionOrderMaster | null>(null);
  const [poSearchText, setPOSearchText] = useState("");
  const debouncedPOSearch = useDebounce(poSearchText, 400);
  const { data: poNumbers = [] } = usePONumbers(debouncedPOSearch);

  const [selectedDrawing, setSelectedDrawing] = useState<any>(null);

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

  // ── Fetch Precheck Details from API ───────────────────────────────────────
  const fetchPrecheckData = () => {
    const params: any = {};
    if (selectedProductionSeries.length > 0) {
      params.ProductionSeriesId = Number(selectedProductionSeries[0]);
    }
    if (combinedSearch.trim()) {
      params.SearchTerm = combinedSearch.trim();
    }
    if (statusFilter) {
      params.Status = statusFilter;
    }
    if (dateFrom) {
      params.FromDate = dateFrom;
    }
    if (dateTo) {
      params.ToDate = dateTo;
    }

    dispatch(viewPrecheckDetails(params))
      .then((result: any) => {
        if (result.payload && Array.isArray(result.payload)) {
          const mapped = result.payload.map((item: any, index: number) => ({
            ...item,
            id: item.id ?? index + 1,
            sr: index + 1,
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
        }
      })
      .catch(() => setPrecheckResults([]));
  };

  // ── Fetch Consumed In Details from API ────────────────────────────────────
  const fetchConsumedData = () => {
    const params: any = {};
    if (selectedProductionSeries.length > 0) {
      params.ProdSeriesId = Number(selectedProductionSeries[0]);
    }
    if (idNumber.trim()) {
      params.IdNumber = parseInt(idNumber.trim());
    }
    if (selectedDrawing?.id || selectedDrawing?.drawingNumberId) {
      params.DrawingNumberId = selectedDrawing.id || selectedDrawing.drawingNumberId;
    }
    if (selectedPO?.productionOrderNumber) {
      params.ProductionOrderNumber = selectedPO.productionOrderNumber;
    }
    if (selectedLnItemCode) {
      params.LnItemCode = selectedLnItemCode;
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
      const exportParams: any = {};
      if (selectedProductionSeries.length > 0) {
        exportParams.productionSeriesId = Number(selectedProductionSeries[0]);
      }
      if (combinedSearch.trim()) {
        exportParams.searchTerm = combinedSearch.trim();
      }
      if (statusFilter) {
        exportParams.status = statusFilter;
      }
      if (dateFrom) {
        exportParams.fromDate = dateFrom;
      }
      if (dateTo) {
        exportParams.toDate = dateTo;
      }
      dispatch(exportPrecheckDetails(exportParams))
        .unwrap()
        .catch((err) => alert(err.message || "Failed to export precheck details"));
    } else {
      if (!selectedDrawing || selectedProductionSeries.length === 0) {
        alert("Please select both Drawing Number and Production Series before exporting");
        return;
      }
      const params: any = {
        ProdSeriesId: Number(selectedProductionSeries[0]),
        DrawingNumberId: selectedDrawing.id || selectedDrawing.drawingNumberId,
      };
      if (idNumber) params.IdNumber = parseInt(idNumber);
      if (selectedPO?.productionOrderNumber) params.ProductionOrderNumber = selectedPO.productionOrderNumber;
      if (selectedLnItemCode) params.LnItemCode = selectedLnItemCode;
      dispatch(exportConsumedIn(params));
    }
  };

  const handleApplyFilters = () => {
    setPage(0);
    if (activeTab === "precheck") {
      fetchPrecheckData();
    } else {
      fetchConsumedData();
    }
  };

  const handleClearAll = () => {
    // Precheck filters
    setCombinedSearch("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
    // Consumed / shared filters
    setSelectedPO(null);
    setSelectedLnItemCode(null);
    setSelectedDrawing(null);
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

  // LN Item Codes available in consumed results (for consumed-tab autocomplete)
  const availableLnItemCodes = useMemo(() => {
    const set = new Set<string>();
    consumedResults.forEach((row) => {
      if (row.lnItemCode && row.lnItemCode !== "-") set.add(row.lnItemCode);
    });
    return Array.from(set).sort();
  }, [consumedResults]);

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

  // ── Series options ─────────────────────────────────────────────────────────
  const seriesOptions = useMemo(() => {
    return productionSeriesData.map((s: any) => ({
      id: s.id || s.productionSeries,
      label: s.productionSeries || String(s),
    }));
  }, [productionSeriesData]);



  // ── Active Filter Chips ────────────────────────────────────────────────────
  const activeChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onRemove: () => void }> = [];

    if (activeTab === "precheck") {
      if (combinedSearch.trim()) {
        chips.push({ id: "search", label: `Search: "${combinedSearch.trim()}"`, onRemove: () => setCombinedSearch("") });
      }
      selectedProductionSeries.forEach((ser) => {
        chips.push({
          id: `series_${ser}`,
          label: `Series: ${ser}`,
          onRemove: () => setSelectedProductionSeries((prev) => prev.filter((s) => s !== ser)),
        });
      });
      if (statusFilter) {
        chips.push({ id: "status", label: `Status: ${statusFilter}`, onRemove: () => setStatusFilter("") });
      }
      if (dateFrom) {
        chips.push({ id: "dateFrom", label: `From: ${dateFrom}`, onRemove: () => setDateFrom("") });
      }
      if (dateTo) {
        chips.push({ id: "dateTo", label: `To: ${dateTo}`, onRemove: () => setDateTo("") });
      }
    } else {
      if (selectedPO) {
        chips.push({ id: "po", label: `PO: ${selectedPO.productionOrderNumber}`, onRemove: () => setSelectedPO(null) });
      }
      if (selectedLnItemCode) {
        chips.push({ id: "lnItemCode", label: `LN Code: ${selectedLnItemCode}`, onRemove: () => setSelectedLnItemCode(null) });
      }
      if (selectedDrawing) {
        chips.push({ id: "drawing", label: `Drawing: ${selectedDrawing.drawingNumber || selectedDrawing.lnItemCode}`, onRemove: () => setSelectedDrawing(null) });
      }
      selectedProductionSeries.forEach((ser) => {
        chips.push({
          id: `series_${ser}`,
          label: `Series: ${ser}`,
          onRemove: () => setSelectedProductionSeries((prev) => prev.filter((s) => s !== ser)),
        });
      });
      if (idNumber.trim()) {
        chips.push({ id: "idNum", label: `ID: ${idNumber.trim()}`, onRemove: () => setIdNumber("") });
      }
    }

    return chips;
  }, [activeTab, combinedSearch, selectedProductionSeries, statusFilter, dateFrom, dateTo, selectedPO, selectedLnItemCode, selectedDrawing, idNumber]);

  // ── Pagination helpers ─────────────────────────────────────────────────────
  const startRow = filteredData.length === 0 ? 0 : page * rowsPerPage + 1;
  const endRow = Math.min(filteredData.length, (page + 1) * rowsPerPage);
  const maxPage = Math.max(0, Math.ceil(filteredData.length / rowsPerPage) - 1);

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

    // Expand / collapse button (precheck tab Details column)
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
            p: 0.5,
            color: isExpanded ? "primary.main" : "#667085",
            border: `1px solid ${isExpanded ? "#6B288A" : "#E9EAEB"}`,
            borderRadius: "6px",
            transition: "all 0.18s",
            "&:hover": { backgroundColor: "#F4EBFF", color: "primary.main", borderColor: "primary.main" },
          }}
        >
          {isExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
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
        py: hideHeader ? 0 : { xs: 1.5, sm: 2 },
        px: hideHeader ? 0 : { xs: 1.5, sm: 2.5 },
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
          spacing={2}
          sx={{ mb: 1.5 }}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "primary.main",
                fontSize: { xs: "1.25rem", sm: "1.5rem" },
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
              height: 34,
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
      <Box sx={{ borderBottom: "1px solid #EAECF0", mb: 1.25 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => {
            setActiveTab(newValue);
            setPage(0);
          }}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            minHeight: 36,
            "& .MuiTab-root": {
              fontWeight: 600,
              fontSize: "0.85rem",
              textTransform: "none",
              minWidth: 100,
              py: 0.75,
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
          mb: 2,
        }}
      >
        {/* Section 1: Filter Bar & Active Chips */}
        <Box sx={{ p: 1.25, pb: 0.75, borderBottom: "1px solid #EAECF0" }}>
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
                py: 0.25,
                "&::-webkit-scrollbar": { height: 6 },
                "&::-webkit-scrollbar-thumb": { backgroundColor: "#D0D5DD", borderRadius: 3 },
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

              {/* Production Series MultiSelect */}
              <MultiSelectFilter
                label="Prod Series"
                value={selectedProductionSeries}
                options={seriesOptions}
                onChange={(newValue) => setSelectedProductionSeries(newValue)}
                flex="0 0 130px"
                minWidth={110}
              />

              {/* Status */}
              <FormControl size="small" sx={{ flex: "0 0 120px", minWidth: 100 }}>
                <Select
                  displayEmpty
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                  sx={{
                    fontSize: "0.82rem",
                    height: 38,
                  }}
                  renderValue={(val) =>
                    val ? (
                      <Typography sx={{ fontSize: "0.82rem", color: "#344054" }}>{val}</Typography>
                    ) : (
                      <Typography sx={{ fontSize: "0.82rem", color: "#98A2B3" }}>Status</Typography>
                    )
                  }
                >
                  <MenuItem value=""><em style={{ fontSize: "0.82rem" }}>All Statuses</em></MenuItem>
                  <MenuItem value="Pending"   sx={{ fontSize: "0.82rem" }}>Pending</MenuItem>
                  <MenuItem value="Partial"   sx={{ fontSize: "0.82rem" }}>Partial</MenuItem>
                  <MenuItem value="Completed" sx={{ fontSize: "0.82rem" }}>Completed</MenuItem>
                </Select>
              </FormControl>

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
                  minWidth: 145,
                  "& .MuiOutlinedInput-input": {
                    py: 0.75,
                    px: 1,
                    fontSize: "0.82rem",
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
                  minWidth: 145,
                  "& .MuiOutlinedInput-input": {
                    py: 0.75,
                    px: 1,
                    fontSize: "0.82rem",
                  },
                }}
              />

              {/* Apply Button */}
              <Button
                size="small"
                variant="contained"
                onClick={handleApplyFilters}
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
                py: 0.25,
                "&::-webkit-scrollbar": { height: 6 },
                "&::-webkit-scrollbar-thumb": { backgroundColor: "#D0D5DD", borderRadius: 3 },
              }}
            >
              {/* PO Number */}
              <Autocomplete
                size="small"
                options={poNumbers || []}
                getOptionLabel={(option) =>
                  typeof option === "string" ? option : option.productionOrderNumber || ""
                }
                value={selectedPO}
                onInputChange={(_, value) => setPOSearchText(value)}
                onChange={(_, newValue) => {
                  if (newValue && typeof newValue !== "string") {
                    setSelectedPO(newValue);
                  } else {
                    setSelectedPO(null);
                  }
                  setPage(0);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="PO Number"
                    placeholder="PO Number"
                    size="small"
                  />
                )}
                sx={{ flex: "0 0 170px", minWidth: 140 }}
              />

              {/* LN Item Code */}
              <Autocomplete
                size="small"
                options={availableLnItemCodes}
                value={selectedLnItemCode}
                onChange={(_, newValue) => { setSelectedLnItemCode(newValue); setPage(0); }}
                renderInput={(params) => (
                  <TextField {...params} placeholder="LN Item Code" size="small" />
                )}
                sx={{
                  flex: "0 0 150px",
                  minWidth: 120,
                }}
              />

              {/* Drawing Number */}
              <Autocomplete
                size="small"
                options={allDrawingNumbers}
                getOptionLabel={(option: any) =>
                  typeof option === "string" ? option : option.drawingNumber || option.lnItemCode || ""
                }
                value={selectedDrawing}
                onChange={(_, value) => { setSelectedDrawing(value); setPage(0); }}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Drawing Number" size="small" />
                )}
                sx={{
                  flex: "0 0 160px",
                  minWidth: 130,
                }}
              />

              {/* Production Series */}
              <MultiSelectFilter
                label="Prod Series"
                value={selectedProductionSeries}
                options={seriesOptions}
                onChange={(newValue) => setSelectedProductionSeries(newValue)}
                flex="0 0 130px"
                minWidth={110}
              />

              {/* ID Number */}
              <TextField
                placeholder="ID Number..."
                size="small"
                variant="outlined"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                sx={{
                  flex: "0 0 120px",
                  minWidth: 100,
                  "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.85rem", height: 38 },
                }}
              />

              {/* Apply */}
              <Button
                size="small"
                variant="contained"
                onClick={handleApplyFilters}
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

              {/* Clear */}
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
              <TableRow sx={{ height: 42 }}>
                {visibleColumns.map((col) => {
                  const isSortActive = orderBy === col.field;
                  return (
                    <TableCell
                      key={col.field}
                      align={col.align || "center"}
                      sx={{
                        fontWeight: 700,
                        color: "#475467",
                        backgroundColor: "#F9FAFB",
                        fontSize: "0.8rem",
                        py: 1,
                        px: 1.5,
                        borderBottom: "1px solid #EAECF0",
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
                            fontWeight: 700,
                            color: isSortActive ? "primary.main" : "#475467",
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
                          "&:hover": { backgroundColor: "#F9FAFB" },
                        }}
                      >
                        {visibleColumns.map((col) => (
                          <TableCell
                            key={col.field}
                            align={col.align || "center"}
                            sx={{
                              fontSize: "0.85rem",
                              color: "#344054",
                              py: 0.75,
                              px: 1.5,
                              borderBottom: isExpanded ? "none" : "1px solid #F2F4F7",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {renderCellContent(col.field, row, idx)}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Expanded sub-table (precheck tab only) */}
                      {activeTab === "precheck" && (
                        <TableRow sx={{ backgroundColor: "#F8F9FC" }}>
                          <TableCell
                            colSpan={visibleColumns.length}
                            sx={{ py: 0, px: 0, borderBottom: isExpanded ? "1px solid #E9EAEB" : "none" }}
                          >
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box sx={{ px: 5, py: 1.25 }}>
                                <Table
                                  size="small"
                                  sx={{
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                    border: "1px solid #E4DAF5",
                                  }}
                                >
                                  <TableHead>
                                    <TableRow sx={{ backgroundColor: "#EDE9F6" }}>
                                      <TableCell
                                        sx={{
                                          fontWeight: 700,
                                          color: "#6B288A",
                                          fontSize: "0.78rem",
                                          py: 0.75,
                                          px: 1.5,
                                          borderBottom: "1px solid #D9D3E8",
                                        }}
                                      >
                                        Remarks
                                      </TableCell>
                                      <TableCell
                                        sx={{
                                          fontWeight: 700,
                                          color: "#6B288A",
                                          fontSize: "0.78rem",
                                          py: 0.75,
                                          px: 1.5,
                                          borderBottom: "1px solid #D9D3E8",
                                        }}
                                      >
                                        User
                                      </TableCell>
                                      <TableCell
                                        sx={{
                                          fontWeight: 700,
                                          color: "#6B288A",
                                          fontSize: "0.78rem",
                                          py: 0.75,
                                          px: 1.5,
                                          borderBottom: "1px solid #D9D3E8",
                                        }}
                                      >
                                        Date
                                      </TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    <TableRow sx={{ backgroundColor: "#FAFBFF" }}>
                                      <TableCell sx={{ fontSize: "0.83rem", color: "#344054", py: 0.85, px: 1.5 }}>
                                        {row.remarks || <Typography component="span" sx={{ color: "#98A2B3", fontStyle: "italic", fontSize: "0.82rem" }}>No remarks</Typography>}
                                      </TableCell>
                                      <TableCell sx={{ fontSize: "0.83rem", color: "#344054", py: 0.85, px: 1.5 }}>
                                        {row.username || "-"}
                                      </TableCell>
                                      <TableCell sx={{ fontSize: "0.83rem", color: "#344054", py: 0.85, px: 1.5 }}>
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
                <TableRow>
                  <TableCell colSpan={visibleColumns.length} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" sx={{ color: "#667085" }}>
                      No records found matching the current criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Section 3: Footer Pagination */}
        <CustomPagination
          page={page}
          pageSize={rowsPerPage}
          totalCount={filteredData.length}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setRowsPerPage(newSize);
            setPage(0);
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
        PaperProps={{ sx: { minWidth: 150, borderRadius: "8px", py: 0.5 } }}
      >
        <MenuItem
          onClick={() => {
            setMenuAnchorEl(null);
            if (activeMenuRow) {
              setSelectedRow(activeMenuRow);
              setDetailDialogOpen(true);
            }
          }}
        >
          <ListItemIcon>
            <VisibilityIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="View Details"
            primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 500 }}
          />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ViewPrecheck;
