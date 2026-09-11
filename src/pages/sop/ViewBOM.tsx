import React, { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "../../store/store";
import { useForm } from "react-hook-form";
import debounce from "lodash/debounce";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Button,
} from "@mui/material";
import {
  TableChart as TableIcon,
  KeyboardArrowDown,
  KeyboardArrowRight,
  Edit as EditIcon,
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
import { BomFilterCard } from "./components/BomFilterCard";

interface AssemblyOption {
  id: number;
  drawingNumber: string;
  nomenclature: string;
  lnItemCode?: string;
}

const ViewBOM: React.FC<{ hideHeader?: boolean }> = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

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
  const { reset, setValue } = useForm({
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
        <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "#64748b" }}>
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
            color: row.level === 0 ? "primary.main" : row.level === 1 ? "#2e7d32" : "#64748b",
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
              color: row.level === 0 ? "primary.main" : "#424242",
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
          sx={{ fontSize: "0.8rem", color: "primary.main", fontWeight: 500 }}
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
        <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "#1e293b" }}>
          {value || "-"}
        </Typography>
      ),
    },
    {
      id: "parentDrawingNumber",
      label: "Assembly No",
      minWidth: 120,
      format: (value: any) => (
        <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "#64748b" }}>
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
    [dispatch]
  );

  const handleAssemblyInputChange = (_: any, newInputValue: string) => {
    setAssemblyInputValue(newInputValue);
    debouncedSearch(newInputValue);
  };

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

  const handleSearch = () => {
    const assemblyNumber = selectedAssembly?.drawingNumber;
    if (assemblyNumber) {
      dispatch(getBomDetails(assemblyNumber));
    }
  };

  const handleExport = () => {
    const assemblyNumber =
      selectedAssembly?.drawingNumber || selectedAssemblyNumber;
    if (assemblyNumber) {
      dispatch(exportBomDetails(assemblyNumber));
    }
  };

  const handleReset = () => {
    reset();
    setSelectedAssembly(null);
    setAssemblyInputValue("");
    dispatch(clearBomData());
    dispatch(clearAssemblySearchResults());
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 1.5, borderRadius: "8px" }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      {/* Bom Search Filter Card */}
      <BomFilterCard
        selectedAssembly={selectedAssembly}
        handleAssemblyChange={handleAssemblyChange}
        assemblyInputValue={assemblyInputValue}
        handleAssemblyInputChange={handleAssemblyInputChange}
        assemblySearchResults={assemblySearchResults}
        isSearchingAssembly={isSearchingAssembly}
        handleSearch={handleSearch}
        handleReset={handleReset}
        handleExport={handleExport}
        isBomLoading={isBomLoading}
        isExporting={isExporting}
        hasBomData={bomData && bomData.length > 0}
      />

      {/* Results Table Card */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "10px",
          border: "1px solid #EAECF0",
          backgroundColor: "#ffffff",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            p: 1.5,
            px: 2,
            borderBottom: "1px solid #EAECF0",
            backgroundColor: "#F9FAFB",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <TableIcon sx={{ color: "primary.main", fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontSize: "0.95rem", fontWeight: 700, color: "#101828" }}>
              BOM Details
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {bomData && bomData.length > 0 && (
              <Chip
                label={`${bomData.length} items`}
                size="small"
                sx={{
                  backgroundColor: "#ECFDF3",
                  color: "#027A48",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                }}
              />
            )}
            <Button
              variant="contained"
              size="small"
              startIcon={<EditIcon sx={{ fontSize: "0.95rem" }} />}
              onClick={() => {
                const activeDwg =
                  selectedAssembly?.drawingNumber ||
                  selectedAssemblyNumber ||
                  assemblyInputValue ||
                  (bomData && bomData.length > 0
                    ? bomData[0]?.parentDrawingNumber ||
                      bomData[0]?.assemblyNumber ||
                      bomData[0]?.childDrawingNumber ||
                      ""
                    : "");
                navigate("/components/assembly", {
                  state: {
                    drawingNumber: activeDwg,
                  },
                });
              }}
              sx={{
                height: 32,
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
              Edit BOM
            </Button>
          </Box>
        </Box>

        <Box sx={{ position: "relative" }}>
          <TableContainer sx={{ maxHeight: "calc(100vh - 280px)", overflow: "auto" }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      align={column.align || "left"}
                      sx={{
                        fontWeight: 700,
                        backgroundColor: "#F9FAFB",
                        color: "#475467",
                        fontSize: "0.8rem",
                        borderBottom: "1px solid #EAECF0",
                        py: 1,
                        px: 1.5,
                        minWidth: column.minWidth,
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
                      hover
                      sx={{
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
                      {columns.map((column) => (
                        <TableCell key={column.id} align={column.align || "left"}>
                          {column.format
                            ? column.format(item[column.id], item, index)
                            : item[column.id]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center" sx={{ py: 6, borderBottom: "none" }}>
                      <Typography variant="body2" sx={{ color: "#667085", fontWeight: 500 }}>
                        {isBomLoading
                          ? "Loading BOM details..."
                          : "No data available. Search for an assembly to view BOM details."}
                      </Typography>
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
              }}
            >
              <CircularProgress color="primary" />
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ViewBOM;
