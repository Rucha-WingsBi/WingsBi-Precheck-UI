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
  Collapse,
} from "@mui/material";
import {
  Close as CloseIcon,
  SubdirectoryArrowRight as SubdirectoryArrowRightIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
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
  const [expandedParents, setExpandedParents] = useState<Record<number, boolean>>({});
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

  // Calculate total pages count and active permissions count
  const { totalPagesCount, activeAccessCount } = useMemo(() => {
    if (!pageAccessData) return { totalPagesCount: 0, activeAccessCount: 0 };
    let total = 0;
    const countItems = (items: PageAccessItem[]) => {
      items.forEach((item) => {
        total++;
        if (item.children && item.children.length > 0) {
          countItems(item.children);
        }
      });
    };
    countItems(pageAccessData);

    const active = Object.values(accessState).filter((val) => val === "full").length;
    return { totalPagesCount: total, activeAccessCount: active };
  }, [pageAccessData, accessState]);

  const toggleExpandParent = (parentId: number) => {
    setExpandedParents((prev) => ({
      ...prev,
      [parentId]: prev[parentId] !== undefined ? !prev[parentId] : false,
    }));
  };

  const handleToggleAccess = (targetItem: PageAccessItem, currentAccess: "full" | "none") => {
    const nextAccess = currentAccess === "full" ? "none" : "full";

    setAccessState((prev) => {
      const nextState = { ...prev };

      // Recursively set target item and all nested children
      const setRecursive = (item: PageAccessItem, access: "full" | "none") => {
        nextState[item.id] = access;
        if (item.children && item.children.length > 0) {
          item.children.forEach((child) => setRecursive(child, access));
        }
      };

      setRecursive(targetItem, nextAccess);

      // If turning ON a child page, automatically turn ON its parent page
      if (nextAccess === "full" && targetItem.parentId) {
        nextState[targetItem.parentId] = "full";
      }

      // If turning OFF a child page, turn parent OFF if no active children remain
      if (nextAccess === "none" && targetItem.parentId && pageAccessData) {
        const findParent = (items: PageAccessItem[], id: number): PageAccessItem | undefined => {
          for (const item of items) {
            if (item.id === id) return item;
            if (item.children) {
              const found = findParent(item.children, id);
              if (found) return found;
            }
          }
          return undefined;
        };

        const parent = findParent(pageAccessData, targetItem.parentId);
        if (parent && parent.children) {
          const hasActiveChild = parent.children.some(
            (c) => nextState[c.id] === "full"
          );
          if (!hasActiveChild) {
            nextState[parent.id] = "none";
          }
        }
      }

      return nextState;
    });
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
          mt: "56px",
          height: "calc(100vh - 56px)",
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
            ) : !pageAccessData || pageAccessData.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                No pages available
              </Typography>
            ) : (
              <Stack spacing={1.2}>
                {pageAccessData.map((parent) => {
                  const hasChildren = Boolean(parent.children && parent.children.length > 0);
                  const isParentFull = accessState[parent.id] === "full";
                  const isExpanded = expandedParents[parent.id] ?? true;

                  const activeChildrenCount = hasChildren
                    ? parent.children.filter((c) => accessState[c.id] === "full").length
                    : 0;
                  const totalChildrenCount = hasChildren ? parent.children.length : 0;

                  return (
                    <Box
                      key={parent.id}
                      sx={{
                        border: "1px solid",
                        borderColor: isParentFull ? "rgba(109, 42, 143, 0.3)" : "neutral.border",
                        borderRadius: 2,
                        overflow: "hidden",
                        backgroundColor: "background.paper",
                        boxShadow: "0px 1px 3px rgba(0,0,0,0.04)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {/* Parent Header */}
                      <Box
                        sx={{
                          py: 1.2,
                          px: 1.5,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: hasChildren ? "pointer" : "default",
                          backgroundColor: isParentFull
                            ? "rgba(109, 42, 143, 0.04)"
                            : "background.paper",
                          "&:hover": {
                            backgroundColor: "action.hover",
                          },
                        }}
                        onClick={() => {
                          if (hasChildren) toggleExpandParent(parent.id);
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1}>
                          {hasChildren ? (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpandParent(parent.id);
                              }}
                              sx={{
                                p: 0.25,
                                color: "primary.main",
                              }}
                            >
                              {isExpanded ? (
                                <KeyboardArrowDownIcon fontSize="small" />
                              ) : (
                                <ChevronRightIcon fontSize="small" />
                              )}
                            </IconButton>
                          ) : (
                            <Box sx={{ width: 24 }} />
                          )}

                          <Box>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography
                                variant="body2"
                                fontWeight={700}
                                color="text.primary"
                                sx={{ fontSize: "0.88rem" }}
                              >
                                {parent.pageName}
                              </Typography>

                              {hasChildren && (
                                <Chip
                                  label={`${activeChildrenCount}/${totalChildrenCount} active`}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: "0.68rem",
                                    fontWeight: 600,
                                    backgroundColor:
                                      activeChildrenCount > 0
                                        ? "rgba(109, 42, 143, 0.12)"
                                        : "neutral.chipBg",
                                    color:
                                      activeChildrenCount > 0
                                        ? "primary.main"
                                        : "text.secondary",
                                  }}
                                />
                              )}
                            </Stack>
                          </Box>
                        </Box>

                        {/* Master Switch for Parent */}
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Switch
                            size="small"
                            color="primary"
                            checked={isParentFull}
                            onChange={() =>
                              handleToggleAccess(parent, accessState[parent.id] || "none")
                            }
                          />
                          <Typography
                            variant="caption"
                            fontWeight={600}
                            color={isParentFull ? "primary.main" : "text.secondary"}
                            sx={{ minWidth: 22 }}
                          >
                            {isParentFull ? "On" : "Off"}
                          </Typography>
                        </Stack>
                      </Box>

                      {/* Collapsible Children Section */}
                      {hasChildren && (
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit={false}>
                          <Box
                            sx={{
                              bgcolor: "rgba(109, 42, 143, 0.02)",
                              borderTop: "1px solid",
                              borderColor: "neutral.border",
                              p: 1.2,
                              pl: 2.5,
                            }}
                          >
                            <Stack spacing={0.8}>
                              {parent.children.map((child) => {
                                const isChildFull = accessState[child.id] === "full";
                                return (
                                  <Box
                                    key={child.id}
                                    sx={{
                                      py: 0.8,
                                      px: 1.5,
                                      borderRadius: 1.5,
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      backgroundColor: isChildFull ? "white" : "transparent",
                                      border: isChildFull ? "1px solid" : "1px dashed",
                                      borderColor: isChildFull
                                        ? "rgba(109, 42, 143, 0.3)"
                                        : "neutral.border",
                                      boxShadow: isChildFull
                                        ? "0px 1px 3px rgba(109, 42, 143, 0.06)"
                                        : "none",
                                      transition: "all 0.15s ease",
                                    }}
                                  >
                                    <Box display="flex" alignItems="center" gap={1}>
                                      <SubdirectoryArrowRightIcon
                                        sx={{
                                          fontSize: 16,
                                          color: isChildFull
                                            ? "primary.main"
                                            : "text.disabled",
                                        }}
                                      />
                                      <Typography
                                        variant="body2"
                                        fontWeight={isChildFull ? 600 : 500}
                                        color={isChildFull ? "text.primary" : "text.secondary"}
                                        sx={{ fontSize: "0.82rem" }}
                                      >
                                        {child.pageName}
                                      </Typography>
                                    </Box>

                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                      <Switch
                                        size="small"
                                        color="primary"
                                        checked={isChildFull}
                                        onChange={() =>
                                          handleToggleAccess(
                                            child,
                                            accessState[child.id] || "none"
                                          )
                                        }
                                      />
                                      <Typography
                                        variant="caption"
                                        fontWeight={600}
                                        color={isChildFull ? "primary.main" : "text.secondary"}
                                        sx={{ minWidth: 22 }}
                                      >
                                        {isChildFull ? "On" : "Off"}
                                      </Typography>
                                    </Stack>
                                  </Box>
                                );
                              })}
                            </Stack>
                          </Box>
                        </Collapse>
                      )}
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
            {saving ? "Saving..." : "Save "}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
};

export default EditRoleDrawer;
