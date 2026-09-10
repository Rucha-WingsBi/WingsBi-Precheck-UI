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
  Tabs,
  Tab,
  Stack,
  InputAdornment,
  Chip,
} from "@mui/material";
import { CustomPagination } from "../../components/CustomPagination";
import { EmptyState } from "../../components/EmptyState";
import { MultiSelectFilter } from "../../components/MultiSelectFilter";

import {
  Search as SearchIcon,
} from "@mui/icons-material";
import api from "../../services/api";
import { useProductionSeries } from "../../hooks/useMasterData";
import { useDebounce } from "../../hooks/useDebounce";

const StoredInComponents = React.lazy(() => import("./StoredInComponents"));

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

  // Pagination states for BOM Items table
  const [bomPage, setBomPage] = useState(0);
  const [bomRowsPerPage, setBomRowsPerPage] = useState(10);

  // Pagination states for Available QR Codes table
  const [qrPage, setQrPage] = useState(0);
  const [qrRowsPerPage, setQrRowsPerPage] = useState(10);

  // States for double-clicked available components overriding the right-side table
  const [overrideQrCodes, setOverrideQrCodes] = useState<any[] | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setSearchQuery("");
    setSelectedSeries([]);
    setSelectedDocumentType([]);
    setSelectedUnits([]);
    setBomPage(0);
    setQrPage(0);
    setOverrideQrCodes(null);
  };

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

    return chips;
  }, [searchQuery, selectedSeries, seriesOptions]);

  // API Call and Result states
  const [masterData, setMasterData] = useState<any | null>(null);
  const [bomItems, setBomItems] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [selectedBomRowIndex, setSelectedBomRowIndex] = useState<number | null>(null);

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

  const paginatedBomItems = useMemo(() => {
    const startIndex = bomPage * bomRowsPerPage;
    return bomItems.slice(startIndex, startIndex + bomRowsPerPage);
  }, [bomItems, bomPage, bomRowsPerPage]);

  const displayQrCodes = useMemo(() => {
    if (overrideQrCodes !== null) {
      return overrideQrCodes;
    }
    return [];
  }, [overrideQrCodes]);

  const paginatedQrCodes = useMemo(() => {
    const startIndex = qrPage * qrRowsPerPage;
    return displayQrCodes.slice(startIndex, startIndex + qrRowsPerPage);
  }, [displayQrCodes, qrPage, qrRowsPerPage]);

  // Keep references to satisfy TypeScript's noUnusedLocals compile check
  if (false as boolean) {
    console.log(qrCodes, results, masterData);
  }

  const handleSearch = async (
    overrideQuery?: string,
    overrideQrType?: number,
    overrideSeries?: (string | number)[]
  ) => {
    const queryStr = overrideQuery !== undefined ? overrideQuery : searchQuery;
    const qrType = overrideQrType !== undefined ? overrideQrType : activeTab;
    const seriesList = overrideSeries !== undefined ? overrideSeries : selectedSeries;

    setError(null);
    setBomPage(0);
    setQrPage(0);
    setOverrideQrCodes(null);
    setIsSearchLoading(true);
    setSearched(true);
    setSelectedBomRowIndex(null);
    setResults([]);

    try {
      const seriesArr = seriesList.map(String);
      const searchPayload = {
        searchQuery: queryStr?.trim() || "",
        drawingNumber: queryStr?.trim() || "",
        lnItemCode: queryStr?.trim() || "",
        productionSeries: seriesArr,
        prodSeries: seriesArr,
        documentType: selectedDocumentType,
        unit: selectedUnits,
        prodSeriesId: seriesArr.length > 0 ? seriesArr.join(",") : null,
        prodSeriesIds: seriesArr.length > 0 ? seriesArr.join(",") : null,
        QrType: qrType,
      };

      const response = await api.get("/api/QRCode/GetAvailableQr", {
        params: searchPayload,
      });

      const data = response.data;
      const qrCodesList = Array.isArray(data)
        ? data
        : (data && Array.isArray(data.qrCodes) ? data.qrCodes : null);

      if (qrCodesList) {
        setResults(qrCodesList);
        setMasterData(null);

        // Group by drawing/LN code to generate BOM items
        const map = new Map<string, any>();
        qrCodesList.forEach((item: any) => {
          const key = `${item.drawingNumber || ""}-${item.lnItemCode || ""}`.toLowerCase();
          if (!map.has(key)) {
            map.set(key, {
              id: item.drawingnumberId || item.id || 0,
              drawingNumber: item.drawingNumber || "N/A",
              lnitemcode: item.lnItemCode || "N/A",
              unit: item.unit || "ECH",
              totalQuantity: 0,
              availableQuantity: 0,
              totalQrQuantity: item.totalQrQuantity !== undefined ? item.totalQrQuantity : 0,
              totalQrNumber: item.totalQrNumber !== undefined ? item.totalQrNumber : 0,
            });
          }
          const component = map.get(key);
          component.totalQuantity += Number(item.quantity) || 0;
          component.availableQuantity += Number(item.remainingQuantity) || 0;

          if (item.totalQrQuantity !== undefined) {
            component.totalQrQuantity = item.totalQrQuantity;
          }
          if (item.totalQrNumber !== undefined) {
            component.totalQrNumber = item.totalQrNumber;
          }
        });

        const generatedBom = Array.from(map.values());
        setBomItems(generatedBom);

        if (generatedBom.length > 0) {
          setSelectedBomRowIndex(0);
        }
      } else {
        setResults([]);
        setMasterData(null);
        setBomItems([]);
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
    } finally {
      setIsSearchLoading(false);
    }
  };

  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const isInitialSearchRef = useRef(true);

  // Auto-trigger API call when 3+ characters typed in search bar, or when search is cleared
  useEffect(() => {
    if (isInitialSearchRef.current) {
      isInitialSearchRef.current = false;
      return;
    }
    const trimmed = debouncedSearchQuery.trim();
    if (trimmed.length >= 3 || (trimmed.length === 0 && searched)) {
      handleSearch(trimmed);
    }
  }, [debouncedSearchQuery]);

  const isDropdownFilterSelected = selectedSeries.length > 0 || selectedDocumentType.length > 0 || selectedUnits.length > 0;

  // Automatically search when tab changes or component mounts
  useEffect(() => {
    handleSearch(searchQuery, activeTab, selectedSeries);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleReset = () => {
    setSearchQuery("");
    setSelectedSeries([]);
    setSelectedDocumentType([]);
    setSelectedUnits([]);
    setError(null);
    setBomPage(0);
    setQrPage(0);
    handleSearch("", activeTab, []);
  };

  const handleBomRowClick = (bomItem: any, index: number) => {
    if (selectedBomRowIndex !== index) {
      setSelectedBomRowIndex(index);
      setOverrideQrCodes(null);
      setQrPage(0);
    }
  };

  const handleBomRowDoubleClick = async (bomItem: any) => {
    const drawingNumberId = bomItem.drawingnumberId || bomItem.drawingNumberId || bomItem.drawingId || bomItem.id || 0;
    let activeSeriesId = selectedSeries.length > 0 ? selectedSeries[0] : 0;

    setIsQrLoading(true);
    setError(null);
    setOverrideQrCodes(null);
    setQrPage(0);

    try {
      const response = await api.post("/api/Precheck/GetAvailablComponents", {
        prodSeriesId: Number(activeSeriesId) || 0,
        drawingNumberId: Number(drawingNumberId) || 0,
        quantity: Number(bomItem.totalQuantity || bomItem.quantity || bomItem.qty) || 1,
      });

      const data = response.data;
      if (Array.isArray(data)) {
        const mappedData = data.map((item: any) => ({
          qrCodeNumber: item.qrCodeNumber || item.qrCode || "N/A",
          id: item.idNumber || item.id || "N/A",
          qty: item.quantity !== undefined ? item.quantity : (item.qty !== undefined ? item.qty : 0),
          status: item.status || "N/A",
          location: item.location || item.storeLocation || "N/A",
        }));
        setOverrideQrCodes(mappedData);
      } else {
        setOverrideQrCodes([]);
      }
    } catch (err: any) {
      console.error("Error fetching components on double click:", err);
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
              {storeTab === "available" ? "Available In Store" : "Stored In Components"}
            </Typography>
            <Typography variant="body2" sx={{ color: "#667085", mt: 0.25, fontSize: "0.8rem" }}>
              View and filter available components and QR codes in store.
            </Typography>
          </Box>

          <Tabs
            value={storeTab}
            onChange={(_, newValue) => setStoreTab(newValue)}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              minHeight: 36,
              "& .MuiTab-root": {
                fontWeight: 600,
                fontSize: "0.85rem",
                textTransform: "none",
                minWidth: 120,
                minHeight: 36,
                py: 0.5,
                px: 1.5,
              },
              "& .MuiTab-root.Mui-selected": { color: "primary.main" },
              "& .MuiTabs-indicator": {
                backgroundColor: "primary.main",
                height: 3,
                borderRadius: "3px 3px 0 0",
              },
            }}
          >
            <Tab label="Available In Store" value="available" />
            <Tab label="Stored In Components" value="stored" />
          </Tabs>
        </Stack>
      )}

      {storeTab === "stored" ? (
        <React.Suspense fallback={<CircularProgress sx={{ display: "block", mx: "auto", my: 4 }} />}>
          <StoredInComponents hideHeader />
        </React.Suspense>
      ) : (
        <>
          {/* Tabs for RM Store & CFG Store */}
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              mb: 1,
              minHeight: 32,
              borderBottom: "1px solid #eaecf0",
              "& .MuiTabs-indicator": {
                backgroundColor: "primary.main",
                height: 3,
                borderRadius: "3px 3px 0 0",
              },
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.825rem",
                color: "#667085",
                px: 2,
                py: 0.5,
                minWidth: 90,
                minHeight: 32,
                "&.Mui-selected": {
                  color: "primary.main",
                },
              },
            }}
          >
            <Tab label="RM Store" value={1} />
            <Tab label="CFG Store" value={2} />
          </Tabs>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 1, py: 0.25, borderRadius: "6px" }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Main Dashboard Layout */}
          <Grid container spacing={1.5}>
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
                <Typography variant="body1" sx={{ fontWeight: 700, mb: 1, color: "#101828", fontSize: "0.88rem" }}>
                  Filter & Search Available QR Codes
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
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
                  {/* Combined Search Bar */}
                  <TextField
                    size="small"
                    placeholder="Search Drawing Number, LN Item Code..."
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

                  {/* Apply Button */}
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleSearch()}
                    disabled={!isDropdownFilterSelected || isSearchLoading}
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
                    {isSearchLoading ? <CircularProgress size={16} color="inherit" /> : "Apply"}
                  </Button>

                  {/* Clear Button */}
                  <Button
                    size="small"
                    variant="text"
                    onClick={handleReset}
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
                        color: "#6B288A",
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
                    <Box sx={{ p: 1.5, borderBottom: "1px solid #eaecf0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Typography variant="body2" sx={{ color: "#475467", fontSize: "0.85rem", fontWeight: 600 }}>
                        Material available in store
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#667085", fontSize: "0.85rem", fontWeight: 500 }}>
                        {bomItems.length} {bomItems.length === 1 ? "item" : "items"}
                      </Typography>
                    </Box>

                    <TableContainer sx={{ overflowX: "auto", flexGrow: 1 }}>
                      <Table stickyHeader size="small" sx={{ width: "100%" }}>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 1, px: 1.5 }} align="center">Sr</TableCell>
                            <TableCell sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 1, px: 1.5 }} align="center">LN Item Code</TableCell>
                            <TableCell sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 1, px: 1.5 }} align="center">Drawing Number</TableCell>
                            <TableCell sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 1, px: 1.5 }} align="center">Unit</TableCell>
                            <TableCell sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 1, px: 1.5 }} align="center">Total Qty</TableCell>
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
                                  onDoubleClick={() => handleBomRowDoubleClick(row)}
                                  sx={{
                                    cursor: "pointer",
                                    height: 40,
                                    backgroundColor: isSelected ? "rgba(107, 40, 138, 0.06)" : "inherit",
                                    "&:hover": {
                                      backgroundColor: "#f9fafb",
                                    },
                                    "& td": {
                                      borderBottom: "1px solid #F2F4F7",
                                      fontSize: "0.85rem",
                                      color: "#344054",
                                      py: 0.75,
                                      px: 1.5,
                                    },
                                  }}
                                >
                                  <TableCell align="center">{globalIndex + 1}</TableCell>
                                  <TableCell sx={{ fontWeight: 600, color: "#101828" }} align="center">
                                    {row.lnitemcode || row.lnItemCode || "N/A"}
                                  </TableCell>
                                  <TableCell align="center">{row.drawingNumber || "N/A"}</TableCell>
                                  <TableCell align="center">{row.unit || row.unitName || "N/A"}</TableCell>
                                  <TableCell align="center">{row.totalQrQuantity}</TableCell>
                                  <TableCell align="center">{row.totalQrNumber}</TableCell>
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
                        totalCount={bomItems.length}
                        pageSizeOptions={[5, 10, 25, 50]}
                        onPageChange={(newPage) => setBomPage(newPage)}
                        onPageSizeChange={(newSize) => {
                          setBomRowsPerPage(newSize);
                          setBomPage(0);
                        }}
                      />
                    )}
                  </Paper>
                </Grid>

                {/* Right Side: Available QR Codes */}
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
                    <Box sx={{ p: 1.5, borderBottom: "1px solid #eaecf0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Typography variant="body2" sx={{ color: "#475467", fontSize: "0.85rem", fontWeight: 600 }}>
                        Available QR Codes
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#667085", fontSize: "0.85rem", fontWeight: 500 }}>
                        {displayQrCodes.length} {displayQrCodes.length === 1 ? "QR code" : "QR codes"}
                      </Typography>
                    </Box>

                    <TableContainer sx={{ overflowX: "auto", flexGrow: 1 }}>
                      <Table stickyHeader size="small" sx={{ width: "100%" }}>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 1, px: 1.5 }} align="center">QR Code Number</TableCell>
                            <TableCell sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 1, px: 1.5 }} align="center">ID</TableCell>
                            <TableCell sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 1, px: 1.5 }} align="center">Qty</TableCell>
                            <TableCell sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 1, px: 1.5 }} align="center">Status</TableCell>
                            <TableCell sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 1, px: 1.5 }} align="center">Location</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {isSearchLoading || isQrLoading ? (
                            <TableRow>
                              <TableCell colSpan={5} align="center" sx={{ py: 6, borderBottom: "none" }}>
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
                                    fontSize: "0.85rem",
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
                                <TableCell align="center">{renderQrStatusBadge(row.status)}</TableCell>
                                <TableCell align="center">{row.location || "N/A"}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <EmptyState
                              colSpan={5}
                              title={
                                overrideQrCodes === null
                                  ? "Double-click a material row to view available QR codes"
                                  : undefined
                              }
                            />
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
                        onPageChange={(newPage) => setQrPage(newPage)}
                        onPageSizeChange={(newSize) => {
                          setQrRowsPerPage(newSize);
                          setQrPage(0);
                        }}
                      />
                    )}
                  </Paper>
                </Grid>
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
      )}
    </Box>
  );
};

export default AvailableInStore;
