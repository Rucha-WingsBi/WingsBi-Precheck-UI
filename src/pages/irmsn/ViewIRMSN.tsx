import React, { useEffect, useState, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  IconButton,
  CircularProgress,
  Button,
  FormControl,
  InputLabel,
  Autocomplete,
  Card,
  CardContent,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import api from "../../services/api";
import SearchIcon from "@mui/icons-material/Search";
import {
  fetchIRMSNList,
  clearTables,
  fetchMSNList,
  setSearchParams,
} from "../../store/slices/irmsnSlice";
import {
  useDepartments,
  useProductionSeries,
  useDrawingNumbers,
  useAllDrawingNumbers,
} from "../../hooks/useMasterData";
import type { RootState, AppDispatch } from "../../store/store";
import debounce from "lodash.debounce";
import { useNavigate } from "react-router-dom";
import {
  Visibility as VisibilityIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
  Today as TodayIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, startOfDay, addDays } from "date-fns";

const ViewIRMSN: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { irmsnList, msnList, loading, lastSearchParams } = useSelector(
    (state: RootState) => state.irmsn,
  );
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();

  const hasRestored = useRef(false);

  // Local state - declare searchTerm first since it's used in hooks below
  const [searchTerm, setSearchTerm] = useState("");
  const [department, setDepartment] = React.useState<string | number>("");
  const [productionSeriesValue, setProductionSeriesValue] = React.useState<
    string | number
  >("");
  const [drawingNumber, setDrawingNumber] = React.useState("");
  const [selectedDrawing, setSelectedDrawing] = useState<any>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [selectedProductionSeries, setSelectedProductionSeries] =
    useState<any>(null);
  const [lnItemCode, setLnItemCode] = useState("");
  const [selectedLnItemCode, setSelectedLnItemCode] = useState<string | null>(
    null,
  );
  const [irOptions, setIrOptions] = useState<any[]>([]);
  const [msnOptions, setMsnOptions] = useState<any[]>([]);

  const [selectedIR, setSelectedIR] = useState<any | null>(null);
  const [selectedMSN, setSelectedMSN] = useState<any | null>(null);

  // Date Filters
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const [localLoading, setLocalLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });
  const [, setHasAutoSelectedDepartment] = useState(false);

  const [viewType, setViewType] = useState<"IR" | "MSN">("IR");

  // TanStack Query Hooks - now searchTerm is available
  const { data: departments = [] } = useDepartments();
  const { data: productionSeries = [] } = useProductionSeries();
  const { data: drawingNumbers = [], isLoading: drawingLoading } =
    useDrawingNumbers("", searchTerm);
  const { data: allDrawingNumbers = [], isLoading: isLnSearchLoading } =
    useAllDrawingNumbers();

  const isLoadingCommon = !departments.length || !productionSeries.length;

  const debouncedDrawingSearch = useMemo(
    () =>
      debounce(async (search: string) => {
        setSearchTerm(search);
      }, 300),
    [],
  );

  const updateDebouncedLnSearch = useMemo(
    () =>
      debounce((val: string) => {
        console.log(val);
      }, 300),
    [],
  );
  useEffect(() => {
    if (statusMessage.type) {
      const timer = setTimeout(() => {
        setStatusMessage({ type: null, message: "" });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [statusMessage]);



  // Restore filters and auto-search on mount
  useEffect(() => {
    // Only run if we have saved criteria and no data is currently loaded (or even if loaded, to refresh)
    // We'll trust lastSearchParams as the source of truth for "active filter state" when returning to the page
    if (
      lastSearchParams &&
      departments.length &&
      productionSeries.length &&
      !hasRestored.current
    ) {
      const restoreAndFetch = async () => {
        hasRestored.current = true;
        // 1. Restore UI states from lastSearchParams

        // Prod Series
        if (lastSearchParams.productionSeries) {
          const psMatch = productionSeries.find(
            (ps: any) =>
              ps.productionSeries === lastSearchParams.productionSeries,
          );
          if (psMatch) {
            setSelectedProductionSeries(psMatch);
            setProductionSeriesValue(psMatch.id);
          }
        }

        // View Type
        if (lastSearchParams.viewType) {
          setViewType(lastSearchParams.viewType as "IR" | "MSN");
        }

        // Department
        if (lastSearchParams.departmentTypeId) {
          const deptId = Number(lastSearchParams.departmentTypeId);
          const deptMatch = departments.find((d: any) => d.id === deptId);
          if (deptMatch) {
            setSelectedDepartment(deptMatch);
            setDepartment(deptMatch.id);
          }
        }

        // Drawing Number
        if (lastSearchParams.drawingNumber) {
          const drgMatch = allDrawingNumbers.find(
            (d) => d.drawingNumber === lastSearchParams.drawingNumber,
          );
          if (drgMatch) setSelectedDrawing(drgMatch);
        }

        // LN Item Code
        if (lastSearchParams.lnItemCode) {
          const lnMatch = allDrawingNumbers.find(
            (d) => d.lnItemCode === lastSearchParams.lnItemCode,
          );
          // If we didn't match via drawing number above, we might try setting selectedDrawing via LN match
          // However, selectedDrawing drives both inputs in current UI logic (sort of)
          // But let's just set the state if we can find a robust match
          if (lnMatch && !lastSearchParams.drawingNumber)
            setSelectedDrawing(lnMatch);
        }

        // Dates
        if (lastSearchParams.fromDate)
          setFromDate(new Date(lastSearchParams.fromDate));
        if (lastSearchParams.toDate)
          setToDate(new Date(lastSearchParams.toDate));

        // 2. Fetch Data - only for the relevant type
        try {
          const typeToFetch = lastSearchParams.viewType || viewType;
          if (typeToFetch === "IR") {
            await dispatch(fetchIRMSNList(lastSearchParams));
          } else {
            await dispatch(fetchMSNList(lastSearchParams));
          }

          // Note: We don't need to manually setStatusMessage here strictly,
          // but we could if we wanted the success banner on return.
          // Leaving it out to be cleaner on auto-load.
        } catch (e) {
          console.error("Auto-fetch failed", e);
        }
      };

      restoreAndFetch();
    }
  }, [
    // Depend on master data being loaded so we can find the matching objects
    departments,
    productionSeries,
    // And the params
    lastSearchParams,
    // Dispatch is stable
    dispatch,
    // allDrawingNumbers might be large, but needed for proper object restoration
  ]);

  // Fetch IR/MSN numbers always on mount and when viewType changes
  useEffect(() => {
    if (viewType === "IR") {
      fetchIRNumbers();
    } else {
      fetchMSNNumbers();
    }
  }, [viewType, selectedDrawing, selectedProductionSeries, selectedDepartment]);

  const isSpecialSearch =
    (viewType === "IR" && selectedIR) || (viewType === "MSN" && selectedMSN);

  const fetchIRNumbers = async () => {
    try {
      setLocalLoading(true);
      const params: any = {
        DrawingNumber: selectedDrawing?.drawingNumber || "",
        Productionseries: selectedProductionSeries?.productionSeries || "",
        DepartmentTypeId: selectedDepartment?.id || "",
      };
      const response = await api.get("/api/reports/Irnumbers", { params });
      setIrOptions(response.data || []);
    } catch (error) {
      console.error("Error fetching IR numbers:", error);
    } finally {
      setLocalLoading(false);
    }
  };

  const fetchMSNNumbers = async () => {
    try {
      setLocalLoading(true);
      const params: any = {
        DrawingNumber: selectedDrawing?.drawingNumber || "",
        Productionseries: selectedProductionSeries?.productionSeries || "",
        DepartmentTypeId: selectedDepartment?.id || "",
      };
      const response = await api.get("/api/reports/MSNNumbers", { params });
      setMsnOptions(response.data || []);
    } catch (error) {
      console.error("Error fetching MSN numbers:", error);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleReset = () => {
    // Reset all fields to empty
    setDepartment("");
    setSelectedDepartment(null);
    setProductionSeriesValue("");
    setSelectedProductionSeries(null);
    setDrawingNumber("");
    setSelectedDrawing(null);
    setLnItemCode("");
    setSelectedLnItemCode(null);
    setFromDate(null);
    setToDate(null);
    setSelectedIR(null);
    setSelectedMSN(null);
    if (viewType === "IR") {
      fetchIRNumbers();
    } else {
      fetchMSNNumbers();
    }

    // Clear table data
    dispatch(clearTables());
    dispatch(setSearchParams(null));
    // Reset auto-selection flag so department can be auto-selected again after reset
    setHasAutoSelectedDepartment(false);
  };

  const handleSearch = async () => {
    // Validate required fields - Production Series is required, Department is optional for filtering
    const missingFields = [];

    // If IR or MSN or date range is selected, we relax the requirement for primary filters
    if (!isSpecialSearch && !(fromDate && toDate) && !selectedProductionSeries) {
      missingFields.push("Production Series");
    }

    if (missingFields.length > 0) {
      setStatusMessage({
        type: "error",
        message: `Please fill the following required fields or select a specific ${viewType} number: ${missingFields.join(
          ", ",
        )}`,
      });
      return;
    }

    try {
      const params: any = {
        drawingNumber: selectedDrawing?.drawingNumber || "",
        productionSeries: selectedProductionSeries?.productionSeries || "",
        stage: "",
        lnItemCode: selectedLnItemCode || "",
        fromDate: fromDate ? format(fromDate, "yyyy-MM-dd") : undefined,
        toDate: toDate ? format(addDays(toDate, 1), "yyyy-MM-dd") : undefined,
        IRNumeberId: viewType === "IR" ? selectedIR?.id : undefined,
        MSNNumberId: viewType === "MSN" ? selectedMSN?.id : undefined,
        viewType,
      };

      // Only add department filter if a specific department is selected
      if (selectedDepartment?.id) {
        params.departmentTypeId = selectedDepartment.id.toString();
      }

      // Save search params to Redux for persistence
      dispatch(setSearchParams(params));

      // Dispatch only the relevant action based on view type
      let count = 0;
      if (viewType === "IR") {
        const result = await dispatch(fetchIRMSNList(params));
        count = result.payload?.length || 0;
      } else {
        const result = await dispatch(fetchMSNList(params));
        count = result.payload?.length || 0;
      }

      // Show success or info message
      if (count > 0) {
        setStatusMessage({
          type: "success",
          message: `Data loaded successfully. ${viewType} Records: ${count}`,
        });
      } else {
        setStatusMessage({
          type: "info",
          message: "No records found for the selected criteria.",
        });
        console.log("No records found for the selected criteria.");
      }
    } catch (error) {
      console.error("Error loading IR/MSN numbers:", error);
      setStatusMessage({
        type: "error",
        message: "Error loading IR/MSN numbers. Please try again.",
      });
    }
  };

  const isResetEnabled = !!(
    selectedDrawing ||
    selectedDepartment ||
    selectedProductionSeries ||
    fromDate ||
    toDate ||
    (viewType === "IR" ? selectedIR : selectedMSN) ||
    irmsnList.length > 0 ||
    msnList.length > 0
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
        <Box display="flex" alignItems="center" mb={1} gap={2}>
          <Typography
            variant="h4"
            sx={{
              color: "primary.main",
              fontWeight: 600,
              fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.5rem" },
            }}
          >
            View
          </Typography>

          <RadioGroup
            row
            value={viewType}
            onChange={(e) => setViewType(e.target.value as "IR" | "MSN")}
            sx={{ color: "primary.main" }}
          >
            <FormControlLabel
              value="IR"
              control={<Radio size="small" />}
              label="IR"
            />
            <FormControlLabel
              value="MSN"
              control={<Radio size="small" />}
              label="MSN"
            />
          </RadioGroup>
        </Box>

        {/* Status Message */}
        {statusMessage.type && (
          <Alert
            severity={statusMessage.type}
            sx={{ mb: 2 }}
            onClose={() => setStatusMessage({ type: null, message: "" })}
          >
            {statusMessage.message}
          </Alert>
        )}
        {/* Form Controls */}
        <Card elevation={2} sx={{ mb: 3 }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1.5,
                alignItems: "center",
              }}
            >
              {/* LN Item Code Filter */}
              {/* LN Item Code Filter */}
              <FormControl sx={{ minWidth: 220 }} size="small">
                <Autocomplete
                  size="small"
                  sx={{ width: 220 }}
                  options={allDrawingNumbers}
                  groupBy={(option: any) => option.lnItemCode || "No LN Code"}
                  getOptionLabel={(option: any) => {
                    if (typeof option === "string") return option;
                    return option.lnItemCode || "";
                  }}
                  value={selectedDrawing}
                  loading={isLnSearchLoading}
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
                        option.lnItemCode
                          ?.toLowerCase()
                          .includes(searchLower) ||
                        option.drawingNumber
                          ?.toLowerCase()
                          .includes(searchLower) ||
                        option.nomenclature
                          ?.toLowerCase()
                          .includes(searchLower),
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
                      <ul style={{ padding: 0, margin: 0 }}>
                        {params.children}
                      </ul>
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
                      label="Drawing No *"
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
                  size="small"
                  sx={{ width: 220 }}
                  options={departments}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    return option.name || "";
                  }}
                  value={selectedDepartment}
                  loading={isLoadingCommon}
                  onChange={(_, value) => {
                    setSelectedDepartment(value);
                    setDepartment(value ? value.id : "");
                  }}
                  isOptionEqualToValue={(option, value) =>
                    option.id === (value?.id || "")
                  }
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Typography variant="body2">{option.name}</Typography>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Department Type "
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isLoadingCommon ? (
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
              <FormControl sx={{ minWidth: 150 }} size="small">
                <Autocomplete
                  size="small"
                  sx={{ minWidth: 150 }}
                  options={productionSeries}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    return option.productionSeries || "";
                  }}
                  value={selectedProductionSeries}
                  loading={isLoadingCommon}
                  onChange={(_, value) => {
                    setSelectedProductionSeries(value);
                    setProductionSeriesValue(value ? value.id : "");
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
                        endAdornment: (
                          <>
                            {isLoadingCommon ? (
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

              {/* Date Range Filters */}
              <DatePicker
                label="From Date"
                value={fromDate}
                onChange={(newValue) => setFromDate(newValue)}
                slotProps={{ textField: { size: "small", sx: { width: 200 } } }}
              />
              <DatePicker
                label="To Date"
                value={toDate}
                onChange={(newValue) => setToDate(newValue)}
                slotProps={{ textField: { size: "small", sx: { width: 200 } } }}
              />

              <Typography
                variant="h6"
                color="text.secondary"
                sx={{
                  fontWeight: "bold",
                  pr: 1,
                }}
              >
                OR
              </Typography>

              {/* IR/MSN Filter Dropdown */}
              {viewType === "IR" ? (
                <FormControl sx={{ minWidth: 250 }} size="small">
                  <Autocomplete
                    size="small"
                    options={irOptions}
                    getOptionLabel={(option: any) =>
                      typeof option === "string"
                        ? option
                        : option.irNumber || ""
                    }
                    value={selectedIR}
                    loading={localLoading}
                    isOptionEqualToValue={(option, value) =>
                      (option?.id || option) === (value?.id || value)
                    }
                    onChange={(_, value) => setSelectedIR(value)}
                    renderInput={(params) => (
                      <TextField {...params} label="Filter by IR No" />
                    )}
                  />
                </FormControl>
              ) : (
                <FormControl sx={{ minWidth: 250 }} size="small">
                  <Autocomplete
                    size="small"
                    sx={{ minWidth: 220 }}
                    options={msnOptions}
                    getOptionLabel={(option: any) =>
                      typeof option === "string"
                        ? option
                        : option.msnNumber || ""
                    }
                    value={selectedMSN}
                    loading={localLoading}
                    isOptionEqualToValue={(option, value) =>
                      (option?.id || option) === (value?.id || value)
                    }
                    onChange={(_, value) => setSelectedMSN(value)}
                    renderInput={(params) => (
                      <TextField {...params} label="Filter by MSN No" />
                    )}
                  />
                </FormControl>
              )}
              <Button
                variant="contained"
                color="primary"
                sx={{
                  minWidth: { xs: "100%", sm: 100 },
                  height: 32,
                  flex: { xs: 1, sm: "none" },
                }}
                size="small"
                onClick={handleSearch}
                disabled={
                  (!isSpecialSearch &&
                    !(fromDate && toDate) &&
                    ( !selectedProductionSeries)) ||
                  loading
                }
              >
                <SearchIcon sx={{ mr: 1 }} />
                Search
              </Button>
              <Button
                variant="contained"
                color="error"
                sx={{
                  minWidth: { xs: "100%", sm: 80 },
                  height: 32,
                  flex: { xs: 1, sm: "none" },
                }}
                size="small"
                onClick={handleReset}
                disabled={!isResetEnabled}
              >
                <RefreshIcon sx={{ mr: 1 }} />
                Reset
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* IR Numbers Table */}
        {viewType === "IR" && (
          <Paper sx={{ mt: 1, mb: 1, p: 0.5, boxShadow: 2 }}>
            <Typography
              variant="subtitle1"
              align="center"
              fontWeight="bold"
              sx={{ mb: 1 }}
            >
              IR Numbers
            </Typography>
            <TableContainer sx={{ maxHeight: 500, overflow: "auto" }}>
              <Table
                stickyHeader
                sx={{ minWidth: { xs: 600, md: 800 } }}
                size="small"
              >
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5", height: 30 }}>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#f5f5f5",
                        padding: "5px 8px !important",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Sr No
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#f5f5f5",
                        padding: "5px 8px !important",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      IR No
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#f5f5f5",
                        padding: "5px 8px !important",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      LnItem Code
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#f5f5f5",
                        padding: "5px 8px !important",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Drg Number
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#f5f5f5",
                        padding: "5px 8px !important",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ID Number
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#f5f5f5",
                        padding: "5px 8px !important",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Date
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#f5f5f5",
                        padding: "5px 8px !important",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      UserName
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#f5f5f5",
                        padding: "5px 8px !important",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Department
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#f5f5f5",
                        padding: "5px 8px !important",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Stage
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#f5f5f5",
                        padding: "5px 8px !important",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Build No
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#f5f5f5",
                        padding: "5px 8px !important",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={11}
                        align="center"
                        sx={{ height: 150 }}
                      >
                        <CircularProgress size={30} />
                      </TableCell>
                    </TableRow>
                  ) : irmsnList.length > 0 ? (
                    irmsnList.map((item, index) => (
                      <TableRow key={item.id} hover sx={{ height: 28 }}>
                        <TableCell
                          align="center"
                          sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        >
                          {index + 1}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        >
                          {item.irNumber}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        >
                          {item.lnItemCode || "-"}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        >
                          {item.drawingNumberIdName || "-"}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        >
                          {item.idNumberRange || "-"}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        >
                          {item.createdDate
                            ? new Date(item.createdDate).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )
                            : "-"}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        >
                          {item.userName || "-"}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        >
                          {item.departmentName || "-"}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        >
                          {item.stage || "-"}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        >
                          {item.buildNumber || "-"}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        >
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() =>
                              navigate(
                                `/irmsn/edit/IR/${encodeURIComponent(
                                  item.irNumber || "",
                                )}`,
                                { state: item },
                              )
                            }
                            title="Edit IR Number"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={11}
                        align="center"
                        sx={{ height: 150 }}
                      >
                        No records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* MSN Numbers Table */}
        {viewType === "MSN" && (
          <Paper sx={{ mt: 1, mb: 1, p: 0.5, boxShadow: 2 }}>
            <Typography
              variant="subtitle1"
              align="center"
              fontWeight="bold"
              sx={{ mb: 1 }}
            >
              MSN Numbers
            </Typography>
            <TableContainer sx={{ maxHeight: 400, overflow: "auto" }}>
              <Table
                stickyHeader
                sx={{ minWidth: { xs: 600, md: 800 } }}
                size="small"
              >
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5", height: 30 }}>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#f5f5f5",
                        padding: "5px 8px !important",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Sr No
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#f5f5f5",
                        padding: "5px 8px !important",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      MSN No
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#f5f5f5",
                        padding: "5px 8px !important",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      LnItem Code
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#f5f5f5",
                        padding: "5px 8px !important",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Drg Number
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#f5f5f5",
                        padding: "5px 8px !important",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ID Number
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#f5f5f5",
                        padding: "5px 8px !important",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      MRIR No
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#f5f5f5",
                        padding: "5px 8px !important",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Date
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#f5f5f5",
                        padding: "5px 8px !important",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      UserName
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#f5f5f5",
                        padding: "5px 8px !important",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Department
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#f5f5f5",
                        padding: "5px 8px !important",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Stage
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#f5f5f5",
                        padding: "5px 8px !important",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Build No
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#f5f5f5",
                        padding: "5px 8px !important",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={12}
                        align="center"
                        sx={{ height: 150 }}
                      >
                        <CircularProgress size={30} />
                      </TableCell>
                    </TableRow>
                  ) : msnList.length > 0 ? (
                    msnList.map((item, index) => (
                      <TableRow key={item.id} hover sx={{ height: 28 }}>
                        <TableCell
                          align="center"
                          sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        >
                          {index + 1}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        >
                          {item.msnNumber}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        >
                          {item.lnItemCode || "-"}
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        >
                          {item.drawingNumberIdName || "-"}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        >
                          {item.idNumberRange || "-"}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        >
                          {item.productionOrderNumber || "-"}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        >
                          {item.createdDate
                            ? new Date(item.createdDate).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )
                            : "-"}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        >
                          {item.userName || "-"}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        >
                          {item.departmentName || "-"}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        >
                          {item.stage || "-"}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        >
                          {item.buildNumber || "-"}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                        >
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() =>
                              navigate(
                                `/irmsn/edit/MSN/${encodeURIComponent(
                                  item.msnNumber || "",
                                )}`,
                                { state: item },
                              )
                            }
                            title="Edit MSN Number"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={12}
                        align="center"
                        sx={{ height: 150 }}
                      >
                        No records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default ViewIRMSN;
