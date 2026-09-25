import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Stack,
  InputAdornment,
  IconButton,
  Chip,
  Tooltip,
} from "@mui/material";
import { CustomPagination } from "../../components/CustomPagination";
import { EmptyState } from "../../components/EmptyState";
import { MultiSelectFilter } from "../../components/MultiSelectFilter";
import { ComponentTypeChip } from "../../components/ComponentTypeChip";

import {
  Search as SearchIcon,
  CalendarToday as CalendarTodayIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import api from "../../services/api";
import { useProductionSeries } from "../../hooks/useMasterData";
import { useDebounce } from "../../hooks/useDebounce";
import { SortableTableHeader } from "../../components/SortableTableHeader";

const StoredInComponents = React.lazy(() => import("./StoredInComponents"));

// Helper function to format date
const formatDateToIST = (dateString: string | undefined | null) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
};

// Helper function to render status badge in QR table
const renderQrStatusBadge = (statusStr: string | undefined) => {
  const status = (statusStr || "N/A").toLowerCase();
  let bg = "#f4f5f7";
  let color = "#344054";
  let borderColor = "#d0d5dd";

  if (status.includes("available") || status.includes("ready") || status.includes("complete")) {
    bg = "#ecfdf5";
    color = "#047857";
    borderColor = "#a7f3d0";
  } else if (status.includes("pending") || status.includes("hold")) {
    bg = "#fffbeb";
    color = "#d97706";
    borderColor = "#fde68a";
  } else if (status.includes("used") || status.includes("consumed")) {
    bg = "#eff6ff";
    color = "#2563eb";
    borderColor = "#bfdbfe";
  } else if (status.includes("reject") || status.includes("scrap")) {
    bg = "#fef2f2";
    color = "#b91c1c";
    borderColor = "#fecaca";
  }

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.25,
        py: 0.25,
        borderRadius: "12px",
        bgcolor: bg,
        color: color,
        border: `1px solid ${borderColor}`,
        fontWeight: 600,
        fontSize: "0.75rem",
        whiteSpace: "nowrap",
      }}
    >
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          bgcolor: color,
        }}
      />
      {statusStr || "N/A"}
    </Box>
  );
};

const AvailableInStore: React.FC<{ hideHeader?: boolean }> = ({ hideHeader = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [storeTab, setStoreTab] = useState<"available" | "stored">(
    hideHeader ? "available" : (location.pathname.includes("stored") || location.pathname.includes("store-in") ? "stored" : "available")
  );

  // Tab state: 1 = RM Store, 2 = RFG Store
  const [activeTab, setActiveTab] = useState<number>(1);

  // Production Series hook for filter
  const { data: productionSeriesList = [] } = useProductionSeries();
  const seriesOptions = useMemo(() => {
    return productionSeriesList.map((s: any) => ({
      id: s.id || s.productionSeries,
      label: s.productionSeries || String(s),
    }));
  }, [productionSeriesList]);

  // Search filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeries, setSelectedSeries] = useState<(string | number)[]>([]);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [fromDateFocused, setFromDateFocused] = useState(false);
  const [toDateFocused, setToDateFocused] = useState(false);

  // Pagination states for BOM Items table
  const [bomPage, setBomPage] = useState(0);
  const [bomRowsPerPage, setBomRowsPerPage] = useState(10);

  // Pagination states for Available QR Codes table
  const [qrPage, setQrPage] = useState(0);
  const [qrRowsPerPage, setQrRowsPerPage] = useState(10);

  // States for double-clicked available components overriding the right-side table
  const [overrideQrCodes, setOverrideQrCodes] = useState<any[] | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);


  // Active Filter Chips
  const activeChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onRemove: () => void }> = [];

    if (searchQuery.trim()) {
      chips.push({
        id: "searchQuery",
        label: `Search: "${searchQuery.trim()}"`,
        onRemove: () => setSearchQuery(""),
      });
    }
    selectedSeries.forEach((ser) => {
      const match = seriesOptions.find((s) => String(s.id) === String(ser) || s.label === String(ser));
      const labelStr = match ? match.label : String(ser);
      chips.push({
        id: `series_${ser}`,
        label: `Series: ${labelStr}`,
        onRemove: () => setSelectedSeries((prev) => prev.filter((s) => s !== ser)),
      });
    });
    if (fromDate && toDate) {
      chips.push({
        id: "dateRange",
        label: `From: ${format(fromDate, "dd/MM/yyyy")} - To: ${format(toDate, "dd/MM/yyyy")}`,
        onRemove: () => {
          setFromDate(null);
          setToDate(null);
          handleSearch(searchQuery, activeTab, selectedSeries, undefined, undefined, null, null);
        },
      });
    } else if (fromDate) {
      chips.push({
        id: "fromDateChip",
        label: `From: ${format(fromDate, "dd/MM/yyyy")}`,
        onRemove: () => {
          setFromDate(null);
          handleSearch(searchQuery, activeTab, selectedSeries, undefined, undefined, null, toDate);
        },
      });
    } else if (toDate) {
      chips.push({
        id: "toDateChip",
        label: `To: ${format(toDate, "dd/MM/yyyy")}`,
        onRemove: () => {
          setToDate(null);
          handleSearch(searchQuery, activeTab, selectedSeries, undefined, undefined, fromDate, null);
        },
      });
    }

    return chips;
  }, [searchQuery, selectedSeries, seriesOptions, fromDate, toDate]);

  // API Call and Result states
  const [masterData, setMasterData] = useState<any | null>(null);
  const [bomItems, setBomItems] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [selectedBomRowIndex, setSelectedBomRowIndex] = useState<number | null>(null);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [isServerPaginated, setIsServerPaginated] = useState<boolean>(false);

  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const qrCodes = useMemo(() => {
    if (selectedBomRowIndex === null || bomItems.length === 0) {
      return [];
    }
    const selectedComponent = bomItems[selectedBomRowIndex];
    return results.filter((item: any) =>
      (item.drawingNumber || "").toLowerCase() === (selectedComponent.drawingNumber || "").toLowerCase() &&
      (item.lnItemCode || item.lnitemcode || "").toLowerCase() === (selectedComponent.lnitemcode || selectedComponent.lnItemCode || "").toLowerCase()
    ).map((item: any) => ({
      qrCodeNumber: item.qrCodeNumber || item.qrCode || "N/A",
      id: item.idNumber || item.id || "N/A",
      qty: item.quantity !== undefined ? item.quantity : 0,
      status: item.status || "N/A",
      location: item.location || "N/A",
    }));
  }, [results, bomItems, selectedBomRowIndex]);

  // Sorting states for BOM Items table
  const [bomSortColumn, setBomSortColumn] = useState<string | null>(null);
  const [bomSortDirection, setBomSortDirection] = useState<"asc" | "desc">("asc");

  const handleBomSort = (col: string) => {
    if (bomSortColumn === col) {
      setBomSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setBomSortColumn(col);
      setBomSortDirection("asc");
    }
  };

  const indexedBomItems = useMemo(() => {
    return bomItems.map((item: any, idx: number) => ({
      ...item,
      _srNo: idx + 1,
    }));
  }, [bomItems]);

  const sortedBomItems = useMemo(() => {
    if (!bomSortColumn) return indexedBomItems;
    return [...indexedBomItems].sort((a: any, b: any) => {
      let valA = a[bomSortColumn] ?? "";
      let valB = b[bomSortColumn] ?? "";

      if (bomSortColumn === "sr" || bomSortColumn === "srNo") {
        valA = a._srNo ?? 0;
        valB = b._srNo ?? 0;
      } else if (bomSortColumn === "lnitemcode" || bomSortColumn === "lnItemCode") {
        valA = a.lnitemcode || a.lnItemCode || "";
        valB = b.lnitemcode || b.lnItemCode || "";
      } else if (bomSortColumn === "drawingNumber") {
        valA = a.drawingNumber || "";
        valB = b.drawingNumber || "";
      } else if (bomSortColumn === "poNumber" || bomSortColumn === "productionOrderNumber") {
        valA = a.productionOrderNumber || a.poNumber || "";
        valB = b.productionOrderNumber || b.poNumber || "";
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return bomSortDirection === "asc" ? valA - valB : valB - valA;
      }
      const strA = String(valA || "").toLowerCase().trim();
      const strB = String(valB || "").toLowerCase().trim();
      return bomSortDirection === "asc"
        ? strA.localeCompare(strB, undefined, { numeric: true, sensitivity: "base" })
        : strB.localeCompare(strA, undefined, { numeric: true, sensitivity: "base" });
    });
  }, [indexedBomItems, bomSortColumn, bomSortDirection]);

  const paginatedBomItems = useMemo(() => {
    if (isServerPaginated) {
      return sortedBomItems;
    }
    const startIndex = bomPage * bomRowsPerPage;
    return sortedBomItems.slice(startIndex, startIndex + bomRowsPerPage);
  }, [sortedBomItems, bomPage, bomRowsPerPage, isServerPaginated]);

  // Sorting states for Available QR Codes table
  const [qrSortColumn, setQrSortColumn] = useState<string | null>(null);
  const [qrSortDirection, setQrSortDirection] = useState<"asc" | "desc">("asc");

  const handleQrSort = (col: string) => {
    if (qrSortColumn === col) {
      setQrSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setQrSortColumn(col);
      setQrSortDirection("asc");
    }
  };

  const displayQrCodes = useMemo(() => {
    if (overrideQrCodes !== null) {
      return overrideQrCodes;
    }
    return [];
  }, [overrideQrCodes]);

  const sortedQrCodes = useMemo(() => {
    if (!qrSortColumn) return displayQrCodes;
    return [...displayQrCodes].sort((a: any, b: any) => {
      let valA = a[qrSortColumn] ?? "";
      let valB = b[qrSortColumn] ?? "";

      if (qrSortColumn === "qrCodeNumber" || qrSortColumn === "qrCode") {
        valA = a.qrCodeNumber || a.qrCode || "";
        valB = b.qrCodeNumber || b.qrCode || "";
      } else if (qrSortColumn === "createdDate" || qrSortColumn === "createdAt" || qrSortColumn === "date") {
        valA = a.createdDate || a.createdAt || a.date ? new Date(a.createdDate || a.createdAt || a.date).getTime() : 0;
        valB = b.createdDate || b.createdAt || b.date ? new Date(b.createdDate || b.createdAt || b.date).getTime() : 0;
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return qrSortDirection === "asc" ? valA - valB : valB - valA;
      }
      const strA = String(valA || "").toLowerCase().trim();
      const strB = String(valB || "").toLowerCase().trim();
      return qrSortDirection === "asc"
        ? strA.localeCompare(strB, undefined, { numeric: true, sensitivity: "base" })
        : strB.localeCompare(strA, undefined, { numeric: true, sensitivity: "base" });
    });
  }, [displayQrCodes, qrSortColumn, qrSortDirection]);

  const paginatedQrCodes = useMemo(() => {
    const startIndex = qrPage * qrRowsPerPage;
    return sortedQrCodes.slice(startIndex, startIndex + qrRowsPerPage);
  }, [sortedQrCodes, qrPage, qrRowsPerPage]);

  // Keep references to satisfy TypeScript's noUnusedLocals compile check
  if (false as boolean) {
    console.log(qrCodes, results, masterData);
  }

  const handleSearch = async (
    overrideQuery?: string,
    overrideQrType?: number,
    overrideSeries?: (string | number)[],
    targetPage?: number,
    targetPageSize?: number,
    overrideFromDate?: Date | null,
    overrideToDate?: Date | null
  ) => {
    const queryStr = overrideQuery !== undefined ? overrideQuery : searchQuery;
    const qrType = overrideQrType !== undefined ? overrideQrType : activeTab;
    const seriesList = overrideSeries !== undefined ? overrideSeries : selectedSeries;
    const pNum = targetPage !== undefined ? targetPage : bomPage;
    const pSize = targetPageSize !== undefined ? targetPageSize : bomRowsPerPage;
    const fromDateVal = overrideFromDate !== undefined ? overrideFromDate : fromDate;
    const toDateVal = overrideToDate !== undefined ? overrideToDate : toDate;

    prevSearchQueryRef.current = queryStr?.trim() || "";

    setError(null);
    if (targetPage === undefined) {
      setBomPage(0);
      setQrPage(0);
      setOverrideQrCodes(null);
      setSelectedBomRowIndex(null);
    }
    setIsSearchLoading(true);
    setSearched(true);
    setResults([]);

    try {
      const seriesArr = seriesList
        .map((item: any) => {
          if (typeof item === "string") return item;
          const match = seriesOptions.find(
            (s) => String(s.id) === String(item) || s.label === String(item)
          );
          return match ? match.label : String(item);
        })
        .filter(Boolean);

      const pageNumber = pNum + 1;
      const pageSize = pSize;

      const searchPayload: any = {
        searchQuery: queryStr?.trim() || "",
        prodSeries: seriesArr,
        QrType: qrType,
        fromDate: fromDateVal ? format(fromDateVal, "yyyy-MM-dd") : null,
        toDate: toDateVal ? format(toDateVal, "yyyy-MM-dd") : null,
      };

      const response = await api.post(
        `/api/QRCode/GetAvailableQr?pageNumber=${pageNumber}&pageSize=${pageSize}`,
        searchPayload
      );

      const responseData = response.data;
      let qrCodesList: any[] | null = null;
      let totalCount = 0;

      if (Array.isArray(responseData)) {
        qrCodesList = responseData;
        totalCount = responseData.length;
        setIsServerPaginated(false);
      } else if (responseData && typeof responseData === "object") {
        if (Array.isArray(responseData.data)) {
          qrCodesList = responseData.data;
        } else if (Array.isArray(responseData.qrCodes)) {
          qrCodesList = responseData.qrCodes;
        }
        totalCount = responseData.totalRecords ?? (responseData.totalCount ?? (qrCodesList ? qrCodesList.length : 0));
        setIsServerPaginated(responseData.totalRecords !== undefined || responseData.totalPages !== undefined);
      }

      setTotalRecords(totalCount);

      if (qrCodesList) {
        setResults(qrCodesList);
        setMasterData(null);

        // Group by drawing/LN code to generate BOM items
        const map = new Map<string, any>();
        qrCodesList.forEach((item: any) => {
          const drawingNum = item.drawingNumber || item.drawingnumber || "N/A";
          const lnCode = item.lnItemCode || item.lnitemcode || "N/A";
          const key = `${drawingNum}-${lnCode}`.toLowerCase();

          if (!map.has(key)) {
            map.set(key, {
              id: item.drawingnumberId || item.drawingNumberId || item.id || 0,
              drawingnumberId: item.drawingnumberId || item.drawingNumberId || item.id || 0,
              prodSeriesId: item.prodseriesid || item.prodSeriesId || item.prodSeries || item.productionSeriesId || item.productionSeries || 0,
              productionSeries: item.productionSeries || item.prodSeries || "N/A",
              drawingNumber: drawingNum,
              lnitemcode: lnCode,
              lnItemCode: lnCode,
              componentType: item.componentType || item.componenttype || item.type || "N/A",
              poNumber: item.poNumber || item.poNo || item.purchaseOrderNumber || item.productionOrderNumber || "N/A",
              unit: item.unit || "NOS",
              totalQuantity: 0,
              availableQuantity: 0,
              totalQrQuantity: item.totalQrQuantity !== undefined && item.totalQrQuantity !== null ? item.totalQrQuantity : 0,
              totalQrNumber: item.totalQrNumber !== undefined && item.totalQrNumber !== null ? item.totalQrNumber : 0,
            });
          }
          const component = map.get(key);
          component.totalQuantity += Number(item.quantity) || 0;
          component.availableQuantity += Number(item.remainingQuantity) || 0;

          if (item.totalQrQuantity !== undefined && item.totalQrQuantity !== null) {
            component.totalQrQuantity = item.totalQrQuantity;
          }
          if (item.totalQrNumber !== undefined && item.totalQrNumber !== null) {
            component.totalQrNumber = item.totalQrNumber;
          }
        });

        const generatedBom = Array.from(map.values());
        setBomItems(generatedBom);

        setSelectedBomRowIndex(null);
        setOverrideQrCodes(null);
      } else {
        setResults([]);
        setMasterData(null);
        setBomItems([]);
        setTotalRecords(0);
      }
    } catch (err: any) {
      console.error("API error fetching available QR codes:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "An error occurred while fetching available QR codes."
      );
      setResults([]);
      setMasterData(null);
      setBomItems([]);
      setTotalRecords(0);
    } finally {
      setIsSearchLoading(false);
    }
  };

  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const isInitialSearchRef = useRef(true);
  const prevSearchQueryRef = useRef(searchQuery.trim());

  // Auto-trigger API call when 3+ characters typed in search bar, or when search is cleared
  useEffect(() => {
    if (isInitialSearchRef.current) {
      isInitialSearchRef.current = false;
      return;
    }
    const trimmed = debouncedSearchQuery.trim();
    if (prevSearchQueryRef.current === trimmed) {
      return;
    }
    if (trimmed.length >= 3 || (trimmed.length === 0 && searched)) {
      prevSearchQueryRef.current = trimmed;
      handleSearch(trimmed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery]);

  const isDropdownFilterSelected =
    selectedSeries.length > 0 ||
    selectedDocumentType.length > 0 ||
    selectedUnits.length > 0 ||
    !!fromDate ||
    !!toDate;

  const initialTabFetchedRef = useRef<number | null>(null);

  // Automatically search when tab changes or component mounts
  useEffect(() => {
    if (initialTabFetchedRef.current === activeTab) return;
    initialTabFetchedRef.current = activeTab;
    prevSearchQueryRef.current = searchQuery.trim();
    handleSearch(searchQuery, activeTab, selectedSeries);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleReset = () => {
    setSearchQuery("");
    prevSearchQueryRef.current = "";
    setSelectedSeries([]);
    setSelectedDocumentType([]);
    setSelectedUnits([]);
    setFromDate(null);
    setToDate(null);
    setError(null);
    setBomPage(0);
    setQrPage(0);
    handleSearch("", activeTab, [], 0, bomRowsPerPage, null, null);
  };

  const fetchAvailableComponents = async (
    bomItem: any,
    targetQrPage?: number,
    targetQrRowsPerPage?: number
  ) => {
    if (!bomItem) return;
    const drawingNumberId = bomItem.drawingnumberId || bomItem.drawingNumberId || bomItem.drawingId || bomItem.id || 0;
    let activeSeriesId = bomItem.prodSeriesId || (selectedSeries.length > 0 ? selectedSeries[0] : 0);
    const pNum = targetQrPage !== undefined ? targetQrPage : qrPage;
    const pSize = targetQrRowsPerPage !== undefined ? targetQrRowsPerPage : qrRowsPerPage;

    setIsQrLoading(true);
    setError(null);
    if (targetQrPage === undefined) {
      setOverrideQrCodes(null);
      setQrPage(0);
    }

    try {
      const response = await api.post("/api/Precheck/GetAvailablComponents", {
        prodSeriesId: Number(activeSeriesId) || 0,
        drawingNumberId: Number(drawingNumberId) || 0,
        quantity: Number(bomItem.totalQuantity || bomItem.quantity || bomItem.qty) || 1,
        pageNumber: pNum + 1,
        pageSize: pSize,
      });

      const data = response.data;
      if (Array.isArray(data)) {
        const mappedData = data.map((item: any) => ({
          qrCodeNumber: item.qrCodeNumber || item.qrCode || "N/A",
          id: item.idNumber || item.id || "N/A",
          qty: item.quantity !== undefined ? item.quantity : (item.qty !== undefined ? item.qty : 0),
          unit: item.unit || "N/A",
          status: item.status || "N/A",
          location: item.location || item.storeLocation || "N/A",
        }));
        setOverrideQrCodes(mappedData);
      } else {
        setOverrideQrCodes([]);
      }
    } catch (err: any) {
      console.error("Error fetching components on click:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch available components from API."
      );
      setOverrideQrCodes([]);
    } finally {
      setIsQrLoading(false);
    }
  };

  const handleBomRowClick = (bomItem: any, index: number) => {
    if (selectedBomRowIndex === index) {
      setSelectedBomRowIndex(null);
      setOverrideQrCodes(null);
    } else {
      setSelectedBomRowIndex(index);
      fetchAvailableComponents(bomItem);
    }
  };

  const formatQuantity = (qty: any) => {
    if (qty === undefined || qty === null || qty === "") return "-";
    const num = Number(qty);
    return isNaN(num) ? String(qty) : num.toFixed(2).replace(/\.00$/, "");
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        py: hideHeader ? 0 : 1,
        px: hideHeader ? 0 : { xs: 1, sm: 2 },
        bgcolor: "#fcfcfd",
        minHeight: hideHeader ? "auto" : "100vh",
      }}
    >
      {!hideHeader && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1.5}
          sx={{ mb: 1 }}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "primary.main",
                fontSize: { xs: "1.15rem", sm: "1.35rem" },
              }}
            >
              Available In Store
            </Typography>
            <Typography variant="body2" sx={{ color: "#667085", mt: 0.25, fontSize: "0.8rem" }}>
              View and filter available components and QR codes in store.
            </Typography>
          </Box>
        </Stack>
      )}
      <>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 1, py: 0.25, borderRadius: "6px" }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Main Dashboard Layout */}
        <Grid container spacing={2}>
          {/* Search Filter Controls Card */}
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                p: 1.25,
                borderRadius: "12px",
                border: "1px solid #eaecf0",
                backgroundColor: "#ffffff",
              }}
            >

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  flexWrap: "nowrap",
                  width: "100%",
                  overflowX: "auto",
                  overflowY: "visible",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  pt: 0.75,
                  pb: 0.5,
                  "&::-webkit-scrollbar": { display: "none" },
                }}
              >
                {/* Combined Search Bar */}
                <TextField
                  size="small"
                  placeholder="Search Part Number, Item Code, Po Number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "#98A2B3", fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    flex: "1 1 250px",
                    minWidth: 200,
                    "& .MuiOutlinedInput-root": {
                      fontSize: "0.825rem",
                      height: 38,
                    },
                  }}
                />

                {/* Production Series MultiSelect Dropdown */}
                <MultiSelectFilter
                  label="Prod. Series"
                  value={selectedSeries}
                  options={seriesOptions}
                  onChange={(newValue) => setSelectedSeries(newValue)}
                  flex="0 0 160px"
                  minWidth={130}
                />

                {/* From Date */}
                <TextField
                  size="small"
                  type={fromDateFocused || Boolean(fromDate) ? "date" : "text"}
                  label="From Date"
                  InputLabelProps={{ shrink: Boolean(fromDateFocused || fromDate) }}
                  value={fromDate ? format(fromDate, "yyyy-MM-dd") : ""}
                  onFocus={() => setFromDateFocused(true)}
                  onBlur={() => setFromDateFocused(false)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFromDate(val ? new Date(val) : null);
                    setBomPage(0);
                  }}
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
                                  try { (input as any).showPicker(); } catch { }
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
                                  try { (input as any).showPicker(); } catch { }
                                }
                              }, 10);
                            }
                          }}
                        />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    flex: "0 0 145px",
                    minWidth: 130,
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
                        transform: "translate(12px, -7px) scale(0.75)",
                      },
                      "&.Mui-focused": { color: "primary.main" },
                    },
                    "& .MuiOutlinedInput-input": {
                      py: "8.5px",
                      px: 1.5,
                      fontSize: "0.82rem",
                      color: fromDate ? "#344054" : "#98A2B3",
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

                {/* To Date */}
                <TextField
                  size="small"
                  type={toDateFocused || Boolean(toDate) ? "date" : "text"}
                  label="To Date"
                  InputLabelProps={{ shrink: Boolean(toDateFocused || toDate) }}
                  value={toDate ? format(toDate, "yyyy-MM-dd") : ""}
                  onFocus={() => setToDateFocused(true)}
                  onBlur={() => setToDateFocused(false)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setToDate(val ? new Date(val) : null);
                    setBomPage(0);
                  }}
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
                                  try { (input as any).showPicker(); } catch { }
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
                                  try { (input as any).showPicker(); } catch { }
                                }
                              }, 10);
                            }
                          }}
                        />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    flex: "0 0 145px",
                    minWidth: 130,
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
                        transform: "translate(12px, -7px) scale(0.75)",
                      },
                      "&.Mui-focused": { color: "primary.main" },
                    },
                    "& .MuiOutlinedInput-input": {
                      py: "8.5px",
                      px: 1.5,
                      fontSize: "0.82rem",
                      color: toDate ? "#344054" : "#98A2B3",
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
                  onClick={() => handleSearch()}
                  disabled={!isDropdownFilterSelected || isSearchLoading}
                  sx={{
                    flex: "0 0 auto",
                    backgroundColor: "primary.main",
                    color: "#FFFFFF",
                    fontWeight: 600,
                    fontSize: "0.82rem",
                    borderRadius: "6px",
                    px: 2,
                    height: 38,
                    textTransform: "none",
                    boxShadow: "none",
                    minWidth: 65,
                    "&:hover": { backgroundColor: "primary.dark", boxShadow: "none" },
                    "&.Mui-disabled": {
                      backgroundColor: "#EAECF0",
                      color: "#98A2B3",
                    },
                  }}
                >
                  Apply
                </Button>

                {/* Clear Button */}
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleReset}
                  sx={{
                    flex: "0 0 auto",
                    borderColor: "#D0D5DD",
                    backgroundColor: "#ffffff",
                    color: "#667085",
                    fontWeight: 600,
                    fontSize: "0.82rem",
                    height: 38,
                    px: 1.5,
                    minWidth: 55,
                    borderRadius: "6px",
                    textTransform: "none",
                    boxShadow: "none",
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

              {/* Active Chips Bar */}
              {activeChips.length > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mt: 1,
                    pt: 0.75,
                    borderTop: "1px solid #F2F4F7",
                    flexWrap: "wrap",
                    gap: 0.75,
                  }}
                >
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
                      }}
                    />
                  ))}
                  <Button
                    variant="text"
                    size="small"
                    onClick={handleReset}
                    sx={{
                      color: "#6D2A8F",
                      fontWeight: 600,
                      fontSize: "0.775rem",
                      textTransform: "none",
                      p: 0,
                    }}
                  >
                    Clear all
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>

          {searched ? (
            <>
              {/* Left Side: BOM Details */}
              <Grid item xs={12} md={selectedBomRowIndex !== null ? 6 : 12}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: "12px",
                    border: "1px solid #eaecf0",
                    backgroundColor: "#ffffff",
                    overflow: "hidden",
                    minHeight: "450px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box sx={{ height: 48, px: 1.5, borderBottom: "1px solid #eaecf0", display: "flex", alignItems: "center", justifyContent: "space-between", boxSizing: "border-box" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Typography variant="body2" sx={{ color: "#475467", fontSize: "0.85rem", fontWeight: 600 }}>
                        Material available in store
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#98A2B3", fontSize: "0.75rem", fontStyle: "italic" }}>
                        (Click a row to view available QR codes)
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: "#667085", fontSize: "0.85rem", fontWeight: 500 }}>
                      {bomItems.length} {bomItems.length === 1 ? "item" : "items"}
                    </Typography>
                  </Box>

                  <TableContainer sx={{ overflowX: "auto", flexGrow: 1 }}>
                    <Table stickyHeader size="small" sx={{ width: "100%" }}>
                      <TableHead>
                        <TableRow>
                          <SortableTableHeader label="Sr No" sortKey="sr" activeSortColumn={bomSortColumn} sortDirection={bomSortDirection} onSort={handleBomSort} align="center" />
                          <SortableTableHeader label="Item Code" sortKey="lnitemcode" activeSortColumn={bomSortColumn} sortDirection={bomSortDirection} onSort={handleBomSort} align="center" />
                          <SortableTableHeader label="Part Number" sortKey="drawingNumber" activeSortColumn={bomSortColumn} sortDirection={bomSortDirection} onSort={handleBomSort} align="center" />
                          <SortableTableHeader label="PO Number" sortKey="poNumber" activeSortColumn={bomSortColumn} sortDirection={bomSortDirection} onSort={handleBomSort} align="center" />
                          <TableCell sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 1, px: 1.5 }} align="center">Prod. Series</TableCell>
                          <TableCell sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 1, px: 1.5 }} align="center">Type</TableCell>
                          <TableCell sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 1, px: 1.5 }} align="center">Total QR Code</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {isSearchLoading ? (
                          <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 6, borderBottom: "none" }}>
                              <CircularProgress size={28} color="primary" />
                            </TableCell>
                          </TableRow>
                        ) : bomItems.length > 0 ? (
                          paginatedBomItems.map((row, index) => {
                            const globalIndex = bomPage * bomRowsPerPage + index;
                            const isSelected = selectedBomRowIndex === globalIndex;
                            return (
                              <TableRow
                                key={globalIndex}
                                hover
                                onClick={() => handleBomRowClick(row, globalIndex)}
                                sx={{
                                  cursor: "pointer",
                                  height: 40,
                                  backgroundColor: isSelected ? "rgba(107, 40, 138, 0.06)" : "inherit",
                                  "&:hover": {
                                    backgroundColor: "#f9fafb",
                                  },
                                  "& td": {
                                    borderBottom: "1px solid #F2F4F7",
                                    fontSize: "0.775rem",
                                    color: "#344054",
                                    py: 0.75,
                                    px: 1.5,
                                  },
                                }}
                              >
                                <TableCell align="center">{row._srNo ?? (globalIndex + 1)}</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: "#101828" }} align="center">
                                  {row.lnitemcode || row.lnItemCode || "N/A"}
                                </TableCell>
                                <TableCell align="center">{row.drawingNumber || "N/A"}</TableCell>
                                <TableCell align="center">
                                  <Tooltip title={row.productionOrderNumber || "N/A"} arrow placement="top">
                                    <Typography component="span" sx={{ fontSize: "0.775rem", color: "#344054" }}>
                                      {row.productionOrderNumber || "N/A"}
                                    </Typography>
                                  </Tooltip>
                                </TableCell>
                                <TableCell align="center">{row.productionSeries || row.prodSeries || "N/A"}</TableCell>
                                <TableCell align="center">
                                  <ComponentTypeChip type={row.componentType} />
                                </TableCell>

                                <TableCell align="center">
                                  {row.totalQrNumber !== undefined && row.totalQrNumber > 0 ? row.totalQrNumber : (row.totalQrCount || 0)}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <EmptyState colSpan={7} />
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {bomItems.length > 0 && (
                    <CustomPagination
                      page={bomPage}
                      pageSize={bomRowsPerPage}
                      totalCount={isServerPaginated && totalRecords > 0 ? totalRecords : bomItems.length}
                      pageSizeOptions={[5, 10, 25, 50]}
                      onPageChange={(newPage) => {
                        setBomPage(newPage);
                        handleSearch(searchQuery, activeTab, selectedSeries, newPage, bomRowsPerPage);
                      }}
                      onPageSizeChange={(newSize) => {
                        setBomRowsPerPage(newSize);
                        setBomPage(0);
                        handleSearch(searchQuery, activeTab, selectedSeries, 0, newSize);
                      }}
                    />
                  )}
                </Paper>
              </Grid>

              {/* Right Side: Available QR Codes (Shown only when a row is clicked) */}
              {selectedBomRowIndex !== null && (
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: "12px",
                      border: "1px solid #eaecf0",
                      backgroundColor: "#ffffff",
                      overflow: "hidden",
                      minHeight: "450px",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Box sx={{ height: 48, px: 1.5, borderBottom: "1px solid #eaecf0", display: "flex", alignItems: "center", justifyContent: "space-between", boxSizing: "border-box" }}>
                      <Typography variant="body2" sx={{ color: "#475467", fontSize: "0.85rem", fontWeight: 600 }}>
                        Available QR Codes
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" sx={{ color: "#667085", fontSize: "0.85rem", fontWeight: 500 }}>
                          {displayQrCodes.length} {displayQrCodes.length === 1 ? "QR code" : "QR codes"}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedBomRowIndex(null);
                            setOverrideQrCodes(null);
                          }}
                          sx={{ p: 0.25, color: "#667085", "&:hover": { color: "#101828", backgroundColor: "#F2F4F7" } }}
                          title="Close QR details"
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Box>

                    <TableContainer sx={{ overflowX: "auto", flexGrow: 1 }}>
                      <Table stickyHeader size="small" sx={{ width: "100%" }}>
                        <TableHead>
                          <TableRow>
                            <SortableTableHeader label="QR Code Number" sortKey="qrCodeNumber" activeSortColumn={qrSortColumn} sortDirection={qrSortDirection} onSort={handleQrSort} align="center" />
                            <TableCell sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 1, px: 1.5 }} align="center">ID</TableCell>
                            <TableCell sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 1, px: 1.5 }} align="center">Qty</TableCell>
                            <TableCell sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 1, px: 1.5 }} align="center">Unit</TableCell>
                            <TableCell sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 1, px: 1.5 }} align="center">Status</TableCell>
                            <TableCell sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 1, px: 1.5 }} align="center">Location</TableCell>
                            <SortableTableHeader label="Created On" sortKey="createdDate" activeSortColumn={qrSortColumn} sortDirection={qrSortDirection} onSort={handleQrSort} align="center" />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {isSearchLoading || isQrLoading ? (
                            <TableRow>
                              <TableCell colSpan={6} align="center" sx={{ py: 6, borderBottom: "none" }}>
                                <CircularProgress size={28} color="primary" />
                              </TableCell>
                            </TableRow>
                          ) : paginatedQrCodes.length > 0 ? (
                            paginatedQrCodes.map((row, index) => (
                              <TableRow
                                key={index}
                                hover
                                sx={{
                                  height: 40,
                                  "&:hover": { backgroundColor: "#F9FAFB" },
                                  "& td": {
                                    borderBottom: "1px solid #F2F4F7",
                                    fontSize: "0.775rem",
                                    color: "#344054",
                                    py: 0.75,
                                    px: 1.5,
                                  },
                                }}
                              >
                                <TableCell sx={{ fontWeight: 600, color: "#101828" }} align="center">
                                  {row.qrCodeNumber || "N/A"}
                                </TableCell>
                                <TableCell align="center">{row.id || "N/A"}</TableCell>
                                <TableCell align="center">{formatQuantity(row.qty)}</TableCell>
                                <TableCell align="center">{row.unit || row.unitName || "N/A"}</TableCell>
                                <TableCell align="center">{renderQrStatusBadge(row.status)}</TableCell>
                                <TableCell align="center">{row.location || "N/A"}</TableCell>
                                <TableCell align="center">{formatDateToIST(row.createdDate || row.createdAt || row.date)}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <EmptyState colSpan={7} />
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {displayQrCodes.length > 0 && (
                      <CustomPagination
                        page={qrPage}
                        pageSize={qrRowsPerPage}
                        totalCount={displayQrCodes.length}
                        pageSizeOptions={[5, 10, 25, 50]}
                        onPageChange={(newPage) => {
                          setQrPage(newPage);
                          if (selectedBomRowIndex !== null && bomItems[selectedBomRowIndex]) {
                            fetchAvailableComponents(bomItems[selectedBomRowIndex], newPage, qrRowsPerPage);
                          }
                        }}
                        onPageSizeChange={(newSize) => {
                          setQrRowsPerPage(newSize);
                          setQrPage(0);
                          if (selectedBomRowIndex !== null && bomItems[selectedBomRowIndex]) {
                            fetchAvailableComponents(bomItems[selectedBomRowIndex], 0, newSize);
                          }
                        }}
                      />
                    )}
                  </Paper>
                </Grid>
              )}
            </>
          ) : (
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 6,
                  borderRadius: "12px",
                  border: "1px solid #eaecf0",
                  backgroundColor: "#ffffff",
                  textAlign: "center",
                  color: "#667085",
                  fontSize: "0.9rem",
                }}
              >
                Please enter search criteria and click Search to display available QR codes.
              </Paper>
            </Grid>
          )}
        </Grid>
      </>
    </Box>
  );
};

export default AvailableInStore;
