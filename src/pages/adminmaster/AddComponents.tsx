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
  Card,
  CardContent,
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
  MenuItem,
  Snackbar,
  Paper,
  ClickAwayListener,
  Popper,
  InputAdornment,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Check as CheckIcon, Close as CloseIcon, Search as SearchIcon } from "@mui/icons-material";
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
interface UploadSignatureRow {
  id: number;
  userId: number;
  userName: string;
  role: string;
  department: string;
  signature: string;
  createdDate: string;
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
    <Card
      elevation={0}
      sx={{
        border: "1px solid #e2e8f0",
        borderRadius: 3,
        overflow: "hidden",
        background: "white",
      }}
    >
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
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
            pageSizeOptions={[5, 10, 25, 50]}
            disableRowSelectionOnClick
            sx={{
              border: "none",
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#f8fafc",
                borderBottom: "2px solid #e2e8f0",
                color: "#1e293b",
                fontWeight: 700,
                fontSize: "0.75rem",
              },
              "& .MuiDataGrid-columnHeaderTitle": {
                fontWeight: 700,
                fontSize: "0.75rem",
                color: "#1e293b",
              },
              "& .MuiDataGrid-cell": {
                fontSize: "0.75rem",
                color: "#1e293b",
                borderBottom: "1px solid #e2e8f0",
              },
              "& .MuiDataGrid-row": {
                "&:nth-of-type(even)": { backgroundColor: "#f8fafc" },
                "&:hover": { backgroundColor: "#f1f5f9" },
                transition: "background-color 0.2s ease",
              },
              "& .MuiDataGrid-cell:focus": { outline: "none" },
              "& .MuiDataGrid-cell:focus-within": { outline: "none" },
              "& .MuiDataGrid-columnHeader:focus": { outline: "none" },
              "& .MuiDataGrid-columnHeader:focus-within": { outline: "none" },
            }}
          />
        </Box>
      </CardContent>
    </Card>
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
  { createdBy: number; users: any[]; showSnackbar: (msg: string, severity?: "success" | "error") => void }
>(function UnitTab({ createdBy, users, showSnackbar }, ref) {
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
        width: 100,
        valueGetter: (params) =>
          rows.findIndex((r) => r.id === params.row.id) + 1,
      },
      { field: "unitName", headerName: "Unit Name", flex: 1, minWidth: 100 },
      // {
      //   field: "isActive",
      //   headerName: "Status",
      //   width: 100,
      //   align: "center",
      //   headerAlign: "center",
      //   renderCell: (params) => {
      //     const isActive =
      //       params.row.isActive === 1 || params.row.isActive === true;
      //     return (
      //       <Typography
      //         variant="body2"
      //         sx={{
      //           color: isActive ? "success.main" : "error.main",
      //           fontWeight: 600,
      //         }}
      //       >
      //         {isActive ? "Active" : "Inactive"}
      //       </Typography>
      //     );
      //   },
      // },
      {
        field: "createdDate",
        headerName: "Created Date",
        width: 170,
        renderCell: (params) =>
          params.row.createdDate
            ? new Date(params.row.createdDate).toLocaleString()
            : "-",
      },
      {
        field: "modifiedDate",
        headerName: "Modified Date",
        width: 170,
        renderCell: (params) =>
          params.row.modifiedDate
            ? new Date(params.row.modifiedDate).toLocaleString()
            : "-",
      },
      {
        field: "createdBy",
        headerName: "Created By",
        width: 170,
        renderCell: (params) => {
          const u = users.find((u) => u.id === params.row.createdBy);
          return u ? u.userName : params.row.createdBy || "-";
        },
      },
      {
        field: "modifiedBy",
        headerName: "Modified By",
        width: 170,
        renderCell: (params) => {
          const u = users.find((u) => u.id === params.row.modifiedBy);
          return u ? u.userName : params.row.modifiedBy || "-";
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 120,
        sortable: false,
        renderCell: (params) => {
          const isConfirming = deleteConfirmId === params.row.id;
          return (
            <Box>
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
                <>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpen(params.row)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteConfirmId(params.row.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
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
  { createdBy: number; users: any[]; showSnackbar: (msg: string, severity?: "success" | "error") => void }
>(function StageTab({ createdBy, users, showSnackbar }, ref) {
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
        width: 100,
        valueGetter: (params) =>
          rows.findIndex((r) => r.id === params.row.id) + 1,
      },
      {
        field: "stageName",
        headerName: "Stage Name",
        flex: 1,
        minWidth: 200,
      },
      { field: "stageType", headerName: "Stage Type", width: 100 },
      // {
      //   field: "isActive",
      //   headerName: "Status",
      //   width: 100,
      //   align: "center",
      //   headerAlign: "center",
      //   renderCell: (params) => {
      //     const isActive =
      //       params.row.isActive === 1 || params.row.isActive === true;
      //     return (
      //       <Typography
      //         variant="body2"
      //         sx={{
      //           color: isActive ? "success.main" : "error.main",
      //           fontWeight: 600,
      //         }}
      //       >
      //         {isActive ? "Active" : "Inactive"}
      //       </Typography>
      //     );
      //   },
      // },
      {
        field: "createdDate",
        headerName: "Created Date",
        width: 170,
        renderCell: (params) =>
          params.row.createdDate
            ? new Date(params.row.createdDate).toLocaleString()
            : "-",
      },
      {
        field: "modifiedDate",
        headerName: "Modified Date",
        width: 170,
        renderCell: (params) =>
          params.row.modifiedDate
            ? new Date(params.row.modifiedDate).toLocaleString()
            : "-",
      },
      {
        field: "createdBy",
        headerName: "Created By",
        width: 170,
        renderCell: (params) => {
          const u = users.find((u) => u.id === params.row.createdBy);
          return u ? u.userName : params.row.createdBy || "-";
        },
      },
      {
        field: "modifiedBy",
        headerName: "Modified By",
        width: 170,
        renderCell: (params) => {
          const u = users.find((u) => u.id === params.row.modifiedBy);
          return u ? u.userName : params.row.modifiedBy || "-";
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 120,
        sortable: false,
        renderCell: (params) => {
          const isConfirming = deleteConfirmId === params.row.id;
          return (
            <Box>
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
                <>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpen(params.row)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteConfirmId(params.row.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
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
  { createdBy: number; users: any[]; showSnackbar: (msg: string, severity?: "success" | "error") => void }
>(function ShapeTab({ createdBy, users, showSnackbar }, ref) {
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
        width: 100,
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
      // {
      //   field: "isActive",
      //   headerName: "Status",
      //   width: 100,
      //   align: "center",
      //   headerAlign: "center",
      //   renderCell: (params) => {
      //     const isActive =
      //       params.row.isActive === 1 || params.row.isActive === true;
      //     return (
      //       <Typography
      //         variant="body2"
      //         sx={{
      //           color: isActive ? "success.main" : "error.main",
      //           fontWeight: 600,
      //         }}
      //       >
      //         {isActive ? "Active" : "Inactive"}
      //       </Typography>
      //     );
      //   },
      // },
      {
        field: "createdDate",
        headerName: "Created Date",
        width: 170,
        renderCell: (params) =>
          params.row.createdDate
            ? new Date(params.row.createdDate).toLocaleString()
            : "-",
      },
      {
        field: "modifiedDate",
        headerName: "Modified Date",
        width: 170,
        renderCell: (params) =>
          params.row.modifiedDate
            ? new Date(params.row.modifiedDate).toLocaleString()
            : "-",
      },
      {
        field: "createdBy",
        headerName: "Created By",
        width: 170,
        renderCell: (params) => {
          const u = users.find((u) => u.id === params.row.createdBy);
          return u ? u.userName : params.row.createdBy || "-";
        },
      },
      {
        field: "modifiedBy",
        headerName: "Modified By",
        width: 170,
        renderCell: (params) => {
          const u = users.find((u) => u.id === params.row.modifiedBy);
          return u ? u.userName : params.row.modifiedBy || "-";
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 120,
        sortable: false,
        renderCell: (params) => {
          const isConfirming = deleteConfirmId === params.row.id;
          return (
            <Box>
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
                <>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpen(params.row)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteConfirmId(params.row.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
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
  { createdBy: number; users: any[]; showSnackbar: (msg: string, severity?: "success" | "error") => void }
>(function ProductionSeriesTab({ createdBy, users, showSnackbar }, ref) {

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
        width: 100,
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
        field: "createdDate",
        headerName: "Created Date",
        width: 170,
        renderCell: (params) =>
          params.row.createdDate
            ? new Date(params.row.createdDate).toLocaleString()
            : "-",
      },

      {
        field: "modifiedDate",
        headerName: "Modified Date",
        width: 170,
        renderCell: (params) =>
          params.row.modifiedDate
            ? new Date(params.row.modifiedDate).toLocaleString()
            : "-",
      },

      {
        field: "createdBy",
        headerName: "Created By",
        width: 170,
        renderCell: (params) => {
          const u = users.find((u) => u.id === params.row.createdBy);
          return u ? u.userName : params.row.createdBy || "-";
        },
      },

      {
        field: "modifiedBy",
        headerName: "Modified By",
        width: 170,
        renderCell: (params) => {
          const u = users.find((u) => u.id === params.row.modifiedBy);
          return u ? u.userName : params.row.modifiedBy || "-";
        },
      },

      {
        field: "actions",
        headerName: "Actions",
        width: 120,
        sortable: false,

        renderCell: (params) => {
          const isConfirming = deleteConfirmId === params.row.id;

          return (
            <Box>
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
                <>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpen(params.row)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() =>
                        setDeleteConfirmId(params.row.id)
                      }
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
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
export default function AddComponents() {
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

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Page heading */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography
          variant="h3"
          sx={{ color: "primary.main", fontWeight: 600 }}
        >
          Add Components
        </Typography>
      </Stack>

      {/* Tabs */}
      <Card
        elevation={0}
        sx={{
          mb: 0,
          border: "1px solid #e2e8f0",
          borderRadius: 3,
          overflow: "hidden",
          background: "white",
        }}
      >
        {/* Tab bar with inline add on the right */}
        <Box
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            px: 2,
            pt: 1,
            backgroundColor: "#f8fafc",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_e, newValue) => setActiveTab(newValue)}
            textColor="primary"
            indicatorColor="primary"
            aria-label="add components tabs"
            sx={{
              flexGrow: 1,
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
            <Tab id="tab-unit" aria-controls="tabpanel-unit" label="Unit" />
            <Tab id="tab-stage" aria-controls="tabpanel-stage" label="Stage" />
            <Tab id="tab-shape" aria-controls="tabpanel-shape" label="Shape" />
            <Tab id="tab-productionSeries" aria-controls="tabpanel-productionSeries" label="Production Series" />
            <Tab id="tab-Upload Signature" aria-controls="tabpanel-Upload Signature" label="Upload Signature" />

          </Tabs>

          {/* Add button */}
          <Box sx={{ ml: 2, mb: 1 }}>
            <Button
              id="btn-add-tab-item"
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleOpenAdd}
              sx={{
                fontWeight: 600,
                textTransform: "none",
                "&:focus": { outline: "none" },
                whiteSpace: "nowrap",
              }}
            >
              {activeTab === 4 ? TAB_LABELS[activeTab] : `Add ${TAB_LABELS[activeTab]}`}
            </Button>
          </Box>
        </Box>

        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <TabPanel value={activeTab} index={0}>
            <UnitTab
              ref={unitRef}
              createdBy={createdBy}
              users={users}
              showSnackbar={showSnackbar}
            />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <StageTab
              ref={stageRef}
              createdBy={createdBy}
              users={users}
              showSnackbar={showSnackbar}
            />
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            <ShapeTab
              ref={shapeRef}
              createdBy={createdBy}
              users={users}
              showSnackbar={showSnackbar}
            />
          </TabPanel>
          <TabPanel value={activeTab} index={3}>
            <ProductionSeriesTab
              ref={productionSeriesRef}
              createdBy={createdBy}
              users={users}
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
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === "error" ? null : 6000}
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
