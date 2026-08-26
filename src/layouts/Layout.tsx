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
  DialogContentText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ViewList as ViewListIcon,
  QrCode as QrCodeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Store as StoreIcon,
  ShoppingCart as ShoppingCartIcon,
  Article as ArticleIcon,
  Archive as ArchiveIcon,
  PlaylistAddCheck as PlaylistAddCheckIcon,
  Terminal as TerminalIcon,
  FactCheck as FactCheckIcon,
  MenuBook as MenuBookIcon,
  Category as CategoryIcon,
  ReceiptLong as ReceiptLongIcon,
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
  icon: React.ReactNode;
  path: string;
  roles?: string[];
  subItems?: MenuItem[];
}

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
  background: "linear-gradient(90deg, #6B288A 0%, #D82578 100%)",
  boxShadow: "0 4px 15px rgba(107, 40, 138, 0.25)",
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
  minHeight: 64,
  background: "linear-gradient(90deg, #6B288A 0%, #D82578 100%)",
  color: "white",
  cursor: "pointer",
  justifyContent: open ? "space-between" : "center",
  transition: theme.transitions.create(["justify-content", "padding"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  "&:hover": {
    background: "linear-gradient(90deg, #4A1964 0%, #9D1352 100%)",
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
      icon: <DashboardIcon />,
      path: "/dashboard",
    },
    {
      text: "Production Order",
      icon: <ShoppingCartIcon />,
      path: "/production-order",
      subItems: [
        {
          text: "Upload Orders",
          icon: <AddIcon />,
          path: "/production-order",

        },
        {
          text: "Pending For Precheck",
          icon: <PlaylistAddCheckIcon />,
          path:
            user?.role === STORE_ROLE
              ? "/precheck/pending/store"
              : "/precheck/pending/qc",

        },
        {
          text: "View Order Details",
          icon: <VisibilityIcon />,
          path: "/production-order/view",

        },
        // {
        //   text: "Edit Order Details",
        //   icon: <EditIcon />,
        //   path: "/production-order/edit",

        // },
      ],
    },
    {
      text: "IR/MSN Number",
      icon: <ViewListIcon />,
      path: "/irmsn",
      subItems: [
        {
          text: "View All IR/MSN",
          icon: <VisibilityIcon />,
          path: "/irmsn/view",
        },
        {
          text: "Create",
          icon: <AddIcon />,
          path: "/irmsn/generate",

        },
      ],
    },
    {
      text: "QR Code",
      icon: <QrCodeIcon />,
      path: "/qrcode",
      subItems: [
        {
          text: "View QR Code",
          icon: <VisibilityIcon />,
          path: "/qrcode/view",
        },
        {
          text: "Generate QR Code",
          icon: <AddIcon />,
          path: "/qrcode/generate",

        },
        {
          text: "Generate STD QR Code",
          icon: <AddIcon />,
          path: "/qrcode/generate-new",

        },
      ],
    },
    {
      text: "Precheck",
      icon: <FactCheckIcon />,
      path: "/precheck",
      subItems: [
        {
          text: "View Precheck",
          icon: <VisibilityIcon />,
          path: "/precheck/view",
        },
        {
          text: "View Consumed In",
          icon: <SearchIcon />,
          path: "/precheck/consumed",
        },
        // {
        //   text: "Make Order",
        //   icon: <ShoppingCartIcon />,
        //   path: "/precheck/make-order",
        //  
        // },
        {
          text: "Make Precheck",
          icon: <AddIcon />,
          path: "/precheck/make",

        },
        {
          text: "Store In",
          icon: <StoreIcon />,
          path: "/precheck/store-in",

        },
        {
          text: "Available In Store",
          icon: <VisibilityIcon />,
          path: "/precheck/available-in-store",

        },
        {
          text: "Stored In Components",
          icon: <VisibilityIcon />,
          path: "/precheck/stored-components",

        },
      ],
    },
    {
      text: "SOP",
      icon: <MenuBookIcon />,
      path: "/sop",
      subItems: [
        { text: "View SOP", icon: <VisibilityIcon />, path: "/sop/view" },
        {
          text: "View BOM Details",
          icon: <VisibilityIcon />,
          path: "/sop/viewBOM",
        },
      ],
    },
    {
      text: "Components",
      icon: <CategoryIcon />,
      path: "/components",
      subItems: [
        {
          text: "View Components",
          icon: <VisibilityIcon />,
          path: "/components",
        },
        {
          text: "View Assembly",
          icon: <VisibilityIcon />,
          path: "/components/assembly",
        },
      ],
    },
    {
      text: "Material Requisition",
      icon: <ReceiptLongIcon />,
      path: "/materialrequisition",
    },
    {
      text: "Script Executor",
      icon: <TerminalIcon />,
      path: "/scriptexecutor",
    },
    {
      text: "Admin",
      icon: <SettingsIcon />,
      path: "/adminmaster",
      subItems: [
        {
          text: "Archive",
          icon: <ArchiveIcon />,
          path: "/adminmaster/archive",

        },
        {
          text: "Update Components",
          icon: <SettingsIcon />,
          path: "/adminmaster/updatecomponents",

        },
        {
          text: "User Management",
          icon: <AssignmentIcon />,
          path: "/adminmaster/usermanagement",

        },
        {
          text: "Role Management",
          icon: <AssignmentIcon />,
          path: "/adminmaster/rolemanagement",

        },
        {
          text: "Add Components",
          icon: <AddIcon />,
          path: "/adminmaster/addcomponents",

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
      // Always explicitly return boolean
      if (!entry) return false;

      return entry.fullAccess === true;
    };

    return menuItems
      .map((item) => {
        // Case 1: No children → normal check
        if (!item.subItems) {
          return isAccessible(item.text) ? item : null;
        }

        // Case 2: Has children → filter children first
        const filteredSubItems = item.subItems.filter((subItem) =>
          isAccessible(subItem.text),
        );

        // Show parent ONLY if at least one child is accessible
        if (filteredSubItems.length > 0) {
          return { ...item, subItems: filteredSubItems };
        }

        return null;
      })
      .filter((item): item is MenuItem => item !== null);
  };

  // Auto-close mobile drawer on route change
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [location.pathname, isMobile]);

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
    if (hasPendingScans && location.pathname === "/precheck/make") {
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
        {getFilteredMenuItems().map((item) => (
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
                      backgroundColor: "rgba(107, 40, 138, 0.08)",
                      transform: "translateX(4px)",
                    },
                    backgroundColor: location.pathname.startsWith(item.path)
                      ? "rgba(107, 40, 138, 0.12)"
                      : "transparent",
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: isSidebarOpen || !isDesktopVersion ? 3 : 0,
                      justifyContent: "center",
                      color: location.pathname.startsWith(item.path)
                        ? "#6B288A"
                        : "text.secondary",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{
                      opacity: isSidebarOpen || !isDesktopVersion ? 1 : 0,
                      display: isSidebarOpen || !isDesktopVersion ? "block" : "none",
                      "& .MuiListItemText-primary": {
                        fontSize: "0.9rem",
                        fontWeight: location.pathname.startsWith(item.path)
                          ? 600
                          : 500,
                        color: location.pathname.startsWith(item.path)
                          ? "#6B288A"
                          : "text.primary",
                      },
                    }}
                  />

                  {item.subItems &&
                    item.subItems.length > 0 &&
                    (isSidebarOpen || !isDesktopVersion) && (
                      <Box sx={{ ml: 1 }}>
                        {expandedItems.includes(item.text) ? (
                          <ExpandLessIcon sx={{ color: "text.secondary" }} />
                        ) : (
                          <ExpandMoreIcon sx={{ color: "text.secondary" }} />
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
                        pl: 5,
                        py: 1,
                        mx: 1,
                        mb: 0.5,
                        borderRadius: 2,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          backgroundColor: "rgba(107, 40, 138, 0.05)",
                          transform: "translateX(4px)",
                        },
                        backgroundColor:
                          location.pathname === subItem.path
                            ? "rgba(107, 40, 138, 0.1)"
                            : "transparent",
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 32,
                          color:
                            location.pathname === subItem.path
                              ? "#6B288A"
                              : "text.secondary",
                        }}
                      >
                        {subItem.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={subItem.text}
                        sx={{
                          "& .MuiListItemText-primary": {
                            fontSize: "0.825rem",
                            fontWeight:
                              location.pathname === subItem.path ? 600 : 400,
                            color:
                              location.pathname === subItem.path
                                ? "#6B288A"
                                : "text.secondary",
                          },
                        }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </Box>
        ))}
      </List>
    </>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />

      {/* App Bar */}
      <StyledAppBar position="fixed">
        <Toolbar sx={{ minHeight: 64, display: "flex", alignItems: "center" }}>
          {/* Menu button */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 1, color: "white" }}
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
              style={{ height: 32, marginRight: 8, borderRadius: 10 }}
            />
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{
                  fontWeight: 600,
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
          <Typography
            variant="caption"
            sx={{
              color: "#ffe0f0",
              fontWeight: 600,
              fontSize: "0.95rem",
              letterSpacing: 0.5,
              opacity: 0.85,
              mr: 2,
              mt: 2,
              display: { xs: "none", sm: "block" },
            }}
          >
            Precheck Version 9.6
          </Typography>

          {/* User Profile */}
          {user && (
            <Box sx={{ display: "flex", alignItems: "center", ml: 2 }}>
              <Stack
                alignItems="flex-end"
                sx={{ mr: 2, display: { xs: "none", sm: "flex" } }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "white" }}
                >
                  {user?.username}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.8)" }}
                >
                  {user?.department} - {user?.role}
                </Typography>
              </Stack>
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                onClick={handleProfileMenuOpen}
                sx={{
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: "rgba(255,255,255,0.2)",
                    color: "white",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    border: "2px solid rgba(255,255,255,0.3)",
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
                <MenuItem onClick={() => navigate("/settings")}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Settings"
                    secondary={`User: ${user?.username}`}
                  />
                </MenuItem>
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
        <Toolbar />
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

      {/* Navigation Guard Dialog */}
      <Dialog
        open={navigationDialogOpen}
        onClose={() => setNavigationDialogOpen(false)}
      >
        <DialogTitle>Unsubmitted Changes</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please submit remaining precheck before leaving this page.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setNavigationDialogOpen(false)}
            variant="outlined"
            size="small"
          >
            Stay
          </Button>
          {/* <Button onClick={confirmNavigation} variant="contained" color="error">
            Leave
          </Button> */}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
