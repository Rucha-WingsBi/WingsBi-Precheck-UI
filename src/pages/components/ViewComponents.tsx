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
  FormControl,
  Chip,
  Menu,
  Checkbox,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DownloadIcon from "@mui/icons-material/Download";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useAllDrawingNumbers, useProductionSeries, useUnits } from "../../hooks/useMasterData";
import api from "../../services/api";
import * as XLSX from "xlsx";

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
  hiddenColumns,
}: {
  drawingData: DrawingNumberRow;
  index: number;
  onDelete: (drawing: DrawingNumberRow) => void;
  hiddenColumns: Record<string, boolean>;
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

  const isColumnHidden = (key: string) => Boolean(hiddenColumns[key]);

  return (
    <>
      <TableRow
        hover
        sx={{
          "& > *": { borderBottom: "1px solid", borderColor: "grey.100", py: 0.75, px: 1 },
          "&:hover": { backgroundColor: "grey.50" },
        }}
      >
        {!isColumnHidden("srNo") && (
          <TableCell sx={{ textAlign: "center", width: "45px", color: "text.muted", fontSize: "0.8rem" }}>
            {index + 1}
          </TableCell>
        )}
        {!isColumnHidden("drawingNo") && (
          <TableCell sx={{ color: "text.primary", fontSize: "0.8rem", fontWeight: 600 }}>
            {drawingData?.drawingNumber || "N/A"}
          </TableCell>
        )}
        {!isColumnHidden("lnItemCode") && (
          <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
            {drawingData?.lnItemCode || "N/A"}
          </TableCell>
        )}
        {!isColumnHidden("nomenclature") && (
          <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {drawingData?.nomenclature || "N/A"}
          </TableCell>
        )}
        {!isColumnHidden("type") && (
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
        )}
        {!isColumnHidden("unit") && (
          <TableCell sx={{ textAlign: "center", color: "text.secondary", fontSize: "0.8rem" }}>
            {drawingData?.unitName || "N/A"}
          </TableCell>
        )}
        {!isColumnHidden("qtyAssy") && (
          <TableCell sx={{ textAlign: "center", color: "text.secondary", fontSize: "0.8rem" }}>
            {drawingData?.qty ?? (drawingData?.assemblyNumber || "N/A")}
          </TableCell>
        )}
        {!isColumnHidden("updatedOn") && (
          <TableCell sx={{ textAlign: "center", color: "text.muted", fontSize: "0.8rem" }}>
            {formatDate(drawingData?.modifiedDate || drawingData?.createdDate)}
          </TableCell>
        )}

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

  // Hooks
  const { data: allDrawingNumbers = [], isLoading, error, refetch } = useAllDrawingNumbers();
  const { data: seriesList = [] } = useProductionSeries();
  const { data: unitsList = [] } = useUnits();

  // Refetch latest component master data whenever page mounts
  React.useEffect(() => {
    refetch();
  }, [refetch]);

  // Filter state (Initial state BLANK / EMPTY)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);

  // Applied filters state
  const [appliedFilters, setAppliedFilters] = useState<{
    search: string;
    series: string[];
    types: string[];
    units: string[];
  }>({
    search: "",
    series: [],
    types: [],
    units: [],
  });

  // Pagination & sorting state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Column visibility menu state
  const [columnAnchorEl, setColumnAnchorEl] = useState<null | HTMLElement>(null);
  const [hiddenColumns, setHiddenColumns] = useState<Record<string, boolean>>({});

  const availableColumns = [
    { key: "srNo", label: "Sr. No." },
    { key: "drawingNo", label: "Drawing No." },
    { key: "lnItemCode", label: "LN Item Code" },
    { key: "nomenclature", label: "Nomenclature" },
    { key: "type", label: "Type" },
    { key: "unit", label: "Unit" },
    { key: "qtyAssy", label: "Qty/Assy" },
    { key: "updatedOn", label: "Updated On" },
  ];

  const hiddenCount = Object.values(hiddenColumns).filter(Boolean).length;

  const toggleColumnVisibility = (key: string) => {
    setHiddenColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
    setAppliedFilters({
      search: searchQuery,
      series: selectedSeries,
      types: selectedTypes,
      units: selectedUnits,
    });
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedSeries([]);
    setSelectedTypes([]);
    setSelectedUnits([]);
    setAppliedFilters({
      search: "",
      series: [],
      types: [],
      units: [],
    });
    setPage(0);
  };

  // Filter and search functionality
  const filteredDrawingNumbers = useMemo(() => {
    if (!Array.isArray(allDrawingNumbers)) return [];

    let result = allDrawingNumbers.filter((drawing) => {
      const searchLower = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !searchLower ||
        drawing?.drawingNumber?.toLowerCase().includes(searchLower) ||
        drawing?.nomenclature?.toLowerCase().includes(searchLower) ||
        drawing?.componentType?.toLowerCase().includes(searchLower) ||
        drawing?.componentCode?.toLowerCase().includes(searchLower) ||
        drawing?.availableFor?.toLowerCase().includes(searchLower) ||
        drawing?.lnItemCode?.toLowerCase().includes(searchLower);

      const matchesSeries =
        selectedSeries.length === 0 ||
        (drawing?.productionSeries &&
          selectedSeries.some(
            (s) => s.toLowerCase() === drawing.productionSeries?.toLowerCase()
          ));

      const matchesType =
        selectedTypes.length === 0 ||
        (drawing?.componentType &&
          selectedTypes.some(
            (t) => t.toLowerCase() === drawing.componentType?.toLowerCase()
          ));

      const matchesUnit =
        selectedUnits.length === 0 ||
        (drawing?.unitName &&
          selectedUnits.some(
            (u) => u.toLowerCase() === drawing.unitName?.toLowerCase()
          ));

      return matchesSearch && matchesSeries && matchesType && matchesUnit;
    });

    // Sorting by modifiedDate / createdDate
    result.sort((a, b) => {
      const dateA = new Date(a.modifiedDate || a.createdDate || 0).getTime();
      const dateB = new Date(b.modifiedDate || b.createdDate || 0).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [allDrawingNumbers, searchQuery, selectedSeries, selectedTypes, selectedUnits, sortOrder]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredDrawingNumbers.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredDrawingNumbers, page, rowsPerPage]);

  const handleExport = () => {
    if (filteredDrawingNumbers.length === 0) {
      setSnackbar({ open: true, message: "No components to export", severity: "error" });
      return;
    }
    const exportData = filteredDrawingNumbers.map((row, idx) => ({
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
    <Box sx={{ p: hideHeader ? 0 : { xs: 1, sm: 1.5, md: 2 }, backgroundColor: "background.default", minHeight: "100vh" }}>
      {!hideHeader && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1.5,
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "primary.main",
              fontSize: { xs: "1.1rem", sm: "1.25rem" },
            }}
          >
            Components
          </Typography>

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
        </Box>
      )}

      {/* Main Filter & Table Card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, md: 2 },
          borderRadius: "10px",
          border: "1px solid",
          borderColor: "grey.200",
          backgroundColor: "background.paper",
          mb: 2,
        }}
      >
        {/* Filter Bar */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            mb: 1.5,
            flexWrap: "wrap",
            alignItems: "center",
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
            placeholder="Search component, Drawing No., LN Item Code..."
            sx={{
              flexGrow: 1,
              minWidth: { xs: "100%", sm: 260, md: 320 },
              "& .MuiOutlinedInput-root": {
                height: 34,
                borderRadius: "6px",
                fontSize: "0.8rem",
                backgroundColor: "background.paper",
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "text.muted", fontSize: "1.1rem" }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Multi-Select Prod. Series Dropdown (No 'All' option) */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              multiple
              displayEmpty
              value={selectedSeries}
              onChange={(e) => {
                const val = typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value;
                setSelectedSeries(val);
                setPage(0);
              }}
              renderValue={(selected) => {
                if (selected.length === 0) {
                  return <Typography variant="body2" sx={{ color: "#667085", fontSize: "0.8rem" }}>Prod. Series</Typography>;
                }
                return <Typography variant="body2" sx={{ color: "#344054", fontWeight: 600, fontSize: "0.8rem" }}>{`Prod. Series (${selected.length})`}</Typography>;
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 260,
                    borderRadius: "8px",
                    "& .MuiMenuItem-root": {
                      minHeight: "28px !important",
                      py: "2px !important",
                      px: "6px !important",
                    },
                  },
                },
              }}
              sx={{ height: 34, borderRadius: "6px", fontSize: "0.8rem" }}
            >
              {seriesList.map((s) => (
                <MenuItem key={s.id} value={s.productionSeries}>
                  <Checkbox size="small" checked={selectedSeries.indexOf(s.productionSeries) > -1} sx={{ p: "2px", mr: 0.75 }} />
                  <ListItemText primary={s.productionSeries} sx={{ m: 0 }} primaryTypographyProps={{ fontSize: "0.8rem" }} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Multi-Select Type Dropdown (No 'All' option) */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              multiple
              displayEmpty
              value={selectedTypes}
              onChange={(e) => {
                const val = typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value;
                setSelectedTypes(val);
                setPage(0);
              }}
              renderValue={(selected) => {
                if (selected.length === 0) {
                  return <Typography variant="body2" sx={{ color: "#667085", fontSize: "0.8rem" }}>Type</Typography>;
                }
                return <Typography variant="body2" sx={{ color: "#344054", fontWeight: 600, fontSize: "0.8rem" }}>{`Type (${selected.length})`}</Typography>;
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 260,
                    borderRadius: "8px",
                    "& .MuiMenuItem-root": {
                      minHeight: "28px !important",
                      py: "2px !important",
                      px: "6px !important",
                    },
                  },
                },
              }}
              sx={{ height: 34, borderRadius: "6px", fontSize: "0.8rem" }}
            >
              {ComponentTypesList.map((t) => (
                <MenuItem key={t} value={t}>
                  <Checkbox size="small" checked={selectedTypes.indexOf(t) > -1} sx={{ p: "2px", mr: 0.75 }} />
                  <ListItemText primary={t} sx={{ m: 0 }} primaryTypographyProps={{ fontSize: "0.8rem" }} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Multi-Select Unit Dropdown (No 'All' option) */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              multiple
              displayEmpty
              value={selectedUnits}
              onChange={(e) => {
                const val = typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value;
                setSelectedUnits(val);
                setPage(0);
              }}
              renderValue={(selected) => {
                if (selected.length === 0) {
                  return <Typography variant="body2" sx={{ color: "#667085", fontSize: "0.8rem" }}>Unit</Typography>;
                }
                return <Typography variant="body2" sx={{ color: "#344054", fontWeight: 600, fontSize: "0.8rem" }}>{`Unit (${selected.length})`}</Typography>;
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 260,
                    borderRadius: "8px",
                    "& .MuiMenuItem-root": {
                      minHeight: "28px !important",
                      py: "2px !important",
                      px: "6px !important",
                    },
                  },
                },
              }}
              sx={{ height: 34, borderRadius: "6px", fontSize: "0.8rem" }}
            >
              {unitsList.map((u) => (
                <MenuItem key={u.id} value={u.unitName}>
                  <Checkbox size="small" checked={selectedUnits.indexOf(u.unitName) > -1} sx={{ p: "2px", mr: 0.75 }} />
                  <ListItemText primary={u.unitName} sx={{ m: 0 }} primaryTypographyProps={{ fontSize: "0.8rem" }} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Clear Button */}
          <Button
            variant="text"
            size="small"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
            sx={{
              height: 34,
              minWidth: 55,
              color: "#667085",
              fontWeight: 600,
              fontSize: "0.8rem",
              textTransform: "none",
              "&:hover": { color: "#101828", backgroundColor: "transparent" },
            }}
          >
            Clear
          </Button>
        </Box>

        {/* Active Filter Chips & Counter Bar */}
        {hasActiveFilters && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1.5,
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
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
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography variant="caption" sx={{ color: "#667085", fontWeight: 600 }}>
                {filteredDrawingNumbers.length.toLocaleString()} results
              </Typography>

              <Button
                size="small"
                startIcon={<ViewColumnIcon fontSize="small" />}
                onClick={(e) => setColumnAnchorEl(e.currentTarget)}
                sx={{ color: "#344054", textTransform: "none", fontWeight: 500, fontSize: "0.75rem", p: 0.5 }}
              >
                Columns {hiddenCount > 0 ? `· ${hiddenCount} hidden` : ""}
              </Button>

              <Menu
                anchorEl={columnAnchorEl}
                open={Boolean(columnAnchorEl)}
                onClose={() => setColumnAnchorEl(null)}
                transitionDuration={0}
                PaperProps={{ sx: { p: 0.75, minWidth: 160 } }}
              >
                <Typography variant="caption" sx={{ px: 1, py: 0.25, fontWeight: 700, color: "#667085" }}>
                  Toggle Columns
                </Typography>
                {availableColumns.map((col) => (
                  <MenuItem
                    key={col.key}
                    onClick={() => toggleColumnVisibility(col.key)}
                    sx={{ py: 0.25, px: 1 }}
                  >
                    <Checkbox size="small" checked={!hiddenColumns[col.key]} />
                    <ListItemText primary={col.label} primaryTypographyProps={{ fontSize: "0.8rem" }} />
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </Box>
        )}

        {/* Counter and Columns button when NO filters are active */}
        {!appliedFilters.search && appliedFilters.series.length === 0 && appliedFilters.types.length === 0 && appliedFilters.units.length === 0 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              mb: 1.5,
              gap: 1.5,
            }}
          >
            <Typography variant="caption" sx={{ color: "#667085", fontWeight: 600 }}>
              {filteredDrawingNumbers.length.toLocaleString()} results
            </Typography>

            <Button
              size="small"
              startIcon={<ViewColumnIcon fontSize="small" />}
              onClick={(e) => setColumnAnchorEl(e.currentTarget)}
              sx={{ color: "#344054", textTransform: "none", fontWeight: 500, fontSize: "0.75rem", p: 0.5 }}
            >
              Columns {hiddenCount > 0 ? `· ${hiddenCount} hidden` : ""}
            </Button>

            <Menu
              anchorEl={columnAnchorEl}
              open={Boolean(columnAnchorEl)}
              onClose={() => setColumnAnchorEl(null)}
              transitionDuration={0}
              PaperProps={{ sx: { p: 0.75, minWidth: 160 } }}
            >
              <Typography variant="caption" sx={{ px: 1, py: 0.25, fontWeight: 700, color: "#667085" }}>
                Toggle Columns
              </Typography>
              {availableColumns.map((col) => (
                <MenuItem
                  key={col.key}
                  onClick={() => toggleColumnVisibility(col.key)}
                  sx={{ py: 0.25, px: 1 }}
                >
                  <Checkbox size="small" checked={!hiddenColumns[col.key]} />
                  <ListItemText primary={col.label} primaryTypographyProps={{ fontSize: "0.8rem" }} />
                </MenuItem>
              ))}
            </Menu>
          </Box>
        )}

        {/* Table */}
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress color="primary" size={32} />
          </Box>
        ) : (
          <TableContainer
            sx={{
              borderRadius: "6px",
              border: "1px solid #EAECF0",
              overflowX: "auto",
            }}
          >
            <Table stickyHeader size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  {!hiddenColumns["srNo"] && <TableCell sx={{ width: "45px", textAlign: "center" }}>Sr. No.</TableCell>}
                  {!hiddenColumns["drawingNo"] && <TableCell>Drawing No.</TableCell>}
                  {!hiddenColumns["lnItemCode"] && <TableCell>LN Item Code</TableCell>}
                  {!hiddenColumns["nomenclature"] && <TableCell>Nomenclature</TableCell>}
                  {!hiddenColumns["type"] && <TableCell sx={{ textAlign: "center" }}>Type</TableCell>}
                  {!hiddenColumns["unit"] && <TableCell sx={{ textAlign: "center" }}>Unit</TableCell>}
                  {!hiddenColumns["qtyAssy"] && <TableCell sx={{ textAlign: "center" }}>Qty/Assy</TableCell>}
                  {!hiddenColumns["updatedOn"] && (
                    <TableCell sx={{ textAlign: "center" }}>
                      <Box
                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                        sx={{ display: "inline-flex", alignItems: "center", gap: 0.25, cursor: "pointer", userSelect: "none" }}
                      >
                        Updated On {sortOrder === "asc" ? <ArrowUpwardIcon sx={{ fontSize: "0.75rem" }} /> : <ArrowDownwardIcon sx={{ fontSize: "0.75rem" }} />}
                      </Box>
                    </TableCell>
                  )}
                  <TableCell sx={{ textAlign: "center", width: "60px" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ textAlign: "center", py: 4 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                        {appliedFilters.search || appliedFilters.series.length > 0 || appliedFilters.types.length > 0 || appliedFilters.units.length > 0
                          ? "No components match your filter criteria"
                          : "No components found"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((drawing, index) => (
                    <DrawingNumberRowComponent
                      key={drawing.id}
                      drawingData={drawing}
                      index={page * rowsPerPage + index}
                      onDelete={handleDeleteClick}
                      hiddenColumns={hiddenColumns}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Footer Pagination */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pt: 1.5,
            px: 0.5,
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="caption" sx={{ color: "#475467", fontWeight: 500 }}>
              Rows per page
            </Typography>
            <Select
              size="small"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(0);
              }}
              sx={{ height: 28, borderRadius: "4px", fontSize: "0.75rem" }}
            >
              <MenuItem value={10} sx={{ fontSize: "0.75rem" }}>10</MenuItem>
              <MenuItem value={20} sx={{ fontSize: "0.75rem" }}>20</MenuItem>
              <MenuItem value={50} sx={{ fontSize: "0.75rem" }}>50</MenuItem>
              <MenuItem value={100} sx={{ fontSize: "0.75rem" }}>100</MenuItem>
            </Select>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="caption" sx={{ color: "#475467", fontWeight: 500 }}>
              {filteredDrawingNumbers.length === 0
                ? "0 of 0"
                : `${page * rowsPerPage + 1}–${Math.min((page + 1) * rowsPerPage, filteredDrawingNumbers.length)} of ${filteredDrawingNumbers.length.toLocaleString()}`}
            </Typography>

            <Box sx={{ display: "flex", gap: 0.25 }}>
              <IconButton
                size="small"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                sx={{ border: "1px solid #D0D5DD", borderRadius: "4px", p: 0.25 }}
              >
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                disabled={(page + 1) * rowsPerPage >= filteredDrawingNumbers.length}
                onClick={() => setPage(page + 1)}
                sx={{ border: "1px solid #D0D5DD", borderRadius: "4px", p: 0.25 }}
              >
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>
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
