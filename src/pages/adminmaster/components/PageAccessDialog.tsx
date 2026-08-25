import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Radio,
  Stack,
  CircularProgress,
  Divider,
  Alert,
} from "@mui/material";
import {
  Edit as EditIcon,
  Block as BlockIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";
import {
  usePageAccess,
  useUpdatePageAccess,
} from "../../../hooks/useMasterData";
import type { PageAccessItem, UpdatePageAccessRequest } from "../../../types";

interface PageAccessDialogProps {
  open: boolean;
  onClose: () => void;
  roleId: number | null;
  roleName: string;
}

const PageAccessDialog: React.FC<PageAccessDialogProps> = ({
  open,
  onClose,
  roleId,
  roleName,
}) => {
  const { data: pageAccessData, isLoading, error } = usePageAccess(roleId);
  const updateMutation = useUpdatePageAccess();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [accessState, setAccessState] = useState<
    Record<number, "full" | "none">
  >({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  // Track the initial state loaded from API to compute diff on submit
  const initialStateRef = useRef<Record<number, "full" | "none">>({});

  const toggleExpand = (id: number) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  useEffect(() => {
    if (pageAccessData) {
      const initialState: Record<number, "full" | "none"> = {};
      const initialExpanded: Record<number, boolean> = {};
      const traverse = (items: PageAccessItem[]) => {
        items.forEach((item) => {
          initialState[item.id] = item.fullAccess
            ? "full"
            : item.noAccess
              ? "none"
              : "none";
          if (item.children && item.children.length > 0) {
            initialExpanded[item.id] = false;
            traverse(item.children);
          }
        });
      };
      traverse(pageAccessData);
      initialStateRef.current = initialState;
      setAccessState(initialState);
      setExpanded(initialExpanded);
    }
  }, [pageAccessData]);

  /** Collect all descendant IDs of a page item (children, grandchildren, etc.) */
  const collectDescendantIds = (item: PageAccessItem): number[] => {
    const ids: number[] = [];
    const walk = (node: PageAccessItem) => {
      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => {
          ids.push(child.id);
          walk(child);
        });
      }
    };
    walk(item);
    return ids;
  };

  /** Find a page item by ID anywhere in the tree */
  const findItem = (
    items: PageAccessItem[],
    targetId: number,
  ): PageAccessItem | null => {
    for (const item of items) {
      if (item.id === targetId) return item;
      if (item.children && item.children.length > 0) {
        const found = findItem(item.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const handleAccessChange = (pageId: number, access: "full" | "none") => {
    setAccessState((prev) => {
      const updates: Record<number, "full" | "none"> = { [pageId]: access };

      // If this item has children, cascade the same access to all descendants
      if (pageAccessData) {
        const item = findItem(pageAccessData, pageId);
        if (item) {
          const descendantIds = collectDescendantIds(item);
          descendantIds.forEach((id) => {
            updates[id] = access;
          });
        }
      }

      return { ...prev, ...updates };
    });
  };

  const handleSubmit = async () => {
    // Only send pages whose access has changed from the initial loaded state
    const changedEntries = Object.entries(accessState).filter(
      ([pageId, access]) => initialStateRef.current[Number(pageId)] !== access,
    );

    if (changedEntries.length === 0) {
      onClose();
      return;
    }

    const payload: UpdatePageAccessRequest[] = changedEntries.map(
      ([pageId, access]) => ({
        roleId: roleId!,
        fullAccess: access === "full",
        noAccess: access === "none",
        modifiedBy: Number(currentUser?.id || 0),
        pageId: Number(pageId),
      }),
    );
    try {
      await updateMutation.mutateAsync(payload);
      onClose();
    } catch (err) {
      console.error("Failed to update page access", err);
    }
  };

  const renderPageItem = (item: PageAccessItem, depth: number = 0) => {
    const isExpanded = expanded[item.id] ?? false;

    return (
      <Box key={item.id}>
        <Stack
          direction="row"
          alignItems="center"
          sx={{
            width: "100%",
            mx: "auto",
            px: 3,
            py: 1.2,
            gap: 2,
            borderBottom: "1px solid rgba(0,0,0,0.12)",
            backgroundColor: depth > 0 ? "#f5f5f5" : "transparent",
            "&:hover": {
              backgroundColor: depth > 0 ? "#eeeeee" : "rgba(0,0,0,0.02)",
            },
          }}
        >
          {/* Expand Icon + Page Name */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              ml: depth * 4,
            }}
          >
            {/* Collapse Arrow */}
            {item.children && item.children.length > 0 ? (
              <Box
                onClick={() => toggleExpand(item.id)}
                sx={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 24,
                  mr: 1,
                }}
              >
                {isExpanded ? (
                  <KeyboardArrowDownIcon fontSize="small" />
                ) : (
                  <KeyboardArrowRightIcon fontSize="small" />
                )}
              </Box>
            ) : (
              <Box sx={{ width: 24, mr: 1 }} />
            )}

            <Typography
              variant={depth === 0 ? "subtitle2" : "body2"}
              sx={{ fontWeight: depth === 0 ? 600 : 400 }}
            >
              {item.pageName}
            </Typography>
          </Box>

          {/* Full Access (Edit) */}
          <Box sx={{ width: 100, display: "flex", justifyContent: "center" }}>
            <Radio
              checked={accessState[item.id] === "full"}
              onChange={() => handleAccessChange(item.id, "full")}
              color="primary"
            />
          </Box>

          {/* No Access (Block) */}
          <Box sx={{ width: 100, display: "flex", justifyContent: "center" }}>
            <Radio
              checked={accessState[item.id] === "none"}
              onChange={() => handleAccessChange(item.id, "none")}
              color="primary"
            />
          </Box>
        </Stack>

        {/* Children */}
        {isExpanded &&
          item.children?.map((sub) => renderPageItem(sub, depth + 1))}
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography
          variant="h6"
          component="div"
          color="primary.main"
          sx={{ fontWeight: 600 }}
        >
          Manage Page Access
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontWeight: 600 }}
        >
          Role: {roleName}
        </Typography>
      </DialogTitle>
      <Divider />

      <DialogContent
        sx={{ mt: 0, px: 0, py: 0, maxHeight: 400, overflowY: "auto" }}
      >
        {/* Fixed table header — now sticky inside the scrollable DialogContent */}
        {!isLoading && !error && (
          <Box
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              bgcolor: "#fdf8fa", // Light pinkish solid background to match the theme
              borderBottom: "1px solid rgba(0,0,0,0.12)",
              boxShadow: "0px 2px 4px rgba(0,0,0,0.05)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                mx: "auto",
                py: 1.5,
                px: 3,
                gap: 2,
              }}
            >
              {/* Spacer to align "Page Name" with the text in the rows below */}
              <Box sx={{ width: 32 }} />
              <Typography
                variant="subtitle2"
                sx={{ flex: 1, fontWeight: 700, color: "text.primary" }}
              >
                Page Name
              </Typography>
              <Box
                sx={{ width: 100, display: "flex", justifyContent: "center" }}
              >
                <EditIcon fontSize="small" sx={{ color: "text.secondary" }} />
              </Box>
              <Box
                sx={{ width: 100, display: "flex", justifyContent: "center" }}
              >
                <BlockIcon fontSize="small" sx={{ color: "text.secondary" }} />
              </Box>
            </Box>
          </Box>
        )}
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box px={3} py={1}>
            <Alert severity="error">Failed to load page access data.</Alert>
          </Box>
        ) : (
          <Box>{pageAccessData?.map((item) => renderPageItem(item))}</Box>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2, px: 3 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={updateMutation.isPending}
          sx={{ fontWeight: 600, px: 3 }}
        >
          {updateMutation.isPending ? "Updating..." : "Update Access"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PageAccessDialog;
