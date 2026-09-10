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
  InputLabel,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  Grid,
} from "@mui/material";
import {
  Search as SearchIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  CheckBox as CheckBoxIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  FileDownload as DownloadIcon,
  Add as AddIcon,
  Article as ArticleIcon,
  MoreVert as MoreVertIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { CustomPagination } from "../../components/CustomPagination";

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
import { format } from "date-fns";
import api from "../../services/api";
import { MultiSelectFilter } from "../../components/MultiSelectFilter";
import { EmptyState } from "../../components/EmptyState";

const ALL_IRMSN_EXPORT_COLUMNS = [
  { key: "displayNumber", label: "IR/MSN No." },
  { key: "recordType", label: "Type" },
  { key: "orderNumber", label: "PO Number" },
  { key: "lnItemCode", label: "LN Item Code" },
  { key: "drawingNumberIdName", label: "Drawing No." },
  { key: "idNumberRange", label: "ID Number" },
  { key: "mrirNumber", label: "MRIR" },
  { key: "createdDate", label: "Date" },
  { key: "userName", label: "UserName" },
  { key: "departmentName", label: "Department" },
  { key: "stage", label: "Stage" },
  { key: "buildNumber", label: "Build No" },
];

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

  // Export Menu & Options Dialog State
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportMode, setExportMode] = useState<"all" | "custom">("all");
  const [exportReportType, setExportReportType] = useState<"IR" | "MSN" | "BOTH">("BOTH");
  const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>([]);

  const handleOpenExportDialog = (type: "IR" | "MSN" | "BOTH" = "BOTH") => {
    setExportReportType(type);
    setExportMode("all");
    setSelectedExportColumns(ALL_IRMSN_EXPORT_COLUMNS.map((c) => c.key));
    setExportDialogOpen(true);
  };

  const handleToggleColumn = (colKey: string) => {
    if (selectedExportColumns.includes(colKey)) {
      setSelectedExportColumns(selectedExportColumns.filter((k) => k !== colKey));
    } else {
      setSelectedExportColumns([...selectedExportColumns, colKey]);
    }
  };

  const handleToggleSelectAllColumns = () => {
    if (selectedExportColumns.length === ALL_IRMSN_EXPORT_COLUMNS.length) {
      setSelectedExportColumns([]);
    } else {
      setSelectedExportColumns(ALL_IRMSN_EXPORT_COLUMNS.map((c) => c.key));
    }
  };

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

  const prodSeriesOptions = useMemo(
    () => productionSeries.map((p: any) => (typeof p === "string" ? p : p.productionSeries)).filter(Boolean),
    [productionSeries]
  );
  const deptOptions = useMemo(
    () => departments.map((d: any) => ({ id: d.id, label: d.name || d.departmentName || d.label })),
    [departments]
  );

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
          .map((d: any) => (typeof d === "object" && d !== null ? d.id : d))
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

          if (count === 0) {
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
    } else if (!lastSearchParams && !hasRestored.current) {
      hasRestored.current = true;
      const initialPayload = {
        pageNumber: 1,
        pageSize: 20,
        searchQuery: "",
        productionSeries: [],
        departmentTypeId: [],
        fromDate: null,
        toDate: null,
        documentType: [],
      };
      dispatch(setSearchParams(initialPayload));
      dispatch(fetchViewIrMsn(initialPayload));
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

    executeFetch(0, rowsPerPage, {
      search: "",
      series: [],
      depts: [],
      type: "All",
      fDate: null,
      tDate: null,
    });
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

  const handleExportClose = () => {
    setExportMenuAnchor(null);
  };

  const handleConfirmExportData = async () => {
    setExportDialogOpen(false);
    setIsExporting(true);

    try {
      let docTypes: string[] = [];
      if (exportReportType === "IR") docTypes = ["IR"];
      else if (exportReportType === "MSN") docTypes = ["MSN"];
      else if (typeFilter === "IR") docTypes = ["IR"];
      else if (typeFilter === "MSN") docTypes = ["MSN"];
      else docTypes = ["IR", "MSN"];

      const payload = {
        searchQuery: drawingOrLnSearch.trim(),
        productionSeries: selectedProductionSeries
          .map((ps: any) => (typeof ps === "object" ? ps.productionSeries || ps.name || String(ps) : String(ps)))
          .filter(Boolean),
        departmentTypeId: selectedDepartments
          .map((d: any) => (typeof d === "object" && d !== null ? Number(d.id || d.departmentTypeId || d) : Number(d)))
          .filter((id: number) => !isNaN(id) && id > 0),
        fromDate: fromDate ? fromDate.toISOString() : null,
        toDate: toDate ? toDate.toISOString() : null,
        documentType: docTypes,
        selectedColumns: exportMode === "custom" ? selectedExportColumns : ALL_IRMSN_EXPORT_COLUMNS.map((c) => c.key),
      };

      const response = await api.post("/api/reports/ExportIrMsn", payload, {
        responseType: "blob",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
        },
      });

      if (response.data && response.data.size > 0) {
        const now = new Date();
        const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
        const filename = `IR_MSN_Report_${timestamp}.xlsx`;

        const url = window.URL.createObjectURL(
          new Blob([response.data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          })
        );
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        setStatusMessage({
          type: "success",
          message: "Export downloaded successfully.",
        });
      } else {
        throw new Error("No content received from export API");
      }
    } catch (err: any) {
      console.error("Export error:", err);
      setStatusMessage({
        type: "error",
        message: err.response?.data?.message || err.message || "Failed to download export report.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const isDropdownFilterSelected = !!(
    selectedDepartments.length > 0 ||
    selectedProductionSeries.length > 0 ||
    fromDate ||
    toDate ||
    (typeFilter && typeFilter !== "All")
  );

  const isFilterApplied = !!(
    drawingOrLnSearch.trim() ||
    isDropdownFilterSelected
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
              onClick={() => handleOpenExportDialog("BOTH")}
              disabled={isExporting || !isFilterApplied}
              startIcon={
                isExporting ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <DownloadIcon fontSize="small" />
                )
              }
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
                onClick={() => {
                  handleExportClose();
                  handleOpenExportDialog("IR");
                }}
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
                onClick={() => {
                  handleExportClose();
                  handleOpenExportDialog("MSN");
                }}
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
              startIcon={<AddIcon fontSize="small" />}
              onClick={() => navigate("/irmsn/generate")}
              sx={{
                height: 34,
                borderRadius: "6px",
                backgroundColor: "primary.main",
                color: "#ffffff",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.8rem",
                boxShadow: "0 1px 2px rgba(16, 24, 40, 0.05)",
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

        {/* ── Unified Single Paper Container ────────────────────────────── */}
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
          {/* Section 1: Filter Card / Controls */}
          <Box sx={{ p: 1.5, pb: 1.25 }}>
            <Box
              sx={{
                display: "flex",
                flexWrap: "nowrap",
                gap: 1,
                alignItems: "center",
                width: "100%",
                overflowX: "auto",
                pt: 1.25,
                pb: 0.5,
                "&::-webkit-scrollbar": { height: 6 },
                "&::-webkit-scrollbar-thumb": { backgroundColor: "#D0D5DD", borderRadius: 3 },
              }}
            >
              {/* Search Bar */}
              <TextField
                size="small"
                sx={{
                  flex: "1 1 200px",
                  minWidth: 160,
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
              <MultiSelectFilter
                label="Prod. Series"
                value={selectedProductionSeries}
                options={prodSeriesOptions}
                onChange={(newValue) => setSelectedProductionSeries(newValue)}
                flex="0 0 130px"
                minWidth={110}
              />

              {/* Department / Type Multi-select */}
              <MultiSelectFilter
                label="Dept Type"
                value={selectedDepartments}
                options={deptOptions}
                onChange={(newValue) => setSelectedDepartments(newValue)}
                flex="0 0 130px"
                minWidth={110}
              />

              {/* Document Type Selector (IR / MSN) */}
              <FormControl size="small" sx={{ flex: "0 0 150px", minWidth: 130 }}>
                <InputLabel
                  id="doc-type-label"
                  shrink
                  sx={{
                    bgcolor: "#ffffff",
                    px: 0.5,
                    fontSize: "0.82rem",
                    color: "#667085",
                    transform: "translate(10px, -7px) scale(0.75)",
                    transformOrigin: "top left",
                    "&.Mui-focused": {
                      color: "primary.main",
                    },
                  }}
                >
                  Document Type
                </InputLabel>
                <Select
                  labelId="doc-type-label"
                  label="Document Type"
                  value={typeFilter === "All" ? "" : typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value || "All")}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected || selected === "All") {
                      return null;
                    }
                    return (
                      <Box component="span" sx={{ color: "#344054", fontWeight: 600, fontSize: "0.82rem" }}>
                        {selected}
                      </Box>
                    );
                  }}
                  endAdornment={
                    typeFilter !== "All" && typeFilter !== "" ? (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTypeFilter("All");
                        }}
                        sx={{ mr: 1, p: 0.25, color: "#667085" }}
                      >
                        <ClearIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    ) : null
                  }
                  sx={{
                    fontSize: "0.82rem",
                    height: 38,
                    borderRadius: "8px",
                  }}
                >
                  <SelectMenuItem value="IR" sx={{ fontSize: "0.82rem" }}>
                    IR
                  </SelectMenuItem>
                  <SelectMenuItem value="MSN" sx={{ fontSize: "0.82rem" }}>
                    MSN
                  </SelectMenuItem>
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
                    InputLabelProps: {
                      shrink: true,
                      sx: {
                        bgcolor: "#ffffff",
                        px: 0.5,
                        fontSize: "0.82rem",
                        color: "#667085",
                        transform: "translate(10px, -7px) scale(0.75)",
                        transformOrigin: "top left",
                        "&.Mui-focused": {
                          color: "primary.main",
                        },
                      },
                    },
                    sx: {
                      flex: "0 0 140px",
                      minWidth: 120,
                      "& .MuiOutlinedInput-root": {
                        height: 38,
                        borderRadius: "8px",
                      },
                      "& .MuiOutlinedInput-input": {
                        py: "8px",
                        px: 1.25,
                        fontSize: "0.82rem",
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
                    InputLabelProps: {
                      shrink: true,
                      sx: {
                        bgcolor: "#ffffff",
                        px: 0.5,
                        fontSize: "0.82rem",
                        color: "#667085",
                        transform: "translate(10px, -7px) scale(0.75)",
                        transformOrigin: "top left",
                        "&.Mui-focused": {
                          color: "primary.main",
                        },
                      },
                    },
                    sx: {
                      flex: "0 0 140px",
                      minWidth: 120,
                      "& .MuiOutlinedInput-root": {
                        height: 38,
                        borderRadius: "8px",
                      },
                      "& .MuiOutlinedInput-input": {
                        py: "8px",
                        px: 1.25,
                        fontSize: "0.82rem",
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
                disabled={!isDropdownFilterSelected || loading}
                sx={{
                  flex: "0 0 auto",
                  minWidth: 65,
                  height: 38,
                  borderRadius: "8px",
                  backgroundColor: "primary.main",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  textTransform: "none",
                  boxShadow: "none",
                  px: 1.75,
                  "&:hover": { backgroundColor: "primary.dark" },
                  "&.Mui-disabled": {
                    backgroundColor: "#F2F4F7",
                    color: "#98A2B3",
                  },
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
                  flex: "0 0 auto",
                  minWidth: 55,
                  height: 38,
                  color: "#667085",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  textTransform: "none",
                  px: 1,
                  "&:hover": { backgroundColor: "#F2F4F7", color: "#101828" },
                }}
              >
                Clear
              </Button>
            </Box>

            {/* Active Filter Chips & Counter Bar */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1,
                mt: 1.25,
                pt: 1,
                borderTop: "1px solid #F2F4F7",
              }}
            >
              {/* Active Chips */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, alignItems: "center" }}>
                {drawingOrLnSearch.trim() && (
                  <Chip
                    key="chip-search"
                    label={`Search: "${drawingOrLnSearch.trim()}"`}
                    size="small"
                    onDelete={() => {
                      setDrawingOrLnSearch("");
                      setPage(0);
                      executeFetch(0, rowsPerPage, { search: "" });
                    }}
                    sx={{
                      backgroundColor: "#F2F4F7",
                      color: "#344054",
                      border: "1px solid #E4E7EC",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      borderRadius: "16px",
                      height: "26px",
                      "& .MuiChip-deleteIcon": {
                        fontSize: "14px",
                        color: "#667085",
                        "&:hover": { color: "#101828" },
                      },
                    }}
                  />
                )}
                {selectedProductionSeries.map((item: any) => {
                  const label = typeof item === "string" ? item : item.productionSeries;
                  return (
                    <Chip
                      key={`series-${item.id || label}`}
                      label={`Series: ${label}`}
                      size="small"
                      onDelete={() => {
                        const nextSeries = selectedProductionSeries.filter(
                          (s: any) => (s.id || s) !== (item.id || item)
                        );
                        setSelectedProductionSeries(nextSeries);
                        setPage(0);
                        executeFetch(0, rowsPerPage, { series: nextSeries });
                      }}
                      sx={{
                        backgroundColor: "#F2F4F7",
                        color: "#344054",
                        border: "1px solid #E4E7EC",
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        borderRadius: "16px",
                        height: "26px",
                        "& .MuiChip-deleteIcon": {
                          fontSize: "14px",
                          color: "#667085",
                          "&:hover": { color: "#101828" },
                        },
                      }}
                    />
                  );
                })}
                {selectedDepartments.map((item: any) => {
                  let label = "";
                  let itemId = item;
                  if (typeof item === "object" && item !== null) {
                    label = item.label || item.name || item.departmentName || "";
                    itemId = item.id;
                  } else {
                    itemId = item;
                    const deptObj: any = departments.find((d: any) => String(d.id) === String(item));
                    label = deptObj ? (deptObj.name || deptObj.departmentName || deptObj.label) : String(item);
                  }
                  return (
                    <Chip
                      key={`dept-${itemId}`}
                      label={`Dept: ${label}`}
                      size="small"
                      onDelete={() => {
                        const nextDepts = selectedDepartments.filter((d: any) => {
                          const dId = typeof d === "object" && d !== null ? d.id : d;
                          return String(dId) !== String(itemId);
                        });
                        setSelectedDepartments(nextDepts);
                        setPage(0);
                        executeFetch(0, rowsPerPage, { depts: nextDepts });
                      }}
                      sx={{
                        backgroundColor: "#F2F4F7",
                        color: "#344054",
                        border: "1px solid #E4E7EC",
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        borderRadius: "16px",
                        height: "26px",
                        "& .MuiChip-deleteIcon": {
                          fontSize: "14px",
                          color: "#667085",
                          "&:hover": { color: "#101828" },
                        },
                      }}
                    />
                  );
                })}
                {typeFilter !== "All" && (
                  <Chip
                    key="type-filter"
                    label={`Type: ${typeFilter}`}
                    size="small"
                    onDelete={() => {
                      setTypeFilter("All");
                      setPage(0);
                      executeFetch(0, rowsPerPage, { type: "All" });
                    }}
                    sx={{
                      backgroundColor: "#F2F4F7",
                      color: "#344054",
                      border: "1px solid #E4E7EC",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      borderRadius: "16px",
                      height: "26px",
                      "& .MuiChip-deleteIcon": {
                        fontSize: "14px",
                        color: "#667085",
                        "&:hover": { color: "#101828" },
                      },
                    }}
                  />
                )}
                {fromDate && (
                  <Chip
                    key="from-date"
                    label={`From: ${format(fromDate, "dd/MM/yyyy")}`}
                    size="small"
                    onDelete={() => {
                      setFromDate(null);
                      setPage(0);
                      executeFetch(0, rowsPerPage, { fDate: null });
                    }}
                    sx={{
                      backgroundColor: "#F2F4F7",
                      color: "#344054",
                      border: "1px solid #E4E7EC",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      borderRadius: "16px",
                      height: "26px",
                      "& .MuiChip-deleteIcon": {
                        fontSize: "14px",
                        color: "#667085",
                        "&:hover": { color: "#101828" },
                      },
                    }}
                  />
                )}
                {toDate && (
                  <Chip
                    key="to-date"
                    label={`To: ${format(toDate, "dd/MM/yyyy")}`}
                    size="small"
                    onDelete={() => {
                      setToDate(null);
                      setPage(0);
                      executeFetch(0, rowsPerPage, { tDate: null });
                    }}
                    sx={{
                      backgroundColor: "#F2F4F7",
                      color: "#344054",
                      border: "1px solid #E4E7EC",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      borderRadius: "16px",
                      height: "26px",
                      "& .MuiChip-deleteIcon": {
                        fontSize: "14px",
                        color: "#667085",
                        "&:hover": { color: "#101828" },
                      },
                    }}
                  />
                )}
                {isFilterApplied && (
                  <Button
                    size="small"
                    variant="text"
                    onClick={handleReset}
                    sx={{
                      color: "primary.main",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      textTransform: "none",
                      p: 0,
                      height: "26px",
                      minWidth: "auto",
                      "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
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
          </Box>

          {/* Section 2: Table */}
          <TableContainer sx={{ borderTop: "1px solid #EAECF0", maxHeight: "calc(100vh - 310px)", overflow: "auto" }}>
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
                  <EmptyState colSpan={14} />
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Section 3: Pagination Footer */}
          <CustomPagination
            page={page}
            pageSize={rowsPerPage}
            totalCount={totalCount}
            disabled={loading}
            onPageChange={(newPage) => {
              setPage(newPage);
              executeFetch(newPage, rowsPerPage);
            }}
            onPageSizeChange={(newRowsPerPage) => {
              setRowsPerPage(newRowsPerPage);
              setPage(0);
              executeFetch(0, newRowsPerPage);
            }}
          />

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

        {/* Export Options Dialog */}
        <Dialog
          open={exportDialogOpen}
          onClose={() => !isExporting && setExportDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: "16px", p: 1 },
          }}
        >
          <DialogTitle
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontWeight: 700,
              color: "#101828",
              fontSize: "1.1rem",
              pb: 1,
            }}
          >
            Export {exportReportType === "BOTH" ? "IR / MSN Reports" : `${exportReportType} Report`}
            <IconButton size="small" onClick={() => setExportDialogOpen(false)} disabled={isExporting}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ py: 2 }}>
            <FormControl component="fieldset" sx={{ width: "100%" }}>
              <Typography variant="subtitle2" fontWeight="600" color="#475467" sx={{ mb: 1 }}>
                Choose Export Option:
              </Typography>

              <RadioGroup
                value={exportMode}
                onChange={(e) => {
                  const newMode = e.target.value as "all" | "custom";
                  setExportMode(newMode);
                  if (newMode === "custom") {
                    setSelectedExportColumns(ALL_IRMSN_EXPORT_COLUMNS.map((c) => c.key));
                  }
                }}
                sx={{ mb: 2 }}
              >
                <FormControlLabel
                  value="all"
                  control={<Radio size="small" sx={{ color: "primary.main", "&.Mui-checked": { color: "primary.main" } }} />}
                  label={<Typography variant="body2" fontWeight="600">Export All Columns</Typography>}
                />
                <FormControlLabel
                  value="custom"
                  control={<Radio size="small" sx={{ color: "primary.main", "&.Mui-checked": { color: "primary.main" } }} />}
                  label={<Typography variant="body2" fontWeight="600">Select Specific Columns to Export</Typography>}
                />
              </RadioGroup>

              {exportMode === "custom" && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    bgcolor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5} pb={1} borderBottom="1px solid #e2e8f0">
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={selectedExportColumns.length === ALL_IRMSN_EXPORT_COLUMNS.length}
                          indeterminate={
                            selectedExportColumns.length > 0 &&
                            selectedExportColumns.length < ALL_IRMSN_EXPORT_COLUMNS.length
                          }
                          onChange={handleToggleSelectAllColumns}
                          sx={{ color: "primary.main", "&.Mui-checked": { color: "primary.main" } }}
                        />
                      }
                      label={
                        <Typography variant="body2" fontWeight="700">
                          {selectedExportColumns.length === ALL_IRMSN_EXPORT_COLUMNS.length ? "Deselect All" : "Select All Columns"}
                        </Typography>
                      }
                    />
                    <Chip
                      label={`${selectedExportColumns.length} / ${ALL_IRMSN_EXPORT_COLUMNS.length} selected`}
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: "primary.main", color: "primary.main" }}
                    />
                  </Box>

                  <Grid container spacing={1}>
                    {ALL_IRMSN_EXPORT_COLUMNS.map((col) => (
                      <Grid item xs={6} sm={4} key={col.key}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={selectedExportColumns.includes(col.key)}
                              onChange={() => handleToggleColumn(col.key)}
                              sx={{ color: "primary.main", "&.Mui-checked": { color: "primary.main" } }}
                            />
                          }
                          label={<Typography variant="body2" sx={{ fontSize: "0.85rem" }}>{col.label}</Typography>}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </FormControl>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              onClick={() => setExportDialogOpen(false)}
              disabled={isExporting}
              sx={{ minWidth: 110, fontWeight: 600, borderRadius: "8px", textTransform: "none" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={isExporting ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
              onClick={handleConfirmExportData}
              disabled={isExporting || (exportMode === "custom" && selectedExportColumns.length === 0)}
              sx={{
                minWidth: 110,
                fontWeight: 600,
                borderRadius: "8px",
                textTransform: "none",
                backgroundColor: "primary.main",
                "&:hover": { backgroundColor: "primary.dark" },
              }}
            >
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ViewIRMSN;
