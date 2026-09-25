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
  Tooltip,
} from "@mui/material";
import {
  QrCodeScanner as QrCodeScannerIcon,
  FileDownload as FileDownloadIcon,
  CloudUpload as UploadIcon,
  Cancel as CancelIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
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

export interface PrecheckHeaderBarProps {
  filterRemainingOnly?: boolean;
  onToggleFilter?: () => void;
  onExport?: () => void;
  onReset?: () => void;
  onUploadExcel: () => void;
  onDownloadTemplate: () => void;
  onReject?: () => void;
  isSubmitEnabled?: boolean;
  uploadInProgress?: boolean;
  downloadTemplateInProgress?: boolean;
  isLoadingLocal?: boolean;
}

export const PrecheckHeaderBar: React.FC<PrecheckHeaderBarProps> = ({
  filterRemainingOnly = false,
  onToggleFilter,
  onExport,
  onReset,
  onUploadExcel,
  onDownloadTemplate,
  onReject,
  isSubmitEnabled = false,
  uploadInProgress = false,
  downloadTemplateInProgress = false,
  isLoadingLocal = false,
}) => {
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
  const isMoreMenuOpen = Boolean(moreMenuAnchor);

  const handleMoreMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMoreMenuAnchor(event.currentTarget);
  };

  const handleMoreMenuClose = () => {
    setMoreMenuAnchor(null);
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 0.6,
        mt: 0.25,
        width: "100%",
      }}
    >
      {/* Title */}
      <Box>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: "primary.main",
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
          }}
        >
          Part Verification
        </Typography>
        <Typography variant="body2" sx={{ color: "#667085", mt: 0.25 }}>
          Scan items, verify component quality, and complete precheck.
        </Typography>
      </Box>

      {/* Top Right Actions: More, Export */}
      <Stack direction="row" spacing={1} alignItems="center">
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

        {onExport && (
          <Button
            variant="outlined"
            size="small"
            onClick={onExport}
            disabled={!isSubmitEnabled || isLoadingLocal}
            startIcon={<FileDownloadIcon fontSize="small" />}
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
            Export
          </Button>
        )}

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
              minWidth: 110,
              border: "1px solid #E5E7EB",
            },
          }}
        >
          {/* {onToggleFilter && (
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
          )} */}

          {/* <Divider sx={{ my: 0.5 }} /> */}

          <Tooltip title="Import Excel file for bulk verification" placement="left" arrow>
            <span>
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
                <ListItemText primary={uploadInProgress ? "Uploading..." : "Import"} />
              </MenuItem>
            </span>
          </Tooltip>

          <Tooltip title="Download Excel template for bulk verification" placement="left" arrow>
            <span>
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
                  primary={downloadTemplateInProgress ? "Downloading..." : "Template"}
                />
              </MenuItem>
            </span>
          </Tooltip>

         
        </Menu>
      </Stack>
    </Box>
  );
};

const PrecheckActionBar: React.FC<PrecheckActionBarProps> = ({
  barcodeText,
  isSubmitEnabled,
  isLoadingLocal,
  uploadInProgress = false,
  downloadTemplateInProgress = false,
  searchResults = [],
  filterRemainingOnly = false,
  onBarcodeChange,
  onBarcodeKeyDown,
  onOpenScanner,
  onUploadExcel,
  onDownloadTemplate,
  onToggleFilter,
  onExport,
  onReset,
  onReject,
  onMakePrecheck,
  onSubmitPrecheck,
  isAdminOrHead = false,
  isAddEnabled = false,
  onAddBomDrawingClick,
}) => {
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
      const statusLower = (item.precheckStatus || "").toLowerCase();
      const isRej = item.isRejected || statusLower === "rejected";
      const isComplete =
        !isRej &&
        (item.isPrecheckComplete ||
          statusLower === "verified" ||
          statusLower === "completed" ||
          statusLower === "updated" ||
          item.isUpdated ||
          (item.precheckDetailsId !== undefined && item.precheckDetailsId > 0 && statusLower !== "pending") ||
          (Boolean(item.qrCode) && (item.remainingQuantity === 0 || item.remainingQuantity === null || item.remainingQuantity === undefined)));

      const scannedQty = item.scannedQuantity ?? (item.qrCode ? item.quantity : 0);
      const totalQty = item.quantity ?? 1;
      const remQty = item.remainingQuantity;

      if (isRej) {
        rejected++;
      } else if (isComplete) {
        verified++;
      } else if (
        (scannedQty > 0 && scannedQty < totalQty) ||
        (remQty !== undefined && remQty !== null && remQty > 0 && remQty < totalQty)
      ) {
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
    <Box sx={{ width: "100%", mb: 0.6 }}>

      {/* Hero Scanner QR Box & Verification Stats Card */}
      <Paper
        elevation={0}
        sx={{
          py: 0.75,
          px: { xs: 1.25, md: 1.5 },
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        }}
      >
        <Grid container spacing={1.5} alignItems="center">
          {/* Left Column: Scan QR Input Box */}
          <Grid
            item
            xs={12}
            md={6.8}
            lg={7}
            sx={{
              pr: { xs: 0, md: 2 },
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                width: "100%",
                position: "relative",
                "&::after": {
                  content: '""',
                  display: { xs: "none", md: "block" },
                  position: "absolute",
                  right: "-18px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  height: "36px",
                  width: "1px",
                  backgroundColor: "#E5E7EB",
                },
              }}
            >
              {/* Thick Rounded Purple Border Input Box */}
              <Box
                sx={{
                  flexGrow: 1,
                  height: "48px !important",
                  minHeight: "48px !important",
                  maxHeight: "48px !important",
                  boxSizing: "border-box !important",
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "10px",
                  border: "2px solid",
                  borderColor: "primary.main",
                  backgroundColor: "#FFFFFF",
                  px: 1.5,
                  py: "0 !important",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                }}
              >
                <CropFreeIcon sx={{ color: "primary.main", mr: 1.25, fontSize: 20 }} />
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
                      fontSize: "0.9rem",
                      color: "#1E293B",
                      fontFamily: "monospace, Courier, monospace",
                      "& input": {
                        py: "0 !important",
                        height: "auto",
                      },
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
                startIcon={<QrCodeScannerIcon sx={{ fontSize: "1.15rem" }} />}
                sx={{
                  height: "48px !important",
                  minHeight: "48px !important",
                  maxHeight: "48px !important",
                  boxSizing: "border-box !important",
                  py: "0 !important",
                  px: 2.25,
                  borderRadius: "10px",
                  border: "2px solid",
                  borderColor: "primary.main",
                  color: "primary.main",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  lineHeight: "1 !important",
                  textTransform: "none",
                  backgroundColor: "#FFFFFF",
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
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
                sx={{ mt: 0.5, fontSize: "0.75rem", color: "#64748B" }}
              >
                <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.75rem" }}>
                  Last scan:{" "}
                  <Box component="span" sx={{ fontWeight: 700, color: "#1E293B" }}>
                    {barcodeText}
                  </Box>
                </Typography>
              </Stack>
            )}
          </Grid>

          {/* Right Column: Line Verification Progress Box */}
          <Grid item xs={12} md={5.2} lg={5} sx={{ pl: { xs: 0, md: 1 } }}>
            <Box
              sx={{
                py: 0.25,
                px: 0.5,
                borderRadius: "10px",
                backgroundColor: "transparent",
                border: "none",
              }}
            >
              {/* Header line: Count & Percent */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 0.5,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, color: "#111827", fontSize: "0.8125rem" }}
                >
                  {`${stats.verified} of ${stats.total} Parts Completed`}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: "#6B7280", fontSize: "0.75rem" }}
                >
                  {`${stats.percentVerified}%`}
                </Typography>
              </Box>

              {/* Segmented Color Progress Bar */}
              <Box
                sx={{
                  height: 6,
                  width: "100%",
                  borderRadius: "3px",
                  backgroundColor: "#E5E7EB",
                  display: "flex",
                  overflow: "hidden",
                  mb: 0.75,
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
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
                flexWrap="wrap"
                sx={{ fontSize: "0.7rem" }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box
                    sx={{ width: 7, height: 7, borderRadius: "1px", backgroundColor: "#059669" }}
                  />
                  <Typography variant="caption" sx={{ color: "#4B5563", fontWeight: 600, fontSize: "0.7rem" }}>
                    {stats.verified} Completed
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box
                    sx={{ width: 7, height: 7, borderRadius: "1px", backgroundColor: "#D97706" }}
                  />
                  <Typography variant="caption" sx={{ color: "#4B5563", fontWeight: 600, fontSize: "0.7rem" }}>
                    {stats.short} Partial
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box
                    sx={{ width: 7, height: 7, borderRadius: "1px", backgroundColor: "#DC2626" }}
                  />
                  <Typography variant="caption" sx={{ color: "#4B5563", fontWeight: 600, fontSize: "0.7rem" }}>
                    {stats.rejected} rejected
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box
                    sx={{ width: 7, height: 7, borderRadius: "1px", backgroundColor: "#9CA3AF" }}
                  />
                  <Typography variant="caption" sx={{ color: "#4B5563", fontWeight: 600, fontSize: "0.7rem" }}>
                    {stats.notScanned} Pending
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


