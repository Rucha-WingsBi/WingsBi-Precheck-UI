import { useState, useEffect, Suspense } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  AppBar,
  Box,
  CssBaseline,
  CircularProgress,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  Stack,
  Collapse,

} from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ViewList as ViewListIcon,
  QrCode as QrCodeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  Store as StoreIcon,
  ShoppingCart as ShoppingCartIcon,
  FactCheck as FactCheckIcon,
  MenuBook as MenuBookIcon,
  ListAlt as ListAltIcon,
  History as HistoryIcon,
  AccountTree as AccountTreeIcon,
  Extension as ExtensionIcon,
  CloudUpload as CloudUploadIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Storage as StorageIcon,
  PlayArrow as PlayArrowIcon,
  Warehouse as WarehouseIcon,
  MoveToInbox as MoveToInboxIcon,
  Inventory as InventoryIcon,
  PlaylistAddCheck as PlaylistAddCheckIcon,
  PlaylistAddCheck,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import type { RootState } from "../store/store";
import { logout } from "../store/slices/authSlice";
import { clearGeneratedNumber, clearTables } from "../store/slices/irmsnSlice";
import { clearAllData as clearCommonData } from "../store/slices/commonSlice";
import { clearError as clearDashboardError } from "../store/slices/dashboardSlice";
import {
  clearError as clearPrecheckError,
  clearPrecheckData,
} from "../store/slices/precheckSlice";
import {
  clearError as clearQrcodeError,
  clearQRCodeList,
  clearBarcodeDetails,
} from "../store/slices/qrcodeSlice";
import {
  clearError as clearSopError,
  clearSopData,
} from "../store/slices/sopSlice";
import { usePageAccess } from "../hooks/useMasterData";
import type { PageAccessItem } from "../types";
const drawerWidth = 255;
const drawerCollapsedWidth = 60;

interface MenuItem {
  text: string;
  pageName?: string;
  icon: React.ReactNode;
  path: string;
  roles?: string[];
  subItems?: MenuItem[];
}

const isItemActive = (item: MenuItem, currentPath: string): boolean => {
  if (item.subItems && item.subItems.length > 0) {
    return item.subItems.some(
      (sub) => currentPath === sub.path || currentPath.startsWith(sub.path + "/")
    );
  }
  return currentPath === item.path || currentPath.startsWith(item.path + "/");
};

const Main = styled("main")(({ theme }) => ({
  flexGrow: 1,
  padding: 0,
  marginLeft: 0,
  minWidth: 0,
  [theme.breakpoints.up("lg")]: {
    paddingLeft: 0,
  },
}));

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 2,
  background: "linear-gradient(90deg, #6D2A8F 0%, #D82578 100%)",
  boxShadow: "0 4px 15px rgba(109, 42, 143, 0.25)",
  [theme.breakpoints.up("lg")]: {
    paddingLeft: 0,
  },
}));

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== "open",
})<{ open?: boolean }>(({ theme, open }) => ({
  width: open ? drawerWidth : drawerCollapsedWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  "& .MuiDrawer-paper": {
    width: open ? drawerWidth : drawerCollapsedWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: "hidden",
    background: "#ffffff",
    borderRight: "1px solid rgba(0, 0, 0, 0.08)",
    boxShadow: "2px 0 8px rgba(0,0,0,0.05)",
    position: "fixed",
    top: 0,
    height: "100vh",
    zIndex: 1200,
  },
}));

const LogoBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== "open",
})<{ open?: boolean }>(({ theme, open }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  minHeight: 56,
  background: "linear-gradient(90deg, #6D2A8F 0%, #D82578 100%)",
  color: "white",
  cursor: "pointer",
  justifyContent: open ? "space-between" : "center",
  transition: theme.transitions.create(["justify-content", "padding"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  "&:hover": {
    background: "linear-gradient(90deg, #571F73 0%, #9D1352 100%)",
  },
}));

const STORE_ROLE = "Store";


export default function Layout() {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const isSidebarOpen = desktopOpen;
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const hasPendingScans = useSelector(
    (state: RootState) => state.precheck.hasPendingScans,
  );

  // Fetch page access for the current role
  const { data: pageAccessData } = usePageAccess(
    user?.roleid ? Number(user.roleid) : null,
  );

  // Navigation guard state
  const [navigationDialogOpen, setNavigationDialogOpen] = useState(false);
  const [nextLocation, setNextLocation] = useState<string | null>(null);

  // Menu items structure
  const menuItems: MenuItem[] = [
    {
      text: "Dashboard",
      pageName: "Dashboard",
      icon: <DashboardIcon />,
      path: "/dashboard",
    },
    {
      text: "Bulk Import",
      pageName: "Bulk Import",
      icon: <CloudUploadIcon />,
      path: "/bulk-import",
    },
    {
      text: "Production Order",
      pageName: "Production Order",
      icon: <ShoppingCartIcon />,
      path: "/production-order",
      subItems: [
        {
          text: "Manage Orders",
          pageName: "Manage Orders",
          icon: <AssignmentIcon />,
          path: "/production-order/history",
        },
      ],
    },
    {
      text: "IR/MSN Number",
      pageName: "IR/MSN Number",
      icon: <ViewListIcon />,
      path: "/irmsn",
      subItems: [
        {
          text: "IR/MSN List",
          pageName: "IR/MSN List",
          icon: <ListAltIcon />,
          path: "/irmsn/list",
        },
        {
          text: "New IR/MSN",
          pageName: "New IR/MSN",
          icon: <AddIcon />,
          path: "/irmsn/new",
        },
      ],
    },
    {
      text: "QR Code",
      pageName: "QR Code",
      icon: <QrCodeIcon />,
      path: "/qrcode",
      subItems: [
        {
          text: "QR Code List",
          pageName: "QR Code List",
          icon: <ListAltIcon />,
          path: "/qrcode/list",
        },
        {
          text: "New QR Code",
          pageName: "New QR Code",
          icon: <AddIcon />,
          path: "/qrcode/new",
        },
        {
          text: "Store In",
          pageName: "Store In",
          icon: <StoreIcon />,
          path: "/qrcode/store-in",
        },
      ],
    },
    {
      text: "Verification",
      pageName: "Precheck",
      icon: <FactCheckIcon />,
      path: "/verification",
      subItems: [
        {
          text: "Verification History",
          pageName: "Verification History",
          icon: <HistoryIcon />,
          path: "/verification/history",
        },
        {
          text: "Part Verification",
          pageName: "Part Verification",
          icon: < PlaylistAddCheck />,
          path: "/verification/parts",
        },
        {
          text: "Material Requisition",
          pageName: "Material Requisition",
          icon: <AssignmentIcon />,
          path: "/verification/material-requisition",
        },
      ],
    },

    {
      text: "Assembly",
      pageName: "Assembly",
      icon: <MenuBookIcon />,
      path: "/assembly",
      subItems: [
        {
          text: "Assembly Explorer",
          pageName: "Assembly Explorer",
          icon: <AccountTreeIcon />,
          path: "/assembly/explorer",
        },
        {
          text: "Components",
          pageName: "Components",
          icon: <ExtensionIcon />,
          path: "/assembly/components",
        },
      ],
    },
    {
      text: "Admin",
      pageName: "Admin",
      icon: <AdminPanelSettingsIcon />,
      path: "/adminmaster",
      subItems: [
        {
          text: "User Management",
          pageName: "User Management",
          icon: <PeopleIcon />,
          path: "/adminmaster/user-management",
        },
        {
          text: "Role Management",
          pageName: "Role Management",
          icon: <SettingsIcon />,
          path: "/adminmaster/role-management",
        },
        {
          text: "Master Data",
          pageName: "Master Data",
          icon: <StorageIcon />,
          path: "/adminmaster/master-data",
        },
      ],
    },
  ];

  // Filter menu items based on user role and dynamic page access
  const getFilteredMenuItems = () => {
    if (!user || !pageAccessData) return [];

    // Build a flat lookup map of pageName -> PageAccessItem from the API
    const accessMap: Record<string, PageAccessItem> = {};
    const walk = (items: PageAccessItem[]) => {
      items.forEach((item) => {
        if (item.pageName) {
          accessMap[item.pageName.trim().toLowerCase()] = item;
        }
        if (item.children?.length) walk(item.children);
      });
    };
    walk(pageAccessData);

    const isAccessible = (pageName: string): boolean => {
      const entry = accessMap[pageName.trim().toLowerCase()];
      if (!entry) return false;
      return entry.fullAccess === true;
    };

    const checkItemAccess = (item: MenuItem): boolean => {
      const pageNameToCheck = (typeof item.pageName === "string" ? item.pageName : item.text) || item.text;
      return isAccessible(pageNameToCheck);
    };

    return menuItems
      .map((item) => {
        // Case 1: No children → normal check
        if (!item.subItems) {
          return checkItemAccess(item) ? item : null;
        }

        // Case 2: Has children → filter children first
        const filteredSubItems = item.subItems.filter((subItem) =>
          checkItemAccess(subItem)
        );

        // Show parent ONLY if at least one child is accessible
        if (filteredSubItems.length > 0) {
          return { ...item, subItems: filteredSubItems };
        }

        return checkItemAccess(item) ? item : null;
      })
      .filter((item): item is MenuItem => item !== null);
  };

  // Auto-close mobile drawer on route change
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Auto-expand active parent menu item based on current route
  useEffect(() => {
    menuItems.forEach((item) => {
      if (
        item.subItems?.some(
          (sub) =>
            location.pathname === sub.path ||
            location.pathname.startsWith(sub.path + "/")
        )
      ) {
        setExpandedItems((prev) =>
          prev.includes(item.text) ? prev : [...prev, item.text]
        );
      }
    });
  }, [location.pathname]);

  const handleDrawerToggle = () => {
    if (isDesktop) {
      setDesktopOpen((prev) => !prev);
    } else {
      setMobileOpen((prev) => !prev);
    }
  };

  const handleLogoClick = () => {
    if (isDesktop) {
      setDesktopOpen(!desktopOpen);
    }
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.subItems && item.subItems.length > 0) {
      // If drawer is collapsed, open it first when clicking on items with subitems
      if (!isSidebarOpen && isDesktop) {
        setDesktopOpen(true);
      }

      const isExpanded = expandedItems.includes(item.text);
      setExpandedItems((prev) =>
        isExpanded
          ? []
          : [item.text]
      );
    } else {
      handleNavigation(item.path);
      setMobileOpen(false);
    }
  };

  const handleSubItemClick = (subItem: MenuItem) => {
    handleNavigation(subItem.path);
    setMobileOpen(false);
  };

  const handleNavigation = (path: string) => {
    if (hasPendingScans && (location.pathname === "/verification/parts" || location.pathname === "/verification")) {
      setNextLocation(path);
      setNavigationDialogOpen(true);
    } else {
      navigate(path);
    }
  };

  const confirmNavigation = () => {
    if (nextLocation) {
      navigate(nextLocation);
      setNavigationDialogOpen(false);
      setNextLocation(null);
    }
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearGeneratedNumber());
    dispatch(clearTables());
    dispatch(clearCommonData());
    dispatch(clearDashboardError());
    dispatch(clearPrecheckError());
    dispatch(clearPrecheckData());
    dispatch(clearQrcodeError());
    dispatch(clearQRCodeList());
    dispatch(clearBarcodeDetails());
    dispatch(clearSopError());
    dispatch(clearSopData());
    navigate("/login");
    handleProfileMenuClose();
  };

  const drawerContent = (isDesktopVersion: boolean = false) => (
    <>
      <LogoBox
        open={isDesktopVersion ? isSidebarOpen : true}
        onClick={isDesktopVersion ? handleLogoClick : handleDrawerToggle}
      >
        {(!isDesktopVersion || isSidebarOpen) && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              overflow: "hidden",
            }}
          ></Box>
        )}

        <IconButton
          sx={{
            color: "white",
            padding: 0.5,
          }}
        >
          {isDesktopVersion ? (
            isSidebarOpen ? (
              <ChevronLeftIcon />
            ) : (
              <ChevronRightIcon />
            )
          ) : (
            <ChevronLeftIcon />
          )}
        </IconButton>
      </LogoBox>

      <List sx={{ flex: 1, py: 1 }}>
        {getFilteredMenuItems().map((item) => {
          const isActive = isItemActive(item, location.pathname);
          return (
            <Box key={item.text}>
              <ListItem disablePadding sx={{ display: "block" }}>
                <Tooltip
                  title={!isSidebarOpen && isDesktopVersion ? item.text : ""}
                  placement="right"
                  arrow
                >
                  <ListItemButton
                    onClick={() => handleItemClick(item)}
                    sx={{
                      minHeight: 46,
                      px: isSidebarOpen || !isDesktopVersion ? 2.5 : 1.5,
                      justifyContent: isSidebarOpen || !isDesktopVersion ? "initial" : "center",
                      mx: 1,
                      mb: 0.5,
                      borderRadius: 2,
                      transition: "all 0.2s ease",
                      "&:hover": {
                        backgroundColor: "rgba(109, 42, 143, 0.08)",
                        transform: "translateX(4px)",
                      },
                      backgroundColor: isActive
                        ? "rgba(109, 42, 143, 0.12)"
                        : "transparent",
                    }}
                  >
                    {item.icon && (
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: isSidebarOpen || !isDesktopVersion ? 3 : 0,
                          justifyContent: "center",
                          color: isActive
                            ? "#6D2A8F"
                            : "text.secondary",
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                    )}
                    <ListItemText
                      primary={item.text}
                      sx={{
                        flex: 1,
                        opacity: isSidebarOpen || !isDesktopVersion ? 1 : 0,
                        display: isSidebarOpen || !isDesktopVersion ? "block" : "none",
                        "& .MuiListItemText-primary": {
                          fontSize: "0.9rem",
                          fontWeight: isActive
                            ? 600
                            : 500,
                          color: isActive
                            ? "#6D2A8F"
                            : "text.primary",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        },
                      }}
                    />

                    {item.subItems &&
                      item.subItems.length > 0 &&
                      (isSidebarOpen || !isDesktopVersion) && (
                        <Box sx={{ ml: "auto", display: "flex", alignItems: "center" }}>
                          {expandedItems.includes(item.text) ? (
                            <ExpandLessIcon sx={{ color: "text.secondary", fontSize: "1.25rem" }} />
                          ) : (
                            <ExpandMoreIcon sx={{ color: "text.secondary", fontSize: "1.25rem" }} />
                          )}
                        </Box>
                      )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>

              {item.subItems && item.subItems.length > 0 && (
                <Collapse
                  in={
                    expandedItems.includes(item.text) &&
                    (isSidebarOpen || !isDesktopVersion)
                  }
                  timeout="auto"
                  unmountOnExit
                >
                  <List component="div" disablePadding>
                    {item.subItems.map((subItem) => (
                      <ListItemButton
                        key={subItem.text}
                        onClick={() => handleSubItemClick(subItem)}
                        sx={{
                          pl: 3.5,
                          pr: 1.5,
                          py: 1,
                          mx: 1,
                          mb: 0.5,
                          borderRadius: 2,
                          transition: "all 0.2s ease",
                          "&:hover": {
                            backgroundColor: "rgba(109, 42, 143, 0.05)",
                            transform: "translateX(4px)",
                          },
                          backgroundColor:
                            location.pathname === subItem.path
                              ? "rgba(109, 42, 143, 0.1)"
                              : "transparent",
                        }}
                      >
                        {subItem.icon && (
                          <ListItemIcon
                            sx={{
                              minWidth: 32,
                              color:
                                location.pathname === subItem.path
                                  ? "#6D2A8F"
                                  : "text.secondary",
                            }}
                          >
                            {subItem.icon}
                          </ListItemIcon>
                        )}
                        <ListItemText
                          primary={subItem.text}
                          sx={{
                            "& .MuiListItemText-primary": {
                              fontSize: "0.825rem",
                              fontWeight:
                                location.pathname === subItem.path ? 600 : 400,
                              color:
                                location.pathname === subItem.path
                                  ? "#6D2A8F"
                                  : "text.secondary",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            },
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              )}
            </Box>
          );
        })}
      </List>
    </>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />

      {/* App Bar */}
      <StyledAppBar position="fixed">
        <Toolbar
          sx={{
            minHeight: "56px !important",
            height: 56,
            px: { xs: 1.5, sm: 2 },
            display: "flex",
            alignItems: "center",
          }}
        >
          {/* Menu button */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 1, color: "white", padding: "6px" }}
          >
            <MenuIcon />
          </IconButton>

          {/* Godrej Aerospace Title */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <img
              src="/assets/logo.jpg"
              alt="Wingsbi Logo"
              style={{ height: 28, marginRight: 8, borderRadius: 8 }}
            />
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{
                  fontWeight: 600,
                  fontSize: "1.05rem",
                  letterSpacing: 0.5,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                Wingsbi
              </Typography>
            </Box>
          </Box>
          <Box sx={{ flexGrow: 1 }} />

          {/* User Profile */}
          {user && (
            <Box sx={{ display: "flex", alignItems: "center", ml: 2 }}>
              <Stack
                alignItems="flex-end"
                sx={{ mr: 1.5, display: { xs: "none", sm: "flex" } }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "white", fontSize: "0.825rem", lineHeight: 1.2 }}
                >
                  {user?.username}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.7rem", lineHeight: 1.1 }}
                >
                  {user?.department} - {user?.role}
                </Typography>
              </Stack>
              <IconButton
                size="small"
                edge="end"
                aria-label="account of current user"
                onClick={handleProfileMenuOpen}
                sx={{
                  padding: "4px",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: "rgba(255,255,255,0.2)",
                    color: "white",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    border: "1.5px solid rgba(255,255,255,0.3)",
                  }}
                >
                  {user?.username?.substring(0, 2).toUpperCase() || "U"}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
                onClick={handleProfileMenuClose}
                PaperProps={{
                  sx: {
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    borderRadius: 2,
                    mt: 1,
                  },
                }}
              >
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Logout" />
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </StyledAppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{
          display: "block",
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            background: "linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)",
          },
        }}
      >
        {drawerContent(false)}
      </Drawer>

      {/* Desktop Drawer */}
      {isDesktop && (
        <StyledDrawer
          variant="permanent"
          open={isSidebarOpen}
        >
          {drawerContent(true)}
        </StyledDrawer>
      )}

      <Main>
        <Toolbar sx={{ minHeight: "56px !important", height: 56 }} />
        <Box
          sx={{
            p: 0,
            ml: 0,
            transition: theme.transitions.create("margin-left", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          <Suspense
            fallback={
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="60vh"
              >
                <CircularProgress />
              </Box>
            }
          >
            <Outlet context={{ isSidebarOpen }} />
          </Suspense>
        </Box>
      </Main>

    </Box>
  );
}
