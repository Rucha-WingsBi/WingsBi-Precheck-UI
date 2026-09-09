import { useState, forwardRef, useImperativeHandle, useRef, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Stack,
  Tab,
  Tabs,
  Snackbar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,

} from "@mui/icons-material";
import {
  useUserRoles,
  useAddUserRole,
  useUpdateUserRole,
  useDeleteUserRole,
  useDepartments,
  useUpdateDepartment,
  useDeleteDepartment,
  useAddDepartment,
} from "../../hooks/useMasterData";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import EditRoleDrawer from "./components/EditRoleDrawer";

interface UserRoleInput {
  id?: number;
  role: string;
  description: string;
  isActive: boolean;
  createdBy?: number;
  modifiedBy?: number;
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

const TAB_LABELS = ["Role", "Department"] as const;

interface TabProps {
  showSnackbar: (msg: string, severity?: "success" | "error") => void;
}

// 3-Dots Action Menu for Rows
interface RoleRowActionMenuProps {
  row: any;
  onEdit: (row: any) => void;
  onDelete: (id: number) => void;
}

function RoleRowActionMenu({ row, onEdit, onDelete }: RoleRowActionMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setIsConfirmingDelete(false);
  };

  const isInactive = !row.isActive;

  if (isConfirmingDelete) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
        <Tooltip title="Confirm Delete">
          <IconButton
            size="small"
            color="success"
            onClick={() => {
              onDelete(row.id);
              handleClose();
            }}
          >
            <CheckIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Cancel">
          <IconButton
            size="small"
            color="error"
            onClick={() => setIsConfirmingDelete(false)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <>
      <IconButton
        id={`role-action-menu-btn-${row.id}`}
        size="small"
        onClick={handleClick}
        disabled={isInactive}
        sx={{ color: "text.secondary" }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          elevation: 2,
          sx: {
            borderRadius: 2,
            minWidth: 140,
            border: "1px solid",
            borderColor: "neutral.border",
          },
        }}
      >
        <MenuItem
          onClick={() => {
            handleClose();
            onEdit(row);
          }}
          disabled={isInactive}
          sx={{ fontSize: "0.85rem", py: 1 }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText primary="Edit Role / Access " />
        </MenuItem>

        

        <MenuItem
          onClick={() => setIsConfirmingDelete(true)}
          disabled={isInactive}
          sx={{ fontSize: "0.85rem", py: 1, color: "error.main" }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>
    </>
  );
}

const RoleTab = forwardRef<TabHandle, TabProps>(({ showSnackbar }, ref) => {
  const { data: userRoles = [], isLoading, error } = useUserRoles();
  const addMutation = useAddUserRole();
  const updateMutation = useUpdateUserRole();
  const deleteMutation = useDeleteUserRole();

  const [open, setOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<UserRoleInput | null>(null);
  const [formData, setFormData] = useState<UserRoleInput>({
    role: "",
    description: "",
    isActive: true,
  });

  const currentUser = useSelector((state: RootState) => state.auth.user);

  const handleOpen = (role?: UserRoleInput) => {
    if (role) {
      setEditingRole(role);
      setOpen(false);
    } else {
      setEditingRole(null);
      setFormData({ role: "", description: "", isActive: true });
      setOpen(true);
    }
  };

  useImperativeHandle(ref, () => ({
    openAdd: () => handleOpen(),
  }));

  const handleClose = () => {
    setOpen(false);
    setEditingRole(null);
  };

  const handleSubmit = async () => {
    try {
      const currentUserId = currentUser?.id ? Number(currentUser.id) : 1;
      if (editingRole) {
        await updateMutation.mutateAsync({
          ...formData,
          id: editingRole.id!,
          modifiedBy: currentUserId,
        });
        showSnackbar("Role updated successfully");
      } else {
        await addMutation.mutateAsync({
          ...formData,
          createdBy: currentUserId,
        });
        showSnackbar("Role added successfully");
      }
      handleClose();
    } catch (err) {
      showSnackbar("Failed to save role", "error");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      showSnackbar("Role deleted successfully");
    } catch (err) {
      showSnackbar("Failed to delete role", "error");
    }
  };

  const rows = useMemo(() => {
    return userRoles.map((r: any, index: number) => ({
      ...r,
      srNo: index + 1,
    }));
  }, [userRoles]);

  const columns: GridColDef[] = [
    {
      field: "srNo",
      headerName: "Sr No",
      width: 110,
      type: "number",
      headerAlign: "left",
      align: "left",
    },
    {
      field: "role",
      headerName: "Role Name",
      flex: 1,
      minWidth: 190,
    },
    {
      field: "description",
      headerName: "Description",
      flex: 1.5,
      minWidth: 160,
      renderCell: (params) => params.value || "-",
    },
    {
      field: "createdDate",
      headerName: "Last Active",
      width: 170,
      renderCell: (params) => {
        if (!params.value) return "-";
        return new Date(params.value).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 90,
      sortable: false,
      renderCell: (params) => (
        <RoleRowActionMenu
          row={params.row}
          onEdit={handleOpen}
          onDelete={handleDelete}
        />
      ),
    },
  ];

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="30vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">Error loading roles. Please try again later.</Alert>
      </Box>
    );
  }

  return (
    <>
      <Card
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "neutral.border",
          borderRadius: "10px",
          overflow: "hidden",
          background: "background.paper",
        }}
      >
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <Box sx={{ width: "100%" }}>
            <DataGrid
              autoHeight
              rows={rows}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10 },
                },
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
                  backgroundColor: "neutral.hoverBg",
                  borderBottom: "1px solid",
                  borderColor: "neutral.border",
                  color: "text.subtle",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                },
                "& .MuiDataGrid-columnHeaderTitle": {
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  color: "text.subtle",
                },
                "& .MuiDataGrid-cell": {
                  fontSize: "0.85rem",
                  color: "text.secondary",
                  borderBottom: "1px solid",
                  borderColor: "neutral.chipBg",
                },
                "& .MuiDataGrid-row": {
                  "&:hover": { backgroundColor: "neutral.hoverBg" },
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

      {/* Add Role Dialog */}
      <Dialog open={open && !editingRole} onClose={handleClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600, color: "text.primary" }}>
          Add Role
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Role Name"
            fullWidth
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            sx={{ mb: 1.5 }}
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            size="small"
            onClick={handleClose}
            sx={{ color: "text.secondary", textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.role.trim()}
            sx={{
              backgroundColor: "primary.main",
              "&:hover": { backgroundColor: "primary.dark" },
              textTransform: "none",
              fontWeight: 600,
              px: 2.5,
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Role Side Drawer */}
      <EditRoleDrawer
        open={Boolean(editingRole)}
        role={editingRole as any}
        onClose={() => setEditingRole(null)}
        showSnackbar={showSnackbar}
      />
    </>
  );
});

const DepartmentTab = forwardRef<TabHandle, TabProps>(({ showSnackbar }, ref) => {
  const { data: departments = [], isLoading, error } = useDepartments();
  const addMutation = useAddDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  const [open, setOpen] = useState(false);
  const [departmentName, setDepartmentName] = useState("");
  const [editingDepartment, setEditingDepartment] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const saving = addMutation.isPending || updateMutation.isPending;
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const handleOpen = (dept?: any) => {
    if (dept) {
      setEditingDepartment(dept);
      setDepartmentName(dept.name || dept.departmentName || "");
    } else {
      setEditingDepartment(null);
      setDepartmentName("");
    }
    setApiError(null);
    setOpen(true);
  };

  useImperativeHandle(ref, () => ({
    openAdd: () => handleOpen(),
  }));

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    setApiError(null);
    try {
      const currentUserId = currentUser?.id ? Number(currentUser.id) : 1;
      if (editingDepartment) {
        await updateMutation.mutateAsync({
          id: editingDepartment.id,
          departmentName,
          modifiedBy: currentUserId,
        });
        showSnackbar("Department updated successfully");
      } else {
        await addMutation.mutateAsync({
          departmentName,
          createdBy: currentUserId,
        });
        showSnackbar("Department added successfully");
      }
      handleClose();
    } catch (err: any) {
      setApiError(
        err?.response?.data?.message ||
          err?.message ||
          `Failed to ${editingDepartment ? "update" : "add"} department.`
      );
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      showSnackbar("Department deleted successfully");
    } catch (err: any) {
      showSnackbar(
        err?.response?.data?.message || err?.message || "Failed to delete department.",
        "error"
      );
    }
  };

  const activeDepartments = useMemo(() => {
    return departments
      .filter((d: any) => d.isActive === 1 || d.isActive === true)
      .map((r: any, index: number) => ({
        ...r,
        srNo: index + 1,
      }));
  }, [departments]);

  const columns: GridColDef[] = [
    {
      field: "srNo",
      headerName: "Sr No",
      width: 110,
      type: "number",
      headerAlign: "left",
      align: "left",
    },
    {
      field: "name",
      headerName: "Department Name",
      flex: 1,
      minWidth: 180,
      renderCell: (params) => params.row.name || params.row.departmentName || "-",
    },
    {
      field: "createdDate",
      headerName: "Last Active",
      width: 170,
      renderCell: (params) => {
        if (!params.row.createdDate && !params.row.modifiedDate) return "-";
        const dateVal = params.row.modifiedDate || params.row.createdDate;
        return new Date(dateVal).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 90,
      sortable: false,
      renderCell: (params) => (
        <RoleRowActionMenu
          row={params.row}
          onEdit={handleOpen}
          onDelete={handleDelete}
        />
      ),
    },
  ];

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="30vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">Error loading departments.</Alert>
      </Box>
    );
  }

  return (
    <>
      {apiError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setApiError(null)}>
          {apiError}
        </Alert>
      )}

      <Card
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "neutral.border",
          borderRadius: "10px",
          overflow: "hidden",
          background: "background.paper",
        }}
      >
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <Box sx={{ width: "100%" }}>
            <DataGrid
              autoHeight
              rows={activeDepartments}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10 },
                },
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
                  backgroundColor: "neutral.hoverBg",
                  borderBottom: "1px solid",
                  borderColor: "neutral.border",
                  color: "text.subtle",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                },
                "& .MuiDataGrid-columnHeaderTitle": {
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  color: "text.subtle",
                },
                "& .MuiDataGrid-cell": {
                  fontSize: "0.85rem",
                  color: "text.secondary",
                  borderBottom: "1px solid",
                  borderColor: "neutral.chipBg",
                },
                "& .MuiDataGrid-row": {
                  "&:hover": { backgroundColor: "neutral.hoverBg" },
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

      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600, color: "text.primary" }}>
          {editingDepartment ? "Edit Department" : "Add Department"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Department Name"
            fullWidth
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            size="small"
            onClick={handleClose}
            disabled={saving}
            sx={{ color: "text.secondary", textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            onClick={handleSubmit}
            variant="contained"
            disabled={!departmentName.trim() || saving}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : undefined}
            sx={{
              backgroundColor: "primary.main",
              "&:hover": { backgroundColor: "primary.dark" },
              textTransform: "none",
              fontWeight: 600,
              px: 2.5,
            }}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

export default function RoleManagement() {
  const [activeTab, setActiveTab] = useState(0);
  const roleRef = useRef<TabHandle>(null);
  const deptRef = useRef<TabHandle>(null);

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

  const showSnackbar = (message: string, severity: "success" | "error" = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleOpenAdd = () => {
    if (activeTab === 0) roleRef.current?.openAdd();
    if (activeTab === 1) deptRef.current?.openAdd();
  };

  return (
    <Box sx={{ py: { xs: 1, sm: 1.25 }, px: { xs: 1.5, sm: 2 } }}>
      {/* Top Header Bar */}
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
            Role Management
          </Typography>
        </Box>
      </Stack>

      {/* Main Container Card */}
      <Card
        elevation={0}
        sx={{
          mb: 0,
          border: "1px solid",
          borderColor: "neutral.border",
          borderRadius: 3,
          overflow: "hidden",
          background: "background.paper",
        }}
      >
        {/* Header Toolbar (Tabs on left, Add Button on right) */}
        <Box
          sx={{
            p: 1.5,
            px: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "neutral.border",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
            aria-label="role and department tabs"
            sx={{
              minHeight: 38,
              "& .MuiTab-root": {
                fontWeight: 600,
                fontSize: "0.875rem",
                textTransform: "none",
                minWidth: 80,
                minHeight: 38,
                py: 0,
                color: "text.muted",
              },
              "& .MuiTab-root.Mui-selected": { color: "primary.main" },
              "& .MuiTabs-indicator": {
                backgroundColor: "primary.main",
                height: 3,
                borderRadius: "3px 3px 0 0",
              },
            }}
          >
            <Tab id="tab-role" label="Role" />
            <Tab id="tab-department" label="Department" />
          </Tabs>

          <Button
            id="btn-add-role-dept"
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
            sx={{
              fontWeight: 600,
              backgroundColor: "primary.main",
              "&:hover": { backgroundColor: "primary.dark" },
              textTransform: "none",
              borderRadius: 1.5,
              px: 2.5,
              height: 38,
              whiteSpace: "nowrap",
            }}
          >
            Add {TAB_LABELS[activeTab]}
          </Button>
        </Box>

        {/* Content Area */}
        <CardContent sx={{ p: { xs: 2, md: 2.5 }, backgroundColor: "background.paper" }}>
          <TabPanel value={activeTab} index={0}>
            <RoleTab ref={roleRef} showSnackbar={showSnackbar} />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <DepartmentTab ref={deptRef} showSnackbar={showSnackbar} />
          </TabPanel>
        </CardContent>
      </Card>

      {/* Global Snackbar Notification */}
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
