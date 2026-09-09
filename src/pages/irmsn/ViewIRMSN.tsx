import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
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
  Autocomplete,
  Alert,
  Checkbox,
  InputAdornment,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Select,
  MenuItem as SelectMenuItem,
} from "@mui/material";
import {
  Search as SearchIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  CheckBox as CheckBoxIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  FileDownload as DownloadIcon,
  Add as AddIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Article as ArticleIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import {
  fetchViewIrMsn,
  clearTables,
  setSearchParams,
} from "../../store/slices/irmsnSlice";
import {
  useDepartments,
  useProductionSeries,
} from "../../hooks/useMasterData";
import type { RootState, AppDispatch } from "../../store/store";
import { useNavigate } from "react-router-dom";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, addDays } from "date-fns";
import api from "../../services/api";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const ViewIRMSN: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { irmsnList, totalCount: reduxTotalCount, loading, lastSearchParams } = useSelector(
    (state: RootState) => state.irmsn
  );
  const navigate = useNavigate();
  const hasRestored = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Local state - Unified Search Bar
  const [drawingOrLnSearch, setDrawingOrLnSearch] = useState<string>("");

  // Local state - Multi-select Dropdowns
  const [selectedDepartments, setSelectedDepartments] = useState<any[]>([]);
  const [selectedProductionSeries, setSelectedProductionSeries] = useState<any[]>([]);

  // Local state - Record Type Filter ("All", "IR", "MSN")
  const [typeFilter, setTypeFilter] = useState<string>("All");

  // Date Filters
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // Pagination State
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(20);

  // Export Menu State
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Row Action Menu State
  const [actionMenuAnchor, setActionMenuAnchor] = useState<{
    anchorEl: HTMLElement;
    item: any;
  } | null>(null);

  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });

  // TanStack Query Hooks
  const { data: departments = [] } = useDepartments();
  const { data: productionSeries = [] } = useProductionSeries();

  const isLoadingCommon = !departments.length || !productionSeries.length;

  useEffect(() => {
    if (statusMessage.type) {
      const timer = setTimeout(() => {
        setStatusMessage({ type: null, message: "" });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const executeFetch = useCallback(
    async (
      targetPage: number,
      targetRowsPerPage: number,
      overrides?: {
        search?: string;
        series?: any[];
        depts?: any[];
        type?: string;
        fDate?: Date | null;
        tDate?: Date | null;
      }
    ) => {
      const searchVal = overrides?.search !== undefined ? overrides.search : drawingOrLnSearch;
      const seriesVal = overrides?.series !== undefined ? overrides.series : selectedProductionSeries;
      const deptsVal = overrides?.depts !== undefined ? overrides.depts : selectedDepartments;
      const typeVal = overrides?.type !== undefined ? overrides.type : typeFilter;
      const fromDVal = overrides?.fDate !== undefined ? overrides.fDate : fromDate;
      const toDVal = overrides?.tDate !== undefined ? overrides.tDate : toDate;

      const docTypes = typeVal === "All" ? [] : [typeVal];

      const payload = {
        pageNumber: targetPage + 1,
        pageSize: targetRowsPerPage,
        searchQuery: searchVal.trim(),
        productionSeries: seriesVal
          .map((ps: any) => (typeof ps === "string" ? ps : ps.productionSeries))
          .filter(Boolean),
        departmentTypeId: deptsVal
          .map((d: any) => d.id)
          .filter(Boolean),
        fromDate: fromDVal ? format(fromDVal, "yyyy-MM-dd") : null,
        toDate: toDVal ? format(toDVal, "yyyy-MM-dd") : null,
        documentType: docTypes,
      };

      dispatch(setSearchParams(payload));

      try {
        const result = await dispatch(fetchViewIrMsn(payload));
        if (fetchViewIrMsn.fulfilled.match(result)) {
          const resPayload = result.payload;
          const count =
            resPayload?.totalCount ??
            resPayload?.totalRecords ??
            (Array.isArray(resPayload) ? resPayload.length : resPayload?.data?.length || 0);

          if (count > 0) {
            setStatusMessage({
              type: "success",
              message: `Data loaded successfully. Loaded ${count} records.`,
            });
          } else {
            setStatusMessage({
              type: "info",
              message: "No records found for the selected criteria.",
            });
          }
        }
      } catch (err) {
        console.error("Error fetching IR/MSN records:", err);
        setStatusMessage({
          type: "error",
          message: "Failed to load IR/MSN records. Please try again.",
        });
      }
    },
    [dispatch, drawingOrLnSearch, selectedProductionSeries, selectedDepartments, typeFilter, fromDate, toDate]
  );

  // Restore filters and auto-search on mount
  useEffect(() => {
    if (
      lastSearchParams &&
      departments.length &&
      productionSeries.length &&
      !hasRestored.current
    ) {
      hasRestored.current = true;
      if (lastSearchParams.searchQuery) setDrawingOrLnSearch(lastSearchParams.searchQuery);
      if (lastSearchParams.productionSeries && Array.isArray(lastSearchParams.productionSeries)) {
        const matchedSeries = productionSeries.filter((ps: any) =>
          lastSearchParams.productionSeries.includes(ps.productionSeries)
        );
        setSelectedProductionSeries(matchedSeries);
      }
      if (lastSearchParams.departmentTypeId && Array.isArray(lastSearchParams.departmentTypeId)) {
        const matchedDepts = departments.filter((d: any) =>
          lastSearchParams.departmentTypeId.includes(d.id)
        );
        setSelectedDepartments(matchedDepts);
      }
      if (lastSearchParams.fromDate) setFromDate(new Date(lastSearchParams.fromDate));
      if (lastSearchParams.toDate) setToDate(new Date(lastSearchParams.toDate));
      if (lastSearchParams.documentType && lastSearchParams.documentType.length === 1) {
        setTypeFilter(lastSearchParams.documentType[0]);
      }

      dispatch(fetchViewIrMsn(lastSearchParams));
    }
  }, [departments, productionSeries, lastSearchParams, dispatch]);

  const handleReset = () => {
    setDrawingOrLnSearch("");
    setSelectedDepartments([]);
    setSelectedProductionSeries([]);
    setTypeFilter("All");
    setFromDate(null);
    setToDate(null);
    setPage(0);

    dispatch(clearTables());
    dispatch(setSearchParams(null));
  };

  const handleSearch = () => {
    setPage(0);
    executeFetch(0, rowsPerPage);
  };

  // Debounced auto-search: trigger API when 3+ chars typed, or when cleared
  useEffect(() => {
    // Skip during restore
    if (!hasRestored.current && lastSearchParams) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (drawingOrLnSearch.trim().length >= 3) {
      debounceTimerRef.current = setTimeout(() => {
        setPage(0);
        executeFetch(0, rowsPerPage, { search: drawingOrLnSearch });
      }, 500);
    } else if (drawingOrLnSearch.trim().length === 0 && irmsnList.length > 0) {
      // Re-fetch without search when cleared
      debounceTimerRef.current = setTimeout(() => {
        setPage(0);
        executeFetch(0, rowsPerPage, { search: "" });
      }, 300);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [drawingOrLnSearch]);

  // Export handler connecting to ExportIR and ExportMSN APIs
  const handleExportClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportMenuAnchor(null);
  };

  const executeExport = async (type: "IR" | "MSN" | "BOTH") => {
    handleExportClose();
    setIsExporting(true);

    try {
      const params: any = {};
      if (selectedProductionSeries.length > 0) {
        params.Productionseries = selectedProductionSeries
          .map((ps: any) => ps.productionSeries)
          .join(",");
      }
      if (selectedDepartments.length > 0) {
        params.DepartmentTypeId = selectedDepartments
          .map((d: any) => d.id)
          .join(",");
      }
      if (drawingOrLnSearch.trim()) {
        params.DrawingNumber = drawingOrLnSearch.trim();
        params.LnItemCode = drawingOrLnSearch.trim();
      }
      if (fromDate) {
        params.FromDate = format(fromDate, "yyyy-MM-dd");
      }
      if (toDate) {
        params.ToDate = format(toDate, "yyyy-MM-dd");
      }

      const downloadBlob = async (endpoint: string, defaultFilename: string) => {
        const response = await api.get(endpoint, {
          params,
          responseType: "blob",
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${defaultFilename}_${Date.now()}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      };

      if (type === "IR" || type === "BOTH") {
        await downloadBlob("/api/reports/ExportIR", "IR_Report");
      }
      if (type === "MSN" || type === "BOTH") {
        await downloadBlob("/api/reports/ExportMSN", "MSN_Report");
      }

      setStatusMessage({
        type: "success",
        message: "Export downloaded successfully.",
      });
    } catch (err: any) {
      console.error("Export failed:", err);
      setStatusMessage({
        type: "error",
        message: err.response?.data?.message || "Failed to download export report.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const isFilterApplied = !!(
    drawingOrLnSearch.trim() ||
    selectedDepartments.length > 0 ||
    selectedProductionSeries.length > 0 ||
    fromDate ||
    toDate ||
    typeFilter !== "All"
  );

  const isResetEnabled = !!(
    isFilterApplied ||
    irmsnList.length > 0
  );

  const displayList = useMemo(() => {
    return (irmsnList || []).map((item: any) => ({
      ...item,
      recordType: item.recordType || item.documentType || (item.irNumber ? "IR" : "MSN"),
      displayNumber: item.displayNumber || item.irNumber || item.msnNumber || "-",
      orderNumber: item.orderNumber || item.purchaseOrderNumber || item.poNumber || item.productionOrderNumber || "-",
    }));
  }, [irmsnList]);

  // Reset page to 0 if pagination exceeds list range
  useEffect(() => {
    setPage(0);
  }, [drawingOrLnSearch, selectedDepartments, selectedProductionSeries, typeFilter, fromDate, toDate]);

  const totalCount = reduxTotalCount || displayList.length;
  const startRow = totalCount > 0 ? page * rowsPerPage + 1 : 0;
  const endRow = Math.min((page + 1) * rowsPerPage, totalCount);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          py: { xs: 1, sm: 1.25 },
          px: { xs: 1.5, sm: 2 },
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#FAFAFA",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Page Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mb: 1 }}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "primary.main",
                fontSize: { xs: "1.25rem", sm: "1.5rem" },
              }}
            >
              IR/MSN List
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* Export Button & Menu */}
            <Button
              variant="outlined"
              size="small"
              onClick={handleExportClick}
              disabled={isExporting || !isFilterApplied}
              startIcon={
                isExporting ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <DownloadIcon sx={{ fontSize: 18 }} />
                )
              }
              endIcon={<ArrowDownIcon sx={{ fontSize: 16 }} />}
              sx={{
                borderColor: "#D0D5DD",
                color: "#344054",
                fontWeight: 600,
                fontSize: "0.875rem",
                borderRadius: "8px",
                px: 2,
                py: 0.75,
                textTransform: "none",
                "&:hover": { borderColor: "#98A2B3", backgroundColor: "#F9FAFB" },
              }}
            >
              Export
            </Button>
            <Menu
              anchorEl={exportMenuAnchor}
              open={Boolean(exportMenuAnchor)}
              onClose={handleExportClose}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              PaperProps={{
                elevation: 0,
                sx: {
                  minWidth: 150,
                  borderRadius: "6px",
                  py: 0.25,
                  px: 0.25,
                  mt: 0.5,
                  border: "1px solid #EAECF0",
                  boxShadow: "0px 4px 12px rgba(16, 24, 40, 0.08)",
                },
              }}
            >
              <MenuItem
                onClick={() => executeExport("IR")}
                sx={{
                  borderRadius: "4px",
                  py: 0.4,
                  px: 1,
                  minHeight: "30px !important",
                  color: "#344054",
                  "&:hover": { backgroundColor: "#F9FAFB", color: "primary.main" },
                }}
              >
                <ListItemIcon sx={{ minWidth: "auto !important", mr: 1, color: "primary.main" }}>
                  <ArticleIcon sx={{ fontSize: 16 }} />
                </ListItemIcon>
                <ListItemText primary="Export IR Report" primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 500 }} />
              </MenuItem>
              <MenuItem
                onClick={() => executeExport("MSN")}
                sx={{
                  borderRadius: "4px",
                  py: 0.4,
                  px: 1,
                  minHeight: "30px !important",
                  color: "#344054",
                  "&:hover": { backgroundColor: "#F9FAFB", color: "#0078D4" },
                }}
              >
                <ListItemIcon sx={{ minWidth: "auto !important", mr: 1, color: "#0078D4" }}>
                  <ArticleIcon sx={{ fontSize: 16 }} />
                </ListItemIcon>
                <ListItemText primary="Export MSN Report" primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 500 }} />
              </MenuItem>
            </Menu>

            {/* New IR/MSN Action Button */}
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 18 }} />}
              onClick={() => navigate("/irmsn/generate")}
              sx={{
                backgroundColor: "primary.main",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.875rem",
                borderRadius: "8px",
                px: 2.5,
                py: 0.75,
                textTransform: "none",
                boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
                "&:hover": { backgroundColor: "primary.dark" },
              }}
            >
              New IR/MSN
            </Button>
          </Stack>
        </Stack>

        {/* Status Alert Message */}
        {statusMessage.type && (
          <Alert
            severity={statusMessage.type}
            sx={{ mb: 1.5, borderRadius: "8px" }}
            onClose={() => setStatusMessage({ type: null, message: "" })}
          >
            {statusMessage.message}
          </Alert>
        )}

        {/* Filter Card / Controls */}
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            mb: 1,
            borderRadius: "10px",
            border: "1px solid #EAECF0",
            backgroundColor: "#ffffff",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1.25,
              alignItems: "center",
            }}
          >
            {/* Search Bar */}
            <TextField
              size="small"
              sx={{
                flex: { xs: "1 1 100%", md: "1 1 240px" },
                minWidth: 200,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                },
              }}
              placeholder="Search IR/MSN No., PO Number, LN Item Code, Dr..."
              value={drawingOrLnSearch}
              onChange={(e) => setDrawingOrLnSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: "#667085" }} />
                  </InputAdornment>
                ),
                endAdornment: drawingOrLnSearch ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                      setDrawingOrLnSearch("");
                      setPage(0);
                      executeFetch(0, rowsPerPage, { search: "" });
                    }}
                      edge="end"
                    >
                      <ClearIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />

            {/* Production Series Filter */}
            <FormControl
              sx={{ flex: { xs: "1 1 45%", md: "0 1 170px" }, minWidth: 140 }}
              size="small"
            >
              <Autocomplete
                multiple
                size="small"
                options={productionSeries}
                disableCloseOnSelect
                renderTags={() => null}
                getOptionLabel={(option: any) =>
                  typeof option === "string" ? option : option.productionSeries || ""
                }
                value={selectedProductionSeries}
                loading={isLoadingCommon}
                onChange={(_, newValue) => setSelectedProductionSeries(newValue)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, option, { selected }) => {
                  const { key, ...optionProps } = props;
                  return (
                    <Box
                      component="li"
                      key={key}
                      {...optionProps}
                      sx={{
                        py: "4px !important",
                        px: "8px !important",
                        minHeight: "28px !important",
                        fontSize: "0.85rem",
                      }}
                    >
                      <Checkbox
                        icon={icon}
                        checkedIcon={checkedIcon}
                        sx={{ p: "2px", mr: 0.5 }}
                        checked={selected}
                        size="small"
                      />
                      <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
                        {option.productionSeries}
                      </Typography>
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={`Prod. Series `}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                      },
                    }}
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

            {/* Department / Type Multi-select */}
            <FormControl
              sx={{ flex: { xs: "1 1 45%", md: "0 1 170px" }, minWidth: 140 }}
              size="small"
            >
              <Autocomplete
                multiple
                size="small"
                options={departments}
                disableCloseOnSelect
                renderTags={() => null}
                getOptionLabel={(option: any) =>
                  typeof option === "string" ? option : option.name || ""
                }
                value={selectedDepartments}
                loading={isLoadingCommon}
                onChange={(_, newValue) => setSelectedDepartments(newValue)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, option, { selected }) => {
                  const { key, ...optionProps } = props;
                  return (
                    <Box
                      component="li"
                      key={key}
                      {...optionProps}
                      sx={{
                        py: "4px !important",
                        px: "8px !important",
                        minHeight: "28px !important",
                        fontSize: "0.85rem",
                      }}
                    >
                      <Checkbox
                        icon={icon}
                        checkedIcon={checkedIcon}
                        sx={{ p: "2px", mr: 0.5 }}
                        checked={selected}
                        size="small"
                      />
                      <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
                        {option.name}
                      </Typography>
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={`Dept Type`}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                      },
                    }}
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

            {/* Document Type Selector (All / IR / MSN) */}
            <FormControl size="small" sx={{ minWidth: 140, flex: "0 0 auto" }}>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected || selected === "All") {
                    return (
                      <Box component="span" sx={{ color: "text.secondary" }}>
                        Document Type
                      </Box>
                    );
                  }
                  return selected;
                }}
                endAdornment={
                  typeFilter !== "All" ? (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTypeFilter("All");
                      }}
                      sx={{ mr: 1, p: 0.25, color: "text.secondary" }}
                    >
                      <ClearIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  ) : null
                }
                sx={{
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  height: 38,
                }}
              >
                <SelectMenuItem value="IR">IR</SelectMenuItem>
                <SelectMenuItem value="MSN">MSN</SelectMenuItem>
              </Select>
            </FormControl>

            {/* Date Range Pickers */}
            <DatePicker
              label="From Date"
              value={fromDate}
              onChange={(newValue) => setFromDate(newValue)}
              slotProps={{
                textField: {
                  size: "small",
                  sx: {
                    minWidth: 135,
                    width: 145,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      backgroundColor: "#ffffff",
                    },
                    "& .MuiInputLabel-root": {
                      fontSize: "0.85rem",
                      backgroundColor: "#ffffff",
                      px: 0.5,
                    },
                  },
                },
              }}
            />
            <DatePicker
              label="To Date"
              value={toDate}
              onChange={(newValue) => setToDate(newValue)}
              slotProps={{
                textField: {
                  size: "small",
                  sx: {
                    minWidth: 135,
                    width: 145,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      backgroundColor: "#ffffff",
                    },
                    "& .MuiInputLabel-root": {
                      fontSize: "0.85rem",
                      backgroundColor: "#ffffff",
                      px: 0.5,
                    },
                  },
                },
              }}
            />

            {/* Action Buttons: Apply & Clear */}
            <Button
              variant="contained"
              size="small"
              onClick={handleSearch}
              disabled={
                (!(fromDate && toDate) &&
                  selectedProductionSeries.length === 0 &&
                  !drawingOrLnSearch.trim() &&
                  selectedDepartments.length === 0) ||
                loading
              }
              sx={{
                minWidth: 80,
                height: 38,
                borderRadius: "8px",
                backgroundColor: "primary.main",
                fontWeight: 600,
                fontSize: "0.85rem",
                textTransform: "none",
                boxShadow: "none",
                "&:hover": { backgroundColor: "primary.dark" },
              }}
            >
              Apply
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={handleReset}
              disabled={!isResetEnabled}
              sx={{
                minWidth: 60,
                height: 38,
                color: "#667085",
                fontWeight: 600,
                fontSize: "0.85rem",
                textTransform: "none",
                "&:hover": { backgroundColor: "#F2F4F7", color: "#101828" },
              }}
            >
              Clear
            </Button>
          </Box>
        </Paper>

        {/* Active Filter Chips & Counter Bar */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
            mb: 1.25,
            px: 0.5,
          }}
        >
          {/* Active Chips */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, alignItems: "center" }}>
            {selectedProductionSeries.map((item: any) => {
              const label = typeof item === "string" ? item : item.productionSeries;
              return (
                <Chip
                  key={`series-${item.id || label}`}
                  label={`Series: ${label}`}
                  size="small"
                  onDelete={() => {
                    setSelectedProductionSeries((prev) =>
                      prev.filter((s: any) => (s.id || s) !== (item.id || item))
                    );
                  }}
                  sx={{
                    backgroundColor: "#F2F4F7",
                    color: "#344054",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    borderRadius: "6px",
                  }}
                />
              );
            })}
            {selectedDepartments.map((item: any) => {
              const label = typeof item === "string" ? item : item.name;
              return (
                <Chip
                  key={`dept-${item.id || label}`}
                  label={`Dept: ${label}`}
                  size="small"
                  onDelete={() => {
                    setSelectedDepartments((prev) =>
                      prev.filter((d: any) => (d.id || d) !== (item.id || item))
                    );
                  }}
                  sx={{
                    backgroundColor: "#F2F4F7",
                    color: "#344054",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    borderRadius: "6px",
                  }}
                />
              );
            })}
            {typeFilter !== "All" && (
              <Chip
                label={`Type: ${typeFilter}`}
                size="small"
                onDelete={() => setTypeFilter("All")}
                sx={{
                  backgroundColor: "#F2F4F7",
                  color: "#344054",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  borderRadius: "6px",
                }}
              />
            )}
            {(selectedDepartments.length > 0 ||
              selectedProductionSeries.length > 0 ||
              typeFilter !== "All") && (
              <Button
                size="small"
                color="error"
                variant="text"
                onClick={() => {
                  setSelectedDepartments([]);
                  setSelectedProductionSeries([]);
                  setTypeFilter("All");
                }}
                sx={{
                  fontSize: "0.75rem",
                  py: 0,
                  px: 1,
                  height: "24px",
                  minWidth: "auto",
                  fontWeight: 600,
                  textTransform: "none",
                }}
              >
                Clear all
              </Button>
            )}
          </Box>

          {/* Results Count Display */}
          <Typography variant="body2" sx={{ color: "#667085", fontSize: "0.85rem", fontWeight: 500, ml: "auto" }}>
            {totalCount} {totalCount === 1 ? "result" : "results"}
          </Typography>
        </Box>

        {/* Data Table Container */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: "10px",
            border: "1px solid #EAECF0",
            backgroundColor: "#ffffff",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
          }}
        >
          <TableContainer sx={{ maxHeight: "calc(100vh - 290px)", overflow: "auto" }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      backgroundColor: "#F9FAFB",
                      color: "#475467",
                      fontSize: "0.8rem",
                      borderBottom: "1px solid #EAECF0",
                      py: 1,
                      px: 1.5,
                      width: 50,
                    }}
                  >
                    Sr.No
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      backgroundColor: "#F9FAFB",
                      color: "#475467",
                      fontSize: "0.8rem",
                      borderBottom: "1px solid #EAECF0",
                      py: 1,
                      px: 1.5,
                    }}
                  >
                    IR/MSN No.
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      backgroundColor: "#F9FAFB",
                      color: "#475467",
                      fontSize: "0.8rem",
                      borderBottom: "1px solid #EAECF0",
                      py: 1,
                      px: 1.5,
                      width: 70,
                    }}
                  >
                    Type
                  </TableCell>
                  <TableCell
                    align="left"
                    sx={{
                      fontWeight: 700,
                      backgroundColor: "#F9FAFB",
                      color: "#475467",
                      fontSize: "0.8rem",
                      borderBottom: "1px solid #EAECF0",
                      py: 1,
                      px: 1.5,
                    }}
                  >
                    PO Number
                  </TableCell>
                  <TableCell
                    align="left"
                    sx={{
                      fontWeight: 700,
                      backgroundColor: "#F9FAFB",
                      color: "#475467",
                      fontSize: "0.8rem",
                      borderBottom: "1px solid #EAECF0",
                      py: 1,
                      px: 1.5,
                    }}
                  >
                    LN Item Code
                  </TableCell>
                  <TableCell
                    align="left"
                    sx={{
                      fontWeight: 700,
                      backgroundColor: "#F9FAFB",
                      color: "#475467",
                      fontSize: "0.8rem",
                      borderBottom: "1px solid #EAECF0",
                      py: 1,
                      px: 1.5,
                    }}
                  >
                    Drawing No.
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      backgroundColor: "#F9FAFB",
                      color: "#475467",
                      fontSize: "0.8rem",
                      borderBottom: "1px solid #EAECF0",
                      py: 1,
                      px: 1.5,
                    }}
                  >
                    ID Number
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      backgroundColor: "#F9FAFB",
                      color: "#475467",
                      fontSize: "0.8rem",
                      borderBottom: "1px solid #EAECF0",
                      py: 1,
                      px: 1.5,
                    }}
                  >
                    MRIR
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      backgroundColor: "#F9FAFB",
                      color: "#475467",
                      fontSize: "0.8rem",
                      borderBottom: "1px solid #EAECF0",
                      py: 1,
                      px: 1.5,
                    }}
                  >
                    Date
                  </TableCell>
                  <TableCell
                    align="left"
                    sx={{
                      fontWeight: 700,
                      backgroundColor: "#F9FAFB",
                      color: "#475467",
                      fontSize: "0.8rem",
                      borderBottom: "1px solid #EAECF0",
                      py: 1,
                      px: 1.5,
                    }}
                  >
                    UserName
                  </TableCell>
                  <TableCell
                    align="left"
                    sx={{
                      fontWeight: 700,
                      backgroundColor: "#F9FAFB",
                      color: "#475467",
                      fontSize: "0.8rem",
                      borderBottom: "1px solid #EAECF0",
                      py: 1,
                      px: 1.5,
                    }}
                  >
                    Department
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      backgroundColor: "#F9FAFB",
                      color: "#475467",
                      fontSize: "0.8rem",
                      borderBottom: "1px solid #EAECF0",
                      py: 1,
                      px: 1.5,
                    }}
                  >
                    Stage
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      backgroundColor: "#F9FAFB",
                      color: "#475467",
                      fontSize: "0.8rem",
                      borderBottom: "1px solid #EAECF0",
                      py: 1,
                      px: 1.5,
                    }}
                  >
                    Build No
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      backgroundColor: "#F9FAFB",
                      color: "#475467",
                      fontSize: "0.8rem",
                      borderBottom: "1px solid #EAECF0",
                      py: 1,
                      px: 1.5,
                      width: 70,
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={14} align="center" sx={{ py: 6, borderBottom: "none" }}>
                      <CircularProgress size={32} color="primary" />
                      <Typography variant="body2" sx={{ color: "#667085", mt: 1 }}>
                        Loading IR/MSN records...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : displayList.length > 0 ? (
                  displayList.map((item, index) => (
                    <TableRow
                      key={`${item.recordType}-${item.id}`}
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
                      <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, color: "#101828", fontSize: "0.85rem" }}
                        >
                          {item.displayNumber || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box
                          component="span"
                          sx={{
                            px: 1.25,
                            py: 0.35,
                            borderRadius: "12px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            bgcolor:
                              item.recordType === "IR"
                                ? "rgba(168, 0, 90, 0.1)"
                                : "rgba(0, 120, 212, 0.1)",
                            color:
                              item.recordType === "IR"
                                ? "primary.main"
                                : "#0078D4",
                          }}
                        >
                          {item.recordType}
                        </Box>
                      </TableCell>
                      <TableCell align="left">{item.orderNumber || "-"}</TableCell>
                      <TableCell align="left">{item.lnItemCode || "-"}</TableCell>
                      <TableCell align="left">
                        {item.drawingNumberIdName || item.drawingNumber || "-"}
                      </TableCell>
                      <TableCell align="center">{item.idNumberRange || "-"}</TableCell>
                      <TableCell align="center">{item.mrirNumber || "-"}</TableCell>
                      <TableCell align="center">
                        {item.createdDate
                          ? new Date(item.createdDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </TableCell>
                      <TableCell align="left">{item.userName || "-"}</TableCell>
                      <TableCell align="left">{item.departmentName || "-"}</TableCell>
                      <TableCell align="center">{item.stage || "-"}</TableCell>
                      <TableCell align="center">{item.buildNumber || "-"}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(e) =>
                            setActionMenuAnchor({
                              anchorEl: e.currentTarget,
                              item,
                            })
                          }
                          sx={{
                            color: "#667085",
                            "&:hover": {
                              backgroundColor: "#F2F4F7",
                              color: "#101828",
                            },
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={14} align="center" sx={{ py: 6, borderBottom: "none" }}>
                      <Typography variant="body2" sx={{ color: "#667085", fontWeight: 500 }}>
                        No records found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination Footer */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 1.5,
              px: 2,
              borderTop: "1px solid #EAECF0",
              backgroundColor: "#ffffff",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" sx={{ color: "#475467", fontSize: "0.85rem" }}>
                Rows per page
              </Typography>
              <Select
                value={rowsPerPage}
                onChange={(e) => {
                  const newRowsPerPage = Number(e.target.value);
                  setRowsPerPage(newRowsPerPage);
                  setPage(0);
                  executeFetch(0, newRowsPerPage);
                }}
                size="small"
                sx={{
                  height: 32,
                  fontSize: "0.85rem",
                  borderRadius: "6px",
                  "& .MuiSelect-select": { py: 0.5, px: 1 },
                }}
              >
                <SelectMenuItem value={10}>10</SelectMenuItem>
                <SelectMenuItem value={20}>20</SelectMenuItem>
                <SelectMenuItem value={50}>50</SelectMenuItem>
                <SelectMenuItem value={100}>100</SelectMenuItem>
              </Select>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="body2" sx={{ color: "#475467", fontSize: "0.85rem" }}>
                {totalCount > 0
                  ? `${startRow}–${endRow} of ${totalCount}`
                  : "0–0 of 0"}
              </Typography>
              <Stack direction="row" spacing={0.5}>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={page === 0 || loading}
                  onClick={() => {
                    const newPage = Math.max(0, page - 1);
                    setPage(newPage);
                    executeFetch(newPage, rowsPerPage);
                  }}
                  sx={{
                    minWidth: 32,
                    width: 32,
                    height: 32,
                    p: 0,
                    borderColor: "#D0D5DD",
                    color: "#344054",
                    borderRadius: "6px",
                  }}
                >
                  ‹
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={(page + 1) * rowsPerPage >= totalCount || loading}
                  onClick={() => {
                    const newPage = page + 1;
                    setPage(newPage);
                    executeFetch(newPage, rowsPerPage);
                  }}
                  sx={{
                    minWidth: 32,
                    width: 32,
                    height: 32,
                    p: 0,
                    borderColor: "#D0D5DD",
                    color: "#344054",
                    borderRadius: "6px",
                  }}
                >
                  ›
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Paper>
        {/* Row Action Menu */}
        <Menu
          anchorEl={actionMenuAnchor?.anchorEl}
          open={Boolean(actionMenuAnchor)}
          onClose={() => setActionMenuAnchor(null)}
          transitionDuration={0}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          PaperProps={{
            elevation: 0,
            sx: {
              minWidth: 90,
              borderRadius: "6px",
              py: 0.25,
              px: 0.25,
              border: "1px solid #EAECF0",
              boxShadow: "0px 4px 12px rgba(16, 24, 40, 0.08)",
            },
          }}
        >
          <MenuItem
            onClick={() => {
              const targetItem = actionMenuAnchor?.item;
              setActionMenuAnchor(null);
              if (targetItem) {
                navigate(
                  `/irmsn/edit/${targetItem.recordType}/${encodeURIComponent(
                    targetItem.displayNumber || ""
                  )}`,
                  { state: targetItem }
                );
              }
            }}
            sx={{
              borderRadius: "4px",
              py: 0.35,
              px: 0.85,
              minHeight: "28px !important",
              color: "#344054",
              transition: "all 0.15s ease-in-out",
              "&:hover": {
                backgroundColor: "#F9FAFB",
                color: "primary.main",
                "& .MuiListItemIcon-root": { color: "primary.main" },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: "auto !important", mr: 0.85, color: "#667085" }}>
              <EditIcon sx={{ fontSize: 14 }} />
            </ListItemIcon>
            <ListItemText
              primary="Edit"
              primaryTypographyProps={{ fontSize: "0.775rem", fontWeight: 500 }}
            />
          </MenuItem>
        </Menu>
      </Box>
    </LocalizationProvider>
  );
};

export default ViewIRMSN;
