import React from "react";
import { useLocation, Link as RouterLink } from "react-router-dom";
import {
  Breadcrumbs,
  Link,
  Typography,
  Box,
  Container,
} from "@mui/material";
import {
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Dashboard as DashboardIcon,
} from "@mui/icons-material";

// Map full routes and route patterns to Layout page names and hierarchy
interface BreadcrumbItem {
  label: string;
  to?: string;
}

const ROUTE_HIERARCHY_MAP: {
  pattern: RegExp;
  parent?: { label: string; path: string };
  current: string;
}[] = [
  // Dashboard
  { pattern: /^\/dashboard/, current: "Dashboard" },

  // Production Order
  {
    pattern: /^\/production-order\/upload/,
    parent: { label: "Production Order", path: "/production-order" },
    current: "Upload Orders",
  },
  {
    pattern: /^\/production-order\/edit/,
    parent: { label: "Production Order", path: "/production-order" },
    current: "Edit Production Order",
  },
  {
    pattern: /^\/production-order\/view/,
    parent: { label: "Production Order", path: "/production-order" },
    current: "View Order Details",
  },
  {
    pattern: /^\/production-order\/store/,
    parent: { label: "Production Order", path: "/production-order" },
    current: "Pending For Precheck",
  },
  { pattern: /^\/production-order/, current: "Production Order" },

  // IR / MSN
  {
    pattern: /^\/irmsn\/view/,
    parent: { label: "IR/MSN Number", path: "/irmsn" },
    current: "View All IR/MSN",
  },
  {
    pattern: /^\/irmsn\/generate/,
    parent: { label: "IR/MSN Number", path: "/irmsn" },
    current: "Create",
  },
  {
    pattern: /^\/irmsn\/edit/,
    parent: { label: "IR/MSN Number", path: "/irmsn" },
    current: "Edit IR/MSN",
  },
  { pattern: /^\/irmsn/, current: "IR/MSN Number" },

  // QR Code
  {
    pattern: /^\/qrcode\/view/,
    parent: { label: "QR Code", path: "/qrcode" },
    current: "View QR Code",
  },
  {
    pattern: /^\/qrcode\/generate-new/,
    parent: { label: "QR Code", path: "/qrcode" },
    current: "Generate STD QR Code",
  },
  {
    pattern: /^\/qrcode\/generate/,
    parent: { label: "QR Code", path: "/qrcode" },
    current: "Generate QR Code",
  },
  {
    pattern: /^\/qrcode\/update/,
    parent: { label: "QR Code", path: "/qrcode" },
    current: "Update QR Code",
  },
  { pattern: /^\/qrcode/, current: "QR Code" },

  // Precheck
  {
    pattern: /^\/precheck\/view-consumed/,
    parent: { label: "Precheck", path: "/precheck" },
    current: "View Consumed In",
  },
  {
    pattern: /^\/precheck\/consumed/,
    parent: { label: "Precheck", path: "/precheck" },
    current: "View Consumed In",
  },
  {
    pattern: /^\/precheck\/view/,
    parent: { label: "Precheck", path: "/precheck" },
    current: "View Precheck",
  },
  {
    pattern: /^\/precheck\/make-order/,
    parent: { label: "Precheck", path: "/precheck" },
    current: "Make Order",
  },
  {
    pattern: /^\/precheck\/make/,
    parent: { label: "Precheck", path: "/precheck" },
    current: "Make Precheck",
  },
  {
    pattern: /^\/precheck\/store-in/,
    parent: { label: "Precheck", path: "/precheck" },
    current: "Store In",
  },
  {
    pattern: /^\/precheck\/available-store/,
    parent: { label: "Precheck", path: "/precheck" },
    current: "Available In Store",
  },
  {
    pattern: /^\/precheck\/available-in-store/,
    parent: { label: "Precheck", path: "/precheck" },
    current: "Available In Store",
  },
  {
    pattern: /^\/precheck\/stored-components/,
    parent: { label: "Precheck", path: "/precheck" },
    current: "Stored In Components",
  },
  { pattern: /^\/precheck/, current: "Precheck" },

  // SOP
  {
    pattern: /^\/sop\/viewBOM/,
    parent: { label: "SOP", path: "/sop" },
    current: "View BOM Details",
  },
  {
    pattern: /^\/sop\/view/,
    parent: { label: "SOP", path: "/sop" },
    current: "View SOP",
  },
  { pattern: /^\/sop/, current: "SOP" },

  // Components
  {
    pattern: /^\/components\/view-assembly/,
    parent: { label: "Components", path: "/components" },
    current: "View Assembly",
  },
  {
    pattern: /^\/components\/assembly/,
    parent: { label: "Components", path: "/components" },
    current: "View Assembly",
  },
  {
    pattern: /^\/components\/view/,
    parent: { label: "Components", path: "/components" },
    current: "View Components",
  },
  {
    pattern: /^\/components/,
    parent: { label: "Components", path: "/components" },
    current: "View Components",
  },

  // Script Executor
  { pattern: /^\/script-executor/, current: "Script Executor" },
  { pattern: /^\/scriptexecutor/, current: "Script Executor" },

  // Material Requisition
  { pattern: /^\/material-requisition/, current: "Material Requisition" },
  { pattern: /^\/materialrequisition/, current: "Material Requisition" },

  // Admin
  {
    pattern: /^\/adminmaster\/usermanagement/,
    parent: { label: "Admin", path: "/adminmaster" },
    current: "User Management",
  },
  {
    pattern: /^\/adminmaster\/user-management/,
    parent: { label: "Admin", path: "/adminmaster" },
    current: "User Management",
  },
  {
    pattern: /^\/adminmaster\/rolemanagement/,
    parent: { label: "Admin", path: "/adminmaster" },
    current: "Role Management",
  },
  {
    pattern: /^\/adminmaster\/role-management/,
    parent: { label: "Admin", path: "/adminmaster" },
    current: "Role Management",
  },
  {
    pattern: /^\/adminmaster\/addcomponents/,
    parent: { label: "Admin", path: "/adminmaster" },
    current: "Add Components",
  },
  {
    pattern: /^\/adminmaster\/add-components/,
    parent: { label: "Admin", path: "/adminmaster" },
    current: "Add Components",
  },
  {
    pattern: /^\/adminmaster\/updatecomponents/,
    parent: { label: "Admin", path: "/adminmaster" },
    current: "Update Components",
  },
  {
    pattern: /^\/adminmaster\/update-components/,
    parent: { label: "Admin", path: "/adminmaster" },
    current: "Update Components",
  },
  {
    pattern: /^\/adminmaster\/archive/,
    parent: { label: "Admin", path: "/adminmaster" },
    current: "Archive",
  },
  { pattern: /^\/adminmaster/, current: "Admin" },
];

const getBreadcrumbItems = (pathname: string): BreadcrumbItem[] => {
  const match = ROUTE_HIERARCHY_MAP.find((item) => item.pattern.test(pathname));

  if (match) {
    const items: BreadcrumbItem[] = [];
    if (match.parent) {
      items.push({ label: match.parent.label, to: match.parent.path });
    }
    items.push({ label: match.current });
    return items;
  }

  // Fallback for unmapped routes
  const pathnames = pathname.split("/").filter((x) => x && isNaN(Number(x)));
  if (
    pathnames.length === 0 ||
    (pathnames.length === 1 && pathnames[0].toLowerCase() === "dashboard")
  ) {
    return [];
  }

  return pathnames.map((segment, index) => {
    const isLast = index === pathnames.length - 1;
    const to = `/${pathnames.slice(0, index + 1).join("/")}`;
    const label = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    return {
      label,
      to: isLast ? undefined : to,
    };
  });
};

const BreadcrumbsNav: React.FC = () => {
  const location = useLocation();
  const items = getBreadcrumbItems(location.pathname);

  // If on home/dashboard root with no extra items
  const isDashboardOnly =
    location.pathname === "/" || location.pathname === "/dashboard";

  return (
    <Box
      sx={{
        backgroundColor: "#f8fafc",
        borderBottom: "1px solid #e2e8f0",
        py: 1,
        px: { xs: 2, md: 3 },
      }}
    >
      <Container maxWidth="xl" disableGutters>
        <Breadcrumbs
          separator={
            <NavigateNextIcon fontSize="small" sx={{ color: "#94a3b8" }} />
          }
          aria-label="breadcrumb"
          sx={{
            fontSize: "0.85rem",
            "& .MuiBreadcrumbs-ol": {
              alignItems: "center",
            },
          }}
        >
          {/* Home Link */}
          {isDashboardOnly ? (
            <Typography
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: "#A8005A",
                fontWeight: 600,
                fontSize: "0.85rem",
              }}
            >
              <DashboardIcon sx={{ fontSize: 18, color: "#A8005A" }} />
              Dashboard
            </Typography>
          ) : (
            <Link
              component={RouterLink}
              to="/dashboard"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: "#64748b",
                textDecoration: "none",
                fontWeight: 500,
                fontSize: "0.85rem",
                transition: "color 0.2s ease",
                "&:hover": {
                  color: "#A8005A",
                  textDecoration: "underline",
                },
              }}
            >
              <DashboardIcon sx={{ fontSize: 18, color: "#A8005A" }} />
              Dashboard
            </Link>
          )}

          {/* Path items */}
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            // Avoid duplicating Dashboard if it's returned in items
            if (item.label.toLowerCase() === "dashboard") {
              return null;
            }

            return isLast || !item.to ? (
              <Typography
                key={`${item.label}-${index}`}
                sx={{
                  color: "#A8005A",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                }}
              >
                {item.label}
              </Typography>
            ) : (
              <Link
                key={`${item.label}-${index}`}
                component={RouterLink}
                to={item.to}
                sx={{
                  color: "#64748b",
                  textDecoration: "none",
                  fontWeight: 500,
                  fontSize: "0.85rem",
                  transition: "color 0.2s ease",
                  "&:hover": {
                    color: "#A8005A",
                    textDecoration: "underline",
                  },
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      </Container>
    </Box>
  );
};

export default BreadcrumbsNav;
