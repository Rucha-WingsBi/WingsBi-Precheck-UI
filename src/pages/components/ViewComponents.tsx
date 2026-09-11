import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Collapse,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  Chip,
  Menu,
  ListItemText,
  ListItemIcon,
  Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DownloadIcon from "@mui/icons-material/Download";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useFetchAllDrawingNumbers, useProductionSeries, useUnits } from "../../hooks/useMasterData";
import { useDebounce } from "../../hooks/useDebounce";
import api from "../../services/api";
import * as XLSX from "xlsx";
import { MultiSelectFilter } from "../../components/MultiSelectFilter";
import { CustomPagination } from "../../components/CustomPagination";
import { EmptyState } from "../../components/EmptyState";


interface DrawingNumberRow {
  parentDrawingNumbers?: string[];
  id: number;
  drawingNumber?: string | null;
  nomenclature?: string | null;
  componentType?: string | null;
  componentCode?: string | null;
  lnItemCode?: string | null;
  availableFor?: string | null;
  isExpiry: boolean;
  location?: string | null;
  assemblyNumber?: string | null;
  createdDate?: string | null;
  modifiedDate?: string | null;
  isActive?: boolean;
  unitName?: string | null;
  qty?: number;
  productionSeries?: string | null;
}

const DrawingNumberRowComponent = ({
  drawingData,
  index,
  onDelete,
}: {
  drawingData: DrawingNumberRow;
  index: number;
  onDelete: (drawing: DrawingNumberRow) => void;
}) => {
  const [openDetails, setOpenDetails] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(menuAnchorEl);
  const navigate = useNavigate();

  // Format date
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return "N/A";
    }
  };

  const handleOpenMenu = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setMenuAnchorEl(e.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };

  // Edit Row
  const handleEdit = () => {
    handleCloseMenu();
    navigate(`/adminmaster/updatecomponents/${drawingData.id}`, {
      state: { editRow: drawingData, fromView: true },
    });
  };

  const handleDelete = () => {
    handleCloseMenu();
    onDelete(drawingData);
  };

  const handleToggleDetails = () => {
    handleCloseMenu();
    setOpenDetails((prev) => !prev);
  };

  return (
    <>
      <TableRow
        hover
        sx={{
          "& > *": { borderBottom: "1px solid", borderColor: "grey.100", py: 0.75, px: 1 },
          "&:hover": { backgroundColor: "grey.50" },
        }}
      >
        <TableCell sx={{ textAlign: "center", width: "45px", color: "text.muted", fontSize: "0.8rem" }}>
          {index + 1}
        </TableCell>
        <TableCell sx={{ color: "text.primary", fontSize: "0.8rem", fontWeight: 600 }}>
          {drawingData?.drawingNumber || "N/A"}
        </TableCell>
        <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
          {drawingData?.lnItemCode || "N/A"}
        </TableCell>
        <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {drawingData?.nomenclature || "N/A"}
        </TableCell>
        <TableCell sx={{ textAlign: "center" }}>
          <Chip
            label={drawingData?.componentType || "N/A"}
            size="small"
            sx={{
              height: 20,
              fontSize: "0.7rem",
              fontWeight: 600,
              backgroundColor: "grey.100",
              color: "text.secondary",
              borderRadius: "4px",
            }}
          />
        </TableCell>
        <TableCell sx={{ textAlign: "center", color: "text.secondary", fontSize: "0.8rem" }}>
          {drawingData?.unitName || "N/A"}
        </TableCell>
        <TableCell sx={{ textAlign: "center", color: "text.secondary", fontSize: "0.8rem" }}>
          {drawingData?.qty ?? (drawingData?.assemblyNumber || "N/A")}
        </TableCell>
        <TableCell sx={{ textAlign: "center", color: "text.muted", fontSize: "0.8rem" }}>
          {formatDate(drawingData?.modifiedDate || drawingData?.createdDate)}
        </TableCell>

        <TableCell sx={{ textAlign: "center", width: "60px" }}>
          <IconButton
            size="small"
            onClick={handleOpenMenu}
            sx={{
              color: "text.muted",
              p: 0.5,
              "&:hover": { backgroundColor: "grey.100", color: "text.primary" },
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>

          <Menu
            anchorEl={menuAnchorEl}
            open={isMenuOpen}
            onClose={handleCloseMenu}
            transitionDuration={0}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            PaperProps={{
              elevation: 3,
              sx: { minWidth: 160, borderRadius: "8px", py: 0.5 },
            }}
          >
            <MenuItem onClick={handleEdit} sx={{ py: 0.75, px: 1.5 }}>
              <ListItemIcon sx={{ minWidth: 28 }}>
                <EditIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText primary="Edit Component" primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 500 }} />
            </MenuItem>

            <MenuItem onClick={handleToggleDetails} sx={{ py: 0.75, px: 1.5 }}>
              <ListItemIcon sx={{ minWidth: 28 }}>
                {openDetails ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
              </ListItemIcon>
              <ListItemText primary={openDetails ? "Hide Details" : "View Details"} primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 500 }} />
            </MenuItem>

            <MenuItem onClick={handleDelete} sx={{ py: 0.75, px: 1.5 }}>
              <ListItemIcon sx={{ minWidth: 28 }}>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText primary="Delete" primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 500, color: "error.main" }} />
            </MenuItem>
          </Menu>
        </TableCell>
      </TableRow>

      <TableRow sx={{ height: 'auto' }}>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
          <Collapse in={openDetails} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1, p: 1.5, backgroundColor: "grey.50", borderRadius: "6px", border: "1px solid", borderColor: "grey.200" }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main", display: "block", mb: 0.75 }}>
                Additional Details
              </Typography>
              <Table size="small" sx={{ width: "100%" }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "grey.100" }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 0.5 }}>Assembly Number</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 0.5 }}>Component Code</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 0.5 }}>Available For</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 0.5 }}>Rack Location</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 0.5 }}>Has Expiry</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 0.5 }}>Created Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontSize: "0.75rem", py: 0.5 }}>{drawingData?.parentDrawingNumbers?.join(", ") || drawingData?.assemblyNumber || "N/A"}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", py: 0.5 }}>{drawingData?.componentCode || "N/A"}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", py: 0.5 }}>{drawingData?.availableFor || "N/A"}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", py: 0.5 }}>{drawingData?.location || "N/A"}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", py: 0.5 }}>{drawingData?.isExpiry ? "Yes" : "No"}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", py: 0.5 }}>{formatDate(drawingData?.createdDate)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const ComponentTypesList = ["ID", "BATCH", "FIM", "SI"];

const Components: React.FC<{ hideHeader?: boolean }> = ({ hideHeader = false }) => {
  const navigate = useNavigate();

  // Filter state (Initial state BLANK / EMPTY)
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);

  const [appliedSeries, setAppliedSeries] = useState<string[]>([]);
  const [appliedTypes, setAppliedTypes] = useState<string[]>([]);
  const [appliedUnits, setAppliedUnits] = useState<string[]>([]);

  // Pagination & sorting state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Reset page when search query changes
  React.useEffect(() => {
    setPage(0);
  }, [debouncedSearchQuery]);

  // Pass debouncedSearchQuery, pageNumber (page + 1), pageSize (rowsPerPage), componentType, prodSeries, and unit filters to FetchAllDrawingNumbers API
  const componentTypeFilter = appliedTypes.length > 0 ? appliedTypes.join(",") : "";
  const {
    data: drawingNumbersData = [],
    isLoading,
    error,
    refetch,
  } = useFetchAllDrawingNumbers(
    debouncedSearchQuery,
    page + 1,
    rowsPerPage,
    componentTypeFilter,
    appliedSeries,
    appliedUnits
  );

  const { data: seriesList = [] } = useProductionSeries();
  const { data: unitsList = [] } = useUnits();

  const prodSeriesOptions = useMemo(
    () => seriesList.map((s: any) => s.productionSeries).filter(Boolean),
    [seriesList]
  );
  const unitOptions = useMemo(
    () => unitsList.map((u: any) => u.unitName).filter(Boolean),
    [unitsList]
  );

  // Refetch latest component master data whenever page mounts
  React.useEffect(() => {
    refetch();
  }, [refetch]);



  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [deletingDrawing, setDeletingDrawing] = useState<DrawingNumberRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const handleDeleteClick = (drawing: DrawingNumberRow) => {
    setDeletingDrawing(drawing);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDrawing) return;
    setIsDeleting(true);
    try {
      await api.post("/api/Common/DeleteDrawingNumber", {
        drawingNumber: deletingDrawing.drawingNumber || "",
        lnItemCode: deletingDrawing.lnItemCode || "",
      });
      setSnackbar({
        open: true,
        message: "Component deleted successfully",
        severity: "success",
      });
      setOpenDeleteDialog(false);
      setDeletingDrawing(null);
      refetch();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to delete component",
        severity: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApplyFilters = () => {
    setAppliedSeries(selectedSeries);
    setAppliedTypes(selectedTypes);
    setAppliedUnits(selectedUnits);
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedSeries([]);
    setSelectedTypes([]);
    setSelectedUnits([]);
    setAppliedSeries([]);
    setAppliedTypes([]);
    setAppliedUnits([]);
    setPage(0);
  };

  const isDropdownFilterSelected = selectedSeries.length > 0 || selectedTypes.length > 0 || selectedUnits.length > 0;

  // Sort and pagination functionality
  const { displayData, totalCount } = useMemo(() => {
    let rawList: DrawingNumberRow[] = Array.isArray(drawingNumbersData)
      ? drawingNumbersData
      : (drawingNumbersData as any)?.data || [];

    const serverTotalRecords = (drawingNumbersData as any)?.totalRecords ?? (drawingNumbersData as any)?.totalCount;

    let result = [...rawList];

    // Sorting by modifiedDate / createdDate
    result.sort((a, b) => {
      const dateA = new Date(a.modifiedDate || a.createdDate || 0).getTime();
      const dateB = new Date(b.modifiedDate || b.createdDate || 0).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    const isServerPaginated = serverTotalRecords !== undefined || (rawList.length <= rowsPerPage && rawList.length > 0);
    const finalDisplayData = isServerPaginated ? result : result.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
    const finalTotalCount = serverTotalRecords !== undefined ? serverTotalRecords : result.length;

    return { displayData: finalDisplayData, totalCount: finalTotalCount };
  }, [drawingNumbersData, sortOrder, page, rowsPerPage]);

  const handleExport = () => {
    if (displayData.length === 0) {
      setSnackbar({ open: true, message: "No components to export", severity: "error" });
      return;
    }
    const exportData = displayData.map((row, idx) => ({
      "Sr No": idx + 1,
      "Drawing Number": row.drawingNumber || "",
      "LN Item Code": row.lnItemCode || "",
      "Nomenclature": row.nomenclature || "",
      "Component Type": row.componentType || "",
      "Component Code": row.componentCode || "",
      "Available For": row.availableFor || "",
      "Unit Name": row.unitName || "",
      "Location": row.location || "",
      "Assembly Number": row.parentDrawingNumbers?.join(", ") || row.assemblyNumber || "",
      "Has Expiry": row.isExpiry ? "Yes" : "No",
      "Created Date": row.createdDate || "",
      "Modified Date": row.modifiedDate || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Components");
    XLSX.writeFile(workbook, `Components_Export_${Date.now()}.xlsx`);
  };

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading drawing numbers: {error instanceof Error ? error.message : "An error occurred"}
        </Alert>
        <Button variant="contained" size="small" onClick={() => refetch()}>
          Retry
        </Button>
      </Box>
    );
  }

  const hasActiveFilters = Boolean(
    searchQuery.trim() || selectedSeries.length > 0 || selectedTypes.length > 0 || selectedUnits.length > 0
  );

  return (
    <Box sx={{ py: hideHeader ? 0 : { xs: 1, sm: 1.25 }, px: hideHeader ? 0 : { xs: 1.5, sm: 2 }, minHeight: "100vh" }}>
      {!hideHeader && (
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
              Components
            </Typography>
            <Typography variant="body2" sx={{ color: "#667085", mt: 0.5 }}>
              View, search, and manage component master entries and assembly mappings.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleExport}
              startIcon={<DownloadIcon fontSize="small" />}
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

            <Button
              variant="contained"
              size="small"
              onClick={() => navigate("/adminmaster/updatecomponents", { state: { fromView: true } })}
              startIcon={<AddIcon fontSize="small" />}
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
              Add Component
            </Button>
          </Box>
        </Stack>
      )}

      {/* Main Filter & Table Single Container Card */}
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
        {/* Section 1: Filter Bar & Active Chips */}
        <Box sx={{ p: 1.5, pb: 1, borderBottom: "1px solid #EAECF0" }}>
          {/* Horizontal Filter Bar */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: "nowrap",
              width: "100%",
              overflowX: "auto",
              py: 0.5,
              "&::-webkit-scrollbar": { height: 6 },
              "&::-webkit-scrollbar-thumb": { backgroundColor: "#D0D5DD", borderRadius: 3 },
            }}
          >
            {/* Search Box */}
            <TextField
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              placeholder="Search component, Drawing No., LN Item Code, nomenclature..."
              sx={{
                flex: "1 1 240px",
                minWidth: 200,
                "& .MuiOutlinedInput-root": {
                  height: 38,
                  fontSize: "0.82rem",
                  backgroundColor: "background.paper",
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#98A2B3", fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Multi-Select Prod. Series Dropdown */}
            <MultiSelectFilter
              label="Prod. Series"
              value={selectedSeries}
              options={prodSeriesOptions}
              onChange={(val) => {
                setSelectedSeries(val);
                setPage(0);
              }}
              flex="0 0 140px"
              minWidth={120}
            />

            {/* Multi-Select Type Dropdown */}
            <MultiSelectFilter
              label="Type"
              value={selectedTypes}
              options={ComponentTypesList}
              onChange={(val) => {
                setSelectedTypes(val);
                setPage(0);
              }}
              flex="0 0 120px"
              minWidth={100}
            />

            {/* Multi-Select Unit Dropdown */}
            <MultiSelectFilter
              label="Unit"
              value={selectedUnits}
              options={unitOptions}
              onChange={(val) => {
                setSelectedUnits(val);
                setPage(0);
              }}
              flex="0 0 120px"
              minWidth={100}
            />

            {/* Apply Button */}
            <Button
              size="small"
              variant="contained"
              onClick={handleApplyFilters}
              disabled={!isDropdownFilterSelected || isLoading}
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
              Apply
            </Button>

            {/* Clear Button */}
            <Button
              size="small"
              variant="text"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              sx={{
                flex: "0 0 auto",
                color: "#667085",
                fontWeight: 600,
                fontSize: "0.82rem",
                height: 38,
                minWidth: 55,
                textTransform: "none",
                "&:hover": { color: "#101828", backgroundColor: "transparent" },
              }}
            >
              Clear
            </Button>
          </Box>

          {/* Active Filter Chips & Counter Bar */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mt: 1,
              pt: 0.75,
              borderTop: "1px solid #F2F4F7",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              {hasActiveFilters ? (
                <>
                  {searchQuery.trim() && (
                    <Chip
                      label={`Search: "${searchQuery}"`}
                      onDelete={() => setSearchQuery("")}
                      size="small"
                      sx={{
                        backgroundColor: "#F2F4F7",
                        color: "#344054",
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        borderRadius: "16px",
                        border: "1px solid #E9EAEB",
                        "& .MuiChip-deleteIcon": {
                          color: "#667085",
                          fontSize: 14,
                          "&:hover": { color: "#344054" },
                        },
                      }}
                    />
                  )}

                  {selectedSeries.map((s) => (
                    <Chip
                      key={`series-${s}`}
                      label={`Series: ${s}`}
                      onDelete={() => setSelectedSeries((prev) => prev.filter((x) => x !== s))}
                      size="small"
                      sx={{
                        backgroundColor: "#F2F4F7",
                        color: "#344054",
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        borderRadius: "16px",
                        border: "1px solid #E9EAEB",
                        "& .MuiChip-deleteIcon": {
                          color: "#667085",
                          fontSize: 14,
                          "&:hover": { color: "#344054" },
                        },
                      }}
                    />
                  ))}

                  {selectedTypes.map((t) => (
                    <Chip
                      key={`type-${t}`}
                      label={`Type: ${t}`}
                      onDelete={() => setSelectedTypes((prev) => prev.filter((x) => x !== t))}
                      size="small"
                      sx={{
                        backgroundColor: "#F2F4F7",
                        color: "#344054",
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        borderRadius: "16px",
                        border: "1px solid #E9EAEB",
                        "& .MuiChip-deleteIcon": {
                          color: "#667085",
                          fontSize: 14,
                          "&:hover": { color: "#344054" },
                        },
                      }}
                    />
                  ))}

                  {selectedUnits.map((u) => (
                    <Chip
                      key={`unit-${u}`}
                      label={`Unit: ${u}`}
                      onDelete={() => setSelectedUnits((prev) => prev.filter((x) => x !== u))}
                      size="small"
                      sx={{
                        backgroundColor: "#F2F4F7",
                        color: "#344054",
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        borderRadius: "16px",
                        border: "1px solid #E9EAEB",
                        "& .MuiChip-deleteIcon": {
                          color: "#667085",
                          fontSize: 14,
                          "&:hover": { color: "#344054" },
                        },
                      }}
                    />
                  ))}

                  <Button
                    variant="text"
                    size="small"
                    onClick={handleClearFilters}
                    sx={{
                      color: "#6B288A",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      textTransform: "none",
                      p: 0,
                      minWidth: "auto",
                      "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
                    }}
                  >
                    Clear all
                  </Button>
                </>
              ) : <Box />}
            </Box>

            <Typography variant="body2" sx={{ color: "#667085", fontSize: "0.85rem", fontWeight: 500, ml: "auto" }}>
              {totalCount.toLocaleString()} {totalCount === 1 ? "result" : "results"}
            </Typography>
          </Box>
        </Box>

        {/* Section 2: Table */}
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress color="primary" size={32} />
          </Box>
        ) : (
          <TableContainer
            sx={{
              overflowX: "auto",
              maxHeight: "calc(100vh - 290px)",
            }}
          >
            <Table stickyHeader size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ height: 42 }}>
                  <TableCell sx={{ width: "55px", textAlign: "center", fontWeight: 700, color: "#475467", backgroundColor: "#F9FAFB", fontSize: "0.8rem", py: 1, px: 1.5, borderBottom: "1px solid #EAECF0" }}>Sr.No</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475467", backgroundColor: "#F9FAFB", fontSize: "0.8rem", py: 1, px: 1.5, borderBottom: "1px solid #EAECF0" }}>Drawing No.</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475467", backgroundColor: "#F9FAFB", fontSize: "0.8rem", py: 1, px: 1.5, borderBottom: "1px solid #EAECF0" }}>LN Item Code</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475467", backgroundColor: "#F9FAFB", fontSize: "0.8rem", py: 1, px: 1.5, borderBottom: "1px solid #EAECF0" }}>Nomenclature</TableCell>
                  <TableCell sx={{ textAlign: "center", fontWeight: 700, color: "#475467", backgroundColor: "#F9FAFB", fontSize: "0.8rem", py: 1, px: 1.5, borderBottom: "1px solid #EAECF0" }}>Type</TableCell>
                  <TableCell sx={{ textAlign: "center", fontWeight: 700, color: "#475467", backgroundColor: "#F9FAFB", fontSize: "0.8rem", py: 1, px: 1.5, borderBottom: "1px solid #EAECF0" }}>Unit</TableCell>
                  <TableCell sx={{ textAlign: "center", fontWeight: 700, color: "#475467", backgroundColor: "#F9FAFB", fontSize: "0.8rem", py: 1, px: 1.5, borderBottom: "1px solid #EAECF0" }}>Qty</TableCell>
                  <TableCell sx={{ textAlign: "center", fontWeight: 700, color: "#475467", backgroundColor: "#F9FAFB", fontSize: "0.8rem", py: 1, px: 1.5, borderBottom: "1px solid #EAECF0" }}>
                    <Box
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      sx={{ display: "inline-flex", alignItems: "center", gap: 0.25, cursor: "pointer", userSelect: "none" }}
                    >
                      Updated On {sortOrder === "asc" ? <ArrowUpwardIcon sx={{ fontSize: "0.75rem" }} /> : <ArrowDownwardIcon sx={{ fontSize: "0.75rem" }} />}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ textAlign: "center", width: "60px", fontWeight: 700, color: "#475467", backgroundColor: "#F9FAFB", fontSize: "0.8rem", py: 1, px: 1.5, borderBottom: "1px solid #EAECF0" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayData.length === 0 ? (
                  <EmptyState colSpan={9} />
                ) : (
                  displayData.map((drawing, index) => (
                    <DrawingNumberRowComponent
                      key={drawing.id}
                      drawingData={drawing}
                      index={page * rowsPerPage + index}
                      onDelete={handleDeleteClick}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Section 3: Footer Pagination */}
        <CustomPagination
          page={page}
          pageSize={rowsPerPage}
          totalCount={totalCount}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setRowsPerPage(newSize);
            setPage(0);
          }}
        />

      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => !isDeleting && setOpenDeleteDialog(false)}>
        <DialogTitle sx={{ fontWeight: 700, color: "#101828", fontSize: "1rem" }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "#475467" }}>
            Are you sure you want to delete component with drawing number{" "}
            <strong>{deletingDrawing?.drawingNumber || "N/A"}</strong> and LN item code{" "}
            <strong>{deletingDrawing?.lnItemCode || "N/A"}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 1.5 }}>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={isDeleting} size="small" sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            size="small"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{ textTransform: "none", borderRadius: "6px" }}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === "error" ? null : 5000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Components;
