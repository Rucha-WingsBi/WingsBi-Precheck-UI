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
} from "@mui/icons-material";

// Map URL path slugs to user-friendly titles
const ROUTE_NAME_MAP: Record<string, string> = {
  dashboard: "Dashboard",
  precheck: "Precheck",
  view: "View",
  make: "Make Precheck",
  "store-in": "Store In",
  "stored-components": "Stored In Components",
  "available-in-store": "Available In Store",
  "make-order": "Make Order",
  consumed: "View Consumed In",
  pending: "Pending",
  qc: "QC",
  store: "Store",
  archive: "Archive",
  irmsn: "IR / MSN",
  generate: "Generate",
  edit: "Edit",
  qrcode: "QR Code",
  "generate-new": "Generate New",
  update: "Update",
  sop: "SOP",
  viewBOM: "View BOM",
  settings: "Settings",
  components: "Components",
  assembly: "Assembly",
  materialrequisition: "Material Requisition",
  "production-order": "Production Order",
  "pending-for-precheck": "Pending For Precheck",
  scriptexecutor: "Script Executor",
  adminmaster: "Admin Master",
  usermanagement: "User Management",
  rolemanagement: "Role Management",
  addcomponents: "Add Components",
  updatecomponents: "Update Components",
  "update-drawingnumber": "Update Drawing Number",
};

const formatSegmentTitle = (segment: string): string => {
  if (ROUTE_NAME_MAP[segment]) {
    return ROUTE_NAME_MAP[segment];
  }
  // Check if it's a numeric ID or parameter
  if (!isNaN(Number(segment))) {
    return `#${segment}`;
  }
  // Fallback: capitalize words separated by hyphens
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const BreadcrumbsNav: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // If path is root or empty, don't show breadcrumbs or show Dashboard
  if (pathnames.length === 0) {
    return null;
  }

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
          separator={<NavigateNextIcon fontSize="small" sx={{ color: "#94a3b8" }} />}
          aria-label="breadcrumb"
          sx={{
            fontSize: "0.85rem",
            "& .MuiBreadcrumbs-ol": {
              alignItems: "center",
            },
          }}
        >
          {/* Home Link */}
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
            <HomeIcon sx={{ fontSize: 18, color: "#A8005A" }} />
            Home
          </Link>

          {/* Path segments */}
          {pathnames.map((value, index) => {
            const last = index === pathnames.length - 1;
            const to = `/${pathnames.slice(0, index + 1).join("/")}`;
            const title = formatSegmentTitle(value);

            // Don't duplicate Dashboard if already handled by Home
            if (value.toLowerCase() === "dashboard") {
              return null;
            }

            return last ? (
              <Typography
                key={to}
                sx={{
                  color: "#A8005A",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                }}
              >
                {title}
              </Typography>
            ) : (
              <Link
                key={to}
                component={RouterLink}
                to={to}
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
                {title}
              </Link>
            );
          })}
        </Breadcrumbs>
      </Container>
    </Box>
  );
};

export default BreadcrumbsNav;
