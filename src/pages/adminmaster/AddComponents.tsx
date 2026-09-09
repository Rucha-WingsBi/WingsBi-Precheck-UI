import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  Snackbar,
  Paper,
  ClickAwayListener,
  Popper,
  InputAdornment,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Check as CheckIcon, Close as CloseIcon, Search as SearchIcon, MoreVert as MoreVertIcon } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUsers,
  useUnits,
  useAddUnit,
  useUpdateUnit,
  useDeleteUnit,
  useAllStages,
  useAddStage,
  useUpdateStage,
  useDeleteStage,
  useShapes,
  useAddShape,
  useUpdateShape,
  useDeleteShape,
  useProductionSeries,
  useAddProductionSeries,
  useUpdateProductionSeries,
  useDeleteProductionSeries,
  useUsersWithSignatures,
} from "../../hooks/useMasterData";
import api from "../../services/api";

interface UnitRow {
  id: number;
  unitName: string;
  createdDate?: string | null;
  modifiedDate?: string | null;
  createdBy?: number | null;
  modifiedBy?: number | null;
  isActive?: number | boolean | null;
}

interface StageRow {
  id: number;
  stageName: string;
  stageType: string;
  createdDate?: string | null;
  modifiedDate?: string | null;
  createdBy?: number | null;
  modifiedBy?: number | null;
  isActive?: number | boolean | null;
}

interface ShapeRow {
  id: number;
  shapeName: string;
  materialName?: string;
  createdDate?: string | null;
  modifiedDate?: string | null;
  createdBy?: number | null;
  modifiedBy?: number | null;
  isActive?: number | boolean | null;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <Box role="tabpanel" hidden={value !== index}>
      {value === index && <Box>{children}</Box>}
    </Box>
  );
}

interface TabHandle {
  openAdd: () => void;
}

function RowActionMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton size="small" onClick={handleClick} sx={{ color: "text.secondary" }}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem
          onClick={() => {
            handleClose();
            onEdit();
          }}
          sx={{ fontSize: "0.875rem", fontWeight: 500 }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleClose();
            onDelete();
          }}
          sx={{ fontSize: "0.875rem", fontWeight: 500, color: "error.main" }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1, color: "error.main" }} />
          Delete
        </MenuItem>
      </Menu>
    </>
  );
}

interface GenericTableProps<T extends { id: number }> {
  rows: T[];
  columns: GridColDef[];
  loading?: boolean;
}

function GenericTable<T extends { id: number }>({
  rows,
  columns,
  loading,
}: GenericTableProps<T>) {
  return (
    <Box sx={{ width: "100%" }}>
      <DataGrid
        autoHeight
        rows={rows}
        columns={columns}
        loading={loading}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
          sorting: {
            sortModel: [{ field: "srNo", sort: "asc" }],
          },
        }}
        pageSizeOptions={[10, 20, 50]}
        disableRowSelectionOnClick
        disableColumnMenu
        disableColumnFilter
        disableColumnSelector
        sx={{
          border: "none",
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#F9FAFB",
            borderBottom: "1px solid #EAECF0",
            color: "#475467",
            fontWeight: 700,
            fontSize: "0.8rem",
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 700,
            fontSize: "0.8rem",
            color: "#475467",
          },
          "& .MuiDataGrid-cell": {
            fontSize: "0.85rem",
            color: "#344054",
            borderBottom: "1px solid #F2F4F7",
          },
          "& .MuiDataGrid-row": {
            "&:hover": { backgroundColor: "#F9FAFB" },
            transition: "background-color 0.2s ease",
          },
          "& .MuiDataGrid-cell:focus": { outline: "none" },
          "& .MuiDataGrid-cell:focus-within": { outline: "none" },
          "& .MuiDataGrid-columnHeader:focus": { outline: "none" },
          "& .MuiDataGrid-columnHeader:focus-within": { outline: "none" },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "1px solid #EAECF0",
          },
        }}
      />
    </Box>
  );
}

interface AddEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string }) => void;
  title: string;
  nameLabel: string;
  initialName?: string;
  saving?: boolean;
  extraFields?: React.ReactNode;
  error?: string | null;
}

function AddEditDialog({
  open,
  onClose,
  onSave,
  title,
  nameLabel,
  initialName = "",
  saving,
  extraFields,
  error,
}: AddEditDialogProps) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (open) setName(initialName);
  }, [open, initialName]);

  const handleSave = () => {
    onSave({ name });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            label={nameLabel}
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {extraFields}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={handleSave}
          disabled={!name.trim() || saving}
          startIcon={saving ? <CircularProgress size={14} /> : undefined}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

//unit tab
const UnitTab = forwardRef<
  TabHandle,
  { createdBy: number; showSnackbar: (msg: string, severity?: "success" | "error") => void }
>(function UnitTab({ createdBy, showSnackbar }, ref) {
  const { data: units = [], isLoading: loading, error: fetchError } = useUnits();
  const addMutation = useAddUnit();
  const updateMutation = useUpdateUnit();
  const deleteMutation = useDeleteUnit();

  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UnitRow | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const handleOpen = (row?: UnitRow) => {
    setError(null);
    setEditing(row ?? null);
    setDialogOpen(true);
  };

  useImperativeHandle(ref, () => ({
    openAdd: () => handleOpen(),
  }));

  const rows = units.filter((item: any) => item.isActive === 1 || item.isActive === true);

  const handleAddUnit = async (unitName: string) => {
    setError(null);
    try {
      await addMutation.mutateAsync({
        unitName,
        createdBy,
      });
      showSnackbar("Unit added successfully");
      setDialogOpen(false);
      setEditing(null);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to add unit.");
    }
  };

  const handleUpdateUnit = async (id: number, unitName: string) => {
    setError(null);
    try {
      await updateMutation.mutateAsync({
        id,
        unitName,
        modifiedBy: createdBy,
      });
      showSnackbar("Unit updated successfully");
      setDialogOpen(false);
      setEditing(null);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to update unit.");
    }
  };

  const handleDeleteUnit = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      showSnackbar("Unit deleted successfully");
      setDeleteConfirmId(null);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message ?? err?.message ?? "Failed to delete unit.";
      showSnackbar(errMsg, "error");
    }
  };

  const handleSave = ({ name }: { name: string }) => {
    if (editing) {
      handleUpdateUnit(editing.id, name);
    } else {
      handleAddUnit(name);
    }
  };

  const saving = addMutation.isPending || updateMutation.isPending;
  const currentError = (fetchError as any)?.message;

  const columns: GridColDef[] = (
    [
      {
        field: "srNo",
        headerName: "Sr No",
        width: 80,
        valueGetter: (params) =>
          rows.findIndex((r) => r.id === params.row.id) + 1,
      },
      { field: "unitName", headerName: "Unit Name", flex: 1, minWidth: 140 },
      {
        field: "modifiedDate",
        headerName: "Last Active ↑",
        width: 170,
        renderCell: (params) => {
          const val = params.row.modifiedDate || params.row.createdDate;
          return val ? new Date(val).toLocaleDateString() : "-";
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 90,
        sortable: false,
        renderCell: (params) => {
          const isConfirming = deleteConfirmId === params.row.id;
          return (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {isConfirming ? (
                <>
                  <Tooltip title="Confirm Delete">
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => handleDeleteUnit(params.row.id)}
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Cancel">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteConfirmId(null)}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              ) : (
                <RowActionMenu
                  onEdit={() => handleOpen(params.row)}
                  onDelete={() => setDeleteConfirmId(params.row.id)}
                />
              )}
            </Box>
          );
        },
      },
    ] as GridColDef[]
  ).map((c) => ({ ...c, align: "center", headerAlign: "center" }));

  return (
    <>
      {currentError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {currentError}
        </Alert>
      )}
      <GenericTable rows={rows} columns={columns} loading={loading} />
      <AddEditDialog
        key={editing ? `unit-edit-${editing.id}` : "unit-add"}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
          setError(null);
        }}
        onSave={handleSave}
        title={editing ? "Edit Unit" : "Add Unit"}
        nameLabel="Unit Name"
        initialName={editing?.unitName ?? ""}
        saving={saving}
        error={error}
      />
    </>
  );
});

// stage tab
const STAGE_TYPES = ["IR", "MSN"] as const;

const StageTab = forwardRef<
  TabHandle,
  { createdBy: number; showSnackbar: (msg: string, severity?: "success" | "error") => void }
>(function StageTab({ createdBy, showSnackbar }, ref) {
  const { data: allStages = [], isLoading: loading, error: fetchError } = useAllStages();
  const addMutation = useAddStage();
  const updateMutation = useUpdateStage();
  const deleteMutation = useDeleteStage();

  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StageRow | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [stageType, setStageType] = useState<string>("IR");

  const handleOpen = (row?: StageRow) => {
    setError(null);
    setEditing(row ?? null);
    setStageType(row?.stageType ?? "IR");
    setDialogOpen(true);
  };

  useImperativeHandle(ref, () => ({
    openAdd: () => handleOpen(),
  }));

  const rows = allStages.filter((item: any) => item.isActive === 1 || item.isActive === true);

  const handleAddStage = async (stageName: string, type: string) => {
    setError(null);
    try {
      await addMutation.mutateAsync({
        stageName,
        stageType: type,
        createdBy,
      });
      showSnackbar("Stage added successfully");
      setDialogOpen(false);
      setEditing(null);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to add stage.");
    }
  };

  const handleUpdateStage = async (id: number, stageName: string, type: string) => {
    setError(null);
    try {
      await updateMutation.mutateAsync({
        id,
        stageName,
        stageType: type,
        modifiedBy: createdBy,
      });
      showSnackbar("Stage updated successfully");
      setDialogOpen(false);
      setEditing(null);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to update stage.");
    }
  };

  const handleDeleteStage = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      showSnackbar("Stage deleted successfully");
      setDeleteConfirmId(null);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message ?? err?.message ?? "Failed to delete stage.";
      showSnackbar(errMsg, "error");
    }
  };

  const handleSave = ({ name }: { name: string }) => {
    if (editing) {
      handleUpdateStage(editing.id, name, stageType);
    } else {
      handleAddStage(name, stageType);
    }
  };

  const saving = addMutation.isPending || updateMutation.isPending;
  const currentError = (fetchError as any)?.message;
  const columns: GridColDef[] = (
    [
      {
        field: "srNo",
        headerName: "Sr No",
        width: 80,
        valueGetter: (params) =>
          rows.findIndex((r) => r.id === params.row.id) + 1,
      },
      {
        field: "stageName",
        headerName: "Stage Name",
        flex: 1,
        minWidth: 160,
      },
      { field: "stageType", headerName: "Stage Type", width: 120 },
      {
        field: "modifiedDate",
        headerName: "Last Active ↑",
        width: 170,
        renderCell: (params) => {
          const val = params.row.modifiedDate || params.row.createdDate;
          return val ? new Date(val).toLocaleDateString() : "-";
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 90,
        sortable: false,
        renderCell: (params) => {
          const isConfirming = deleteConfirmId === params.row.id;
          return (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {isConfirming ? (
                <>
                  <Tooltip title="Confirm Delete">
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => handleDeleteStage(params.row.id)}
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Cancel">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteConfirmId(null)}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              ) : (
                <RowActionMenu
                  onEdit={() => handleOpen(params.row)}
                  onDelete={() => setDeleteConfirmId(params.row.id)}
                />
              )}
            </Box>
          );
        },
      },
    ] as GridColDef[]
  ).map((c) => ({ ...c, align: "center", headerAlign: "center" }));

  return (
    <>
      {currentError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {currentError}
        </Alert>
      )}
      <GenericTable rows={rows} columns={columns} loading={loading} />
      <AddEditDialog
        key={editing ? `stage-edit-${editing.id}` : "stage-add"}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
          setError(null);
        }}
        onSave={handleSave}
        title={editing ? "Edit Stage" : "Add Stage"}
        nameLabel="Stage Name"
        initialName={editing?.stageName ?? ""}
        saving={saving}
        error={error}
        extraFields={
          <TextField
            select
            label="Stage Type"
            fullWidth
            value={stageType}
            onChange={(e) => setStageType(e.target.value)}
          >
            {STAGE_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        }
      />
    </>
  );
});

// shape tab
const ShapeTab = forwardRef<
  TabHandle,
  { createdBy: number; showSnackbar: (msg: string, severity?: "success" | "error") => void }
>(function ShapeTab({ createdBy, showSnackbar }, ref) {
  const { data: shapes = [], isLoading: loading, error: fetchError } = useShapes();
  const addMutation = useAddShape();
  const updateMutation = useUpdateShape();
  const deleteMutation = useDeleteShape();

  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ShapeRow | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const handleOpen = (row?: ShapeRow) => {
    setError(null);
    setEditing(row ?? null);
    setDialogOpen(true);
  };

  useImperativeHandle(ref, () => ({
    openAdd: () => handleOpen(),
  }));

  const rows = shapes.filter((item: any) => item.isActive === 1 || item.isActive === true);

  const handleAddShape = async (shapeName: string) => {
    setError(null);
    try {
      await addMutation.mutateAsync({
        shapeName,
        createdBy,
      });
      showSnackbar("Shape added successfully");
      setDialogOpen(false);
      setEditing(null);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to add shape.");
    }
  };

  const handleUpdateShape = async (id: number, shapeName: string) => {
    setError(null);
    try {
      await updateMutation.mutateAsync({
        id,
        shapeName,
        modifiedBy: createdBy,
      });
      showSnackbar("Shape updated successfully");
      setDialogOpen(false);
      setEditing(null);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to update shape.");
    }
  };

  const handleDeleteShape = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      showSnackbar("Shape deleted successfully");
      setDeleteConfirmId(null);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message ?? err?.message ?? "Failed to delete shape.";
      showSnackbar(errMsg, "error");
    }
  };

  const handleSave = ({ name }: { name: string }) => {
    if (editing) {
      handleUpdateShape(editing.id, name);
    } else {
      handleAddShape(name);
    }
  };

  const saving = addMutation.isPending || updateMutation.isPending;
  const currentError = (fetchError as any)?.message;

  const columns: GridColDef[] = (
    [
      {
        field: "srNo",
        headerName: "Sr No",
        width: 80,
        valueGetter: (params) =>
          rows.findIndex((r) => r.id === params.row.id) + 1,
      },
      {
        field: "shapeName",
        headerName: "Shape Name",
        flex: 1,
        minWidth: 140,
        valueGetter: (params) => params.row.materialName || "-",
      },
      {
        field: "modifiedDate",
        headerName: "Last Active ↑",
        width: 170,
        renderCell: (params) => {
          const val = params.row.modifiedDate || params.row.createdDate;
          return val ? new Date(val).toLocaleDateString() : "-";
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 90,
        sortable: false,
        renderCell: (params) => {
          const isConfirming = deleteConfirmId === params.row.id;
          return (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {isConfirming ? (
                <>
                  <Tooltip title="Confirm Delete">
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => handleDeleteShape(params.row.id)}
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Cancel">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteConfirmId(null)}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              ) : (
                <RowActionMenu
                  onEdit={() => handleOpen(params.row)}
                  onDelete={() => setDeleteConfirmId(params.row.id)}
                />
              )}
            </Box>
          );
        },
      },
    ] as GridColDef[]
  ).map((c) => ({ ...c, align: "center", headerAlign: "center" }));

  return (
    <>
      {currentError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {currentError}
        </Alert>
      )}
      <GenericTable rows={rows} columns={columns} loading={loading} />
      <AddEditDialog
        key={editing ? `shape-edit-${editing.id}` : "shape-add"}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
          setError(null);
        }}
        onSave={handleSave}
        title={editing ? "Edit Shape" : "Add Shape"}
        nameLabel="Shape Name"
        initialName={editing?.shapeName || editing?.materialName || ""}
        saving={saving}
        error={error}
      />
    </>
  );
});

// production series
const ProductionSeriesTab = forwardRef<
  TabHandle,
  { createdBy: number; showSnackbar: (msg: string, severity?: "success" | "error") => void }
>(function ProductionSeriesTab({ createdBy, showSnackbar }, ref) {

  const { data: productionSeries = [], isLoading: loading, error: fetchError } =
    useProductionSeries();

  const addMutation = useAddProductionSeries();
  const updateMutation = useUpdateProductionSeries();
  const deleteMutation = useDeleteProductionSeries();

  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const handleOpen = (row?: any) => {
    setError(null);
    setEditing(row ?? null);
    setDialogOpen(true);
  };

  useImperativeHandle(ref, () => ({
    openAdd: () => handleOpen(),
  }));

  const rows = productionSeries.filter(
    (item: any) => item.isActive === 1 || item.isActive === true
  );

  const handleAddProductionSeries = async (productionSeries: string) => {
    setError(null);

    try {
      await addMutation.mutateAsync({
        productionSeries,
        createdBy,
      });

      showSnackbar("Production Series added successfully");
      setDialogOpen(false);
      setEditing(null);

    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
        err?.message ??
        "Failed to add production series."
      );
    }
  };

  const handleUpdateProductionSeries = async (
    id: number,
    productionSeries: string
  ) => {

    setError(null);

    try {
      await updateMutation.mutateAsync({
        id,
        productionSeries,
        modifiedBy: createdBy,
      });

      showSnackbar("Production Series updated successfully");
      setDialogOpen(false);
      setEditing(null);

    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
        err?.message ??
        "Failed to update production series."
      );
    }
  };

  const handleDeleteProductionSeries = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);

      showSnackbar("Production Series deleted successfully");
      setDeleteConfirmId(null);

    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ??
        err?.message ??
        "Failed to delete production series.";
      showSnackbar(errMsg, "error");
    }
  };

  const handleSave = ({ name }: { name: string }) => {
    if (editing) {
      handleUpdateProductionSeries(editing.id, name);
    } else {
      handleAddProductionSeries(name);
    }
  };

  const saving = addMutation.isPending || updateMutation.isPending;
  const currentError = (fetchError as any)?.message;

  const columns: GridColDef[] = (
    [
      {
        field: "srNo",
        headerName: "Sr No",
        width: 80,
        valueGetter: (params) =>
          rows.findIndex((r: any) => r.id === params.row.id) + 1,
      },
      {
        field: "productionSeries",
        headerName: "Production Series",
        flex: 1,
        minWidth: 180,
        valueGetter: (params) =>
          params.row.productionSeries || "-",
      },
      {
        field: "modifiedDate",
        headerName: "Last Active ↑",
        width: 170,
        renderCell: (params) => {
          const val = params.row.modifiedDate || params.row.createdDate;
          return val ? new Date(val).toLocaleDateString() : "-";
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 90,
        sortable: false,
        renderCell: (params) => {
          const isConfirming = deleteConfirmId === params.row.id;
          return (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {isConfirming ? (
                <>
                  <Tooltip title="Confirm Delete">
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() =>
                        handleDeleteProductionSeries(params.row.id)
                      }
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Cancel">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteConfirmId(null)}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              ) : (
                <RowActionMenu
                  onEdit={() => handleOpen(params.row)}
                  onDelete={() => setDeleteConfirmId(params.row.id)}
                />
              )}
            </Box>
          );
        },
      },
    ] as GridColDef[]
  ).map((c) => ({
    ...c,
    align: "center",
    headerAlign: "center",
  }));

  return (
    <>
      {currentError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {currentError}
        </Alert>
      )}

      <GenericTable
        rows={rows}
        columns={columns}
        loading={loading}
      />

      <AddEditDialog
        key={
          editing
            ? `production-series-edit-${editing.id}`
            : "production-series-add"
        }
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
          setError(null);
        }}
        onSave={handleSave}
        title={
          editing
            ? "Edit Production Series"
            : "Add Production Series"
        }
        nameLabel="Production Series"
        initialName={editing?.productionSeries || ""}
        saving={saving}
        error={error}
      />
    </>
  );
});

const SignatureTab = forwardRef<
  TabHandle,
  {
    createdBy: number;
    users: any[];
    showSnackbar: (
      msg: string,
      severity?: "success" | "error"
    ) => void;
  }
>(function SignatureTab(
  { users, showSnackbar },
  ref
) {
  const queryClient = useQueryClient();
  const { data: usersWithSignatures = [], isLoading: loading, error: fetchError } = useUsersWithSignatures();

  const [dialogOpen, setDialogOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userFieldRef = useRef<HTMLDivElement>(null);

  const [signatureFile, setSignatureFile] =
    useState<File | null>(null);

  useImperativeHandle(ref, () => ({
    openAdd: () => {
      setDialogOpen(true);
    },
  }));

  const rows = (usersWithSignatures || []).map((row) => {
    const userObj = (users || []).find((u) => u && String(u.id) === String(row.userId));
    return {
      ...row,
      id: row.signatureId,
      roleName: userObj?.role || "-",
    };
  });

  const columns: GridColDef[] = (
    [
      {
        field: "srNo",
        headerName: "Sr No",
        width: 100,
        valueGetter: (params) =>
          rows.findIndex((r) => r.id === params.row.id) + 1,
      },
      { field: "employeeId", headerName: "User ID", flex: 1, minWidth: 120 },
      { field: "userName", headerName: "User Name", flex: 1, minWidth: 150 },
      { field: "roleName", headerName: "Role", flex: 1, minWidth: 150 },
      { field: "departmentName", headerName: "Department Name", flex: 1, minWidth: 120 },
      {
        field: "signatureCreatedDate",
        headerName: "Created Date",
        width: 200,
        renderCell: (params) =>
          params.row.signatureCreatedDate
            ? new Date(params.row.signatureCreatedDate).toLocaleString()
            : "-",
      },
    ] as GridColDef[]
  ).map((c) => ({ ...c, align: "center", headerAlign: "center" }));

  const handleSave = async () => {
    if (!selectedUser) {
      showSnackbar("Please select a user", "error");
      return;
    }
    if (!signatureFile) {
      showSnackbar("Please upload a signature image", "error");
      return;
    }

    try {
      // Read file as base64 and extract only the base64 string content
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(signatureFile);
      });

      // Retrieve full user information
      const userObj = (users || []).find((u) => u && String(u.id) === String(selectedUser));
      const userId = userObj ? userObj.id : selectedUser;

      const payload = {
        userId,
        signature: base64Image,
      };

      await api.post("/api/User/Upload-Signature", payload);

      showSnackbar("Signature uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["usersWithSignatures"] });
      setDialogOpen(false);
      setSelectedUser("");
      setUserSearchQuery("");
      setSignatureFile(null);

    } catch (err: any) {
      showSnackbar(err?.message || "Failed to upload signature", "error");
    }
  };

  return (
    <>
      {fetchError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(fetchError as any)?.message || "Failed to load signatures"}
        </Alert>
      )}
      <GenericTable rows={rows} columns={columns} loading={loading} />
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedUser("");
          setUserSearchQuery("");
          setSignatureFile(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Upload Signature
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <ClickAwayListener onClickAway={() => setUserDropdownOpen(false)}>
              <Box>
                <TextField
                  ref={userFieldRef}
                  size="small"
                  label="User Name"
                  variant="outlined"
                  required
                  fullWidth
                  value={userSearchQuery}
                  onChange={(e) => {
                    setUserSearchQuery(e.target.value);
                    setUserDropdownOpen(true);
                    if (!e.target.value.trim()) {
                      setSelectedUser("");
                    }
                  }}
                  onFocus={() => setUserDropdownOpen(true)}
                  InputProps={{
                    endAdornment: selectedUser ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedUser("");
                            setUserSearchQuery("");
                            setUserDropdownOpen(false);
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                />
                <Popper
                  open={userDropdownOpen}
                  anchorEl={userFieldRef.current}
                  placement="bottom-start"
                  style={{ zIndex: 1500, width: userFieldRef.current?.clientWidth }}
                >
                  <Paper
                    elevation={3}
                    sx={{ maxHeight: 250, overflow: "auto", mt: 0.5 }}
                  >
                    {(users || [])
                      .filter(
                        (u) => u && (u.isActive === true || u.isActive === 1)
                      )
                      .filter((u) => {
                        if (!userSearchQuery.trim()) return true;
                        const q = userSearchQuery.toLowerCase();
                        return (
                          (u.userName || "").toLowerCase().includes(q) ||
                          (u.email || "").toLowerCase().includes(q) ||
                          (u.userId || "").toLowerCase().includes(q) ||
                          String(u.id || "").toLowerCase().includes(q) ||
                          (u.role || "").toLowerCase().includes(q) ||
                          (u.departmentName || "").toLowerCase().includes(q)
                        );
                      })
                      .map((u) => (
                        <MenuItem
                          key={u.id}
                          onClick={() => {
                            setSelectedUser(String(u.id));
                            setUserSearchQuery(
                              u.userName || u.username || u.name || ""
                            );
                            setUserDropdownOpen(false);
                          }}
                          selected={String(u.id) === selectedUser}
                        >
                          <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <Typography variant="body2" fontWeight={500}>
                              {u.userName || u.username || u.name || ""}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {u.role || "No Role"} | {u.departmentName || "No Department"} | {u.email || "No Email"}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    {(users || [])
                      .filter((u) => u && (u.isActive === true || u.isActive === 1))
                      .filter((u) => {
                        if (!userSearchQuery.trim()) return true;
                        const q = userSearchQuery.toLowerCase();
                        return (
                          (u.userName || "").toLowerCase().includes(q) ||
                          (u.email || "").toLowerCase().includes(q) ||
                          (u.userId || "").toLowerCase().includes(q) ||
                          String(u.id || "").toLowerCase().includes(q) ||
                          (u.role || "").toLowerCase().includes(q) ||
                          (u.departmentName || "").toLowerCase().includes(q)
                        );
                      }).length === 0 && (
                      <MenuItem disabled>
                        <Typography variant="body2" color="text.secondary">
                          No users found
                        </Typography>
                      </MenuItem>
                    )}
                  </Paper>
                </Popper>
              </Box>
            </ClickAwayListener>

            {/* <Autocomplete
              size="small"
              options={userRoles}
              getOptionLabel={(option) => {
                if (typeof option === "string") return option;
                return option?.role || "";
              }}
              value={userRoles.find((r) => r.role === role) || null}
              onChange={(_, newValue) =>
                setRole(newValue ? newValue.role : "")
              }
              isOptionEqualToValue={(option, value) =>
                (option?.role || "") === (value?.role || "")
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Role"
                  variant="outlined"
                  required
                />
              )}
            /> */}

            {/* <Autocomplete
              size="small"
              options={departments}
              getOptionLabel={(option) => {
                if (typeof option === "string") return option;
                return option?.name || "";
              }}
              value={departments.find((d) => d.name === department) || null}
              onChange={(_, newValue) =>
                setDepartment(newValue ? newValue.name : "")
              }
              isOptionEqualToValue={(option, value) =>
                (option?.name || "") === (value?.name || "")
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Department"
                  variant="outlined"
                  required
                />
              )}
            /> */}

            <Button
              variant="outlined"
              component="label"
            >
              Upload Signature
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setSignatureFile(
                    e.target.files?.[0] || null
                  )
                }
              />
            </Button>

            {signatureFile && (
              <Typography variant="body2">
                {signatureFile.name}
              </Typography>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setDialogOpen(false);
              setSelectedUser("");
              setSignatureFile(null);

            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSave}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});


// tab labels
const TAB_LABELS = ["Unit", "Stage", "Shape", "Production Series", "Upload Signature"] as const;

// main page
export default function AddComponents({ hideHeader = false }: { hideHeader?: boolean } = {}) {
  const [activeTab, setActiveTab] = useState(0);
  const unitRef = useRef<TabHandle>(null);
  const stageRef = useRef<TabHandle>(null);
  const shapeRef = useRef<TabHandle>(null);
  const productionSeriesRef = useRef<TabHandle>(null);
  const signatureRef = useRef<TabHandle>(null);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const showSnackbar = (
    message: string,
    severity: "success" | "error" = "success",
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const { data: users = [] } = useUsers();

  const user = useSelector((state: RootState) => state.auth.user);
  const createdBy = user?.id ? Number(user.id) : 0;

  const handleOpenAdd = () => {
    if (activeTab === 0) unitRef.current?.openAdd();
    if (activeTab === 1) stageRef.current?.openAdd();
    if (activeTab === 2) shapeRef.current?.openAdd();
    if (activeTab === 3) productionSeriesRef.current?.openAdd();
    if (activeTab === 4) signatureRef.current?.openAdd();
  };

  // Fetch counts for tabs
  const { data: units = [] } = useUnits();
  const { data: stages = [] } = useAllStages();
  const { data: shapes = [] } = useShapes();
  const { data: productionSeries = [] } = useProductionSeries();
  const { data: signatures = [] } = useUsersWithSignatures();

  const [searchQuery, setSearchQuery] = useState("");

  const activeUnitsCount = units.filter((u: any) => u.isActive === 1 || u.isActive === true).length;
  const activeStagesCount = stages.filter((s: any) => s.isActive === 1 || s.isActive === true).length;
  const activeShapesCount = shapes.filter((s: any) => s.isActive === 1 || s.isActive === true).length;
  const activeSeriesCount = productionSeries.filter((p: any) => p.isActive === 1 || p.isActive === true).length;
  const activeSignaturesCount = (signatures || []).length;

  return (
    <Box sx={{ py: hideHeader ? 0 : { xs: 1.5, sm: 2 }, px: hideHeader ? 0 : { xs: 1.5, sm: 2.5 } }}>
      {/* 1. Top Header Bar */}
      {!hideHeader && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mb: 1.5 }}
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
            Master Data
            </Typography>
          </Box>
        </Stack>
      )}

      {/* 2. Tabs Bar (Outside Container) */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid #EAECF0",
          mb: 2,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_e, newValue) => setActiveTab(newValue)}
          textColor="primary"
          indicatorColor="primary"
          aria-label="master data tabs"
          sx={{
            minHeight: 40,
            "& .MuiTab-root": {
              fontWeight: 600,
              fontSize: "0.875rem",
              textTransform: "none",
              minWidth: 90,
              py: 0.75,
              px: 1.5,
              minHeight: 40,
              color: "#475467",
            },
            "& .MuiTab-root.Mui-selected": { color: "primary.main", fontWeight: 700 },
            "& .MuiTabs-indicator": {
              backgroundColor: "primary.main",
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
          }}
        >
          <Tab
            id="tab-unit"
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <span>Units</span>
                <Typography component="span" sx={{ fontSize: "0.75rem", fontWeight: 600, px: 0.8, py: 0.15, borderRadius: "12px", backgroundColor: activeTab === 0 ? "#F4EBFF" : "#F2F4F7", color: activeTab === 0 ? "primary.main" : "#667085" }}>
                  {activeUnitsCount}
                </Typography>
              </Box>
            }
          />
          <Tab
            id="tab-stage"
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <span>Stages</span>
                <Typography component="span" sx={{ fontSize: "0.75rem", fontWeight: 600, px: 0.8, py: 0.15, borderRadius: "12px", backgroundColor: activeTab === 1 ? "#F4EBFF" : "#F2F4F7", color: activeTab === 1 ? "primary.main" : "#667085" }}>
                  {activeStagesCount}
                </Typography>
              </Box>
            }
          />
          <Tab
            id="tab-shape"
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <span>Shapes</span>
                <Typography component="span" sx={{ fontSize: "0.75rem", fontWeight: 600, px: 0.8, py: 0.15, borderRadius: "12px", backgroundColor: activeTab === 2 ? "#F4EBFF" : "#F2F4F7", color: activeTab === 2 ? "primary.main" : "#667085" }}>
                  {activeShapesCount}
                </Typography>
              </Box>
            }
          />
          <Tab
            id="tab-productionSeries"
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <span>Production Series</span>
                <Typography component="span" sx={{ fontSize: "0.75rem", fontWeight: 600, px: 0.8, py: 0.15, borderRadius: "12px", backgroundColor: activeTab === 3 ? "#F4EBFF" : "#F2F4F7", color: activeTab === 3 ? "primary.main" : "#667085" }}>
                  {activeSeriesCount}
                </Typography>
              </Box>
            }
          />
          <Tab
            id="tab-Upload Signature"
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <span>Signatures</span>
                <Typography component="span" sx={{ fontSize: "0.75rem", fontWeight: 600, px: 0.8, py: 0.15, borderRadius: "12px", backgroundColor: activeTab === 4 ? "#F4EBFF" : "#F2F4F7", color: activeTab === 4 ? "primary.main" : "#667085" }}>
                  {activeSignaturesCount}
                </Typography>
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* 3. Main Single Container Card */}
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
        {/* Inside Container Toolbar: Search on Left, Add Button on Right */}
        <Box
          sx={{
            p: 1.5,
            px: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            borderBottom: "1px solid #EAECF0",
          }}
        >
          <TextField
            placeholder={`Search ${TAB_LABELS[activeTab]?.toLowerCase() || "items"}...`}
            size="small"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              width: { xs: "100%", sm: 320 },
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                fontSize: "0.82rem",
                height: 38,
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#6B288A" },
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

          <Button
            id="btn-add-tab-item"
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
            sx={{
              fontWeight: 600,
              backgroundColor: "primary.main",
              "&:hover": { backgroundColor: "primary.dark" },
              textTransform: "none",
              borderRadius: "8px",
              px: 2.5,
              height: 38,
              boxShadow: "none",
            }}
          >
            {activeTab === 4 ? TAB_LABELS[activeTab] : `Add ${TAB_LABELS[activeTab]}`}
          </Button>
        </Box>

        {/* Tab Panels with Tables */}
        <Box sx={{ width: "100%" }}>
          <TabPanel value={activeTab} index={0}>
            <UnitTab
              ref={unitRef}
              createdBy={createdBy}
              showSnackbar={showSnackbar}
            />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <StageTab
              ref={stageRef}
              createdBy={createdBy}
              showSnackbar={showSnackbar}
            />
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            <ShapeTab
              ref={shapeRef}
              createdBy={createdBy}
              showSnackbar={showSnackbar}
            />
          </TabPanel>
          <TabPanel value={activeTab} index={3}>
            <ProductionSeriesTab
              ref={productionSeriesRef}
              createdBy={createdBy}
              showSnackbar={showSnackbar}
            />
          </TabPanel>
          <TabPanel value={activeTab} index={4}>
            <SignatureTab
              ref={signatureRef}
              createdBy={createdBy}
              users={users}
              showSnackbar={showSnackbar}
            />
          </TabPanel>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === "error" ? undefined : 6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

