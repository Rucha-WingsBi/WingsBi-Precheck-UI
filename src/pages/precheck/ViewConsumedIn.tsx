import React, { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
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
  FormControl,
  Autocomplete,
  CircularProgress,
  TableSortLabel,
  TablePagination,
  Card,
  CardContent,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FileDownload as FileDownloadIcon,
} from "@mui/icons-material";
import {
  getConsumedIn,
  exportConsumedIn,
} from "../../store/slices/qrcodeSlice";

import {
  useProductionSeries,
  useDrawingNumbers,
  useLnItemCodeSearch,
  useAllDrawingNumbers,
} from "../../hooks/useMasterData";
import {
  usePONumbers,
  type ProductionOrderMaster,
} from "../../hooks/usePONumbers";
import { useDebounce } from "../../hooks/useDebounce";
import api from "../../services/api";

import type { RootState, AppDispatch } from "../../store/store";
import debounce from "lodash.debounce";

const formatQuantity = (qty: any) => {
  if (qty === undefined || qty === null || qty === '') return '-';
  const num = Number(qty);
  if (isNaN(num)) return String(qty);
  const match = String(qty).match(/^-?\d+(?:\.\d{0,4})?/);
  return match ? match[0] : String(qty);
};

const ViewPrecheck = React.lazy(() => import("./ViewPrecheck"));

const ViewConsumedIn: React.FC<{ hideHeader?: boolean }> = ({ hideHeader = false }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"precheck" | "consumed">(
    location.pathname.includes("consumed") ? "consumed" : "precheck"
  );
  const { loading, isDownloading } = useSelector(
    (state: RootState) => state.qrcode,
  );

  // TanStack Query Hooks
  const [drawingSearchText, setDrawingSearchText] = useState("");

  const [debouncedLnSearch, setDebouncedLnSearch] = useState("");
  const { data: productionSeries = [] } = useProductionSeries();
  const { data: drawingNumbers = [], isLoading: drawingLoading } =
    useDrawingNumbers("", drawingSearchText);
  const { data: allDrawingNumbers = [], isLoading: isDrawingsLoading } = useAllDrawingNumbers();
  const { isLoading: isLnSearchLoading } =
    useLnItemCodeSearch(debouncedLnSearch);

  // Form state
  const [selectedDrawing, setSelectedDrawing] = useState<any>(null);
  const [selectedProductionSeries, setSelectedProductionSeries] =
    useState<any>(null);
  const [idNumber, setIdNumber] = useState("");
  const [assemblyNumber, setAssemblyNumber] = useState<any>("");
  const [consumedInOptions, setConsumedInOptions] = useState<any[]>([]);
  const [consumedInLoading, setConsumedInLoading] = useState(false);
  const [poSearchText, setPOSearchText] = useState("");
  const debouncedPOSearch = useDebounce(poSearchText, 500);
  const { data: poNumbers = [] } = usePONumbers(debouncedPOSearch);

  const [selectedPO, setSelectedPO] = useState<ProductionOrderMaster | null>(
    null,
  );

  // Fetch Consumed In Components when drawing number is selected
  useEffect(() => {
    const drawingId =
      selectedDrawing?.id ||
      selectedDrawing?.drawingNumberId ||
      selectedDrawing?.drawingId;

    if (drawingId) {
      setConsumedInLoading(true);
      api
        .post("/api/Precheck/ConsumedInComponents", {
          drawingNumberId: drawingId,
        })
        .then((response) => {
          const rawData =
            response.data?.data || response.data?.$values || response.data;
          if (Array.isArray(rawData)) {
            setConsumedInOptions(rawData);
          } else {
            setConsumedInOptions([]);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch consumed in components:", error);
          setConsumedInOptions([]);
        })
        .finally(() => {
          setConsumedInLoading(false);
        });
    } else {
      setConsumedInOptions([]);
      setAssemblyNumber("");
    }
  }, [
    selectedDrawing?.id,
    selectedDrawing?.drawingNumberId,
    selectedDrawing?.drawingId,
  ]);

  // Search results
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const assemblyString =
    typeof assemblyNumber === "object" && assemblyNumber !== null
      ? (assemblyNumber.drawingNumber ||
        assemblyNumber.assemblyNumber ||
        assemblyNumber.assemblyDrawingNo ||
        "")
      : (assemblyNumber || "");

  const hasData =
    !!selectedDrawing ||
    !!selectedProductionSeries ||
    !!idNumber.trim() ||
    !!assemblyString.trim();

  // Sorting state
  const [orderBy, setOrderBy] = useState<string>("");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Debounced search functions
  const debouncedDrawingSearch = useMemo(
    () =>
      debounce((searchValue: string) => {
        setDrawingSearchText(searchValue);
      }, 300),
    [],
  );

  const updateDebouncedLnSearch = useMemo(
    () => debounce((value: string) => setDebouncedLnSearch(value), 300),
    [],
  );

  // Sorting functions
  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedResults = useMemo(() => {
    if (!orderBy) return searchResults;

    return [...searchResults].sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      // Handle numeric values
      if (orderBy === "sr" || orderBy === "quantity") {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else {
        // Handle string values
        aValue = String(aValue || "").toLowerCase();
        bValue = String(bValue || "").toLowerCase();
      }

      if (order === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [searchResults, orderBy, order]);

  // Pagination handlers
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Paginated results
  const paginatedResults = useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedResults.slice(startIndex, endIndex);
  }, [sortedResults, page, rowsPerPage]);

  const handleViewConsumption = () => {
    // Validate required fields
    if (!selectedDrawing || !selectedProductionSeries) {
      alert("Please select both Drawing Number and Production Series");
      return;
    }

    // According to the API spec, the GetConsumedIn endpoint expects these parameters:
    // ProdSeriesId, IdNumber, DrawingNumberId, AssemblyNumber
    const params = {
      ProdSeriesId: selectedProductionSeries.id,
      IdNumber: idNumber ? parseInt(idNumber) : undefined,
      DrawingNumberId: selectedDrawing.id || selectedDrawing.drawingNumberId || selectedDrawing.drawingId,
      AssemblyNumber: assemblyString.trim() || undefined,
    };

    // Call API with required parameters
    dispatch(getConsumedIn(params))
      .then((result: any) => {
        if (result.payload && Array.isArray(result.payload)) {
          // Map the API response to our table format
          const mappedResults = result.payload.map(
            (item: any, index: number) => ({
              sr: index + 1,
              idNumber: item.idNumber || "",
              consumedInDrawingNumber: item.consumedInDrawing || "",
              quantity: item.quantity !== undefined && item.quantity !== null ? item.quantity : "",
              poNumber: item.consumedInProductionOrderNumber || "",
              irNumber: item.irNumber || "",
              msnNumber: item.msnNumber || "",
              date: item.date
                ? new Date(item.date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
                : "",
              username: item.username || "",
              lnItemCode: item.lnItemCode || "",
              isRejected: item.isRejected === true ? "Yes" : item.isRejected === false ? "No" : "-",
              rejectionReason: item.rejectionReason || "-",
            }),
          );
          setSearchResults(mappedResults);
        } else {
          setSearchResults([]);
        }
        setShowResults(true);
      })
      .catch(() => {
        setSearchResults([]);
        setShowResults(true);
      });
  };

  const handleExport = () => {
    // Validate required fields
    if (!selectedDrawing || !selectedProductionSeries) {
      alert("Please select both Drawing Number and Production Series");
      return;
    }

    const params = {
      ProdSeriesId: selectedProductionSeries.id,
      IdNumber: idNumber ? parseInt(idNumber) : undefined,
      DrawingNumberId: selectedDrawing.id || selectedDrawing.drawingNumberId || selectedDrawing.drawingId,
      AssemblyNumber: assemblyString.trim() || undefined,
    };

    dispatch(exportConsumedIn(params));
  };

  const handleReset = () => {
    setSelectedDrawing(null);
    setSelectedProductionSeries(null);
    setIdNumber("");
    setAssemblyNumber("");
    setConsumedInOptions([]);
    setSearchResults([]);
    setShowResults(false);
    setSelectedPO(null);
    setPOSearchText("");
    setOrderBy("");
setOrder("asc");
    setPage(0);
  };

  return (
    <Box sx={{ p: hideHeader ? 0 : { xs: 1, sm: 1.5, md: 2 } }}>
      {!hideHeader && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            mb: 1.5,
            flexWrap: "wrap",
            gap: { xs: 2, sm: 4, md: 6 },
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
            {activeTab === "precheck" ? "View Precheck Details" : "View Consumed In Details"}
          </Typography>

          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              "& .MuiTab-root": {
                fontWeight: 600,
                fontSize: "0.875rem",
                textTransform: "none",
                minWidth: 120,
              },
              "& .MuiTab-root.Mui-selected": { color: "primary.main" },
              "& .MuiTabs-indicator": {
                backgroundColor: "primary.main",
                height: 3,
                borderRadius: "3px 3px 0 0",
              },
            }}
          >
            <Tab label="View Precheck" value="precheck" />
            <Tab label="View Consumed In" value="consumed" />
          </Tabs>
        </Box>
      )}

      {activeTab === "precheck" ? (
        <React.Suspense fallback={<CircularProgress sx={{ display: "block", mx: "auto", my: 4 }} />}>
          <ViewPrecheck hideHeader />
        </React.Suspense>
      ) : (
        <>
          <Card elevation={2} sx={{ mb: 2 }}>
            <CardContent sx={{ p: { xs: 1, md: 2 } }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 1,
                  gap: 1.5,
                  flexWrap: "wrap",
                }}
              >
                {/* LN Item Code Filter */}
                <FormControl sx={{ minWidth: 250 }} size="small">
                  <Autocomplete
                    size="small"
                sx={{ width: 250 }}
                options={allDrawingNumbers}
                groupBy={(option: any) => option.lnItemCode || "No LN Code"}
                getOptionLabel={(option: any) => {
                  if (typeof option === "string") return option;
                  return option.lnItemCode || "";
                }}
                value={selectedDrawing}
                loading={isDrawingsLoading || isLnSearchLoading}
                noOptionsText={
                  isDrawingsLoading
                    ? "Loading drawing numbers..."
                    : "No drawing numbers found"
                }
                freeSolo={false}
                onInputChange={(_, value) => {
                  updateDebouncedLnSearch(value);
                }}
                onChange={(_: any, value: any) => {
                  setSelectedDrawing(value);
                }}
                filterOptions={(options, { inputValue }) => {
                  if (!inputValue) return options.slice(0, 100);
                  const searchLower = inputValue.toLowerCase();
                  const filtered = options.filter(
                    (option: any) =>
                      option.lnItemCode?.toLowerCase().includes(searchLower) ||
                      option.drawingNumber
                        ?.toLowerCase()
                        .includes(searchLower) ||
                      option.nomenclature?.toLowerCase().includes(searchLower),
                  );
                  return filtered.slice(0, 100);
                }}
                renderOption={(props: any, option: any) => {
                  const { key, ...optionProps } = props;
                  return (
                    <li {...optionProps} key={key}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          py: 0.5,
                          width: "100%",
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight="500"
                          sx={{ fontSize: "0.85rem", color: "text.primary" }}
                        >
                          Drawing: {option.drawingNumber}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: "0.72rem" }}
                        >
                          {option.nomenclature} | Type: {option.componentType}
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
                renderGroup={(params) => (
                  <li key={params.key}>
                    <Typography
                      variant="subtitle2"
                      fontWeight="800"
                      sx={{
                        px: 2,
                        py: 0.5,
                        backgroundColor: "grey.200",
                        color: "primary.main",
                        fontSize: "0.95rem",
                        letterSpacing: "0.5px",
                      }}
                    >
                      LN CODE: {params.group}
                    </Typography>
                    <ul style={{ padding: 0, margin: 0 }}>{params.children}</ul>
                  </li>
                )}
                renderInput={(params: any) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="LN Item Code"
                    placeholder="Search by Drawing, LN, or Name..."
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isLnSearchLoading ? (
                            <CircularProgress color="inherit" size={16} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </FormControl>

            {/* Drawing Number Filter */}
            <FormControl sx={{ minWidth: 220 }} size="small">
              <Autocomplete
                size="small"
                sx={{ width: 260 }}
                options={drawingNumbers}
                getOptionLabel={(option) => {
                  if (typeof option === "string") return option;
                  return option.drawingNumber || "";
                }}
                value={selectedDrawing}
                loading={drawingLoading}
                onInputChange={(_: any, value: string) => {
                  if (value.length >= 3) {
                    debouncedDrawingSearch(value);
                  }
                }}
                onChange={(_: any, value: any) => {
                  setSelectedDrawing(value);
                }}
                isOptionEqualToValue={(option, value) =>
                  option.id === (value?.id || "")
                }
                renderOption={(props: any, option: any) => (
                  <li {...props}>
                    <Box
                      sx={{ display: "flex", flexDirection: "column", py: 0.5 }}
                    >
                      <Typography variant="body2">
                        {option.drawingNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.nomenclature || ""} |{" "}
                        {option.componentType || ""}
                      </Typography>
                    </Box>
                  </li>
                )}
                renderInput={(params: any) => (
                  <TextField
                    {...params}
                    label="Drawing No *"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: <>{params.InputProps.endAdornment}</>,
                    }}
                  />
                )}
              />
            </FormControl>
            <FormControl sx={{ minWidth: 120 }} size="small">
              <Autocomplete
                size="small"
                sx={{ width: 140 }}
                options={productionSeries}
                getOptionLabel={(option) => {
                  if (typeof option === "string") return option;
                  return option.productionSeries || "";
                }}
                value={selectedProductionSeries}
                onChange={(_, value) => {
                  setSelectedProductionSeries(value);
                }}
                isOptionEqualToValue={(option, value) =>
                  option.id === (value?.id || "")
                }
                renderOption={(props, option) => (
                  <li {...props}>
                    <Typography variant="body2">
                      {option.productionSeries}
                    </Typography>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Prod Series *"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: <>{params.InputProps.endAdornment}</>,
                    }}
                  />
                )}
              />
            </FormControl>
            <FormControl sx={{ minWidth: 220 }} size="small">
              <Autocomplete
                freeSolo
                forcePopupIcon={true}
                size="small"
                sx={{ width: 260 }}
                options={
                  consumedInOptions && consumedInOptions.length > 0
                    ? consumedInOptions
                    : Array.isArray(allDrawingNumbers)
                    ? allDrawingNumbers
                    : []
                }
                getOptionLabel={(option: any) => {
                  if (!option) return "";
                  if (typeof option === "string") return option;
                  return (
                    option.drawingNumber ||
                    option.assemblyNumber ||
                    option.assemblyDrawingNo ||
                    option.nomenclature ||
                    ""
                  );
                }}
                value={assemblyNumber || null}
                loading={consumedInLoading}
                onInputChange={(_, value) => {
                  setAssemblyNumber(value);
                }}
                onChange={(_: any, value: any) => {
                  setAssemblyNumber(value);
                }}
                noOptionsText={
                  consumedInLoading
                    ? "Loading assembly drawing numbers..."
                    : "No assembly drawing numbers found"
                }
                filterOptions={(options, { inputValue }) => {
                  if (!inputValue) return options.slice(0, 100);
                  const searchLower = inputValue.toLowerCase();
                  const filtered = options.filter((option: any) => {
                    if (typeof option === "string") {
                      return option.toLowerCase().includes(searchLower);
                    }
                    const text = (
                      option.drawingNumber ||
                      option.assemblyNumber ||
                      option.assemblyDrawingNo ||
                      option.nomenclature ||
                      ""
                    ).toLowerCase();
                    return text.includes(searchLower);
                  });
                  return filtered.slice(0, 100);
                }}
                isOptionEqualToValue={(option: any, value: any) => {
                  if (!option || !value) return false;
                  if (typeof option === "string" || typeof value === "string") {
                    return option === value;
                  }
                  return (
                    (option.id && option.id === value.id) ||
                    (option.drawingNumber &&
                      option.drawingNumber === value.drawingNumber) ||
                    (option.assemblyNumber &&
                      option.assemblyNumber === value.assemblyNumber)
                  );
                }}
                renderOption={(props: any, option: any) => {
                  const { key, ...optionProps } = props;
                  const label =
                    typeof option === "string"
                      ? option
                      : option.drawingNumber ||
                      option.assemblyNumber ||
                      option.assemblyDrawingNo ||
                      "";
                  const subLabel =
                    typeof option === "object"
                      ? [option.nomenclature, option.componentType]
                        .filter(Boolean)
                        .join(" | ")
                      : "";

                  return (
                    <li {...optionProps} key={key || label || option.id}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          py: 0.5,
                        }}
                      >
                        <Typography variant="body2">{label}</Typography>
                        {subLabel ? (
                          <Typography variant="caption" color="text.secondary">
                            {subLabel}
                          </Typography>
                        ) : null}
                      </Box>
                    </li>
                  );
                }}
                renderInput={(params: any) => (
                  <TextField
                    {...params}
                    label="Assembly Drawing No"
                    placeholder="Type or select assembly..."
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {consumedInLoading ? (
                            <CircularProgress color="inherit" size={16} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </FormControl>
            <FormControl sx={{ minWidth: 50 }} size="small">
              <TextField
                size="small"
                sx={{ width: 105 }}
                label="ID Number"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                variant="outlined"
              />
            </FormControl>
            <Button
              variant="contained"
              color="primary"
              sx={{ minWidth: 70, height: 32 }}
              size="small"
              onClick={handleViewConsumption}
              disabled={loading || !hasData}
            >
              <SearchIcon sx={{ mr: 1 }} />
              View
            </Button>
            <Button
              variant="contained"
              sx={{
                minWidth: 70,
                height: 32,
                backgroundColor: "#2e7d32",
                "&:hover": { backgroundColor: "#1b5e20" },
              }}
              size="small"
              onClick={handleExport}
              disabled={
                isDownloading || !selectedDrawing || !selectedProductionSeries
              }
            >
              {isDownloading ? (
                <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
              ) : (
                <FileDownloadIcon sx={{ mr: 1 }} />
              )}
              Export
            </Button>
            <Button
              variant="contained"
              color="error"
              sx={{ minWidth: 70, height: 32 }}
              size="small"
              onClick={handleReset}
              disabled={!hasData}
            >
              <RefreshIcon sx={{ mr: 1 }} />
              Reset
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Results Display */}
      {showResults && (
        <Typography variant="body2" sx={{ mb: 1, fontWeight: "medium" }}>
          Showing consumption results for {selectedDrawing?.drawingNumber || ""}{" "}
          / {selectedProductionSeries?.productionSeries || ""}
        </Typography>
      )}

      {/* Results Table */}
      <Paper sx={{ mt: 1, mb: 1, p: 0.5, boxShadow: 2 }}>
        <TableContainer sx={{ overflow: "auto" }}>
          <Table stickyHeader sx={{ minWidth: 800 }} size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5", height: 40 }}>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "#f5f5f5",
                    py: 0.3,
                    px: 0.8,
                    fontSize: "0.85rem",
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "sr"}
                    direction={orderBy === "sr" ? order : "asc"}
                    onClick={() => handleRequestSort("sr")}
                    sx={{ fontSize: "0.85rem", fontWeight: "bold" }}
                  >
                    Sr No
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "#f5f5f5",
                    py: 0.3,
                    px: 0.8,
                    fontSize: "0.85rem",
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "idNumber"}
                    direction={orderBy === "idNumber" ? order : "asc"}
                    onClick={() => handleRequestSort("idNumber")}
                    sx={{ fontSize: "0.85rem", fontWeight: "bold" }}
                  >
                    ID Number
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "#f5f5f5",
                    py: 0.3,
                    px: 0.8,
                    fontSize: "0.85rem",
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "consumedInDrawingNumber"}
                    direction={
                      orderBy === "consumedInDrawingNumber" ? order : "asc"
                    }
                    onClick={() => handleRequestSort("consumedInDrawingNumber")}
                    sx={{ fontSize: "0.85rem", fontWeight: "bold" }}
                  >
                    Consumed IN Drawing Number
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "#f5f5f5",
                    py: 0.3,
                    px: 0.8,
                    fontSize: "0.85rem",
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "quantity"}
                    direction={
                      orderBy === "quantity" ? order : "asc"
                    }
                    onClick={() => handleRequestSort("quantity")}
                    sx={{ fontSize: "0.85rem", fontWeight: "bold" }}
                  >
                    Quantity
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "#f5f5f5",
                    py: 0.3,
                    px: 0.8,
                    fontSize: "0.85rem",
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "poNumber"}
                    direction={orderBy === "poNumber" ? order : "asc"}
                    onClick={() => handleRequestSort("poNumber")}
                    sx={{ fontSize: "0.85rem", fontWeight: "bold" }}
                  >
                    PO Number
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "#f5f5f5",
                    py: 0.3,
                    px: 0.8,
                    fontSize: "0.85rem",
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "irNumber"}
                    direction={orderBy === "irNumber" ? order : "asc"}
                    onClick={() => handleRequestSort("irNumber")}
                    sx={{ fontSize: "0.85rem", fontWeight: "bold" }}
                  >
                    IR Number
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "#f5f5f5",
                    py: 0.3,
                    px: 0.8,
                    fontSize: "0.85rem",
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "msnNumber"}
                    direction={orderBy === "msnNumber" ? order : "asc"}
                    onClick={() => handleRequestSort("msnNumber")}
                    sx={{ fontSize: "0.85rem", fontWeight: "bold" }}
                  >
                    MSN Number
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "#f5f5f5",
                    py: 0.3,
                    px: 0.8,
                    fontSize: "0.85rem",
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "date"}
                    direction={orderBy === "date" ? order : "asc"}
                    onClick={() => handleRequestSort("date")}
                    sx={{ fontSize: "0.85rem", fontWeight: "bold" }}
                  >
                    Date
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "#f5f5f5",
                    py: 0.3,
                    px: 0.8,
                    fontSize: "0.85rem",
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "username"}
                    direction={orderBy === "username" ? order : "asc"}
                    onClick={() => handleRequestSort("username")}
                    sx={{ fontSize: "0.85rem", fontWeight: "bold" }}
                  >
                    Username
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "#f5f5f5",
                    py: 0.3,
                    px: 0.8,
                    fontSize: "0.85rem",
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "isRejected"}
                    direction={orderBy === "isRejected" ? order : "asc"}
                    onClick={() => handleRequestSort("isRejected")}
                    sx={{ fontSize: "0.85rem", fontWeight: "bold" }}
                  >
                    Is Rejected
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    backgroundColor: "#f5f5f5",
                    py: 0.3,
                    px: 0.8,
                    fontSize: "0.85rem",
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "rejectionRemarks"}
                    direction={orderBy === "rejectionRemarks" ? order : "asc"}
                    onClick={() => handleRequestSort("rejectionRemarks")}
                    sx={{ fontSize: "0.85rem", fontWeight: "bold" }}
                  >
                    Remarks
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ height: 150 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : paginatedResults.length > 0 ? (
                paginatedResults.map((item, index) => (
                  <TableRow key={index} hover sx={{ height: 36 }}>
                    <TableCell
                      align="center"
                      sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                    >
                      {item.sr}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                    >
                      {item.idNumber}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                    >
                      {item.consumedInDrawingNumber}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                    >
                      {formatQuantity(item.quantity)}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                    >
                      {item.poNumber}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                    >
                      {item.irNumber || "-"}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                    >
                      {item.msnNumber || "-"}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                    >
                      {item.date || "-"}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                    >
                      {item.username || "-"}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                    >
                      {item.isRejected || "-"}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ py: 0.2, px: 0.8, fontSize: "0.75rem" }}
                    >
                      {item.rejectionReason || "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : showResults ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ height: 150 }}>
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    align="center"
                    sx={{ height: 150, color: "text.secondary" }}
                  >
                    Enter search criteria and click "View Consumption" to see
                    results
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {searchResults.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={searchResults.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              borderTop: "1px solid #e0e0e0",
              "& .MuiTablePagination-toolbar": {
                minHeight: 48,
              },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
              {
                fontSize: "0.8rem",
              },
            }}
          />
        )}
      </Paper>
      </>
      )}
    </Box>
  );
};

export default ViewConsumedIn;
