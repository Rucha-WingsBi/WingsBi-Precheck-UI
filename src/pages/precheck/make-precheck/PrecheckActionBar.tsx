import React, { useState, useMemo } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Stack,
  CircularProgress,
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Grid,
} from "@mui/material";
import {
  QrCodeScanner as QrCodeScannerIcon,
  Send as SendIcon,
  FileDownload as FileDownloadIcon,
  CloudUpload as UploadIcon,
  Cancel as CancelIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Visibility as VisibilityIcon,
  CropFree as CropFreeIcon,
} from "@mui/icons-material";
import type { GridItem } from "./types";

interface PrecheckActionBarProps {
  barcodeText: string;
  showResults: boolean;
  searchResultsLength: number;
  isMakePrecheckEnabled: boolean;
  isSubmitEnabled: boolean;
  isLoadingLocal: boolean;
  uploadInProgress?: boolean;
  downloadTemplateInProgress?: boolean;
  idOptionsLength: number;

  // Display info
  selectedDrawingNumber: string;
  selectedProductionSeries: string;
  idNumber: string;
  selectedPONumber?: string;
  selectedLnItemCode?: string;

  searchResults?: GridItem[];
  filterRemainingOnly?: boolean;

  onBarcodeChange: (value: string) => void;
  onBarcodeKeyDown: (e: React.KeyboardEvent) => void;
  onOpenScanner: () => void;
  onUploadExcel: () => void;
  onDownloadTemplate: () => void;
  onMakePrecheck: () => void;
  onSubmitPrecheck: () => void;
  onToggleFilter?: () => void;
  onExport?: () => void;
  onReset?: () => void;
  onChangeOrder?: () => void;
  onChangeIdNumber?: () => void;
  onPrevId?: () => void;
  onNextId?: () => void;
  onReject?: () => void;

  isAdminOrHead?: boolean;
  isAddEnabled?: boolean;
  onAddBomDrawingClick?: () => void;
  isSidebarOpen?: boolean;
}

const PrecheckActionBar: React.FC<PrecheckActionBarProps> = ({
  barcodeText,
  showResults,
  searchResultsLength,
  isMakePrecheckEnabled,
  isSubmitEnabled,
  isLoadingLocal,
  uploadInProgress = false,
  downloadTemplateInProgress = false,
  idOptionsLength,
  selectedDrawingNumber,
  selectedProductionSeries,
  idNumber,
  selectedPONumber = "",
  selectedLnItemCode = "",
  searchResults = [],
  filterRemainingOnly = false,
  onBarcodeChange,
  onBarcodeKeyDown,
  onOpenScanner,
  onUploadExcel,
  onDownloadTemplate,
  onMakePrecheck,
  onSubmitPrecheck,
  onToggleFilter,
  onExport,
  onReset,
  onChangeOrder,
  onChangeIdNumber,
  onPrevId,
  onNextId,
  onReject,
  isAdminOrHead = false,
  isAddEnabled = false,
  onAddBomDrawingClick,
  isSidebarOpen = false,
}) => {
  // Menu Anchor State for "More v" dropdown
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
  const isMoreMenuOpen = Boolean(moreMenuAnchor);

  const handleMoreMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMoreMenuAnchor(event.currentTarget);
  };

  const handleMoreMenuClose = () => {
    setMoreMenuAnchor(null);
  };

  // Verification Stats Calculation
  const stats = useMemo(() => {
    const total = searchResults.length;
    if (total === 0) {
      return {
        total: 0,
        verified: 0,
        short: 0,
        rejected: 0,
        notScanned: 0,
        percentVerified: 0,
      };
    }

    let verified = 0;
    let short = 0;
    let rejected = 0;
    let notScanned = 0;

    searchResults.forEach((item) => {
      const isComplete =
        item.isPrecheckComplete || item.precheckStatus?.toLowerCase() === "verified" || item.precheckStatus?.toLowerCase() === "completed";
      const isRej = item.isRejected || item.precheckStatus?.toLowerCase() === "rejected";
      const scannedQty = item.scannedQuantity ?? 0;
      const totalQty = item.quantity ?? 1;

      if (isRej) {
        rejected++;
      } else if (isComplete || scannedQty >= totalQty) {
        verified++;
      } else if (scannedQty > 0 && scannedQty < totalQty) {
        short++;
      } else {
        notScanned++;
      }
    });

    const percentVerified = Math.round((verified / total) * 100);

    return {
      total,
      verified,
      short,
      rejected,
      notScanned,
      percentVerified,
    };
  }, [searchResults]);

  return (
    <Box sx={{ width: "100%", mb: 1.5 }}>
      {/* Top Header Bar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 1,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        {/* Title & Subtitle */}
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "primary.main",
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
            }}
          >
            Run Precheck
          </Typography>
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            flexWrap="wrap"
            sx={{ color: "#6B7280", fontSize: "0.875rem" }}
          >
            <Typography variant="body2" sx={{ color: "#6B7280", fontSize: "0.875rem" }}>
              PO{" "}
              <Box component="span" sx={{ color: "#111827", fontWeight: 700 }}>
                {selectedPONumber || "-"}
              </Box>{" "}
              · Drawing{" "}
              <Box component="span" sx={{ color: "#111827", fontWeight: 700 }}>
                {selectedDrawingNumber || "-"}
              </Box>{" "}
              · LN Item{" "}
              <Box component="span" sx={{ color: "#111827", fontWeight: 700 }}>
                {selectedLnItemCode || "-"}
              </Box>{" "}
              · Series{" "}
              <Box component="span" sx={{ color: "#111827", fontWeight: 700 }}>
                {selectedProductionSeries || "-"}
              </Box>{" "}
              · ID No.{" "}
              <Box component="span" sx={{ color: "#111827", fontWeight: 700 }}>
                {idNumber || "-"}
              </Box>
            </Typography>

            {onChangeIdNumber && (
              <Button
                variant="text"
                size="small"
                onClick={onChangeIdNumber}
                sx={{
                  color: "#7E22CE",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  p: 0,
                  ml: 0.5,
                  minWidth: "auto",
                  textTransform: "none",
                  "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
                }}
              >
                Change ID number
              </Button>
            )}

            {onChangeOrder && (
              <Button
                variant="text"
                size="small"
                onClick={onChangeOrder}
                sx={{
                  color: "#7E22CE",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  p: 0,
                  ml: 0.5,
                  minWidth: "auto",
                  textTransform: "none",
                  "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
                }}
              >
                Change order
              </Button>
            )}
          </Stack>
        </Box>

        {/* Top Right "More v" Action Button */}
        <Box>
          <Button
            variant="outlined"
            size="small"
            onClick={handleMoreMenuOpen}
            endIcon={<KeyboardArrowDownIcon sx={{ fontSize: "1.125rem", color: "text.secondary" }} />}
            sx={{
              height: 34,
              borderRadius: "6px",
              borderColor: "grey.300",
              color: "text.secondary",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.8rem",
              backgroundColor: "background.paper",
              "&:hover": { borderColor: "grey.400", backgroundColor: "grey.50" },
            }}
          >
            More
          </Button>

          {/* More Menu Dropdown */}
          <Menu
            anchorEl={moreMenuAnchor}
            open={isMoreMenuOpen}
            onClose={handleMoreMenuClose}
            transitionDuration={0}
            PaperProps={{
              elevation: 4,
              sx: {
                borderRadius: "12px",
                mt: 1,
                minWidth: 210,
                border: "1px solid #E5E7EB",
              },
            }}
          >


            {onToggleFilter && (
              <MenuItem
                onClick={() => {
                  handleMoreMenuClose();
                  onToggleFilter();
                }}
                disabled={!isSubmitEnabled}
              >
                <ListItemIcon>
                  <FilterListIcon fontSize="small" sx={{ color: "#2563EB" }} />
                </ListItemIcon>
                <ListItemText
                  primary={filterRemainingOnly ? "Show All Items" : "Remaining Precheck"}
                />
              </MenuItem>
            )}

            {onExport && (
              <MenuItem
                onClick={() => {
                  handleMoreMenuClose();
                  onExport();
                }}
                disabled={!isSubmitEnabled}
              >
                <ListItemIcon>
                  <FileDownloadIcon fontSize="small" sx={{ color: "#059669" }} />
                </ListItemIcon>
                <ListItemText primary="Export BOM" />
              </MenuItem>
            )}

            <Divider sx={{ my: 0.5 }} />

            <MenuItem
              onClick={() => {
                handleMoreMenuClose();
                onUploadExcel();
              }}
              disabled={uploadInProgress}
            >
              <ListItemIcon>
                {uploadInProgress ? (
                  <CircularProgress size={18} color="primary" />
                ) : (
                  <UploadIcon fontSize="small" sx={{ color: "#D97706" }} />
                )}
              </ListItemIcon>
              <ListItemText primary={uploadInProgress ? "Uploading..." : "Upload Excel..."} />
            </MenuItem>

            <MenuItem
              onClick={() => {
                handleMoreMenuClose();
                onDownloadTemplate();
              }}
              disabled={downloadTemplateInProgress || uploadInProgress}
            >
              <ListItemIcon>
                {downloadTemplateInProgress ? (
                  <CircularProgress size={18} color="primary" />
                ) : (
                  <FileDownloadIcon fontSize="small" sx={{ color: "#4B5563" }} />
                )}
              </ListItemIcon>
              <ListItemText
                primary={downloadTemplateInProgress ? "Downloading..." : "Download Template"}
              />
            </MenuItem>

            <Divider sx={{ my: 0.5 }} />

            {onReset && (
              <MenuItem
                onClick={() => {
                  handleMoreMenuClose();
                  onReset();
                }}
              >
                <ListItemIcon>
                  <RefreshIcon fontSize="small" sx={{ color: "#DC2626" }} />
                </ListItemIcon>
                <ListItemText primary="Reset scans" />
              </MenuItem>
            )}

            {onReject && (
              <MenuItem
                onClick={() => {
                  handleMoreMenuClose();
                  onReject();
                }}
                disabled={isLoadingLocal}
              >
                <ListItemIcon>
                  <CancelIcon fontSize="small" sx={{ color: "#DC2626" }} />
                </ListItemIcon>
                <ListItemText primary="Reject Order" />
              </MenuItem>
            )}
          </Menu>
        </Box>
      </Box>

      {/* Hero Scanner QR Box & Verification Stats Card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, md: 1.75 },
          borderRadius: "16px",
          border: "1px solid #E5E7EB",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        }}
      >
        <Grid container spacing={2} alignItems="center">
          {/* Left Column: Scan QR Input Box */}
          <Grid item xs={12} md={7} lg={7.5}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 600, color: "#475467", mb: 0.75, display: "block", fontSize: "0.8125rem" }}
            >
              Scan QR
            </Typography>

            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: "100%" }}>
              {/* Thick Rounded Purple Border Input Box */}
              <Box
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "10px",
                  border: "2px solid",
                  borderColor: "primary.main",
                  backgroundColor: "#FFFFFF",
                  px: 1.5,
                  py: 0.75,
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                }}
              >
                <CropFreeIcon sx={{ color: "primary.main", mr: 1.25, fontSize: 22 }} />
                <TextField
                  fullWidth
                  variant="standard"
                  value={barcodeText}
                  onChange={(e) => onBarcodeChange(e.target.value)}
                  onKeyDown={onBarcodeKeyDown}
                  placeholder="Enter QR code number (12 to 15) digit"
                  autoFocus
                  InputProps={{
                    disableUnderline: true,
                    sx: {
                      fontSize: "0.9375rem",
                      color: "#1E293B",
                      fontFamily: "monospace, Courier, monospace",
                      "& input::placeholder": {
                        color: "#94A3B8",
                        opacity: 1,
                      },
                    },
                  }}
                  inputProps={{
                    maxLength: 15,
                  }}
                />
              </Box>

              {/* Scan QR Button with thick purple border and camera icon */}
              <Button
                variant="outlined"
                onClick={onOpenScanner}
                startIcon={<QrCodeScannerIcon />}
                sx={{
                  height: 48,
                  px: 2.5,
                  borderRadius: "10px",
                  border: "2px solid",
                  borderColor: "primary.main",
                  color: "primary.main",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  textTransform: "none",
                  backgroundColor: "#FFFFFF",
                  whiteSpace: "nowrap",
                  "&:hover": {
                    border: "2px solid",
                    borderColor: "primary.main",
                    backgroundColor: "action.hover",
                  },
                }}
              >
                Scan QR
              </Button>
            </Stack>

            {/* Sub-text line below scanner input */}
            {barcodeText && (
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mt: 1.25, fontSize: "0.8125rem", color: "#64748B" }}
              >
                <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.8125rem" }}>
                  Last scan:{" "}
                  <Box component="span" sx={{ fontWeight: 700, color: "#1E293B" }}>
                    {barcodeText}
                  </Box>
                </Typography>
              </Stack>
            )}
          </Grid>

          {/* Right Column: Line Verification Progress Box */}
          <Grid item xs={12} md={5} lg={4.5}>
            <Box
              sx={{
                p: 2,
                borderRadius: "12px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2E8F0",
              }}
            >
              {/* Header line: Count & Percent */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, color: "#111827", fontSize: "0.875rem" }}
                >
                  {`${stats.verified} of ${stats.total} lines verified`}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: "#6B7280", fontSize: "0.8125rem" }}
                >
                  {`${stats.percentVerified}%`}
                </Typography>
              </Box>

              {/* Segmented Color Progress Bar */}
              <Box
                sx={{
                  height: 8,
                  width: "100%",
                  borderRadius: "4px",
                  backgroundColor: "#E5E7EB",
                  display: "flex",
                  overflow: "hidden",
                  mb: 1.5,
                }}
              >
                {/* Verified Segment (Green) */}
                <Box
                  sx={{
                    width: `${stats.total > 0 ? (stats.verified / stats.total) * 100 : 0}%`,
                    backgroundColor: "#059669",
                    transition: "width 0.4s ease",
                  }}
                />
                {/* Short Segment (Amber) */}
                <Box
                  sx={{
                    width: `${stats.total > 0 ? (stats.short / stats.total) * 100 : 0}%`,
                    backgroundColor: "#D97706",
                    transition: "width 0.4s ease",
                  }}
                />
                {/* Rejected Segment (Red) */}
                <Box
                  sx={{
                    width: `${stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0}%`,
                    backgroundColor: "#DC2626",
                    transition: "width 0.4s ease",
                  }}
                />
                {/* Not Scanned Segment (Gray) */}
                <Box
                  sx={{
                    width: `${stats.total > 0 ? (stats.notScanned / stats.total) * 100 : 0}%`,
                    backgroundColor: "#9CA3AF",
                    transition: "width 0.4s ease",
                  }}
                />
              </Box>

              {/* Legend Badges Row */}
              <Stack
                direction="row"
                spacing={1.25}
                alignItems="center"
                justifyContent="space-between"
                flexWrap="wrap"
                sx={{ fontSize: "0.75rem" }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box
                    sx={{ width: 8, height: 8, borderRadius: "1px", backgroundColor: "#059669" }}
                  />
                  <Typography variant="caption" sx={{ color: "#4B5563", fontWeight: 600, fontSize: "0.75rem" }}>
                    {stats.verified} verified
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box
                    sx={{ width: 8, height: 8, borderRadius: "1px", backgroundColor: "#D97706" }}
                  />
                  <Typography variant="caption" sx={{ color: "#4B5563", fontWeight: 600, fontSize: "0.75rem" }}>
                    {stats.short} short
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box
                    sx={{ width: 8, height: 8, borderRadius: "1px", backgroundColor: "#DC2626" }}
                  />
                  <Typography variant="caption" sx={{ color: "#4B5563", fontWeight: 600, fontSize: "0.75rem" }}>
                    {stats.rejected} rejected
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box
                    sx={{ width: 8, height: 8, borderRadius: "1px", backgroundColor: "#9CA3AF" }}
                  />
                  <Typography variant="caption" sx={{ color: "#4B5563", fontWeight: 600, fontSize: "0.75rem" }}>
                    {stats.notScanned} not scanned
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default PrecheckActionBar;


