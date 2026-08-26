import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  QrCode as QrCodeIcon,
  Inventory as InventoryIcon,
  QrCodeScanner as QrCodeScannerIcon,
  Description as DescriptionIcon,
  FolderOpen as ProjectIcon,
  ShoppingCart as ShoppingCartIcon,
  Settings as SettingIcon,
  Science as ScienceIcon,
  Terminal as TerminalIcon,
  FactCheck as FactCheckIcon,
  MenuBook as MenuBookIcon,
  Category as CategoryIcon,
  ReceiptLong as ReceiptLongIcon,
} from "@mui/icons-material";
import type { RootState } from "../store/store";
import { usePageAccess } from "../hooks/useMasterData";
import type { PageAccessItem } from "../types";

interface DashboardCard {
  title: string;
  pageName: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  route: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const { data: pageAccessData } = usePageAccess(
    user?.roleid ? Number(user.roleid) : null,
  );

  // Build flat access map from API — sole authority
  const accessMap: Record<string, PageAccessItem> = {};
  if (pageAccessData) {
    const walk = (items: PageAccessItem[]) => {
      items.forEach((item) => {
        accessMap[item.pageName] = item;
        if (item.children?.length) walk(item.children);
      });
    };
    walk(pageAccessData);
  }

  const isAccessible = (pageName: string): boolean => {
    const entry = accessMap[pageName];
    return !!entry && entry.fullAccess;
  };

  const dashboardCards: DashboardCard[] = [
    {
      title: "Production Order",
      pageName: "Production Order",
      description: "Upload and view Production Order details and status",
      icon: <ShoppingCartIcon sx={{ fontSize: 40 }} />,
      color: "#df2e78ff",
      route: isAccessible("Upload Orders")
        ? "/production-order"
        : isAccessible("Pending For Precheck")
          ? user?.role === "Store"
            ? "/precheck/pending/store"
            : "/precheck/pending/qc"
          : "/dashboard",

    },
    {
      title: "Generate IR, MSN",
      pageName: "Create",
      description: "Access and manage gen. ir msn no. related tasks",
      icon: <QrCodeIcon sx={{ fontSize: 40 }} />,
      color: "#9C27B0",
      route: "/irmsn/generate",
    },
    {
      title: "Generate QR Code",
      pageName: "Generate QR Code",
      description: "Access and manage Barcode generation related tasks",
      icon: <QrCodeScannerIcon sx={{ fontSize: 40 }} />,
      color: "#FF9800",
      route: "/qrcode/generate",
    },
    {
      title: "Make Pre-check",
      pageName: "Make Precheck",
      description: "Access and manage make pre-check related tasks",
      icon: <FactCheckIcon sx={{ fontSize: 40 }} />,
      color: "#2196F3",
      route: "/precheck/make",
    },
    {
      title: "View Precheck",
      pageName: "View Precheck",
      description: "Access and view precheck details and status",
      icon: <FactCheckIcon sx={{ fontSize: 40 }} />,
      color: "#3F51B5", // Indigo
      route: "/precheck/view",
    },
    {
      title: "Material Requisition",
      pageName: "Material Requisition",
      description: "Add and view Material Requisition details",
      icon: <ReceiptLongIcon sx={{ fontSize: 40 }} />,
      color: "#3fb1b5ff",
      route: "/materialrequisition",
    },

    {
      title: "Store Consumption",
      pageName: "Store In",
      description: "Access and manage Store Consumption related tasks",
      icon: <InventoryIcon sx={{ fontSize: 40 }} />,
      color: "#4CAF50",
      route: "/precheck/store-in",
    },

    {
      title: "Generate SOP",
      pageName: "View SOP",
      description: "Access and manage SOP Generation related tasks",
      icon: <MenuBookIcon sx={{ fontSize: 40 }} />,
      color: "#F44336", // Red
      route: "/sop/view",
    },
    {
      title: "Script Executor",
      pageName:"Script Executor",
      description:"Access and Manage Script related tasks",
      icon:<TerminalIcon sx={{fontSize: 40 }}/>,
      color:"#009688",
      route:"/scriptexecutor",
    },
    // {
    //   title:"Testing",
    //   pageName:"Testing Offering",
    //   description:"Access and manage Testing related tasks",
    //   icon:<ScienceIcon sx={{frontSize:40}}/>,
    //   color:"#ec5e5eff",
    //   route:"/testing/offering",
    // },
    {
      title:"Components",
      pageName:"Components",
      description:"Access and manage Components related tasks",
      icon:<CategoryIcon sx={{fontSize: 40 }}/>,
      color:"#f1b40bff",
      route:"/components/assembly",
    },
    {
      title:"Admin Master",
      pageName:"Role Management",
      description:"Access and manage Admin  related tasks",
      icon:<SettingIcon  sx={{fontSize:40}}/>,
      color:"#3F51B5",
      route:"/adminmaster/rolemanagement",
    }
  ];


  // Filter cards — API is sole authority; hide all until data is loaded
  const dashboardAccessible = isAccessible("Dashboard");

  const filteredCards = !pageAccessData
    ? []
    : dashboardCards.filter((card) => isAccessible(card.pageName));

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  if (pageAccessData && !dashboardAccessible) {
    return (
      <Box sx={{ flexGrow: 1, p: 3, display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <Typography variant="h5" color="error" sx={{ fontWeight: 600 }}>
          You do not have access to the Dashboard.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 600,
          color: "primary.main",
          fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.5rem" },
          mb: 1,
        }}
      >
        Dashboard
      </Typography>

      <Grid container spacing={2}>
        {filteredCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: "100%",
                cursor: "pointer",
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 6,
                },
                border: "1px solid",
                borderColor: "divider",
              }}
              onClick={() => handleCardClick(card.route)}
            >
              <CardContent
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  p: 3,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: card.color,
                    width: 56,
                    height: 56,
                    mb: 2,
                    "& .MuiSvgIcon-root": {
                      fontSize: "2rem",
                    },
                  }}
                >
                  {card.icon}
                </Avatar>
                <Typography
                  variant="h6"
                  component="h2"
                  gutterBottom
                  sx={{ fontWeight: 600 }}
                >
                  {card.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ flex: 1 }}
                >
                  {card.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;
