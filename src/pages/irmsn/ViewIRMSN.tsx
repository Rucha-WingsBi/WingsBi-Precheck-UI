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
  Autocomplete,
  Card,
  CardContent,
  Alert,
  Checkbox,
  InputAdornment,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import ClearIcon from "@mui/icons-material/Clear";
import {
  fetchIRMSNList,
  clearTables,
  fetchMSNList,
  setSearchParams,
} from "../../store/slices/irmsnSlice";
import {
  useDepartments,
  useProductionSeries,
} from "../../hooks/useMasterData";
import type { RootState, AppDispatch } from "../../store/store";
import { useNavigate } from "react-router-dom";
import {
  Refresh as RefreshIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, addDays } from "date-fns";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const ViewIRMSN: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { irmsnList, msnList, loading, lastSearchParams } = useSelector(
    (state: RootState) => state.irmsn,
  );
  const navigate = useNavigate();
  const hasRestored = useRef(false);

  // Local state - Unified Search Bar
  const [drawingOrLnSearch, setDrawingOrLnSearch] = useState<string>("");

  // Local state - Multi-select Dropdowns
  const [selectedDepartments, setSelectedDepartments] = useState<any[]>([]);
  const [selectedProductionSeries, setSelectedProductionSeries] = useState<any[]>([]);

  // Date Filters
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

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

  // Restore filters and auto-search on mount
  useEffect(() => {
    if (
      lastSearchParams &&
      departments.length &&
      productionSeries.length &&
      !hasRestored.current
    ) {
      const restoreAndFetch = async () => {
        hasRestored.current = true;

        if (lastSearchParams.drawingNumber || lastSearchParams.lnItemCode) {
          setDrawingOrLnSearch(
            lastSearchParams.drawingNumber || lastSearchParams.lnItemCode || "",
          );
        }

        if (lastSearchParams.productionSeries) {
          const seriesArr = lastSearchParams.productionSeries.split(",");
          const matchedSeries = productionSeries.filter((ps: any) =>
            seriesArr.includes(ps.productionSeries),
          );
          setSelectedProductionSeries(matchedSeries);
        }

        if (lastSearchParams.departmentTypeId) {
          const deptIds = String(lastSearchParams.departmentTypeId).split(",").map(Number);
          const matchedDepts = departments.filter((d: any) => deptIds.includes(d.id));
          setSelectedDepartments(matchedDepts);
        }

        if (lastSearchParams.fromDate) setFromDate(new Date(lastSearchParams.fromDate));
        if (lastSearchParams.toDate) setToDate(new Date(lastSearchParams.toDate));

        try {
          await Promise.all([
            dispatch(fetchIRMSNList(lastSearchParams)),
            dispatch(fetchMSNList(lastSearchParams)),
          ]);
        } catch (e) {
          console.error("Auto-fetch failed", e);
        }
      };

      restoreAndFetch();
    }
  }, [departments, productionSeries, lastSearchParams, dispatch]);

  const handleReset = () => {
    setDrawingOrLnSearch("");
    setSelectedDepartments([]);
    setSelectedProductionSeries([]);
    setFromDate(null);
    setToDate(null);

    dispatch(clearTables());
    dispatch(setSearchParams(null));
  };

  const handleSearch = async () => {
    if (
      !(fromDate && toDate) &&
      selectedProductionSeries.length === 0 &&
      !drawingOrLnSearch.trim() &&
      selectedDepartments.length === 0
    ) {
      setStatusMessage({
        type: "error",
        message: "Please enter search criteria or select Production Series / Department or Date Range",
      });
      return;
    }

    try {
      const params: any = {
        drawingNumber: drawingOrLnSearch.trim(),
        productionSeries: selectedProductionSeries.map((ps: any) => ps.productionSeries).join(","),
        stage: "",
        lnItemCode: drawingOrLnSearch.trim(),
        fromDate: fromDate ? format(fromDate, "yyyy-MM-dd") : undefined,
        toDate: toDate ? format(addDays(toDate, 1), "yyyy-MM-dd") : undefined,
        departmentTypeId: selectedDepartments.map((d: any) => d.id).join(","),
      };

      dispatch(setSearchParams(params));

      const [irRes, msnRes] = await Promise.all([
        dispatch(fetchIRMSNList(params)),
        dispatch(fetchMSNList(params)),
      ]);

      const irCount = irRes.payload?.length || 0;
      const msnCount = msnRes.payload?.length || 0;
      const totalCount = irCount + msnCount;

      if (totalCount > 0) {
        setStatusMessage({
          type: "success",
          message: `Data loaded successfully. Total Records: ${totalCount} (IR: ${irCount}, MSN: ${msnCount})`,
        });
      } else {
        setStatusMessage({
          type: "info",
          message: "No records found for the selected criteria.",
        });
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
    drawingOrLnSearch ||
    selectedDepartments.length > 0 ||
    selectedProductionSeries.length > 0 ||
    fromDate ||
    toDate ||
    irmsnList.length > 0 ||
    msnList.length > 0
  );

  // Combine IR and MSN lists into one single list with distinct type
  const combinedList = useMemo(() => {
    const irs = (irmsnList || []).map((item: any) => ({
      ...item,
      recordType: "IR" as const,
      displayNumber: item.irNumber,
      orderNumber: item.purchaseOrderNumber || item.poNumber || item.productionOrderNumber || "",
    }));
    const msns = (msnList || []).map((item: any) => ({
      ...item,
      recordType: "MSN" as const,
      displayNumber: item.msnNumber,
      orderNumber: item.productionOrderNumber || item.purchaseOrderNumber || item.poNumber || "",
    }));

    let list: any[] = [...irs, ...msns];

    if (drawingOrLnSearch.trim()) {
      const searchLower = drawingOrLnSearch.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.drawingNumber?.toLowerCase().includes(searchLower) ||
          item.drawingNumberIdName?.toLowerCase().includes(searchLower) ||
          item.lnItemCode?.toLowerCase().includes(searchLower) ||
          item.displayNumber?.toLowerCase().includes(searchLower) ||
          item.irNumber?.toLowerCase().includes(searchLower) ||
          item.msnNumber?.toLowerCase().includes(searchLower),
      );
    }

    if (selectedDepartments.length > 0) {
      const deptIds = selectedDepartments.map((d: any) => d.id);
      const deptNames = selectedDepartments.map((d: any) => d.name?.toLowerCase());
      list = list.filter(
        (item) =>
          deptIds.includes(item.departmentId) ||
          (item.departmentName && deptNames.includes(item.departmentName.toLowerCase())),
      );
    }

    if (selectedProductionSeries.length > 0) {
      const seriesNames = selectedProductionSeries.map((ps: any) =>
        ps.productionSeries?.toLowerCase(),
      );
      const seriesIds = selectedProductionSeries.map((ps: any) => ps.id);
      list = list.filter(
        (item) =>
          seriesIds.includes(item.prodSeriesId) ||
          (item.productionSeries && seriesNames.includes(item.productionSeries.toLowerCase())) ||
          (item.productionSeriesName && seriesNames.includes(item.productionSeriesName.toLowerCase())),
      );
    }

    return list;
  }, [
    irmsnList,
    msnList,
    drawingOrLnSearch,
    selectedDepartments,
    selectedProductionSeries,
  ]);

  const cellStyle = { padding: "4px 8px !important", fontSize: "0.75rem", whiteSpace: "nowrap" };
  const headerStyle = {
    fontWeight: "bold",
    backgroundColor: "#f5f5f5",
    padding: "5px 8px !important",
    fontSize: "0.85rem",
    whiteSpace: "nowrap",
  };

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
            View IR/MSN
          </Typography>
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
        <Card elevation={2} sx={{ mb: 1.5 }}>
          <CardContent sx={{ p: { xs: 1.5, md: 2 }, "&:last-child": { pb: { xs: 1.5, md: 2 } } }}>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                alignItems: "center",
              }}
            >
              {/* Drawing / LN / IR / MSN No Combined Search Bar */}
              <TextField
                size="small"
                sx={{ flex: { xs: "1 1 100%", md: "1 1 0%" }, minWidth: 180 }}
                label="Search"
                placeholder="Drawing, LN Code, IR/MSN..."
                value={drawingOrLnSearch}
                onChange={(e) => setDrawingOrLnSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                  endAdornment: drawingOrLnSearch ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setDrawingOrLnSearch("")}
                        edge="end"
                      >
                        <ClearIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />

              {/* Department Filter (Multi-select) */}
              <FormControl sx={{ flex: { xs: "1 1 45%", md: "0 1 auto" }, minWidth: 150 }} size="small">
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
                          py: "2px !important",
                          px: "8px !important",
                          minHeight: "28px !important",
                          fontSize: "0.8rem",
                          "&.MuiAutocomplete-option": {
                            py: "2px !important",
                            minHeight: "28px !important",
                          },
                        }}
                      >
                        <Checkbox
                          icon={icon}
                          checkedIcon={checkedIcon}
                          sx={{ p: "2px", mr: 0.5 }}
                          checked={selected}
                          size="small"
                        />
                        <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                          {option.name}
                        </Typography>
                      </Box>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Dept Type"
                      placeholder={selectedDepartments.length > 0 ? `${selectedDepartments.length} selected` : "Select"}
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

              {/* Production Series Filter (Multi-select) */}
              <FormControl sx={{ flex: { xs: "1 1 45%", md: "0 1 auto" }, minWidth: 140 }} size="small">
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
                          py: "2px !important",
                          px: "8px !important",
                          minHeight: "28px !important",
                          fontSize: "0.8rem",
                          "&.MuiAutocomplete-option": {
                            py: "2px !important",
                            minHeight: "28px !important",
                          },
                        }}
                      >
                        <Checkbox
                          icon={icon}
                          checkedIcon={checkedIcon}
                          sx={{ p: "2px", mr: 0.5 }}
                          checked={selected}
                          size="small"
                        />
                        <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                          {option.productionSeries}
                        </Typography>
                      </Box>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Prod Series *"
                      placeholder={selectedProductionSeries.length > 0 ? `${selectedProductionSeries.length} selected` : "Select"}
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
                slotProps={{ textField: { size: "small", sx: { flex: { xs: "1 1 45%", md: "0 0 auto" }, minWidth: 130, width: { md: 150 } } } }}
              />
              <DatePicker
                label="To Date"
                value={toDate}
                onChange={(newValue) => setToDate(newValue)}
                slotProps={{ textField: { size: "small", sx: { flex: { xs: "1 1 45%", md: "0 0 auto" }, minWidth: 130, width: { md: 150 } } } }}
              />

              <Button
                variant="contained"
                color="primary"
                sx={{
                  minWidth: 80,
                  height: 36,
                  flex: { xs: 1, sm: "none" },
                }}
                size="small"
                onClick={handleSearch}
                disabled={
                  (!(fromDate && toDate) &&
                    selectedProductionSeries.length === 0 &&
                    !drawingOrLnSearch.trim() &&
                    selectedDepartments.length === 0) ||
                  loading
                }
              >
                <SearchIcon sx={{ mr: 0.5, fontSize: 18 }} />
                Search
              </Button>
              <Button
                variant="contained"
                color="error"
                sx={{
                  minWidth: 70,
                  height: 36,
                  flex: { xs: 1, sm: "none" },
                }}
                size="small"
                onClick={handleReset}
                disabled={!isResetEnabled}
              >
                <RefreshIcon sx={{ mr: 0.5, fontSize: 18 }} />
                Reset
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Selected Filter Chips */}
        {(selectedDepartments.length > 0 || selectedProductionSeries.length > 0) && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center', my: 0.5, px: 0.5 }}>
            {selectedDepartments.map((item: any) => {
              const label = typeof item === 'string' ? item : item.name;
              return (
                <Chip
                  key={`dept-${item.id || label}`}
                  label={`Dept: ${label}`}
                  size="small"
                  onDelete={() => {
                    setSelectedDepartments(prev => prev.filter((d: any) => (d.id || d) !== (item.id || item)));
                  }}
                  color="primary"
                  variant="outlined"
                />
              );
            })}
            {selectedProductionSeries.map((item: any) => {
              const label = typeof item === 'string' ? item : item.productionSeries;
              return (
                <Chip
                  key={`series-${item.id || label}`}
                  label={`Series: ${label}`}
                  size="small"
                  onDelete={() => {
                    setSelectedProductionSeries(prev => prev.filter((s: any) => (s.id || s) !== (item.id || item)));
                  }}
                  color="primary"
                  variant="outlined"
                />
              );
            })}
            <Button
              size="small"
              color="error"
              variant="text"
              onClick={() => {
                setSelectedDepartments([]);
                setSelectedProductionSeries([]);
              }}
              sx={{ fontSize: '0.75rem', py: 0, px: 1, height: '24px', minWidth: 'auto', fontWeight: 600 }}
            >
              Clear All
            </Button>
          </Box>
        )}

        {/* Single Combined IR/MSN Table */}
        <Paper sx={{ mt: 1, mb: 1, p: 0.5, boxShadow: 2 }}>
          <Typography
            variant="subtitle1"
            align="center"
            fontWeight="bold"
            sx={{ mb: 1 }}
          >
            IR/MSN Number
          </Typography>
          <TableContainer sx={{ maxHeight: 500, overflow: "auto" }}>
            <Table
              stickyHeader
              sx={{ minWidth: { xs: 600, md: 800 } }}
              size="small"
            >
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5", height: 30 }}>
                  <TableCell align="center" sx={headerStyle}>
                    Sr No
                  </TableCell>
                  <TableCell align="center" sx={headerStyle}>
                    Type
                  </TableCell>
                  <TableCell align="center" sx={headerStyle}>
                    IR/MSN Number
                  </TableCell>
                  <TableCell align="center" sx={headerStyle}>
                    LnItem Code
                  </TableCell>
                  <TableCell align="center" sx={headerStyle}>
                    Drg Number
                  </TableCell>
                  <TableCell align="center" sx={headerStyle}>
                    ID Number
                  </TableCell>
                  <TableCell align="center" sx={headerStyle}>
                    MRIR 
                  </TableCell>
                  <TableCell align="center" sx={headerStyle}>
                    Date
                  </TableCell>
                  <TableCell align="center" sx={headerStyle}>
                    UserName
                  </TableCell>
                  <TableCell align="center" sx={headerStyle}>
                    Department
                  </TableCell>
                  <TableCell align="center" sx={headerStyle}>
                    Stage
                  </TableCell>
                  <TableCell align="center" sx={headerStyle}>
                    Build No
                  </TableCell>
                  <TableCell align="center" sx={headerStyle}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={13}
                      align="center"
                      sx={{ height: 150 }}
                    >
                      <CircularProgress size={30} />
                    </TableCell>
                  </TableRow>
                ) : combinedList.length > 0 ? (
                  combinedList.map((item, index) => (
                    <TableRow key={`${item.recordType}-${item.id}`} hover sx={{ height: 28 }}>
                      <TableCell align="center" sx={cellStyle}>
                        {index + 1}
                      </TableCell>
                      <TableCell align="center" sx={cellStyle}>
                        <Box
                          component="span"
                          sx={{
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            bgcolor:
                              item.recordType === "IR"
                                ? "rgba(168, 0, 90, 0.1)"
                                : "rgba(0, 120, 212, 0.1)",
                            color:
                              item.recordType === "IR"
                                ? "primary.main"
                                : "secondary.main",
                            
                          }}
                        >
                          {item.recordType}
                        </Box>
                      </TableCell>
                      <TableCell align="center" sx={cellStyle}>
                        {item.displayNumber || "-"}
                      </TableCell>
                      <TableCell align="center" sx={cellStyle}>
                        {item.lnItemCode || "-"}
                      </TableCell>
                      <TableCell align="center" sx={cellStyle}>
                        {item.drawingNumberIdName || item.drawingNumber || "-"}
                      </TableCell>
                      <TableCell align="center" sx={cellStyle}>
                        {item.idNumberRange || "-"}
                      </TableCell>
                      <TableCell align="center" sx={cellStyle}>
                        {item.mrirNumber || "-"}
                      </TableCell>
                      <TableCell align="center" sx={cellStyle}>
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
                      <TableCell align="center" sx={cellStyle}>
                        {item.userName || "-"}
                      </TableCell>
                      <TableCell align="center" sx={cellStyle}>
                        {item.departmentName || "-"}
                      </TableCell>
                      <TableCell align="center" sx={cellStyle}>
                        {item.stage || "-"}
                      </TableCell>
                      <TableCell align="center" sx={cellStyle}>
                        {item.buildNumber || "-"}
                      </TableCell>
                      <TableCell align="center" sx={cellStyle}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() =>
                            navigate(
                              `/irmsn/edit/${item.recordType}/${encodeURIComponent(
                                item.displayNumber || "",
                              )}`,
                              { state: item },
                            )
                          }
                          title={`Edit ${item.recordType} Number`}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={13}
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
      </Box>
    </LocalizationProvider>
  );
};

export default ViewIRMSN;
