import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  CircularProgress,
  Button,
  ButtonGroup,
  Paper,
} from "@mui/material";
import {
  QrCode as QrCodeIcon,
  Inventory as InventoryIcon,
  QrCodeScanner as QrCodeScannerIcon,
  ShoppingCart as ShoppingCartIcon,
  Settings as SettingIcon,
  FactCheck as FactCheckIcon,
  MenuBook as MenuBookIcon,
  Category as CategoryIcon,
  ReceiptLong as ReceiptLongIcon,
  CloudUpload as CloudUploadIcon,
  Assessment as AssessmentIcon,
  GridView as GridViewIcon,
} from "@mui/icons-material";
import type { RootState } from "../store/store";
import { usePageAccess } from "../hooks/useMasterData";
import { isPageAccessible } from "../utils/accessUtils";
import { KpiDashboard } from "./KpiDashboard";

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
  const [viewMode, setViewMode] = useState<"kpi" | "shortcuts">("kpi");

  const { data: pageAccessData, isLoading } = usePageAccess(
    user?.roleid ? Number(user.roleid) : null,
  );

  const dashboardCards: DashboardCard[] = [
    {
      title: "Production Order",
      pageName: "Manage Orders",
      description: "Upload and view Production Order details and status",
      icon: <ShoppingCartIcon sx={{ fontSize: 40 }} />,
      color: "#df2e78ff",
      route: "/production-order/upload",
    },
    {
      title: "Generate IR, MSN",
      pageName: "New IR/MSN",
      description: "Access and manage gen. ir msn no. related tasks",
      icon: <QrCodeIcon sx={{ fontSize: 40 }} />,
      color: "#9C27B0",
      route: "/irmsn/generate",
    },
    {
      title: "Generate QR Code",
      pageName: "New QR Code",
      description: "Access and manage Barcode generation related tasks",
      icon: <QrCodeScannerIcon sx={{ fontSize: 40 }} />,
      color: "#FF9800",
      route: "/qrcode/generate",
    },
    {
      title: "Run Precheck",
      pageName: "Run Precheck",
      description: "Access and manage make pre-check related tasks",
      icon: <FactCheckIcon sx={{ fontSize: 40 }} />,
      color: "#2196F3",
      route: "/precheck/make",
    },
    {
      title: "View Precheck",
      pageName: "Precheck History",
      description: "Access and view precheck details and status",
      icon: <FactCheckIcon sx={{ fontSize: 40 }} />,
      color: "#3F51B5",
      route: "/precheck/view",
    },
    {
      title: "Material Requisition",
      pageName: "Run Precheck",
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
      title: "Assembly Explorer",
      pageName: "Assembly Explorer",
      description: "Access and manage Assembly related tasks",
      icon: <MenuBookIcon sx={{ fontSize: 40 }} />,
      color: "#F44336",
      route: "/sop/view",
    },
    {
      title: "Bulk Import",
      pageName: "Bulk Import",
      description: "Access and Manage Bulk Import related tasks",
      icon: <CloudUploadIcon sx={{ fontSize: 40 }} />,
      color: "#009688",
      route: "/scriptexecutor",
    },
    {
      title: "Components",
      pageName: "Components",
      description: "Access and manage Components related tasks",
      icon: <CategoryIcon sx={{ fontSize: 40 }} />,
      color: "#f1b40bff",
      route: "/components",
    },
    {
      title: "Admin Master",
      pageName: "Role Management",
      description: "Access and manage Admin related tasks",
      icon: <SettingIcon sx={{ fontSize: 40 }} />,
      color: "#3F51B5",
      route: "/adminmaster/rolemanagement",
    },
  ];

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  if (isLoading || !pageAccessData) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "70vh",
        }}
      >
        <CircularProgress size={48} color="primary" />
      </Box>
    );
  }

  const dashboardAccessible = isPageAccessible(pageAccessData, "Dashboard");

  if (!dashboardAccessible) {
    return (
      <Box sx={{ flexGrow: 1, p: 3, display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <Typography variant="h5" color="error" sx={{ fontWeight: 600 }}>
          You do not have access to the Dashboard.
        </Typography>
      </Box>
    );
  }

  const filteredCards = dashboardCards.filter((card) =>
    isPageAccessible(pageAccessData, card.pageName)
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <KpiDashboard />
    </Box>
  );
};

export default Dashboard;

