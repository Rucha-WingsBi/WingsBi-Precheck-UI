import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  TextField,
  Switch,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Chip,
  Divider,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";
import {
  usePageAccess,
  useUpdatePageAccess,
  useUpdateUserRole,
  useUsers,
} from "../../../hooks/useMasterData";
import type { PageAccessItem, UpdatePageAccessRequest } from "../../../types";

interface EditRoleDrawerProps {
  open: boolean;
  onClose: () => void;
  role: {
    id: number;
    role: string;
    description: string;
    isActive: boolean;
  } | null;
  showSnackbar: (msg: string, severity?: "success" | "error") => void;
}

const EditRoleDrawer: React.FC<EditRoleDrawerProps> = ({
  open,
  onClose,
  role,
  showSnackbar,
}) => {
  const [activeTab, setActiveTab] = useState(1);
  const [formData, setFormData] = useState({ role: "", description: "" });
  const [accessState, setAccessState] = useState<Record<number, "full" | "none">>({});
  const [saving, setSaving] = useState(false);

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const { data: users = [] } = useUsers();
  const { data: pageAccessData, isLoading: isAccessLoading, error: accessError } = usePageAccess(
    role?.id ?? null
  );

  const updateRoleMutation = useUpdateUserRole();
  const updatePageAccessMutation = useUpdatePageAccess();

  const initialStateRef = useRef<Record<number, "full" | "none">>({});

  // Sync role data when role changes
  useEffect(() => {
    if (role) {
      setFormData({
        role: role.role || "",
        description: role.description || "",
      });
      setActiveTab(1);
    }
  }, [role]);

  // Sync page access data when API responds
  useEffect(() => {
    if (pageAccessData) {
      const initialState: Record<number, "full" | "none"> = {};
      const traverse = (items: PageAccessItem[]) => {
        items.forEach((item) => {
          initialState[item.id] = item.fullAccess ? "full" : "none";
          if (item.children && item.children.length > 0) {
            traverse(item.children);
          }
        });
      };
      traverse(pageAccessData);
      initialStateRef.current = initialState;
      setAccessState(initialState);
    }
  }, [pageAccessData]);

  // Calculate count of active users on this role
  const userCount = useMemo(() => {
    if (!role) return 0;
    return users.filter(
      (u: any) =>
        u.userRoleId === role.id ||
        u.roleId === role.id ||
        (u.role && u.role.toLowerCase() === role.role.toLowerCase())
    ).length;
  }, [users, role]);

  // Flatten page items for display
  const flatPageItems = useMemo(() => {
    if (!pageAccessData) return [];
    const list: { item: PageAccessItem; category: string }[] = [];
    const traverse = (items: PageAccessItem[], parentCategory: string) => {
      items.forEach((item) => {
        const cat = parentCategory || "-";
        list.push({ item, category: cat });
        if (item.children && item.children.length > 0) {
          traverse(item.children, item.pageName);
        }
      });
    };
    traverse(pageAccessData, "");
    return list;
  }, [pageAccessData]);

  // Count full access items
  const activeAccessCount = useMemo(() => {
    return Object.values(accessState).filter((val) => val === "full").length;
  }, [accessState]);

  const totalPagesCount = flatPageItems.length;

  const handleToggleAccess = (pageId: number, currentAccess: "full" | "none") => {
    const newAccess = currentAccess === "full" ? "none" : "full";
    setAccessState((prev) => ({
      ...prev,
      [pageId]: newAccess,
    }));
  };

  const handleSave = async () => {
    if (!role) return;
    setSaving(true);

    try {
      const currentUserId = currentUser?.id ? Number(currentUser.id) : 1;

      // 1. Update role details
      await updateRoleMutation.mutateAsync({
        id: role.id,
        role: formData.role,
        description: formData.description,
        isActive: role.isActive ?? true,
        modifiedBy: currentUserId,
      });

      // 2. Update page access diff
      const changedEntries = Object.entries(accessState).filter(
        ([pageId, access]) => initialStateRef.current[Number(pageId)] !== access
      );

      if (changedEntries.length > 0) {
        const payload: UpdatePageAccessRequest[] = changedEntries.map(
          ([pageId, access]) => ({
            roleId: role.id,
            fullAccess: access === "full",
            noAccess: access === "none",
            modifiedBy: currentUserId,
            pageId: Number(pageId),
          })
        );
        await updatePageAccessMutation.mutateAsync(payload);
      }

      showSnackbar("Role updated successfully");
      onClose();
    } catch (err: any) {
      showSnackbar(
        err?.response?.data?.message || err?.message || "Failed to update role",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 440 },
          mt: { xs: "56px", sm: "64px" },
          height: { xs: "calc(100vh - 56px)", sm: "calc(100vh - 64px)" },
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Sticky Header */}
      <Box
        sx={{
          p: 1.5,
          px: 2.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid",
          borderColor: "neutral.border",
          backgroundColor: "background.paper",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ fontSize: "1.05rem" }}>
            Edit Role
          </Typography>
          {role?.role && (
            <Chip
              label={role.role}
              size="small"
              sx={{
                height: 22,
                fontSize: "0.75rem",
                fontWeight: 600,
                backgroundColor: "primary.main",
                color: "white",
              }}
            />
          )}
        </Stack>

        <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Tabs Bar */}
      <Box
        sx={{
          borderBottom: "1px solid",
          borderColor: "neutral.border",
          px: 2.5,
          pt: 0.5,
          bgcolor: "background.paper",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_e, val) => setActiveTab(val)}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            minHeight: 36,
            "& .MuiTab-root": {
              fontWeight: 600,
              fontSize: "0.85rem",
              textTransform: "none",
              minHeight: 36,
              py: 0,
              mr: 2,
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
          <Tab label="Details" />
          <Tab
            label={
              <Stack direction="row" alignItems="center" gap={1}>
                <span>Page access</span>
                {totalPagesCount > 0 && (
                  <Chip
                    label={`${activeAccessCount} / ${totalPagesCount}`}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      backgroundColor: "neutral.chipBg",
                      color: "text.secondary",
                    }}
                  />
                )}
              </Stack>
            }
          />
        </Tabs>
      </Box>

      {/* Drawer Body Content */}
      <Box sx={{ flex: 1, overflowY: "auto", p: 2, px: 2.5 }}>
        {/* Tab 0: Details */}
        {activeTab === 0 && (
          <Stack spacing={2}>
            <TextField
              label="Role Name"
              fullWidth
              size="small"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            />
            <TextField
              label="Description (Optional)"
              fullWidth
              multiline
              rows={3}
              size="small"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </Stack>
        )}

        {/* Tab 1: Page access */}
        {activeTab === 1 && (
          <Box>
            {isAccessLoading ? (
              <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress size={24} color="primary" />
              </Box>
            ) : accessError ? (
              <Alert severity="error">Failed to load page access data.</Alert>
            ) : flatPageItems.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                No pages available
              </Typography>
            ) : (
              <Stack divider={<Divider flexItem sx={{ borderColor: "neutral.chipBg" }} />}>
                {flatPageItems.map(({ item, category }) => {
                  const isFull = accessState[item.id] === "full";
                  return (
                    <Box
                      key={item.id}
                      sx={{
                        py: 1,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ fontSize: "0.85rem" }}>
                          {item.pageName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                          {category}
                        </Typography>
                      </Box>

                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Switch
                          size="small"
                          color="primary"
                          checked={isFull}
                          onChange={() => handleToggleAccess(item.id, accessState[item.id] || "none")}
                        />
                        <Typography variant="caption" fontWeight={600} color={isFull ? "text.primary" : "text.secondary"}>
                          {isFull ? "On" : "Off"}
                        </Typography>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>
        )}
      </Box>

      {/* Sticky Footer */}
      <Box
        sx={{
          p: 1.5,
          px: 2.5,
          borderTop: "1px solid",
          borderColor: "neutral.border",
          backgroundColor: "background.paper",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="caption" color="text.secondary" fontWeight={500}>
          Applies to {userCount} {userCount === 1 ? "user" : "users"} on save
        </Typography>

        <Stack direction="row" spacing={1.5}>
          <Button
            size="small"
            variant="outlined"
            onClick={onClose}
            disabled={saving}
            sx={{
              borderColor: "neutral.border",
              color: "text.primary",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 1.5,
              px: 2,
            }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleSave}
            disabled={!formData.role.trim() || saving}
            sx={{
              backgroundColor: "primary.main",
              "&:hover": { backgroundColor: "primary.dark" },
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 1.5,
              px: 2.5,
            }}
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
};

export default EditRoleDrawer;
