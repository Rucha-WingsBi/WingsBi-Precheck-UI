import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Snackbar,
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


// Helper function to format date
const formatDateToIST = (dateString: string | undefined | null) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "-";
  }
};



const AvailableInStore: React.FC<{ hideHeader?: boolean }> = ({ hideHeader = false }) => {
  // Tab state: 1 = RM Store, 2 = RFG Store
  const activeTab = 1;

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
  const [totalQrRecords, setTotalQrRecords] = useState<number>(0);

  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "warning" | "info" = "info"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

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
      productionOrderNumber: item.productionOrderNumber || item.poNumber || item.poNo || item.purchaseOrderNumber || "N/A",
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
    return sortedBomItems;
  }, [sortedBomItems]);

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
    return sortedQrCodes;
  }, [sortedQrCodes]);

  // Keep references to satisfy TypeScript's noUnusedLocals compile check
  if (false as boolean) {
    console.log(qrCodes, results, masterData);
  }

  const handleSearch = async (
    overrideQuery?: string,
    _overrideQrType?: number,
    overrideSeries?: (string | number)[],
    targetPage?: number,
    targetPageSize?: number,
    overrideFromDate?: Date | null,
    overrideToDate?: Date | null
  ) => {
    const queryStr = overrideQuery !== undefined ? overrideQuery : searchQuery;
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
        fromDate: fromDateVal ? format(fromDateVal, "yyyy-MM-dd") : null,
        toDate: toDateVal ? format(toDateVal, "yyyy-MM-dd") : null,
      };

      const response = await api.post(
        `/api/QRCode/GetAvailableQr?pageNumber=${pageNumber}&pageSize=${pageSize}`,
        searchPayload
      );

      const responseData = response.data;
      const qrCodesList = responseData?.data || [];
      const totalCount = responseData?.totalRecords || 0;
      setTotalRecords(totalCount);

      if (qrCodesList.length > 0) {
        setResults(qrCodesList);
        setMasterData(null);

        // Map response items directly matching API structure
        const generatedBom = qrCodesList.map((item: any, idx: number) => ({
          id: idx + 1,
          drawingNumberId: item.drawingNumberId ?? null,
          drawingNumber: item.drawingNumber || "-",
          lnItemCode: item.lnItemCode || "-",
          lnitemcode: item.lnItemCode || "-",
          prodSeriesId: item.prodSeriesId ?? null,
          productionSeries: item.productionSeries || "-",
          componentType: item.componentType || "-",
          totalQuantity: item.totalQuantity !== undefined ? Number(item.totalQuantity) : 0,
          totalRemainingQuantity: item.totalRemainingQuantity !== undefined ? Number(item.totalRemainingQuantity) : 0,
          availableQuantity: item.totalRemainingQuantity !== undefined ? Number(item.totalRemainingQuantity) : 0,
          qrCount: item.qrCount !== undefined ? Number(item.qrCount) : 0,
          totalQrNumber: item.qrCount !== undefined ? Number(item.qrCount) : 0,
        }));
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
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "An error occurred while fetching available QR codes.";
      setError(errMsg);
      showSnackbar(errMsg, "error");
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
    const drawingNumberId = bomItem.drawingNumberId || null;
    const activeSeriesId = bomItem.prodSeriesId || null;
    const pNum = targetQrPage !== undefined ? targetQrPage : qrPage;
    const pSize = targetQrRowsPerPage !== undefined ? targetQrRowsPerPage : qrRowsPerPage;

    setIsQrLoading(true);
    setError(null);
    if (targetQrPage === undefined) {
      setOverrideQrCodes(null);
      setQrPage(0);
    }

    try {
      const pageNumber = pNum + 1;
      const pageSize = pSize;

      const parsedProdSeriesId = activeSeriesId && !isNaN(Number(activeSeriesId)) ? Number(activeSeriesId) : 0;
      const parsedDrawingNumberId = drawingNumberId && !isNaN(Number(drawingNumberId)) ? Number(drawingNumberId) : 0;
      const parsedQuantity = bomItem.totalQuantity !== undefined && bomItem.totalQuantity !== null && !isNaN(Number(bomItem.totalQuantity)) ? Number(bomItem.totalQuantity) : 0;
      const parsedTotalQrQty = bomItem.qrCount !== undefined && bomItem.qrCount !== null && !isNaN(Number(bomItem.qrCount)) ? Number(bomItem.qrCount) : 0;

      const response = await api.post(
        `/api/Precheck/GetAvailablComponents?pageNumber=${pageNumber}&pageSize=${pageSize}`,
        {
          prodSeriesId: parsedProdSeriesId,
          drawingNumberId: parsedDrawingNumberId,
          quantity: parsedQuantity,
          totalQrQty: parsedTotalQrQty,
        }
      );

      const responseData = response.data;
      let rawList: any[] = [];
      let totalCount = 0;

      if (Array.isArray(responseData)) {
        rawList = responseData;
        totalCount = responseData.length;
      } else if (responseData && typeof responseData === "object") {
        if (Array.isArray(responseData.data)) {
          rawList = responseData.data;
        } else if (Array.isArray(responseData.items)) {
          rawList = responseData.items;
        } else if (Array.isArray(responseData.qrCodes)) {
          rawList = responseData.qrCodes;
        }
        totalCount = responseData.totalRecords ?? (responseData.totalCount ?? rawList.length);
      }

      setTotalQrRecords(totalCount);

      if (rawList && rawList.length > 0) {
        const mappedData = rawList.map((item: any) => ({
          qrCodeNumber: item.qrCodeNumber || item.qrCode || "-",
          id: item.idNumber || item.id || "-",
          qty: item.quantity !== undefined ? item.quantity : (item.qty !== undefined ? item.qty : 0),
          unit: item.unit || "-",
          status: item.status || "-",
          productionOrderNumber: item.productionOrderNumber || "-",
          location: item.location || "-",
          manufacturingDate: item.manufacturingDate || null,
        }));
        setOverrideQrCodes(mappedData);
      } else {
        setOverrideQrCodes([]);
      }
    } catch (err: any) {
      console.error("Error fetching components on click:", err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch available components from API.";
      setError(errMsg);
      showSnackbar(errMsg, "error");
      setOverrideQrCodes([]);
      setTotalQrRecords(0);
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
             Stored Components
            </Typography>
            <Typography variant="body2" sx={{ color: "#667085", mt: 0.25, fontSize: "0.8rem" }}>
              View and filter Stored Components and QR codes.
            </Typography>
          </Box>
        </Stack>
      )}
      <>


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
                  placeholder="Search Part Number, Item Code..."
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
                      {totalRecords} {totalRecords === 1 ? "item" : "items"}
                    </Typography>
                  </Box>

                  <TableContainer sx={{ overflowX: "auto", flexGrow: 1 }}>
                    <Table stickyHeader size="small" sx={{ width: "100%" }}>
                      <TableHead>
                        <TableRow>
                          <SortableTableHeader label="Sr No" sortKey="sr" activeSortColumn={bomSortColumn} sortDirection={bomSortDirection} onSort={handleBomSort} align="center" />
                          <SortableTableHeader label="Item Code" sortKey="lnitemcode" activeSortColumn={bomSortColumn} sortDirection={bomSortDirection} onSort={handleBomSort} align="center" />
                          <SortableTableHeader label="Part Number" sortKey="drawingNumber" activeSortColumn={bomSortColumn} sortDirection={bomSortDirection} onSort={handleBomSort} align="center" />
                          <TableCell sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 1, px: 1.5 }} align="center">Prod. Series</TableCell>
                          <TableCell sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 1, px: 1.5 }} align="center">Type</TableCell>
                          <TableCell sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 1, px: 1.5 }} align="center">Total QR Code</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {isSearchLoading ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 6, borderBottom: "none" }}>
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
                                <TableCell align="center">{row.productionSeries || "N/A"}</TableCell>
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
                          <EmptyState colSpan={6} />
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {bomItems.length > 0 && (
                    <CustomPagination
                      page={bomPage}
                      pageSize={bomRowsPerPage}
                      totalCount={totalRecords}
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
                          {totalQrRecords} {totalQrRecords === 1 ? "QR code" : "QR codes"}
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
                            <TableCell sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 1, px: 1.5 }} align="center">
                              <Tooltip title="Production Order Number" arrow placement="bottom">
                                <span>PO Number</span>
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 1, px: 1.5 }} align="center">Location</TableCell>
                            <SortableTableHeader label="Created On" sortKey="createdDate" activeSortColumn={qrSortColumn} sortDirection={qrSortDirection} onSort={handleQrSort} align="center" />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {isSearchLoading || isQrLoading ? (
                            <TableRow>
                              <TableCell colSpan={7} align="center" sx={{ py: 6, borderBottom: "none" }}>
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
                                  {row.qrCodeNumber || "-"}
                                </TableCell>
                                <TableCell align="center">{row.id || "-"}</TableCell>
                                <TableCell align="center">{formatQuantity(row.qty)}</TableCell>
                                <TableCell align="center">{row.unit || row.unitName || "-"}</TableCell>
                                <TableCell align="center">{row.productionOrderNumber || "-"}</TableCell>
                                <TableCell align="center">{row.location || "-"}</TableCell>
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
                        totalCount={totalQrRecords}
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
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === "error" ? 5000 : 4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AvailableInStore;
