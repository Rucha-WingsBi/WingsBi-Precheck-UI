import { useState, forwardRef, useImperativeHandle, useRef } from "react";
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
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import {
  useUserRoles,
  useAddUserRole,
  useUpdateUserRole,
  useDeleteUserRole,
  useDepartments,
  useUpdateDepartment,
  useDeleteDepartment,
  useUsers,
  useAddDepartment,
} from "../../hooks/useMasterData";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import PageAccessDialog from "./components/PageAccessDialog";
import { useQueryClient } from "@tanstack/react-query";

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
      {value === index && <Box sx={{ mt: 2 }}>{children}</Box>}
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

const RoleTab = forwardRef<TabHandle, TabProps>(({ showSnackbar }, ref) => {
  const { data: userRoles = [], isLoading, error } = useUserRoles();
  const { data: users = [] } = useUsers();
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

  const [pageAccessOpen, setPageAccessOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const currentUser = useSelector((state: RootState) => state.auth.user);

  const handleOpen = (role?: UserRoleInput) => {
    if (role) {
      setEditingRole(role);
      setFormData(role);
    } else {
      setEditingRole(null);
      setFormData({ role: "", description: "", isActive: true });
    }
    setOpen(true);
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
      setDeleteConfirmId(null);
    } catch (err) {
      showSnackbar("Failed to delete role", "error");
    }
  };

  const columns: GridColDef[] = (
    [
      {
        field: "srNo",
        headerName: "Sr No",
        width: 70,
        renderCell: (params) =>
          userRoles.findIndex((r: any) => r.id === params.row.id) + 1,
      },
      { field: "role", headerName: "Role Name", flex: 1, minWidth: 120 },
      {
        field: "description",
        headerName: "Description",
        flex: 1.5,
        minWidth: 150,
      },
      {
        field: "createdBy",
        headerName: "Created By",
        width: 180,
        renderCell: (params) => {
          const u = users.find((u: any) => u.id === params.row.createdBy);
          return u ? u.userName : params.row.createdBy || "-";
        },
      },
      {
        field: "createdDate",
        headerName: "Created Date",
        width: 180,
        valueFormatter: (params) => {
          if (!params.value) return "N/A";
          return new Date(params.value).toLocaleString();
        },
      },
      // {
      //   field: "isActive",
      //   headerName: "Status",
      //   width: 100,
      //   renderCell: (params) => (
      //     <Typography
      //       variant="body2"
      //       sx={{
      //         color: params.value ? "success.main" : "error.main",
      //         fontWeight: 600,
      //       }}
      //     >
      //       {params.value ? "Active" : "Inactive"}
      //     </Typography>
      //   ),
      // },
      ...(currentUser?.role?.toLowerCase() === "admin"
        ? [
            {
              field: "pageaccess",
              headerName: "Page Access",
              flex: 1,
              minWidth: 100,
              renderCell: (params: any) => {
                const isInactive = !params.row.isActive;
                return (
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={isInactive}
                    onClick={() => {
                      if (isInactive) return;
                      setSelectedRole(params.row);
                      setPageAccessOpen(true);
                    }}
                    sx={{
                      color: "#6B288A",
                      borderColor: "#c084fc",
                      fontWeight: 600,
                      borderRadius: 4,
                      fontSize: "0.75rem !important",
                      px: 2,
                      py: 0.3,
                      textTransform: "none",
                      "&:hover": {
                        borderColor: "#6B288A",
                        backgroundColor: "rgba(107, 40, 138, 0.04)",
                      },
                    }}
                  >
                    Edit
                  </Button>
                );
              },
            } as GridColDef,
          ]
        : []),
      {
        field: "actions",
        headerName: "Actions",
        width: 120,
        sortable: false,
        renderCell: (params) => {
          const isInactive = !params.row.isActive;
          const isConfirming = deleteConfirmId === params.row.id;

          return (
            <Box>
              {isConfirming ? (
                <>
                  <Tooltip title="Confirm Delete">
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => handleDelete(params.row.id)}
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
                  <Tooltip title={isInactive ? "Inactive - cannot edit" : "Edit"}>
                    <span>
                      {" "}
                      {/* 👈 required for tooltip on disabled button */}
                      <IconButton
                        size="small"
                        color="primary"
                        disabled={isInactive}
                        onClick={() => {
                          if (isInactive) return;
                          handleOpen(params.row);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>

                  <Tooltip
                    title={isInactive ? "Inactive - cannot delete" : "Delete"}
                  >
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={isInactive}
                        onClick={() => {
                          if (isInactive) return;
                          setDeleteConfirmId(params.row.id);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </>
              )}
            </Box>
          );
        },
      },
    ] as GridColDef[]
  ).map((c) => ({ ...c, align: "center", headerAlign: "center" }));

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="40vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Error loading roles. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <>
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
              rows={userRoles}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10 },
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

      {/* Add / Edit Role Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>{editingRole ? "Edit Role" : "Add Role"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Role Name"
            fullWidth
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            // disabled={!!editingRole}
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.role}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <PageAccessDialog
        open={pageAccessOpen}
        onClose={() => {
          setPageAccessOpen(false);
          setSelectedRole(null);
        }}
        roleId={selectedRole?.id || null}
        roleName={selectedRole?.role || ""}
      />
    </>
  );
});

const DepartmentTab = forwardRef<TabHandle, TabProps>(
  ({ showSnackbar }, ref) => {
    const { data: departments = [], isLoading, error } = useDepartments();
    const { data: users = [] } = useUsers();
    const addMutation = useAddDepartment();
    const updateMutation = useUpdateDepartment();
    const deleteMutation = useDeleteDepartment();

    const [open, setOpen] = useState(false);
    const [departmentName, setDepartmentName] = useState("");
    const [editingDepartment, setEditingDepartment] = useState<any>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);

    const saving = addMutation.isPending || updateMutation.isPending;

    const queryClient = useQueryClient();
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
            `Failed to ${editingDepartment ? "update" : "add"} department.`,
        );
      }
    };

    const handleDelete = async (id: number) => {
      try {
        await deleteMutation.mutateAsync(id);
        showSnackbar("Department deleted successfully");
        setDeleteConfirmId(null);
      } catch (err: any) {
        showSnackbar(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to delete department.",
          "error",
        );
      }
    };

    const filteredDepartments = departments.filter(
      (d: any) => d.isActive === 1 || d.isActive === true,
    );

    const columns: GridColDef[] = (
      [
        {
          field: "srNo",
          headerName: "Sr No",
          width: 70,
          renderCell: (params) =>
            filteredDepartments.findIndex((r: any) => r.id === params.row.id) +
            1,
        },
        {
          field: "name",
          headerName: "Department Name",
          flex: 1,
          minWidth: 150,
          renderCell: (params) =>
            params.row.name || params.row.departmentName || "-",
        },
        // {
        //   field: "isActive",
        //   headerName: "Status",
        //   width: 100,
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
          width: 160,
          renderCell: (params) => {
            const u = users.find((u: any) => u.id === params.row.createdBy);
            return u ? u.userName : params.row.createdBy || "-";
          },
        },
        {
          field: "modifiedBy",
          headerName: "Modified By",
          width: 160,
          renderCell: (params) => {
            const u = users.find((u: any) => u.id === params.row.modifiedBy);
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
                        onClick={() => handleDelete(params.row.id)}
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

    if (isLoading) {
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="40vh"
        >
          <CircularProgress />
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
                rows={filteredDepartments}
                columns={columns}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 10 },
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
                  "& .MuiDataGrid-columnHeader:focus-within": {
                    outline: "none",
                  },
                }}
              />
            </Box>
          </CardContent>
        </Card>

        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
          <DialogTitle>
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
          <DialogActions>
            <Button onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={!departmentName.trim() || saving}
              startIcon={saving ? <CircularProgress size={14} /> : undefined}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  },
);

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

  const showSnackbar = (
    message: string,
    severity: "success" | "error" = "success",
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleOpenAdd = () => {
    if (activeTab === 0) roleRef.current?.openAdd();
    if (activeTab === 1) deptRef.current?.openAdd();
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
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
          Role Management
        </Typography>
      </Stack>

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
        <Box
          sx={{
            borderBottom: "1px solid #e2e8f0",
            px: 3,
            pt: 1.5,
            pb: 0.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "white",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
            aria-label="role and department tabs"
            sx={{
              flexGrow: 1,
              "& .MuiTab-root": {
                fontWeight: 600,
                fontSize: "0.875rem",
                textTransform: "none",
                minWidth: 100,
                color: "#64748b",
              },
              "& .MuiTab-root.Mui-selected": { color: "#6B288A" },
              "& .MuiTabs-indicator": {
                backgroundColor: "#6B288A",
                height: 3,
                borderRadius: "3px 3px 0 0",
              },
            }}
          >
            <Tab label="Role" />
            <Tab label="Department" />
          </Tabs>

          <Box sx={{ ml: 2, mb: 0.5 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleOpenAdd}
              sx={{
                fontWeight: 600,
                backgroundColor: "#6B288A",
                "&:hover": { backgroundColor: "#4A1964" },
                textTransform: "none",
                borderRadius: 1,
                px: 2.5,
                py: 0.8,
                whiteSpace: "nowrap",
              }}
            >
              Add {TAB_LABELS[activeTab]}
            </Button>
          </Box>
        </Box>

        <CardContent sx={{ p: { xs: 2, md: 2.5 }, backgroundColor: "#f8fafc" }}>
          <TabPanel value={activeTab} index={0}>
            <RoleTab ref={roleRef} showSnackbar={showSnackbar} />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <DepartmentTab ref={deptRef} showSnackbar={showSnackbar} />
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
