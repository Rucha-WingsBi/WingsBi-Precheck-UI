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
  IconButton,
  Collapse,
  Chip,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  QrCode as QrCodeIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import {
  viewPrecheckDetails,
  exportPrecheckDetails,
} from "../../store/slices/precheckSlice";
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

import type { RootState, AppDispatch } from "../../store/store";
import debounce from "lodash.debounce";

const ViewConsumedIn = React.lazy(() => import("./ViewConsumedIn"));

const ViewPrecheck: React.FC<{ hideHeader?: boolean }> = ({ hideHeader = false }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"precheck" | "consumed">(
    location.pathname.includes("consumed") ? "consumed" : "precheck"
  );
  const { isLoading } = useSelector((state: RootState) => state.precheck);

  const [poSearchText, setPOSearchText] = useState("");
  const debouncedPOSearch = useDebounce(poSearchText, 500);
  const { data: poNumbers = [] } = usePONumbers(debouncedPOSearch);

  const [selectedPO, setSelectedPO] = useState<ProductionOrderMaster | null>(
    null,
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
  // Precheck
  const [productionOrder, setProductionOrder] = useState("");
  const [selectedDrawing, setSelectedDrawing] = useState<any>(null);
  const [selectedProductionSeries, setSelectedProductionSeries] =
    useState<any>(null);
  const [idNumber, setIdNumber] = useState("");

  // Search results
  // Precheck
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Sorting state
  const [orderBy, setOrderBy] = useState<string>("");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Expanded rows state
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const findMatchingDrawing = (po: ProductionOrderMaster | null, drawingList: any[]) => {
    if (!po || !drawingList || drawingList.length === 0) return null;

    // Priority 1: Match exact drawing ID
    if (po.drawingNumberId) {
      const match = drawingList.find((d: any) => d.id === po.drawingNumberId);
      if (match) return match;
    }

    // Priority 2: Match exact drawing number string (case insensitive)
    if (po.drawingNumber) {
      const target = po.drawingNumber.trim().toLowerCase();
      const match = drawingList.find(
        (d: any) => d.drawingNumber && d.drawingNumber.trim().toLowerCase() === target
      );
      if (match) return match;
    }

    // Priority 3: Match LN Item Code ID
    if (po.lnItemCodeId) {
      const match = drawingList.find((d: any) => d.lnItemCodeId === po.lnItemCodeId);
      if (match) return match;
    }

    // Priority 4: Match LN Item Code string (case insensitive)
    if (po.lnItemCode) {
      const target = po.lnItemCode.trim().toLowerCase();
      const match = drawingList.find(
        (d: any) => d.lnItemCode && d.lnItemCode.trim().toLowerCase() === target
      );
      if (match) return match;
    }

    return null;
  };

  // Sync selectedDrawing with allDrawingNumbers once loaded if selecting PO gave a partial object or was loaded before master data
  useEffect(() => {
    if (selectedPO && allDrawingNumbers.length > 0) {
      const matchingDrawing = findMatchingDrawing(selectedPO, allDrawingNumbers);
      if (matchingDrawing) {
        setSelectedDrawing(matchingDrawing);
      }
    }
  }, [allDrawingNumbers, selectedPO]);

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
  const handleChangePage = (__event: unknown, newPage: number) => {
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

  const handleViewPrecheck = () => {
    // According to the API spec, the ViewPrecheck endpoint expects these parameters:
    // ProductionOrderNumber, ProductionSeriesId, Id, DrawingNumberId
    const params = {
      ProductionOrderNumber: productionOrder || undefined,
      ProductionSeriesId: selectedProductionSeries?.id || undefined,
      Id: idNumber ? parseInt(idNumber) : undefined,
      DrawingNumberId: selectedDrawing?.id || undefined,
    };

    // Only call API if we have at least one parameter
    if (
      params.ProductionOrderNumber ||
      params.ProductionSeriesId ||
      params.Id ||
      params.DrawingNumberId
    ) {
      dispatch(viewPrecheckDetails(params))
        .then((result: any) => {
          if (result.payload && Array.isArray(result.payload)) {
            // Map the API response to our table format
            const mappedResults = result.payload.map(
              (item: any, index: number) => ({
                sr: index + 1,
                drawingNumber: item.drawingNumber || "",
                nomenclature: item.nomenclature || "",
                quantity: item.quantity || 0,
                idNumber: item.idNumber || "",
                ir: item.irNumber || "",
                msn: item.msnNumber || "",
                mrirNumber: item.mrirNumber || "",
                componentType: item.componentType || "",
                remarks: item.remarks || "",
                username: item.username || "",
                modifiedDate: item.modifiedDate
                  ? formatDate(item.modifiedDate)
                  : item.createdDate
                    ? formatDate(item.createdDate)
                    : "",
                isPrecheckComplete: item.isPrecheckComplete || false,
                consumedInDrawing: item.consumedInDrawing || "",
                productionOrderNumber: item.productionOrderNumber || "",
                projectNumber: item.projectNumber || "",
                lnItemCode: item.lnItemCode || "",
                isRejected: item.isRejected || false,
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
    }
  };

  const handleExport = () => {
    // Create export parameters object with only defined values
    const exportParams: {
      productionOrderNumber?: string;
      productionSeriesId?: number;
      id?: number;
      drawingNumberId?: number;
    } = {};

    // Only add parameters that have values
    if (productionOrder) {
      exportParams.productionOrderNumber = productionOrder;
    }
    if (selectedProductionSeries?.id) {
      exportParams.productionSeriesId = selectedProductionSeries.id;
    }
    if (idNumber) {
      exportParams.id = parseInt(idNumber);
    }
    if (selectedDrawing?.id) {
      exportParams.drawingNumberId = selectedDrawing.id;
    }

    // Check if at least one parameter is provided
    if (Object.keys(exportParams).length === 0) {
      alert("Please enter at least one search criteria before exporting");
      return;
    }

    // Call the export API
    dispatch(exportPrecheckDetails(exportParams))
      .unwrap()
      .then((result) => {
        if (result.success) {
          // You can show a success message here if needed
          // toast.success(result.message);
        }
      })
      .catch((error) => {
        // Show error message
        alert(error.message || "Failed to export precheck details");
      });
  };

  const handleReset = () => {
    setProductionOrder("");
    setSelectedDrawing(null);
    setSelectedProductionSeries(null);
    setSelectedPO(null);
    setIdNumber("");
    setSearchResults([]);
    setShowResults(false);
    setOrderBy("");
    setOrder("asc");
    setPage(0);
    setExpandedRows(new Set());
  };

  const handleRowExpand = (index: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };

  const getComponentTypeChip = (componentType: string) => {
    const type = componentType?.toUpperCase();
    switch (type) {
      case "ID":
        return (
          <Chip
            icon={<QrCodeIcon />}
            label="ID"
            size="small"
            color="primary"
            variant="outlined"
          />
        );
      case "BATCH":
        return (
          <Chip
            icon={<InventoryIcon />}
            label="BATCH"
            size="small"
            color="secondary"
            variant="outlined"
          />
        );
      case "FIM":
        return (
          <Chip
            icon={<CategoryIcon />}
            label="FIM"
            size="small"
            color="success"
            variant="outlined"
          />
        );
      case "SI":
        return (
          <Chip
            icon={<SettingsIcon />}
            label="SI"
            size="small"
            color="warning"
            variant="outlined"
          />
        );
      default:
        return <Chip label={type || "N/A"} size="small" variant="outlined" />;
    }
  };

  // Format date function
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "N/A";
    }
  };

  const isSearchCriteriaFilled = !!(
    productionOrder ||
    selectedDrawing ||
    selectedProductionSeries ||
    selectedPO ||
    idNumber.trim()
  );

  const isResetEnabled = isSearchCriteriaFilled || searchResults.length > 0;

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

      {activeTab === "consumed" ? (
        <React.Suspense fallback={<CircularProgress sx={{ display: "block", mx: "auto", my: 4 }} />}>
          <ViewConsumedIn hideHeader />
        </React.Suspense>
      ) : (
        <>

      {/* Precheck Form Controls */}
      <Card elevation={2} sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 1, md: 2 } }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              flexWrap: "wrap",
              gap: 1.5,
              alignItems: { xs: "stretch", sm: "center" },
            }}
          >
            <FormControl
              sx={{ minWidth: { xs: "100%", sm: 200 } }}
              size="small"
            >
              <Autocomplete
                size="small"
                options={poNumbers || []}
                getOptionLabel={(option) => {
                  if (typeof option === "string") return option;
                  return option.productionOrderNumber || "";
                }}
                filterOptions={(options, { inputValue }) => {
                  if (!inputValue) return options.slice(0, 100);
                  const searchLower = inputValue.toLowerCase();
                  const filtered = options.filter((option) => {
                    return (
                      option.productionOrderNumber?.toLowerCase().includes(searchLower) ||
                      option.lnItemCode?.toLowerCase().includes(searchLower) ||
                      option.drawingNumber?.toLowerCase().includes(searchLower)
                    );
                  });
                  return filtered.slice(0, 100);
                }}
                value={selectedPO}
                onInputChange={(_, value) => setPOSearchText(value)}
                onChange={(_, newValue) => {
                  if (newValue && typeof newValue !== "string") {
                    setSelectedPO(newValue);
                    setProductionOrder(newValue.productionOrderNumber);

                    // Auto-select Production Series
                    if (newValue.prodSeriesId && newValue.productionSeries) {
                      const matchingSeries = productionSeries.find(
                        (ps) => ps.id === newValue.prodSeriesId,
                      );
                      if (matchingSeries) {
                        setSelectedProductionSeries(matchingSeries);
                      } else {
                        setSelectedProductionSeries({
                          id: newValue.prodSeriesId,
                          productionSeries: newValue.productionSeries,
                        });
                      }
                    }

                    // Auto-select Drawing / LN Item Code
                    const matchingDrawing = findMatchingDrawing(newValue, allDrawingNumbers);

                    if (matchingDrawing) {
                      setSelectedDrawing(matchingDrawing);
                    } else if (newValue.drawingNumber || newValue.lnItemCode || newValue.drawingNumberId) {
                      setSelectedDrawing({
                        id: newValue.drawingNumberId || 0,
                        drawingNumber: newValue.drawingNumber || "",
                        lnItemCode: newValue.lnItemCode || "",
                        lnItemCodeId: newValue.lnItemCodeId || 0,
                        nomenclature: newValue.nomenclature || "",
                        componentType: newValue.componentType || "",
                      });
                    }
                  } else {
                    setSelectedPO(null);
                    setProductionOrder("");
                  }
                }}
                renderOption={(props, option) => {
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
                          fontWeight="600"
                          color="primary"
                        >
                          PO: {option.productionOrderNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.lnItemCode && `LN: ${option.lnItemCode}`}
                          {option.drawingNumber &&
                            ` | Drawing: ${option.drawingNumber}`}
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="PO Number Filter"
                    size="small"
                  />
                )}
              />
            </FormControl>

            {/* LN Item Code Filter */}
            <FormControl
              sx={{ minWidth: { xs: "100%", sm: 280 } }}
              size="small"
            >
              <Autocomplete
                size="small"
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
                isOptionEqualToValue={(option: any, value: any) =>
                  (value?.id && option.id === value.id) ||
                  (option.drawingNumber && value?.drawingNumber && option.drawingNumber.trim().toLowerCase() === value.drawingNumber.trim().toLowerCase()) ||
                  (option.lnItemCode && value?.lnItemCode && option.lnItemCode.trim().toLowerCase() === value.lnItemCode.trim().toLowerCase())
                }
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
                          sx={{
                            fontSize: "0.85rem",
                            color: "text.primary",
                          }}
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
                    label="LN Item Code"
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
            <FormControl
              sx={{ minWidth: { xs: "100%", sm: 280 } }}
              size="small"
            >
              <Autocomplete
                size="small"
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
                isOptionEqualToValue={(option: any, value: any) =>
                  Boolean(
                    (value?.id && option.id === value.id) ||
                    (option.drawingNumber && value?.drawingNumber && option.drawingNumber.trim().toLowerCase() === value.drawingNumber.trim().toLowerCase())
                  )
                }
                renderOption={(props: any, option: any) => (
                  <li {...props}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        py: 0.5,
                      }}
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
                    label="Drawing Number"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: <>{params.InputProps.endAdornment}</>,
                    }}
                  />
                )}
              />
            </FormControl>

            <FormControl
              sx={{ minWidth: { xs: "100%", sm: 120 } }}
              size="small"
            >
              <Autocomplete
                size="small"
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
                    label="Prod Series"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: <>{params.InputProps.endAdornment}</>,
                    }}
                  />
                )}
              />
            </FormControl>

            <FormControl sx={{ minWidth: { xs: "100%", sm: 100 } }}>
              <TextField
                size="small"
                label="ID Number"
                sx={{ width: 100 }}
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                variant="outlined"
              />
            </FormControl>

            <Box
              sx={{
                display: "flex",
                gap: 1,
                width: { xs: "100%", sm: "auto" },
                justifyContent: { xs: "space-between", sm: "flex-start" },
              }}
            >
              <Button
                variant="contained"
                color="primary"
                sx={{ minWidth: { xs: "30%", sm: 130 }, height: 32 }}
                size="small"
                onClick={handleViewPrecheck}
                disabled={isLoading || !isSearchCriteriaFilled}
              >
                <VisibilityIcon sx={{ mr: 1 }} />
                View
              </Button>
              <Button
                variant="contained"
                color="info"
                sx={{ minWidth: { xs: "30%", sm: 130 }, height: 32 }}
                size="small"
                onClick={handleExport}
                disabled={!isSearchCriteriaFilled}
              >
                <FileDownloadIcon sx={{ mr: 1 }} />
                Export
              </Button>
              <Button
                variant="contained"
                color="error"
                sx={{ minWidth: { xs: "30%", sm: 130 }, height: 32 }}
                size="small"
                onClick={handleReset}
                disabled={!isResetEnabled}
              >
                <RefreshIcon sx={{ mr: 1 }} />
                Reset
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Precheck Results Display */}
      {showResults && (
        <Typography variant="body2" sx={{ mb: 1, fontWeight: "medium" }}>
          Showing results for Production Order: {productionOrder || "All"} /
          Drawing: {selectedDrawing?.drawingNumber || "All"} / Production
          Series: {selectedProductionSeries?.productionSeries || "All"} / ID:{" "}
          {idNumber || "All"}
        </Typography>
      )}

      {/* Precheck Results Table */}
      <Paper sx={{ mt: 1, mb: 1, p: 0.5, boxShadow: 2 }}>
        <TableContainer
          sx={{
            overflow: "auto",
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ height: 40 }}>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    bgcolor: "grey.50",
                    padding: "5px 8px !important",
                    fontSize: "0.85rem",
                    minWidth: 20,
                    whiteSpace: "nowrap",
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "sr"}
                    direction={orderBy === "sr" ? order : "asc"}
                    onClick={() => handleRequestSort("sr")}
                  >
                    SR
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    bgcolor: "grey.50",
                    padding: "5px 8px !important",
                    fontSize: "0.85rem",
                    minWidth: 80,
                    whiteSpace: "nowrap",
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "lnitemcode"}
                    direction={orderBy === "lnitemcode" ? order : "asc"}
                    onClick={() => handleRequestSort("lnitemcode")}
                  >
                    LN Item Code
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    bgcolor: "grey.50",
                    padding: "5px 8px !important",
                    fontSize: "0.85rem",
                    minWidth: 80,
                    whiteSpace: "nowrap",
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "drawingNumber"}
                    direction={orderBy === "drawingNumber" ? order : "asc"}
                    onClick={() => handleRequestSort("drawingNumber")}
                  >
                    Drawing Number
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    bgcolor: "grey.50",
                    padding: "5px 8px !important",
                    fontSize: "0.85rem",
                    minWidth: 100,
                    whiteSpace: "nowrap",
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "nomenclature"}
                    direction={orderBy === "nomenclature" ? order : "asc"}
                    onClick={() => handleRequestSort("nomenclature")}
                  >
                    Nomenclature
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    bgcolor: "grey.50",
                    padding: "5px 8px !important",
                    fontSize: "0.85rem",
                    minWidth: 40,
                    whiteSpace: "nowrap",
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "quantity"}
                    direction={orderBy === "quantity" ? order : "asc"}
                    onClick={() => handleRequestSort("quantity")}
                  >
                    Qty
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    bgcolor: "grey.50",
                    padding: "5px 8px !important",
                    fontSize: "0.85rem",
                    minWidth: 80,
                    whiteSpace: "nowrap",
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "idNumber"}
                    direction={orderBy === "idNumber" ? order : "asc"}
                    onClick={() => handleRequestSort("idNumber")}
                  >
                    ID Number
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    bgcolor: "grey.50",
                    padding: "5px 8px !important",
                    fontSize: "0.85rem",
                    minWidth: 60,
                    whiteSpace: "nowrap",
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "ir"}
                    direction={orderBy === "ir" ? order : "asc"}
                    onClick={() => handleRequestSort("ir")}
                  >
                    IR
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    bgcolor: "grey.50",
                    padding: "5px 8px !important",
                    fontSize: "0.85rem",
                    minWidth: 60,
                    whiteSpace: "nowrap",
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "msn"}
                    direction={orderBy === "msn" ? order : "asc"}
                    onClick={() => handleRequestSort("msn")}
                  >
                    MSN
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    bgcolor: "grey.50",
                    padding: "5px 8px !important",
                    fontSize: "0.85rem",
                    minWidth: 80,
                    whiteSpace: "nowrap",
                  }}
                >
                  <TableSortLabel
                    active={orderBy === "mrirNumber"}
                    direction={orderBy === "mrirNumber" ? order : "asc"}
                    onClick={() => handleRequestSort("mrirNumber")}
                  >
                    MRIR Number
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    bgcolor: "grey.50",
                    padding: "5px 8px !important",
                    fontSize: "0.85rem",
                    minWidth: 80,
                    whiteSpace: "nowrap",
                  }}
                >
                  Type
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    bgcolor: "grey.50",
                    padding: "5px 8px !important",
                    fontSize: "0.85rem",
                    minWidth: 70,
                    whiteSpace: "nowrap",
                  }}
                >
                  Status
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: "bold",
                    bgcolor: "grey.50",
                    padding: "5px 8px !important",
                    fontSize: "0.85rem",
                    minWidth: 40,
                    whiteSpace: "nowrap",
                  }}
                >
                  Details
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ height: 100 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : paginatedResults.length > 0 ? (
                paginatedResults.map((item: any, index: number) => (
                  <React.Fragment key={index}>
                    <TableRow
                      hover
                      sx={{
                        height: 28,
                        backgroundColor: item.isRejected
                          ? "#e0e0e0"
                          : item.isPrecheckComplete
                            ? "#f0f0f0"
                            : "inherit",
                        opacity: item.isRejected
                          ? 0.7
                          : item.isPrecheckComplete
                            ? 0.8
                            : 1,
                      }}
                    >
                      <TableCell
                        align="center"
                        sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                      >
                        {item.sr}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                      >
                        {item.lnItemCode}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                      >
                        {item.drawingNumber}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                      >
                        {item.nomenclature}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                      >
                        {item.quantity}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                      >
                        {item.idNumber || "-"}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                      >
                        {item.ir || "-"}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                      >
                        {item.msn || "-"}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                      >
                        {item.mrirNumber || "-"}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                      >
                        {getComponentTypeChip(item.componentType || "")}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                      >
                        {item.isRejected ? (
                          <Chip
                            label="REJECTED"
                            size="small"
                            color="error"
                            sx={{
                              fontWeight: "bold",
                              fontSize: "0.65rem",
                              height: 20,
                            }}
                          />
                        ) : (
                          <Chip
                            label="ACTIVE"
                            size="small"
                            color="success"
                            sx={{
                              fontWeight: "bold",
                              fontSize: "0.65rem",
                              height: 20,
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => handleRowExpand(index)}
                          sx={{ p: 0.2 }}
                        >
                          {expandedRows.has(index) ? (
                            <ExpandLessIcon fontSize="small" />
                          ) : (
                            <ExpandMoreIcon fontSize="small" />
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow sx={{ height: 'auto' }}>
                      <TableCell
                        style={{ paddingBottom: 0, paddingTop: 0 }}
                        colSpan={12}
                      >
                        <Collapse
                          in={expandedRows.has(index)}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box sx={{ margin: 0.5 }}>
                            <Table size="small" aria-label="additional-details">
                              <TableHead>
                                <TableRow sx={{ height: 40 }}>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      fontWeight: "bold",
                                      padding: "3px 6px !important",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    Remarks
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      fontWeight: "bold",
                                      padding: "3px 6px !important",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    User
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      fontWeight: "bold",
                                      padding: "3px 6px !important",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    Date
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                <TableRow sx={{ height: 40 }}>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      padding: "2px 6px !important",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {item.remarks || "-"}
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      padding: "2px 6px !important",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {item.username || "-"}
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontSize: "0.75rem",
                                      padding: "2px 6px !important",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {item.modifiedDate || "-"}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              ) : showResults ? (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ height: 100 }}>
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    align="center"
                    sx={{ height: 100, color: "text.secondary" }}
                  >
                    Enter search criteria and click "View Precheck" to see
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
                minHeight: 40,
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

export default ViewPrecheck;
