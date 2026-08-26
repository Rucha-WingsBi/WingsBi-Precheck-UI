import { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Stack,
  MenuItem,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Grid,
  InputAdornment,
  Snackbar,
  Alert,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import {
  Edit as EditIcon,
  Add as AddIcon,
  Visibility,
  VisibilityOff,
  Search as SearchIcon,
} from "@mui/icons-material";
import {
  useUserRoles,
  useUsers,
  useUpdateUser,
  useUpdateUserStatus,
  useCreateUser,
  useRegisterUser,
  useDepartments,
  usePlants,
  useSecurityQuestions,
  usePendingUsers,
  useApproveUser,
} from "../../hooks/useMasterData";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import type { UserRole, User } from "../../types";

export default function UserManagement() {
  const { data: userRoles = [] } = useUserRoles();
  const { data: users = [], isLoading: isUsersLoading } = useUsers(true);
  const { data: pendingUsers = [], isLoading: isPendingUsersLoading } = usePendingUsers(true);
  const { data: departments = [] } = useDepartments();
  const { data: plants = [] } = usePlants();
  const { data: securityQuestions = [] } = useSecurityQuestions();
  const updateUserMutation = useUpdateUser();
  const updateUserStatusMutation = useUpdateUserStatus();
  const approveUserMutation = useApproveUser();
  const createUserMutation = useCreateUser();
  const registerUserMutation = useRegisterUser();

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const userRole = currentUser?.role;

  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("edit");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<any>({});

  const [activeTab, setActiveTab] = useState(0); // 0 = Regular User, 1 = Contractor
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message: string, severity: "success" | "error" | "warning" | "info" = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const [mainTab, setMainTab] = useState(0); // 0 = All Users, 1 = Pending Approval
  const pendingUsersCount = pendingUsers.length;
  const displayedUsers = (mainTab === 0 ? users : pendingUsers).filter((u: User) =>
    u.userName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Active/Deactive Confirmation Dialog State
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState<User | null>(null);
  const [targetStatus, setTargetStatus] = useState<boolean>(false);

  const handleUserDialogOpen = (user: any) => {
    setDialogMode("edit");
    setEditingUser(user);
    setUserFormData({
      id: user.id,
      email: user.email || "",
      userName: user.userName || "",
      userId: user.userId || "",
      departmentId: user.departmentId || "",
      plantId: user.plantId || "",
      userRoleId: user.userRoleId || "",
      isActive: user.isActive,
      modifiedBy: Number(currentUser?.id || 0),
      securityQuestionId: user.securityQuestionId || "",
      securityAnswer: user.securityAnswer || "",
      password: "",
      confirmPassword: "",
    });
    setUserDialogOpen(true);
  };

  const handleAddUserOpen = () => {
    setDialogMode("add");
    setActiveTab(0);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setEditingUser(null);
    setUserFormData({
      userName: "",
      userId: "",
      email: "",
      password: "",
      confirmPassword: "",
      roleId: "",
      departmentId: "",
      plantId: "",
      securityQuestionId: "",
      securityAnswer: "",
    });
    setUserDialogOpen(true);
  };

  const handleUserDialogClose = () => {
    setUserDialogOpen(false);
    setEditingUser(null);
    setUserFormData({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleUserSubmit = async () => {
    try {
      if (dialogMode === "edit") {
        if (userFormData.id) {
          const updatePayload: any = {
            id: userFormData.id,
            email: userFormData.email,
            userName: userFormData.userName,
            departmentId: Number(userFormData.departmentId),
            userRoleId: Number(userFormData.userRoleId),
            isActive: userFormData.isActive,
            modifiedBy: Number(currentUser?.id || 0),
          };

          if (userFormData.plantId) {
            updatePayload.plantId = Number(userFormData.plantId);
          }

          if (userFormData.securityQuestionId) {
            updatePayload.securityQuestionId = Number(userFormData.securityQuestionId);
          }
          if (userFormData.securityAnswer) {
            updatePayload.securityAnswer = userFormData.securityAnswer;
          }

          await updateUserMutation.mutateAsync(updatePayload);
          showSnackbar("User updated successfully", "success");
          handleUserDialogClose();
        }
      } else {
        if (activeTab === 0) {
          // Regular User
          if (
            !userFormData.userName ||
            !userFormData.email ||
            !userFormData.userId ||
            !userFormData.password ||
            !userFormData.confirmPassword ||
            !userFormData.roleId ||
            !userFormData.departmentId ||
            !userFormData.plantId ||
            !userFormData.securityQuestionId ||
            !userFormData.securityAnswer
          ) {
            showSnackbar("Please fill in all required fields", "error");
            return;
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(userFormData.email)) {
            showSnackbar("Invalid email format", "error");
            return;
          }

          if (userFormData.password.length < 6) {
            showSnackbar("Password must be at least 6 characters", "error");
            return;
          }

          if (userFormData.password !== userFormData.confirmPassword) {
            showSnackbar("Passwords do not match", "error");
            return;
          }

          await registerUserMutation.mutateAsync({
            userName: userFormData.userName,
            email: userFormData.email,
            userId: userFormData.userId,
            password: userFormData.password,
            userroleId: Number(userFormData.roleId),
            plantId: Number(userFormData.plantId),
            deptId: Number(userFormData.departmentId),
            securityQuestionId: Number(userFormData.securityQuestionId),
            securityAnswer: userFormData.securityAnswer,
          });
          showSnackbar("Regular user registered successfully", "success");
          handleUserDialogClose();
        } else {
          // Contractor
          if (
            !userFormData.userName ||
            !userFormData.userId ||
            !userFormData.password ||
            !userFormData.roleId ||
            !userFormData.departmentId
          ) {
            showSnackbar("Please fill in all required fields", "error");
            return;
          }

          await createUserMutation.mutateAsync({
            userName: userFormData.userName,
            userId: userFormData.userId,
            password: userFormData.password,
            roleId: Number(userFormData.roleId),
            departmentId: Number(userFormData.departmentId),
          });
          showSnackbar("Contractor registered successfully", "success");
          handleUserDialogClose();
        }
      }
    } catch (error: any) {
      console.error(error);
      showSnackbar(
        error?.response?.data?.message || error?.message || "Operation failed",
        "error"
      );
    }
  };

  const handleToggleUserStatus = (user: User, checked: boolean) => {
    if (Number(user.id) === Number(currentUser?.id)) {
      showSnackbar("You cannot deactivate your own account.", "error");
      return;
    }
    setUserToToggle(user);
    setTargetStatus(checked);
    setConfirmDialogOpen(true);
  };

  const handleConfirmStatusToggle = async () => {
    if (!userToToggle) return;
    try {
      await updateUserStatusMutation.mutateAsync({
        id: userToToggle.id,
        isActive: targetStatus,
        modifiedBy: Number(currentUser?.id || 0),
      });
      showSnackbar(
        `User "${userToToggle.userName}" ${targetStatus ? "activated" : "deactivated"} successfully`,
        "success"
      );
    } catch (error: any) {
      console.error(error);
      showSnackbar(
        error?.response?.data?.message || error?.message || "Operation failed",
        "error"
      );
    } finally {
      setConfirmDialogOpen(false);
      setUserToToggle(null);
    }
  };

  const handleCancelStatusToggle = () => {
    setConfirmDialogOpen(false);
    setUserToToggle(null);
  };

  const handleApproveUser = async (user: User) => {
    try {
      await approveUserMutation.mutateAsync(user.id);
      showSnackbar(`User "${user.userName}" approved successfully`, "success");
    } catch (error: any) {
      console.error(error);
      showSnackbar(
        error?.response?.data?.message || error?.message || "Operation failed",
        "error"
      );
    }
  };

  const pendingColumns: GridColDef[] = [
    {
      field: "srNo",
      headerName: "Sr No",
      width: 70,
      renderCell: (params) =>
        params.api.getSortedRowIds().indexOf(params.id) + 1,
    },
    { field: "userName", headerName: "Full Name", flex: 1.5, minWidth: 150 },
    { field: "email", headerName: "User Email", width: 200 },
    { field: "userId", headerName: "User ID", width: 150 },
    {
      field: "plantName",
      headerName: "Plant",
      width: 120,
      valueGetter: (params: any) => {
        const row = params.row || params;
        const plant = plants.find((p: any) => p.id === row.plantId);
        return plant ? plant.name || plant.plantname : "";
      },
    },
    {
      field: "role",
      headerName: "Role",
      width: 120,
      valueGetter: (params: any) => {
        const row = params.row || params;
        if (row.role) return row.role;
        const roleObj = userRoles.find((r: any) => r.id === row.userRoleId || r.id === row.roleId);
        return roleObj ? roleObj.role : "";
      },
    },
    {
      field: "departmentName",
      headerName: "Department",
      width: 150,
      valueGetter: (params: any) => {
        const row = params.row || params;
        if (row.departmentName) return row.departmentName;
        const deptObj = departments.find((d: any) => d.id === row.departmentId || d.id === row.deptId);
        return deptObj ? deptObj.name : "";
      },
    },
    {
      field: "isActive",
      headerName: "Status",
      width: 150,
      renderCell: () => (
        <Typography
          variant="body2"
          sx={{
            color: "warning.main",
            fontWeight: 600,
          }}
        >
          Pending Approval
        </Typography>
      ),
    },
    {
      field: "approveUser",
      headerName: "Approve User",
      width: 130,
      sortable: false,
      renderCell: (params) => {
        const isAdmin = userRole === "Admin";

        return (
          <Tooltip title={!isAdmin ? "Only administrators can approve users" : ""}>
            <span>
              <Button
                variant="contained"
                size="small"
                onClick={() => handleApproveUser(params.row)}
                disabled={!isAdmin || approveUserMutation.isPending}
                sx={{
                  fontWeight: 600,
                  backgroundColor: "#6B288A",
                  "&.Mui-disabled": {
                    backgroundColor: "rgba(0, 0, 0, 0.12)",
                  },
                  "&:hover": { backgroundColor: "#4A1964" },
                  textTransform: "none",
                  borderRadius: 1,
                  px: 2,
                }}
              >
                Approve
              </Button>
            </span>
          </Tooltip>
        );
      },
    },
  ];

  const userColumns: GridColDef[] = [
    {
      field: "srNo",
      headerName: "Sr No",
      width: 70,
      renderCell: (params) =>
        params.api.getSortedRowIds().indexOf(params.id) + 1,
    },
    { field: "userName", headerName: "Full Name", flex: 1.5, minWidth: 150 },
    { field: "email", headerName: "User Email", width: 200 },
    { field: "userId", headerName: "User ID", width: 150 },
    {
      field: "plantName",
      headerName: "Plant",
      width: 120,
      valueGetter: (params: any) => {
        const row = params.row || params;
        const plant = plants.find((p: any) => p.id === row.plantId);
        return plant ? plant.name || plant.plantname : "";
      },
    },
    { field: "role", headerName: "Role", width: 120 },
    { field: "departmentName", headerName: "Department", width: 150 },
    {
      field: "isActive",
      headerName: "Status",
      width: 100,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            color: params.value ? "success.main" : "error.main",
            fontWeight: 600,
          }}
        >
          {params.value ? "Active" : "Inactive"}
        </Typography>
      ),
    },
    {
      field: "deactivateUser",
      headerName: "Deactivate User",
      width: 140,
      sortable: false,
      renderCell: (params) => {
        const isAdmin = userRole === "Admin";
        const isSelf = Number(params.row.id) === Number(currentUser?.id);

        const switchEl = (
          <Switch
            checked={Boolean(params.row.isActive)}
            disabled={!isAdmin || isSelf}
            onChange={(e) => handleToggleUserStatus(params.row, e.target.checked)}
            color="primary"
            size="small"
          />
        );

        if (!isAdmin) {
          return (
            <Tooltip title="Only administrators can change status" arrow>
              <span>{switchEl}</span>
            </Tooltip>
          );
        }

        if (isSelf) {
          return (
            <Tooltip title="You cannot deactivate your own account" arrow>
              <span>{switchEl}</span>
            </Tooltip>
          );
        }

        return (
          <Tooltip title={params.row.isActive ? "Deactivate User" : "Activate User"} arrow>
            {switchEl}
          </Tooltip>
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 80,
      sortable: false,
      renderCell: (params) => {
        const isAdmin = userRole === "Admin";
        const isActive = Boolean(params.row.isActive);

        let tooltipTitle = "Edit User";
        if (!isAdmin) {
          tooltipTitle = "Only administrators can edit users";
        } else if (!isActive) {
          tooltipTitle = "Cannot edit inactive user";
        }

        return (
          <Tooltip title={tooltipTitle}>
            <span>
              <IconButton
                size="small"
                color="primary"
                disabled={!isAdmin || !isActive}
                onClick={() => handleUserDialogOpen(params.row)}
                sx={{
                  "&:focus": { outline: "none", boxShadow: "none" },
                  "&:active": { outline: "none", boxShadow: "none" },
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        );
      },
    },
  ];

  if (isUsersLoading || isPendingUsersLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

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
          User Management
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Total Users: {users.length}
          </Typography>
          {userRole === "Admin" && (<Button
            variant="contained"
            size="small"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddUserOpen}
            sx={{
              fontWeight: 600,
              backgroundColor: "#6B288A",
              "&:hover": { backgroundColor: "#4A1964" },
              textTransform: "none",
              borderRadius: 1.5,
              px: 2.5,
            }}
          >
            Add User
          </Button>
          )}
        </Stack>
      </Stack>

      <Card elevation={2}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2, pt: 1, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          <Tabs
            value={mainTab}
            onChange={(e, newValue) => setMainTab(newValue)}
            sx={{
              "& .MuiTab-root": {
                fontWeight: 600,
                textTransform: "none",
                fontSize: "0.9rem",
              },
              "& .Mui-selected": {
                color: "#6B288A !important",
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#6B288A",
              },
            }}
          >
            <Tab label="All Users" />
            <Tab label={`Pending Approval (${pendingUsersCount})`} />
          </Tabs>
          <TextField
            placeholder="Search by name..."
            size="small"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              mb: 1,
              width: { xs: "100%", sm: 260 },
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <Box sx={{ width: "100%" }}>
            <DataGrid
              autoHeight
              rows={displayedUsers}
              columns={mainTab === 0 ? userColumns : pendingColumns}
              loading={mainTab === 0 ? isUsersLoading : isPendingUsersLoading}
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
                  backgroundColor: "rgba(168, 0, 90, 0.04)",
                  borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
                },
                "& .MuiDataGrid-cell": {
                  borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
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

      <Dialog
        open={userDialogOpen}
        onClose={handleUserDialogClose}
        maxWidth="sm"
        fullWidth
      >
        {dialogMode === "edit" && (
          <DialogTitle sx={{ fontWeight: 600, color: "primary.main" }}>
            Edit User: {editingUser?.userName}
          </DialogTitle>
        )}
        <DialogContent
          dividers={dialogMode === "edit"}
          sx={{
            p: dialogMode === "add" ? 0 : 2,
            borderBottom: dialogMode === "add" ? "1px solid rgba(0, 0, 0, 0.12)" : "none",
          }}
        >
          {dialogMode === "add" && (
            <Box sx={{ width: "100%" }}>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                variant="fullWidth"
                sx={{
                  mb: 3,
                  borderBottom: 1,
                  borderColor: "divider",
                  "& .MuiTab-root": {
                    fontWeight: 600,
                    textTransform: "none",
                    fontSize: "1rem",
                  },
                  "& .Mui-selected": {
                    color: "#6B288A !important",
                  },
                  "& .MuiTabs-indicator": {
                    backgroundColor: "#6B288A",
                  },
                }}
              >
                <Tab label="Regular User" />
                <Tab label="Contractor" />
              </Tabs>
            </Box>
          )}

          {dialogMode === "edit" && (
            <Box sx={{ px: 3, pb: 3, pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Full Name"
                    fullWidth
                    size="small"
                    required
                    value={userFormData.userName || ""}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, userName: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    size="small"
                    required
                    value={userFormData.email || ""}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, email: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="User ID"
                    fullWidth
                    size="small"
                    disabled
                    InputProps={{
                      readOnly: true,
                    }}
                    value={userFormData.userId || ""}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Role"
                    fullWidth
                    size="small"
                    required
                    value={userFormData.userRoleId || ""}
                    onChange={(e) =>
                      setUserFormData({
                        ...userFormData,
                        userRoleId: Number(e.target.value),
                      })
                    }
                  >
                    {userRoles.map((role: UserRole) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.role}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Department"
                    fullWidth
                    size="small"
                    required
                    value={userFormData.departmentId || ""}
                    onChange={(e) =>
                      setUserFormData({
                        ...userFormData,
                        departmentId: Number(e.target.value),
                      })
                    }
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Plant"
                    fullWidth
                    size="small"
                    value={userFormData.plantId || ""}
                    onChange={(e) =>
                      setUserFormData({
                        ...userFormData,
                        plantId: e.target.value ? Number(e.target.value) : "",
                      })
                    }
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {plants.map((plant: any) => (
                      <MenuItem key={plant.id} value={plant.id}>
                        {plant.name || plant.plantname}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Security Question"
                    fullWidth
                    size="small"
                    value={userFormData.securityQuestionId || ""}
                    onChange={(e) =>
                      setUserFormData({
                        ...userFormData,
                        securityQuestionId: Number(e.target.value),
                      })
                    }
                  >
                    {securityQuestions.map((q: any) => (
                      <MenuItem key={q.id} value={q.id}>
                        {q.question || q.securityQuestion}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Security Answer"
                    fullWidth
                    size="small"
                    value={userFormData.securityAnswer || ""}
                    onChange={(e) =>
                      setUserFormData({
                        ...userFormData,
                        securityAnswer: e.target.value,
                      })
                    }
                  />
                </Grid>

              </Grid>
            </Box>
          )}

          {dialogMode === "add" && activeTab === 0 && (
            <Box sx={{ px: 3, pb: 3, pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Full Name"
                    fullWidth
                    size="small"
                    required
                    value={userFormData.userName || ""}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, userName: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    size="small"
                    required
                    value={userFormData.email || ""}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, email: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="User ID"
                    fullWidth
                    size="small"
                    required
                    value={userFormData.userId || ""}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, userId: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Role"
                    fullWidth
                    size="small"
                    required
                    value={userFormData.roleId || ""}
                    onChange={(e) =>
                      setUserFormData({
                        ...userFormData,
                        roleId: Number(e.target.value),
                      })
                    }
                  >
                    {userRoles
                      .filter((role: any) => role.role !== "Admin")
                      .map((role: UserRole) => (
                        <MenuItem key={role.id} value={role.id}>
                          {role.role}
                        </MenuItem>
                      ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Department"
                    fullWidth
                    size="small"
                    required
                    value={userFormData.departmentId || ""}
                    onChange={(e) =>
                      setUserFormData({
                        ...userFormData,
                        departmentId: Number(e.target.value),
                      })
                    }
                  >
                    {departments
                      .filter((dept: any) => dept.name !== "Admin")
                      .map((dept) => (
                        <MenuItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </MenuItem>
                      ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Plant"
                    fullWidth
                    size="small"
                    required
                    value={userFormData.plantId || ""}
                    onChange={(e) =>
                      setUserFormData({
                        ...userFormData,
                        plantId: Number(e.target.value),
                      })
                    }
                  >
                    {plants.map((plant: any) => (
                      <MenuItem key={plant.id} value={plant.id}>
                        {plant.name || plant.plantname}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Security Question"
                    fullWidth
                    size="small"
                    required
                    value={userFormData.securityQuestionId || ""}
                    onChange={(e) =>
                      setUserFormData({
                        ...userFormData,
                        securityQuestionId: Number(e.target.value),
                      })
                    }
                  >
                    {securityQuestions.map((q: any) => (
                      <MenuItem key={q.id} value={q.id}>
                        {q.question || q.securityQuestion}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Security Answer"
                    fullWidth
                    size="small"
                    required
                    value={userFormData.securityAnswer || ""}
                    onChange={(e) =>
                      setUserFormData({
                        ...userFormData,
                        securityAnswer: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    size="small"
                    required
                    value={userFormData.password || ""}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, password: e.target.value })
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Confirm Password"
                    type={showConfirmPassword ? "text" : "password"}
                    fullWidth
                    size="small"
                    required
                    value={userFormData.confirmPassword || ""}
                    onChange={(e) =>
                      setUserFormData({
                        ...userFormData,
                        confirmPassword: e.target.value,
                      })
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle confirm password visibility"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            size="small"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {dialogMode === "add" && activeTab === 1 && (
            <Box sx={{ px: 3, pb: 3, pt: 1, width: "100%" }}>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label="Full Name"
                  fullWidth
                  size="small"
                  required
                  value={userFormData.userName || ""}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, userName: e.target.value })
                  }
                />
                <TextField
                  label="User ID"
                  fullWidth
                  size="small"
                  required
                  value={userFormData.userId || ""}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, userId: e.target.value })
                  }
                />
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  size="small"
                  required
                  value={userFormData.password || ""}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, password: e.target.value })
                  }
                />
                <TextField
                  select
                  label="Role"
                  fullWidth
                  size="small"
                  required
                  value={userFormData.roleId || ""}
                  onChange={(e) =>
                    setUserFormData({
                      ...userFormData,
                      roleId: Number(e.target.value),
                    })
                  }
                >
                  {userRoles.map((role: UserRole) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.role}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Department"
                  fullWidth
                  size="small"
                  required
                  value={userFormData.departmentId || ""}
                  onChange={(e) =>
                    setUserFormData({
                      ...userFormData,
                      departmentId: Number(e.target.value),
                    })
                  }
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleUserDialogClose} variant="outlined" color="secondary" size="small">
            Cancel
          </Button>
          <Button
            onClick={handleUserSubmit}
            variant="contained"
            size="small"
            disabled={
              dialogMode === "edit"
                ? updateUserMutation.isPending
                : activeTab === 0
                  ? registerUserMutation.isPending
                  : createUserMutation.isPending
            }
            sx={{
              backgroundColor: "#6B288A",
              "&:hover": { backgroundColor: "#4A1964" },
            }}
          >
            {dialogMode === "edit"
              ? updateUserMutation.isPending
                ? "Saving..."
                : "Save Changes"
              : activeTab === 0
                ? registerUserMutation.isPending
                  ? "Creating..."
                  : "Create User"
                : createUserMutation.isPending
                  ? "Creating..."
                  : "Create User"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toggle Status Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelStatusToggle}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, color: targetStatus ? "success.main" : "error.main" }}>
          {targetStatus ? "Activate User" : "Deactivate User"}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1">
            Are you sure you want to <strong>{targetStatus ? "activate" : "deactivate"}</strong> the user account for{" "}
            <strong>{userToToggle?.userName}</strong>?
          </Typography>
          {!targetStatus && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              Deactivating this user will prevent them from logging in and accessing the application.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCancelStatusToggle} variant="outlined" color="secondary" size="small">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmStatusToggle}
            variant="contained"
            color={targetStatus ? "success" : "error"}
            size="small"
            disabled={updateUserStatusMutation.isPending}
            sx={{
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 1.5,
              px: 2.5,
            }}
          >
            {updateUserStatusMutation.isPending ? "Processing..." : targetStatus ? "Activate" : "Deactivate"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'error' ? null : 6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
