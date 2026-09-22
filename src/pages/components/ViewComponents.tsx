import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
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
  Chip,
  Menu,
  ListItemText,
  ListItemIcon,
  Stack,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useFetchAllDrawingNumbers, useProductionSeries, useUnits } from "../../hooks/useMasterData";
import { useHasPermission } from "../../hooks/useHasPermission";
import { useDebounce } from "../../hooks/useDebounce";
import api from "../../services/api";
import { MultiSelectFilter } from "../../components/MultiSelectFilter";
import { CustomPagination } from "../../components/CustomPagination";
import { EmptyState } from "../../components/EmptyState";
import { ComponentTypeChip } from "../../components/ComponentTypeChip";
import { SortableTableHeader } from "../../components/SortableTableHeader";

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

  // Edit Row — close menu first, then navigate on next tick so MUI Menu
  // close animation completes before the component unmounts (prevents menu
  // briefly staying visible during the route transition).
  const handleEdit = () => {
    setMenuAnchorEl(null);
    setTimeout(() => {
      navigate(`/adminmaster/updatecomponents/${drawingData.id}`, {
        state: { editRow: drawingData, fromView: true },
      });
    }, 0);
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
          height: 28,
          "& > *": { borderBottom: "1px solid", borderColor: "grey.100", py: 0.15, px: 0.75 },
          "&:hover": { backgroundColor: "grey.50" },
        }}
      >
        <TableCell sx={{ textAlign: "center", minWidth: 55, color: "text.muted", fontSize: "0.8rem" }}>
          {index + 1}
        </TableCell>
        <TableCell sx={{ color: "text.primary", fontSize: "0.8rem", fontWeight: 600, minWidth: 160, whiteSpace: "nowrap" }}>
          {drawingData?.drawingNumber || "N/A"}
        </TableCell>
        <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem", minWidth: 150, whiteSpace: "nowrap" }}>
          {drawingData?.lnItemCode || "N/A"}
        </TableCell>
        <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem", minWidth: 220, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {drawingData?.nomenclature || "N/A"}
        </TableCell>
        <TableCell sx={{ textAlign: "center", minWidth: 95 }}>
          <ComponentTypeChip type={drawingData?.componentType} />
        </TableCell>
        <TableCell sx={{ textAlign: "center", color: "text.secondary", fontSize: "0.8rem", minWidth: 100, whiteSpace: "nowrap" }}>
          {drawingData?.unitName || "N/A"}
        </TableCell>
        <TableCell sx={{ textAlign: "center", color: "text.secondary", fontSize: "0.8rem", minWidth: 110, whiteSpace: "nowrap" }}>
          {drawingData?.productionSeries || drawingData?.availableFor || "N/A"}
        </TableCell>

        <TableCell sx={{ textAlign: "center", minWidth: 65 }}>
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
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={openDetails} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1, p: 1.5, backgroundColor: "grey.50", borderRadius: "6px", border: "1px solid", borderColor: "grey.200" }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 0.75,
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main" }}>
                  Additional Details
                </Typography>
                <IconButton
                  size="small"
                  onClick={handleToggleDetails}
                  title="Close Additional Details"
                  sx={{
                    p: 0.25,
                    color: "#667085",
                    "&:hover": { color: "#101828", backgroundColor: "grey.200" },
                  }}
                >
                  <KeyboardArrowUpIcon fontSize="small" />
                </IconButton>
              </Box>
              <Table size="small" sx={{ width: "100%" }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "grey.100" }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 0.5 }}>Assembly Number</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 0.5 }}>Component Code</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 0.5 }}>Rack Location</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 0.5 }}>Has Expiry</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 0.5 }}>Created Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 0.5 }}>Updated On</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontSize: "0.75rem", py: 0.5 }}>{drawingData?.parentDrawingNumbers?.join(", ") || drawingData?.assemblyNumber || "N/A"}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", py: 0.5 }}>{drawingData?.componentCode || "N/A"}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", py: 0.5 }}>{drawingData?.location || "N/A"}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", py: 0.5 }}>{drawingData?.isExpiry ? "Yes" : "No"}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", py: 0.5 }}>{formatDate(drawingData?.createdDate)}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", py: 0.5 }}>{formatDate(drawingData?.modifiedDate || drawingData?.createdDate)}</TableCell>
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
  const hasAddComponentAccess = useHasPermission("Components");

  // ─── Persist filter state across navigation ───────────────────────────────
  // Key scoped to this page so other pages are not affected.
  const FILTER_STORAGE_KEY = "viewComponents_filters";

  // Initialise state from sessionStorage if available so filters survive
  // navigating to the edit page and coming back.
  const getInitialFilters = () => {
    try {
      const saved = sessionStorage.getItem(FILTER_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    return null;
  };

  const savedFilters = useRef(getInitialFilters());

  // Filter state – restored from sessionStorage on first render
  const [searchQuery, setSearchQuery] = useState(savedFilters.current?.searchQuery ?? "");
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  const [selectedSeries, setSelectedSeries] = useState<string[]>(savedFilters.current?.selectedSeries ?? []);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(savedFilters.current?.selectedTypes ?? []);
  const [selectedUnits, setSelectedUnits] = useState<string[]>(savedFilters.current?.selectedUnits ?? []);

  // Pagination & sorting state – also restored
  const [page, setPage] = useState(savedFilters.current?.page ?? 0);
  const [rowsPerPage, setRowsPerPage] = useState(savedFilters.current?.rowsPerPage ?? 10);
  const [sortColumn, setSortColumn] = useState<string>(savedFilters.current?.sortColumn ?? "modifiedDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(savedFilters.current?.sortOrder ?? "desc");

  // Persist to sessionStorage whenever any filter changes
  useEffect(() => {
    try {
      sessionStorage.setItem(
        FILTER_STORAGE_KEY,
        JSON.stringify({ searchQuery, selectedSeries, selectedTypes, selectedUnits, page, rowsPerPage, sortColumn, sortOrder })
      );
    } catch {
      /* ignore */
    }
  }, [searchQuery, selectedSeries, selectedTypes, selectedUnits, page, rowsPerPage, sortColumn, sortOrder]);
  // ──────────────────────────────────────────────────────────────────────────

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(columnKey);
      setSortOrder("asc");
    }
  };

  // Reset page when search query or filter states change (skip initial mount to preserve restored page)
  const isFirstRender = useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPage(0);
  }, [debouncedSearchQuery, selectedSeries, selectedTypes, selectedUnits]);

  // Pass debouncedSearchQuery, pageNumber (page + 1), pageSize (rowsPerPage), componentType, prodSeries, and unit filters directly to FetchAllDrawingNumbers API
  // Memoize to keep queryKey stable and avoid unnecessary re-fetches
  const componentTypeFilter = useMemo(
    () => (selectedTypes.length > 0 ? selectedTypes.join(",") : ""),
    [selectedTypes]
  );
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
    selectedSeries,
    selectedUnits
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

  // NOTE: No manual refetch on mount — React Query automatically re-fetches
  // when the cache is stale (staleTime: 5 min). Calling refetch() here would
  // bypass the cache and fire a network request on every navigation back.

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
    setPage(0);
    refetch();
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedSeries([]);
    setSelectedTypes([]);
    setSelectedUnits([]);
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

    // Sorting functionality
    result.sort((a: any, b: any) => {
      let aVal: any = "";
      let bVal: any = "";
      if (sortColumn === "modifiedDate") {
        aVal = new Date(a.modifiedDate || a.createdDate || 0).getTime();
        bVal = new Date(b.modifiedDate || b.createdDate || 0).getTime();
      } else {
        aVal = a[sortColumn] ?? "";
        bVal = b[sortColumn] ?? "";
        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();
      }
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    const isServerPaginated = serverTotalRecords !== undefined || (rawList.length <= rowsPerPage && rawList.length > 0);
    const finalDisplayData = isServerPaginated ? result : result.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
    const finalTotalCount = serverTotalRecords !== undefined ? serverTotalRecords : result.length;

    return { displayData: finalDisplayData, totalCount: finalTotalCount };
  }, [drawingNumbersData, sortColumn, sortOrder, page, rowsPerPage]);


  React.useEffect(() => {
    if (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : "Failed to fetch components",
        severity: "error",
      });
    }
  }, [error]);

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
            {/* <Button
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
            </Button> */}

            <Tooltip
              title={!hasAddComponentAccess ? "You do not have access to add component page" : ""}
              arrow
            >
              <span>
                <Button
                  variant="contained"
                  size="small"
                  disabled={!hasAddComponentAccess}
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
                    "&.Mui-disabled": {
                      backgroundColor: "#EAECF0",
                      color: "#98A2B3",
                    },
                  }}
                >
                  Add Component
                </Button>
              </span>
            </Tooltip>
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
                color: "#FFFFFF",
                fontWeight: 600,
                fontSize: "0.82rem",
                borderRadius: "6px",
                px: 2,
                height: 38,
                textTransform: "none",
                boxShadow: "none",
                minWidth: 65,
                "&:hover": { backgroundColor: "primary.dark", boxShadow: "none" },
                "&.Mui-disabled": {
                  backgroundColor: "#EAECF0",
                  color: "#98A2B3",
                },
              }}
            >
              Apply
            </Button>

            {/* Clear Button */}
            <Button
              size="small"
              variant="outlined"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              sx={{
                flex: "0 0 auto",
                borderColor: "#D0D5DD",
                backgroundColor: "#ffffff",
                color: "#667085",
                fontWeight: 600,
                fontSize: "0.82rem",
                height: 38,
                px: 1.5,
                minWidth: 55,
                borderRadius: "6px",
                textTransform: "none",
                boxShadow: "none",
                "&:hover": {
                  borderColor: "#98A2B3",
                  backgroundColor: "#F9FAFB",
                  color: "#101828",
                },
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
                      onDelete={() => {
                        setSelectedSeries((prev) => prev.filter((x) => x !== s));
                        setPage(0);
                      }}
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
                      onDelete={() => {
                        setSelectedTypes((prev) => prev.filter((x) => x !== t));
                        setPage(0);
                      }}
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
                      onDelete={() => {
                        setSelectedUnits((prev) => prev.filter((x) => x !== u));
                        setPage(0);
                      }}
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
                      color: "#6D2A8F",
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
        <TableContainer
          sx={{
            overflowX: "auto",
            minHeight: 350,
            maxHeight: "calc(100vh - 290px)",
          }}
        >
          <Table stickyHeader size="small" sx={{ width: "100%", minWidth: 1100 }}>
            <TableHead>
              <TableRow sx={{ height: 36 }}>
                <SortableTableHeader label="Sr.No" columnKey="srNo" align="center" minWidth={55} isSortable={false} />
                <SortableTableHeader label="Drawing No." columnKey="drawingNumber" sortColumn={sortColumn} sortDirection={sortOrder} onSort={handleSort} minWidth={160} />
                <SortableTableHeader label="LN Item Code" columnKey="lnItemCode" sortColumn={sortColumn} sortDirection={sortOrder} onSort={handleSort} minWidth={150} />
                <SortableTableHeader label="Nomenclature" columnKey="nomenclature" sortColumn={sortColumn} sortDirection={sortOrder} onSort={handleSort} minWidth={220} />
                <SortableTableHeader label="Type" columnKey="componentType" sortColumn={sortColumn} sortDirection={sortOrder} onSort={handleSort} align="center" minWidth={95} />
                <SortableTableHeader label="Unit" columnKey="unitName" sortColumn={sortColumn} sortDirection={sortOrder} onSort={handleSort} align="center" minWidth={100} />
                <SortableTableHeader label="Prod. Series" columnKey="productionSeries" sortColumn={sortColumn} sortDirection={sortOrder} onSort={handleSort} align="center" minWidth={110} />
                <SortableTableHeader label="Actions" columnKey="actions" align="center" minWidth={65} isSortable={false} />
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ height: 280, borderBottom: "none" }}>
                    <CircularProgress size={32} color="primary" />
                    <Typography variant="body2" sx={{ color: "#667085", mt: 1 }}>
                      Loading components...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : displayData.length === 0 ? (
                <EmptyState colSpan={8} />
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
