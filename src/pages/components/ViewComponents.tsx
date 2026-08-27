import React, { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  TablePagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import ClearIcon from "@mui/icons-material/Clear";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAllDrawingNumbers } from "../../hooks/useMasterData";
import api from "../../services/api";

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
}

const DrawingNumberRowComponent = ({
  drawingData,
  onDelete,
}: {
  drawingData: DrawingNumberRow;
  onDelete: (drawing: DrawingNumberRow) => void;
}) => {
  const [open, setOpen] = useState(false);
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
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "N/A";
    }
  };
  // Edit Row
  const handleEdit = (row: DrawingNumberRow) => {
    navigate(`/adminmaster/updatecomponents/${row.id}`, {
      state: { editRow: row, fromView: true },
    });
  };

  return (
    <>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell sx={{ textAlign: "center", width: "60px" }}>
          {drawingData?.id || "N/A"}
        </TableCell>
        <TableCell
          sx={{ textAlign: "center", width: "140px", wordBreak: "break-word" }}
        >
          {drawingData?.lnItemCode || "N/A"}
        </TableCell>
        <TableCell
          sx={{ textAlign: "center", width: "180px", wordBreak: "break-word" }}
        >
          {drawingData?.drawingNumber || "N/A"}
        </TableCell>
        <TableCell
          sx={{ textAlign: "center", width: "200px", wordBreak: "break-word" }}
        >
          {drawingData?.nomenclature || "N/A"}
        </TableCell>
        <TableCell sx={{ textAlign: "center", width: "120px" }}>
          {drawingData?.componentType || "N/A"}
        </TableCell>
        <TableCell sx={{ textAlign: "center", width: "120px" }}>
          {drawingData?.componentCode || "N/A"}
        </TableCell>
        <TableCell sx={{ textAlign: "center", width: "140px" }}>
          {drawingData?.availableFor || "N/A"}
        </TableCell>

        <TableCell sx={{ textAlign: "center", width: "100px" }}>
          <IconButton color="primary" onClick={() => handleEdit(drawingData)}>
            <EditIcon />
          </IconButton>

          <IconButton color="error" onClick={() => onDelete(drawingData)}>
            <DeleteIcon />
          </IconButton>

          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow sx={{ height: 'auto' }}>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1, overflow: "hidden" }}>
              <Typography variant="h6" gutterBottom component="div">
                Additional Details
              </Typography>
              <Table size="small" sx={{ width: "100%" }}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        textAlign: "center",
                        width: "12%",
                      }}
                    >
                      Assembly Number
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        textAlign: "center",
                        width: "12%",
                      }}
                    >
                      Location
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        textAlign: "center",
                        width: "10%",
                      }}
                    >
                      Has Expiry
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        textAlign: "center",
                        width: "10%",
                      }}
                    >
                      Unit Name
                    </TableCell>
                    {/* <TableCell
                      sx={{
                        fontWeight: "bold",
                        textAlign: "center",
                        width: "10%",
                      }}
                    >
                      Status
                    </TableCell> */}
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        textAlign: "center",
                        width: "17%",
                      }}
                    >
                      Created Date
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        textAlign: "center",
                        width: "17%",
                      }}
                    >
                      Modified Date
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell
                      sx={{
                        textAlign: "center",
                        wordBreak: "break-word",
                        width: "12%",
                      }}
                    >
                      {drawingData?.parentDrawingNumbers?.join(", ") || "N/A"}
                    </TableCell>
                    <TableCell
                      sx={{
                        textAlign: "center",
                        wordBreak: "break-word",
                        width: "12%",
                      }}
                    >
                      {drawingData?.location || "N/A"}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center", width: "10%" }}>
                      {drawingData?.isExpiry ? "Yes" : "No"}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center", width: "10%" }}>
                      {drawingData?.unitName || "N/A"}
                    </TableCell>
                    {/* <TableCell sx={{ textAlign: "center", width: "10%" }}>
                      {drawingData?.isActive ? "Active" : "Inactive"}
                    </TableCell> */}
                    <TableCell
                      sx={{
                        textAlign: "center",
                        fontSize: "0.875rem",
                        width: "17%",
                      }}
                    >
                      {formatDate(drawingData?.createdDate)}
                    </TableCell>
                    <TableCell
                      sx={{
                        textAlign: "center",
                        fontSize: "0.875rem",
                        width: "17%",
                      }}
                    >
                      {formatDate(drawingData?.modifiedDate)}
                    </TableCell>
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

const Components: React.FC<{ hideHeader?: boolean }> = ({ hideHeader = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  // Get data from hook
  const {
    data: allDrawingNumbers = [],
    isLoading,
    error,
    refetch,
  } = useAllDrawingNumbers();

  // Refetch latest component master data whenever page mounts
  React.useEffect(() => {
    refetch();
  }, [refetch]);

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

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

  // Filter and search functionality
  const filteredDrawingNumbers = useMemo(() => {
    if (!Array.isArray(allDrawingNumbers)) return [];

    return allDrawingNumbers.filter((drawing) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        drawing?.drawingNumber?.toLowerCase().includes(searchLower) ||
        drawing?.nomenclature?.toLowerCase().includes(searchLower) ||
        drawing?.componentType?.toLowerCase().includes(searchLower) ||
        drawing?.componentCode?.toLowerCase().includes(searchLower) ||
        drawing?.availableFor?.toLowerCase().includes(searchLower) ||
        drawing?.lnItemCode?.toLowerCase().includes(searchLower)
      );
    });
  }, [allDrawingNumbers, searchQuery]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredDrawingNumbers.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredDrawingNumbers, page, rowsPerPage]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setPage(0);
    setSnackbar({
      open: true,
      message: "Search cleared successfully",
      severity: "success",
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading drawing numbers:{" "}
          {error instanceof Error ? error.message : "An error occurred"}
        </Alert>
        <Button
          variant="contained"
          onClick={() => refetch()}
          startIcon={<ClearIcon />}
        >
          Retry
        </Button>
      </Box>
    );
  }

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
            View Component Details
          </Typography>

          <Tabs
            value={location.pathname.includes("assembly") ? "assembly" : "components"}
            onChange={(_, newValue) => {
              if (newValue === "components") {
                navigate("/components/view");
              } else {
                navigate("/components/assembly");
              }
            }}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              "& .MuiTab-root": {
                fontWeight: 600,
                fontSize: "0.875rem",
                textTransform: "none",
                minWidth: 100,
              },
              "& .MuiTab-root.Mui-selected": { color: "primary.main" },
              "& .MuiTabs-indicator": {
                backgroundColor: "primary.main",
                height: 3,
                borderRadius: "3px 3px 0 0",
              },
            }}
          >
            <Tab label="View Component" value="components" />
            <Tab label="View Assembly" value="assembly" />
          </Tabs>
        </Box>
      )}

      <Paper sx={{ p: 3, mb: 3, width: "100%", overflow: "hidden" }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 3,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <TextField
            label="Search Drawing Numbers"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{
              minWidth: 450,
              maxWidth: 400,
              flexGrow: 1,
              "& .MuiOutlinedInput-root": {
                height: 50,
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            placeholder="Search by drawing number, nomenclature, component type..."
          />

          <Button
            variant="outlined"
            onClick={handleClearSearch}
            startIcon={<ClearIcon />}
            disabled={!searchQuery}
            size="small"
            sx={{
              height: 50,
            }}
          >
            Clear Search
          </Button>
        </Box>

        <Box
          sx={{
            mb: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="body1" color="text.secondary">
            Total Records: {filteredDrawingNumbers.length} | Showing:{" "}
            {Math.min(page * rowsPerPage + 1, filteredDrawingNumbers.length)}-
            {Math.min((page + 1) * rowsPerPage, filteredDrawingNumbers.length)}
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/adminmaster/updatecomponents", { state: { fromView: true } })}
            startIcon={<AddIcon />}
            size="small"
            sx={{
              height: 40,
              backgroundColor: "#A8005A",
              "&:hover": {
                backgroundColor: "#800044",
              },
            }}
          >
            Add Component
          </Button>
        </Box>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer
              component={Paper}
              sx={{
                overflowX: "auto",
                width: "100%",
              }}
            >
              <Table stickyHeader sx={{ width: "100%" }}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        textAlign: "center",
                        backgroundColor: "#f5f5f5",
                        width: "60px",
                      }}
                    >
                      ID
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        textAlign: "center",
                        backgroundColor: "#f5f5f5",
                        width: "140px",
                      }}
                    >
                      LN Item Code
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        textAlign: "center",
                        backgroundColor: "#f5f5f5",
                        width: "180px",
                      }}
                    >
                      Drawing Number
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        textAlign: "center",
                        backgroundColor: "#f5f5f5",
                        width: "200px",
                      }}
                    >
                      Nomenclature
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        textAlign: "center",
                        backgroundColor: "#f5f5f5",
                        width: "120px",
                      }}
                    >
                      Component Type
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        textAlign: "center",
                        backgroundColor: "#f5f5f5",
                        width: "120px",
                      }}
                    >
                      Component Code
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        textAlign: "center",
                        backgroundColor: "#f5f5f5",
                        width: "140px",
                      }}
                    >
                      Available For
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        textAlign: "center",
                        backgroundColor: "#f5f5f5",
                        width: "100px",
                      }}
                    >
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ textAlign: "center", p: 3 }}>
                        <Typography variant="body1" color="text.secondary">
                          {searchQuery
                            ? "No drawing numbers match your search criteria"
                            : "No drawing numbers found"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((drawing) => (
                      <DrawingNumberRowComponent
                        key={drawing.id}
                        drawingData={drawing}
                        onDelete={handleDeleteClick}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredDrawingNumbers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{ mt: 2 }}
            />
          </>
        )}
      </Paper>

      <Dialog
        open={openDeleteDialog}
        onClose={() => !isDeleting && setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete component with drawing number{" "}
            <strong>{deletingDrawing?.drawingNumber || "N/A"}</strong> and LN item code{" "}
            <strong>{deletingDrawing?.lnItemCode || "N/A"}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'error' ? null : 6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Components;
