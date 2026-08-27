import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Autocomplete,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Launch as LaunchIcon,
} from "@mui/icons-material";
import api from "../../services/api";
import { useAllDrawingNumbers, useLnItemCodeSearch, useProductionSeries } from "../../hooks/useMasterData";
import { type DrawingNumber, type ProductionSeries } from "../../types";

const StoredInComponents = React.lazy(() => import("./StoredInComponents"));

const AvailableInStore: React.FC<{ hideHeader?: boolean }> = ({ hideHeader = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [storeTab, setStoreTab] = useState<"available" | "stored">(
    hideHeader ? "available" : (location.pathname.includes("stored") || location.pathname.includes("store-in") ? "stored" : "available")
  );

  // Tab state: 1 = RM Store, 2 = RFG Store
  const [activeTab, setActiveTab] = useState<number>(1);

  // Query master data
  const { data: allDrawingNumbers = [], isLoading: isDrawingsLoading } = useAllDrawingNumbers();
  const { data: productionSeriesList = [], isLoading: isSeriesLoading } = useProductionSeries();

  // Search filter states
  const [selectedDrawing, setSelectedDrawing] = useState<DrawingNumber | null>(null);
  const [selectedLnCode, setSelectedLnCode] = useState<string | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<ProductionSeries | null>(null);

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
    // Reset search filter states
    setSelectedDrawing(null);
    setSelectedLnCode(null);
    setSelectedSeries(null);
    setDrawingSearchInput("");
    setLnSearchInput("");
    setBomPage(0);
    setQrPage(0);
    setOverrideQrCodes(null);
  };

  // Autocomplete input value states (for debouncing API searches if needed)
  const [drawingSearchInput, setDrawingSearchInput] = useState("");
  const [lnSearchInput, setLnSearchInput] = useState("");
  const [debouncedLnSearch, setDebouncedLnSearch] = useState("");

  // Debounce LN search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLnSearch(lnSearchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [lnSearchInput]);

  const { data: searchedLnCodes = [], isLoading: isLnSearchLoading } = useLnItemCodeSearch(debouncedLnSearch);

  // Combine local and server-queried LN Item Codes with associated drawings
  const lnDrawingOptions = useMemo(() => {
    const map = new Map<string, any>();

    // First populate from local allDrawingNumbers
    allDrawingNumbers.forEach((d: any) => {
      if (d.lnItemCode && d.lnItemCode.trim() !== "") {
        const key = d.lnItemCode.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, d);
        }
      }
    });

    // Then populate from searchedLnCodes if they aren't already present
    searchedLnCodes.forEach((code: string) => {
      if (code && code.trim() !== "") {
        const key = code.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            id: -Math.random(),
            drawingNumber: "N/A",
            lnItemCode: code,
            nomenclature: "Searched Item Code",
          });
        }
      }
    });

    return Array.from(map.values());
  }, [allDrawingNumbers, searchedLnCodes]);

  // Locally filtered drawings for smoother typing performance
  const filteredDrawingOptions = useMemo(() => {
    if (!drawingSearchInput) return allDrawingNumbers.slice(0, 100);
    const searchLower = drawingSearchInput.toLowerCase();
    return allDrawingNumbers
      .filter(
        (d: any) =>
          d.drawingNumber?.toLowerCase().includes(searchLower) ||
          d.lnItemCode?.toLowerCase().includes(searchLower) ||
          d.nomenclature?.toLowerCase().includes(searchLower)
      )
      .slice(0, 100);
  }, [allDrawingNumbers, drawingSearchInput]);

  // Autofill Logic
  const handleDrawingChange = (val: DrawingNumber | null) => {
    setSelectedDrawing(val);
    if (val) {
      // Autofill corresponding LN Item Code
      if (val.lnItemCode) {
        setSelectedLnCode(val.lnItemCode);
      }
      // Autofill corresponding Production Series
      if (val.availableSeriesId && val.availableSeriesId.length > 0) {
        const matchedSeries = productionSeriesList.find(
          (s) => s.id === val.availableSeriesId[0]
        );
        if (matchedSeries) {
          setSelectedSeries(matchedSeries);
        }
      }
    }
  };

  const handleLnCodeChange = (val: string | null) => {
    setSelectedLnCode(val);
    if (val) {
      // Autofill corresponding Drawing Number by looking up options
      const matchedDrawing = allDrawingNumbers.find(
        (d: any) => d.lnItemCode?.toLowerCase() === val.toLowerCase()
      );
      if (matchedDrawing) {
        setSelectedDrawing(matchedDrawing);
      }
    }
  };

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
    overrideDrawing?: DrawingNumber | null,
    overrideLnCode?: string | null,
    overrideQrType?: number,
    overrideSeries?: ProductionSeries | null
  ) => {
    const drawing = overrideDrawing !== undefined ? overrideDrawing : selectedDrawing;
    const lnCode = overrideLnCode !== undefined ? overrideLnCode : selectedLnCode;
    const qrType = overrideQrType !== undefined ? overrideQrType : activeTab;
    const series = overrideSeries !== undefined ? overrideSeries : selectedSeries;

    setError(null);
    setBomPage(0);
    setQrPage(0);
    setOverrideQrCodes(null);
    setIsSearchLoading(true);
    setSearched(true);
    setSelectedBomRowIndex(null);
    setResults([]);

    try {
      const response = await api.get("/api/QRCode/GetAvailableQr", {
        params: {
          lnItemCode: lnCode || "",
          drawingNumber: drawing?.drawingNumber || "",
          prodSeriesId: series?.id || null,
          QrType: qrType,
        }
      });

      const data = response.data;
      const qrCodesList = Array.isArray(data)
        ? data
        : (data && Array.isArray(data.qrCodes) ? data.qrCodes : null);

      if (qrCodesList) {
        // Set flat array of QR codes
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

  // Automatically search when tab changes or component mounts
  useEffect(() => {
    handleSearch(selectedDrawing, selectedLnCode, activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleReset = () => {
    setSelectedDrawing(null);
    setSelectedLnCode(null);
    setSelectedSeries(null);
    setDrawingSearchInput("");
    setLnSearchInput("");
    setError(null);
    setBomPage(0);
    setQrPage(0);
    handleSearch(null, null, activeTab, null);
  };

  const handleBomRowClick = (bomItem: any, index: number) => {
    if (selectedBomRowIndex !== index) {
      setSelectedBomRowIndex(index);
      setOverrideQrCodes(null);
      setQrPage(0);
    }
  };

  const handleBomRowDoubleClick = async (bomItem: any) => {
    const matchedDrawing = allDrawingNumbers.find(
      (d: any) => d.drawingNumber?.toLowerCase() === (bomItem.drawingNumber || "").toLowerCase()
    );

    const drawingNumberId = matchedDrawing?.id || bomItem.drawingnumberId || bomItem.drawingNumberId || bomItem.drawingId || bomItem.id || 0;

    // Try to infer series if not set
    let activeSeriesId = selectedSeries?.id;
    if (!activeSeriesId && matchedDrawing?.availableSeriesId && matchedDrawing.availableSeriesId.length > 0) {
      activeSeriesId = matchedDrawing.availableSeriesId[0];
    }

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
        p: hideHeader ? 0 : { xs: 1, sm: 1.5, md: 2 },
        animation: "fadeIn 0.5s ease-out",
        "@keyframes fadeIn": {
          from: { opacity: 0, transform: "translateY(10px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      {!hideHeader && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            mb: 1.5,
            flexWrap: "wrap",
            gap: { xs: 1, sm: 2, md: 3 },
            borderBottom: 1,
            borderColor: "divider",
            pb: 0.5,
          }}
        >
          <Typography
            variant="h4"
            color="primary.main"
            fontWeight={600}
            sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.5rem" }, mb: 0.5 }}
          >
            {storeTab === "available" ? "Available In Store" : "Stored In Components"}
          </Typography>

          <Tabs
            value={storeTab}
            onChange={(_, newValue) => setStoreTab(newValue)}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              "& .MuiTab-root": {
                fontWeight: 600,
                fontSize: "0.875rem",
                textTransform: "none",
                minWidth: 140,
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
        </Box>
      )}

      {storeTab === "stored" ? (
        <React.Suspense fallback={<CircularProgress sx={{ display: "block", mx: "auto", my: 4 }} />}>
          <StoredInComponents hideHeader />
        </React.Suspense>
      ) : (
        <>

      {/* Tabs for RM Store & RFG Store */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        textColor="primary"
        indicatorColor="primary"
        sx={{
          mb: 2,
          borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
          "& .MuiTabs-indicator": {
            backgroundColor: "primary.main",
            height: 3,
            borderRadius: 2,
          },
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 600,
            fontSize: "1rem",
            color: "text.secondary",
            px: 3,
            py: 1,
            transition: "all 0.2s ease",
            "&:hover": {
              color: "primary.main",
              backgroundColor: "rgba(168, 0, 90, 0.04)",
            },
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
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
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
              p: { xs: 1.5, md: 2 },
              borderRadius: "16px",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "text.primary" }}>
              Filter & Search Available QR Codes
            </Typography>

            <Grid container spacing={2} alignItems="center">
              {/* Drawing Number Autocomplete */}
              <Grid item xs={12} sm="auto">
                <Autocomplete
                  size="small"
                  sx={{ width: { xs: "100%", sm: 380 } }}
                  options={filteredDrawingOptions}
                  loading={isDrawingsLoading}
                  getOptionLabel={(option) => option.drawingNumber || ""}
                  value={selectedDrawing}
                  onChange={(_, val) => handleDrawingChange(val)}
                  inputValue={drawingSearchInput}
                  onInputChange={(_, val) => setDrawingSearchInput(val)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Drawing Number"
                      placeholder="Type to search drawing..."
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isDrawingsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box sx={{ display: "flex", flexDirection: "column", py: 0.5 }}>
                        <Typography variant="body2" fontWeight="500">
                          {option.drawingNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.nomenclature} {option.lnItemCode ? `| LN: ${option.lnItemCode}` : ""}
                        </Typography>
                      </Box>
                    </li>
                  )}
                />
              </Grid>

              {/* LN Item Code Autocomplete */}
              <Grid item xs={12} sm="auto">
                <Autocomplete
                  size="small"
                  sx={{ width: { xs: "100%", sm: 300 } }}
                  options={lnDrawingOptions}
                  loading={isLnSearchLoading}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    return option.lnItemCode || "";
                  }}
                  value={
                    selectedLnCode
                      ? lnDrawingOptions.find(
                        (d) => d.lnItemCode?.toLowerCase() === selectedLnCode.toLowerCase()
                      ) || {
                        id: -1,
                        drawingNumber: "N/A",
                        lnItemCode: selectedLnCode,
                        nomenclature: "",
                        isActive: true,
                      }
                      : null
                  }
                  onChange={(_, val) => {
                    handleLnCodeChange(val ? val.lnItemCode : null);
                  }}
                  inputValue={lnSearchInput}
                  onInputChange={(_, val) => setLnSearchInput(val)}
                  filterOptions={(options, { inputValue }) => {
                    if (!inputValue) return options.slice(0, 100);
                    const searchLower = inputValue.toLowerCase();
                    return options
                      .filter(
                        (option: any) =>
                          option.lnItemCode?.toLowerCase().includes(searchLower) ||
                          option.drawingNumber?.toLowerCase().includes(searchLower) ||
                          option.nomenclature?.toLowerCase().includes(searchLower)
                      )
                      .slice(0, 100);
                  }}
                  isOptionEqualToValue={(option, value) =>
                    option?.lnItemCode?.toLowerCase() === value?.lnItemCode?.toLowerCase()
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="LN Item Code"
                      placeholder="Type to search item code..."
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isLnSearchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box sx={{ display: "flex", flexDirection: "column", py: 0.5 }}>
                        <Typography variant="body2" fontWeight="600" color="primary.main">
                          LN Code: {option.lnItemCode}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Drawing: {option.drawingNumber} {option.nomenclature ? `| ${option.nomenclature}` : ""}
                        </Typography>
                      </Box>
                    </li>
                  )}
                />
              </Grid>

              {/* Production Series Autocomplete */}
              <Grid item xs={12} sm="auto">
                <Autocomplete
                  size="small"
                  sx={{ width: { xs: "100%", sm: 220 } }}
                  options={productionSeriesList}
                  loading={isSeriesLoading}
                  getOptionLabel={(option) => option.productionSeries || ""}
                  value={selectedSeries}
                  onChange={(_, val) => setSelectedSeries(val)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Production Series"
                      placeholder="Select series..."
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isSeriesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Action Buttons Row */}
              <Grid item xs={12} sm="auto" sx={{ display: "flex", gap: 1.5 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleReset}
                  startIcon={<RefreshIcon />}
                  sx={{ textTransform: "none", height: 40, borderRadius: "8px", minWidth: 100 }}
                >
                  Reset
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleSearch()}
                  disabled={isSearchLoading || (!selectedDrawing && (!selectedLnCode || selectedLnCode.trim() === "") && !selectedSeries)}
                  startIcon={isSearchLoading ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
                  sx={{ textTransform: "none", height: 40, borderRadius: "8px", px: 3, minWidth: 120 }}
                >
                  Search
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {searched ? (
          <>
            {/* Left Side: BOM Details */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: "16px",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                  minHeight: "450px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
                      Material available in store
                    </Typography>

                  </Box>

                </Box>

                <TableContainer sx={{ overflowX: "auto", flexGrow: 1 }}>
                  <Table size="small" sx={{ width: "100%" }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "grey.50" }}>
                        <TableCell sx={{ fontWeight: 600, py: 1.5, whiteSpace: "nowrap" }} align="center">Sr</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 1.5, whiteSpace: "nowrap" }} align="center">LN Item Code</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 1.5, whiteSpace: "nowrap" }} align="center">Drawing Number</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 1.5, whiteSpace: "nowrap" }} align="center">Unit</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 1.5, whiteSpace: "nowrap" }} align="center">Total Qty</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 1.5, whiteSpace: "nowrap" }} align="center">Total QR Code</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {isSearchLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                            <CircularProgress size={30} />
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
                                bgcolor: isSelected ? "action.hover" : "background.paper",
                                "&:hover": {
                                  bgcolor: "action.hover",
                                },
                              }}
                            >
                              <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>{globalIndex + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 500, whiteSpace: "nowrap" }} align="center">
                                {row.lnitemcode || row.lnItemCode || "N/A"}
                              </TableCell>
                              <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>{row.drawingNumber || "N/A"}</TableCell>
                              <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>{row.unit || row.unitName || "N/A"}</TableCell>
                              <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>{row.totalQrQuantity}
                                
                              </TableCell>
                              <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>{row.totalQrNumber}
                                
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                            No BOM components found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {bomItems.length > 0 && (
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={bomItems.length}
                    rowsPerPage={bomRowsPerPage}
                    page={bomPage}
                    onPageChange={(_, newPage) => setBomPage(newPage)}
                    onRowsPerPageChange={(event) => {
                      setBomRowsPerPage(parseInt(event.target.value, 10));
                      setBomPage(0);
                    }}
                    sx={{
                      borderTop: "1px solid rgba(0, 0, 0, 0.08)",
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
                  p: 3,
                  borderRadius: "16px",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                  minHeight: "450px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "text.primary" }}>
                  Available QR Codes
                </Typography>

                <TableContainer sx={{ overflowX: "auto", flexGrow: 1 }}>
                  <Table size="small" sx={{ width: "100%" }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "grey.50" }}>
                        <TableCell sx={{ fontWeight: 600, py: 1.5, whiteSpace: "nowrap" }} align="center">QR Code Number</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 1.5, whiteSpace: "nowrap" }} align="center">ID</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 1.5, whiteSpace: "nowrap" }} align="center">Qty</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 1.5, whiteSpace: "nowrap" }} align="center">Status</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 1.5, whiteSpace: "nowrap" }} align="center">Location</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {isSearchLoading || isQrLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                            <CircularProgress size={30} />
                          </TableCell>
                        </TableRow>
                      ) : paginatedQrCodes.length > 0 ? (
                        paginatedQrCodes.map((row, index) => (
                          <TableRow key={index} hover sx={{ bgcolor: "background.paper" }}>
                            <TableCell sx={{ fontWeight: 550, whiteSpace: "nowrap" }} align="center">
                              {row.qrCodeNumber || "N/A"}
                            </TableCell>
                            <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>{row.id || "N/A"}</TableCell>
                            <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>{formatQuantity(row.qty)}</TableCell>
                            <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>{row.status || "N/A"}</TableCell>
                            <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>{row.location || "N/A"}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>
                            {overrideQrCodes === null ? "Double-click a material row to view available QR codes" : "No components found"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {displayQrCodes.length > 0 && (
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={displayQrCodes.length}
                    rowsPerPage={qrRowsPerPage}
                    page={qrPage}
                    onPageChange={(_, newPage) => setQrPage(newPage)}
                    onRowsPerPageChange={(event) => {
                      setQrRowsPerPage(parseInt(event.target.value, 10));
                      setQrPage(0);
                    }}
                    sx={{
                      borderTop: "1px solid rgba(0, 0, 0, 0.08)",
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
                borderRadius: "16px",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                textAlign: "center",
                color: "text.secondary",
              }}
            >
              Please select Drawing Number/LN Item Code and click Search to display available QR codes.
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
