import React, { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store/store";
import { useForm } from "react-hook-form";
import debounce from "lodash/debounce";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardHeader,
  Chip,
  Container,
  Autocomplete,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Search as SearchIcon,
  GetApp as ExportIcon,
  Refresh as ResetIcon,
  TableChart as TableIcon,
} from "@mui/icons-material";
import {
  getBomDetails,
  searchAssemblyNumbers,
  exportBomDetails,
  clearBomData,
  clearAssemblySearchResults,
  setSelectedAssemblyNumber,
  clearError,
} from "../../store/slices/sopSlice";
import { useHierarchicalTable } from "../../hooks/useHierarchicalTable";
import { KeyboardArrowDown, KeyboardArrowRight } from "@mui/icons-material";
import { IconButton } from "@mui/material";

interface AssemblyOption {
  id: number;
  drawingNumber: string;
  nomenclature: string;
  lnItemCode?: string;
}

const ViewBOM: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const {
    bomData,
    assemblySearchResults,
    isBomLoading,
    isSearchingAssembly,
    isExporting,
    error,
    selectedAssemblyNumber,
  } = useSelector((state: RootState) => state.sop);

  const [selectedAssembly, setSelectedAssembly] =
    useState<AssemblyOption | null>(null);
  const [assemblyInputValue, setAssemblyInputValue] = useState("");

  // Hierarchical Table Hook
  const { visibleRows, toggleRow, expandedRowIds } = useHierarchicalTable({
    data: bomData || [],
    defaultExpanded: false,
  });

  // Form
  const { handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      assemblyNumber: "",
    },
  });

  // Column configuration
  const columns = [
    {
      id: "serialNumber",
      label: "Sr. No.",
      minWidth: 70,
      align: "center" as const,
      format: (_: any, __: any, index: number) => (
        <Typography
          variant="body2"
          sx={{ fontSize: "0.8rem", color: "#64748b" }}
        >
          {index + 1}
        </Typography>
      ),
    },
    {
      id: "level",
      label: "Level",
      minWidth: 70,
      align: "center" as const,
      format: (value: any, row: any) => (
        <Typography
          variant="body2"
          sx={{
            fontSize: "0.8rem",
            fontWeight: row.level === 0 ? 600 : row.level === 1 ? 500 : 400,
            color: row.level === 0 ? "#1976d2" : row.level === 1 ? "#2e7d32" : "#64748b"
          }}
        >
          {row.level !== undefined && row.level !== null ? row.level : "0"}
        </Typography>
      ),
    },
    {
      id: "childDrawingNumber",
      label: "Drawing Number",
      minWidth: 160,
      format: (value: any, row: any) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            pl: row.level * 3,
          }}
        >
          {row.hasChildren ? (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                toggleRow(row.id);
              }}
              sx={{ padding: 0.25, marginRight: 0.5 }}
            >
              {expandedRowIds.has(row.id) ? (
                <KeyboardArrowDown fontSize="small" />
              ) : (
                <KeyboardArrowRight fontSize="small" />
              )}
            </IconButton>
          ) : (
            <Box sx={{ width: 24, display: "inline-block" }} />
          )}
          <Typography
            variant="body2"
            sx={{
              fontWeight: row.level === 0 ? 600 : 500,
              color: row.level === 0 ? "#1976d2" : "#424242",
              fontSize: { xs: "0.75rem", md: "0.8rem" },
            }}
          >
            {value}
          </Typography>
        </Box>
      ),
    },
    {
      id: "nomenclature",
      label: "Nomenclature",
      minWidth: 150,
      format: (value: any) => (
        <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
          {value || "-"}
        </Typography>
      ),
    },
    {
      id: "lnItemCode",
      label: "LN Item Code",
      minWidth: 120,
      format: (value: any) => (
        <Typography
          variant="body2"
          sx={{ fontSize: "0.8rem", color: "#1976d2", fontWeight: 500 }}
        >
          {value || "-"}
        </Typography>
      ),
    },
    {
      id: "componentType",
      label: "Component Type",
      minWidth: 120,
      format: (value: any) => (
        <Chip
          label={value || "Standard"}
          size="small"
          variant="outlined"
          sx={{ fontSize: "0.7rem", height: 20 }}
        />
      ),
    },
    {
      id: "quantity",
      label: "Qty",
      minWidth: 60,
      align: "center" as const,
      format: (value: any) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: "#059669" }}>
          {value || "0"}
        </Typography>
      ),
    },
    {
      id: "findNo",
      label: "Position No",
      minWidth: 80,
      align: "center" as const,
      format: (value: any) => (
        <Typography
          variant="body2"
          sx={{ fontSize: "0.8rem", color: "#1e293b" }}
        >
          {value || "-"}
        </Typography>
      ),
    },
    {
      id: "parentDrawingNumber",
      label: "Assembly No",
      minWidth: 120,
      format: (value: any) => (
        <Typography
          variant="body2"
          sx={{ fontSize: "0.8rem", color: "#64748b" }}
        >
          {value || "-"}
        </Typography>
      ),
    },
  ];

  // Debounced search for assembly numbers
  const debouncedSearch = useCallback(
    debounce((searchText: string) => {
      if (searchText && searchText.length >= 3) {
        dispatch(searchAssemblyNumbers(searchText));
      } else {
        dispatch(clearAssemblySearchResults());
      }
    }, 300),
    [dispatch],
  );

  // Handle assembly search input change
  const handleAssemblyInputChange = (_: any, newInputValue: string) => {
    setAssemblyInputValue(newInputValue);
    debouncedSearch(newInputValue);
  };

  // Handle assembly selection
  const handleAssemblyChange = (_: any, newValue: AssemblyOption | null) => {
    setSelectedAssembly(newValue);
    if (newValue) {
      setValue("assemblyNumber", newValue.drawingNumber);
      dispatch(setSelectedAssemblyNumber(newValue.drawingNumber));
    } else {
      setValue("assemblyNumber", "");
      dispatch(setSelectedAssemblyNumber(null));
    }
  };

  // Handle search
  const handleSearch = (data: any) => {
    const assemblyNumber =
      selectedAssembly?.drawingNumber || data.assemblyNumber;
    if (assemblyNumber) {
      dispatch(getBomDetails(assemblyNumber));
    }
  };

  // Handle export
  const handleExport = () => {
    const assemblyNumber =
      selectedAssembly?.drawingNumber || selectedAssemblyNumber;
    if (assemblyNumber) {
      dispatch(exportBomDetails(assemblyNumber));
    }
  };

  // Handle reset
  const handleReset = () => {
    reset();
    setSelectedAssembly(null);
    setAssemblyInputValue("");
    dispatch(clearBomData());
    dispatch(clearAssemblySearchResults());
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        position: "relative",
        p: { xs: 1, md: 1.5 },
      }}
    >
      <Container maxWidth="xl" sx={{ pt: 1.5, pb: 1 }}>
        <Typography
          variant="h5"
          sx={{
            color: "primary.main",
            fontWeight: 600,
            fontSize: { xs: "1.25rem", md: "1.4rem" },
            mb: 1,
          }}
        >
          View BOM Details
        </Typography>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 1, py: 0 }} onClose={() => dispatch(clearError())}>
            {error}
          </Alert>
        )}

        {/* Search Filters Card */}
        <Card
          elevation={0}
          sx={{
            border: "1px solid #e2e8f0",
            borderRadius: 2,
            overflow: "hidden",
            background: "white",
            p: 1,
            mb: 1.5,
          }}
        >
          <Grid container spacing={1} alignItems="end">
            {/* Assembly Number - Autocomplete */}
            <Grid item xs={12} sm={6} md={4}>
              <Autocomplete
                value={selectedAssembly}
                onChange={handleAssemblyChange}
                inputValue={assemblyInputValue}
                onInputChange={handleAssemblyInputChange}
                options={assemblySearchResults || []}
                getOptionLabel={(option) =>
                  option.drawingNumber
                    ? `${option.drawingNumber}${option.lnItemCode ? ` - ${option.lnItemCode}` : ""
                    }`
                    : ""
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                loading={isSearchingAssembly}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assembly Number / LN Item Code"
                    placeholder="Type to search assembly Number or LN item code..."
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isSearchingAssembly ? (
                            <CircularProgress color="inherit" size={18} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#d1d5db",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#A8005A",
                      },
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {option.drawingNumber}
                      {option.lnItemCode && (
                        <Box component="span" sx={{ color: "text.secondary", fontWeight: 400, ml: 1 }}>
                          - {option.lnItemCode}
                        </Box>
                      )}
                    </Typography>
                  </li>
                )}
                noOptionsText={
                  assemblyInputValue.length < 3
                    ? "Type at least 3 characters"
                    : "No assemblies found"
                }
                freeSolo={false}
                sx={{ width: "100%" }}
              />
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12} sm={6} md={4}>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  justifyContent: { xs: "center", md: "flex-start" },
                  flexWrap: "no-wrap",
                }}
              >
                <Button
                  variant="outlined"
                  startIcon={<ResetIcon />}
                  onClick={handleReset}
                  size="small"
                  sx={{
                    minWidth: { xs: 80, md: 90 },
                    py: 0.75,
                    px: 1.5,
                    borderColor: "#6b7280",
                    color: "#6b7280",
                    fontSize: "0.75rem",
                    "&:hover": {
                      borderColor: "#374151",
                      backgroundColor: "#f9fafb",
                      color: "#374151",
                    },
                  }}
                >
                  Reset
                </Button>

                <Button
                  variant="contained"
                  startIcon={
                    isBomLoading ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <SearchIcon />
                    )
                  }
                  onClick={handleSubmit(handleSearch)}
                  disabled={!selectedAssembly || isBomLoading}
                  size="small"
                  sx={{
                    minWidth: { xs: 90, md: 100 },
                    py: 0.75,
                    px: 1.5,
                    fontSize: "0.75rem",
                    backgroundColor: "#2563eb",
                    "&:hover": { backgroundColor: "#1d4ed8" },
                    "&:disabled": { backgroundColor: "#94a3b8" },
                    boxShadow: "0 1px 4px rgba(37, 99, 235, 0.3)",
                  }}
                >
                  {isBomLoading ? "Searching..." : "Search"}
                </Button>

                <Button
                  variant="contained"
                  startIcon={
                    isExporting ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <ExportIcon />
                    )
                  }
                  onClick={handleExport}
                  disabled={bomData.length === 0 || isExporting}
                  size="small"
                  sx={{
                    minWidth: { xs: 90, md: 100 },
                    py: 0.75,
                    px: 1.5,
                    fontSize: "0.75rem",
                    backgroundColor: "#A8005A",
                    "&:hover": { backgroundColor: "#920050" },
                    "&:disabled": { backgroundColor: "#d1a3c0" },
                    boxShadow: "0 1px 4px rgba(168, 0, 90, 0.3)",
                  }}
                >
                  {isExporting ? "Exporting..." : "Export"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Card>

        {/* Results Section */}
        <Card
          elevation={0}
          sx={{
            border: "1px solid #e2e8f0",
            borderRadius: 3,
            overflow: "hidden",
            background: "white",
          }}
        >
          <CardHeader
            avatar={<TableIcon sx={{ color: "#A8005A" }} />}
            title={
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: { xs: "1rem", md: "1.125rem" },
                    fontWeight: 600,
                    color: "#1e293b",
                  }}
                >
                  BOM Details
                </Typography>
                {bomData && bomData.length > 0 && (
                  <Chip
                    label={`${bomData.length} items`}
                    size="small"
                    sx={{
                      backgroundColor: "#dcfce7",
                      color: "#166534",
                      fontWeight: 600,
                    }}
                  />
                )}
              </Box>
            }
            sx={{
              backgroundColor: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
              py: 0.75,
            }}
          />

          <Box sx={{ position: "relative" }}>
            <TableContainer
              sx={{
                maxHeight: { xs: 450, sm: 550, md: 650, lg: 750 },
                overflow: "auto",
                "&::-webkit-scrollbar": { width: 8, height: 8 },
                "&::-webkit-scrollbar-track": { backgroundColor: "#f1f1f1" },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#cbd5e1",
                  borderRadius: 4,
                  "&:hover": { backgroundColor: "#94a3b8" },
                },
              }}
            >
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.align || "left"}
                        sx={{
                          fontWeight: 700,
                          backgroundColor: "#f8fafc",
                          borderBottom: "2px solid #e2e8f0",
                          fontSize: "0.75rem",
                          py: 1,
                          px: 1,
                          minWidth: column.minWidth,
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                        }}
                      >
                        {column.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleRows && visibleRows.length > 0 ? (
                    visibleRows.map((item: any, index: number) => (
                      <TableRow
                        key={`${item.childDrawingId}-${index}`}
                        sx={{
                          backgroundColor:
                            index % 2 === 1 ? "#f8fafc" : "white",
                          "&:hover": { backgroundColor: "#f1f5f9" },
                          transition: "background-color 0.2s ease",
                          height: { xs: 36, md: 42 },
                        }}
                      >
                        {columns.map((column) => (
                          <TableCell
                            key={column.id}
                            align={column.align || "left"}
                            sx={{
                              fontSize: "0.75rem",
                              py: 1,
                              px: 1,
                              color: "#1e293b",
                            }}
                          >
                            {column.format
                              ? column.format(item[column.id], item, index)
                              : item[column.id]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        align="center"
                        sx={{ py: 8 }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <TableIcon sx={{ fontSize: 40, color: "#d1d5db" }} />
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: { xs: "0.8rem", md: "0.9rem" },
                              fontWeight: 500,
                            }}
                          >
                            {isBomLoading
                              ? "Loading BOM data..."
                              : "No data available. Please search for an assembly to view BOM details."}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {isBomLoading && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                  zIndex: 20,
                  borderRadius: 1,
                }}
              >
                <CircularProgress color="primary" />
              </Box>
            )}
          </Box>
        </Card>
      </Container>
    </Box>
  );
};

export default ViewBOM;
