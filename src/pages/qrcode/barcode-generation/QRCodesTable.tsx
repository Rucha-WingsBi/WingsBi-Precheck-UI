import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Chip,
  IconButton,
  Menu,
  MenuItem as MuiMenuItem,
  ListItemIcon,
  ListItemText,
  Box,
} from "@mui/material";
import {
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  GetApp as GetAppIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  CallSplit as CallSplitIcon,
} from "@mui/icons-material";
import { CustomPagination } from "../../../components/CustomPagination";

interface QRCodesTableProps {
  displayedQRCodes: any[];
  selectedBarcodes: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectBarcode: (id: string, checked: boolean) => void;
  onDownload: () => void;
  onOpenBulkUpdateDialog: () => void;
  onSplit: (globalIndex: number) => void;
  onSplitAll: () => void;
  hasAnySplit: boolean;
  canSplitAny: boolean;
  showBatchIdColumn: boolean;
  componentType: string;
  isDownloading: boolean;
  onOpenSingleExportDialog: (qrCodeId: string, batchId?: string) => void;
  page: number;
  rowsPerPage: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newSize: number) => void;
}

const QRCodesTable = ({
  displayedQRCodes,
  selectedBarcodes,
  onSelectAll,
  onSelectBarcode,
  onDownload,
  onOpenBulkUpdateDialog,
  onSplit,
  onSplitAll,
  hasAnySplit,
  canSplitAny,
  showBatchIdColumn,
  componentType,
  isDownloading,
  onOpenSingleExportDialog,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: QRCodesTableProps) => {
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [actionMenuItem, setActionMenuItem] = useState<any | null>(null);
  const [actionMenuIndex, setActionMenuIndex] = useState<number | null>(null);

  const handleActionMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    item: any,
    globalIndex: number
  ) => {
    setActionMenuAnchorEl(event.currentTarget);
    setActionMenuItem(item);
    setActionMenuIndex(globalIndex);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchorEl(null);
    setActionMenuItem(null);
    setActionMenuIndex(null);
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: "10px",
        borderColor: "#EAECF0",
        backgroundColor: "#FFFFFF",
        mt: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1.5}
          sx={{ mb: 2 }}
        >
          <Box flex={1}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#1E293B" }}>
              Generated QR Codes
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B" }}>
              Total {displayedQRCodes.length} item(s) available
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
            {canSplitAny && (
              <Button
                variant="outlined"
                color={hasAnySplit ? "error" : "secondary"}
                size="small"
                onClick={onSplitAll}
                disabled={displayedQRCodes.length === 0}
                sx={{ mr: 1 }}
              >
                {hasAnySplit ? "Close All" : "Split All"}
              </Button>
            )}

            <Button
              variant="contained"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={onDownload}
              disabled={selectedBarcodes.length === 0 || isDownloading}
            >
              Export Selected ({selectedBarcodes.length})
            </Button>
            <Button
              variant="contained"
              color="secondary"
              size="small"
              startIcon={<EditIcon />}
              onClick={onOpenBulkUpdateDialog}
              disabled={selectedBarcodes.length === 0}
            >
              Bulk Edit ({selectedBarcodes.length})
            </Button>
          </Stack>
        </Stack>

        <TableContainer component={Paper} variant="outlined">
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ height: 40 }}>
                <TableCell
                  padding="checkbox"
                  sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 0.75, px: 1.25 }}
                >
                  <Checkbox
                    checked={
                      selectedBarcodes.length === displayedQRCodes.length &&
                      displayedQRCodes.length > 0
                    }
                    indeterminate={
                      selectedBarcodes.length > 0 &&
                      selectedBarcodes.length < displayedQRCodes.length
                    }
                    onChange={(e) => onSelectAll(e.target.checked)}
                    size="small"
                  />
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 0.75, px: 1.25 }}
                >
                  Sr. No
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 0.75, px: 1.25 }}
                >
                  QR Code
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 0.75, px: 1.25 }}
                >
                  ID Number
                </TableCell>
                {showBatchIdColumn && (
                  <TableCell
                    sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 0.75, px: 1.25 }}
                  >
                    Batch ID
                  </TableCell>
                )}
                <TableCell
                  sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 0.75, px: 1.25 }}
                >
                  Status
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 700, backgroundColor: "#F9FAFB !important", color: "#475467", fontSize: "0.8rem", borderBottom: "1px solid #EAECF0", py: 0.75, px: 1.25 }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedQRCodes
                .slice(
                  page * rowsPerPage,
                  page * rowsPerPage + rowsPerPage
                )
                .map((item, index) => (
                  <TableRow
                    key={
                      item.id || item.qrCodeNumber || item.serialNumber
                    }
                    hover
                    sx={{
                      height: 36,
                      backgroundColor: item.isSplitRow ? "#f5f5f5" : "inherit",
                      "& td": { borderBottom: "1px solid #F2F4F7", fontSize: "0.775rem", color: "#344054", py: 0.5, px: 1.25 },
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedBarcodes.includes(
                          item.id || item.qrCodeNumber || item.serialNumber
                        )}
                        onChange={(e) => {
                          e.stopPropagation();
                          onSelectBarcode(
                            item.id || item.qrCodeNumber || item.serialNumber,
                            e.target.checked
                          );
                        }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {page * rowsPerPage + index + 1}
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: "monospace", fontSize: "0.775rem", fontWeight: 600, color: "#101828" }}
                      >
                        {item.qrCodeNumber || item.serialNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.idNumber || "-"}</TableCell>
                    {showBatchIdColumn && (
                      <TableCell>{item.batchId || "N/A"}</TableCell>
                    )}
                    <TableCell>
                      <Chip
                        label={item.isNewQrCode ? "New" : "Existing"}
                        color={item.isNewQrCode ? "success" : "default"}
                        size="small"
                        sx={{ height: 22, fontSize: "0.75rem" }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) =>
                          handleActionMenuOpen(
                            e,
                            item,
                            page * rowsPerPage + index
                          )
                        }
                        sx={{
                          color: "#64748B",
                          "&:hover": { color: "#6D2A8F", backgroundColor: "rgba(109, 42, 143, 0.08)" },
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Menu
          anchorEl={actionMenuAnchorEl}
          open={Boolean(actionMenuAnchorEl)}
          onClose={handleActionMenuClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          PaperProps={{
            sx: {
              minWidth: 140,
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              borderRadius: "8px",
              py: 0.5,
            },
          }}
        >
          <MuiMenuItem
            onClick={() => {
              if (actionMenuItem) {
                copyToClipboard(
                  actionMenuItem.qrCodeNumber || actionMenuItem.serialNumber
                );
              }
              handleActionMenuClose();
            }}
            sx={{ fontSize: "0.85rem", py: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: "#6D2A8F" }}>
              <CopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Copy" primaryTypographyProps={{ fontSize: "0.85rem" }} />
          </MuiMenuItem>

          <MuiMenuItem
            onClick={() => {
              if (actionMenuItem) {
                onOpenSingleExportDialog(
                  actionMenuItem.qrCodeNumber || actionMenuItem.serialNumber,
                  actionMenuItem.batchId
                );
              }
              handleActionMenuClose();
            }}
            sx={{ fontSize: "0.85rem", py: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: "#6D2A8F" }}>
              <GetAppIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Download" primaryTypographyProps={{ fontSize: "0.85rem" }} />
          </MuiMenuItem>

          {actionMenuItem &&
            (componentType === "BATCH" || componentType === "Batch") &&
            canSplitAny &&
            (Number(actionMenuItem.quantity) > 1 || actionMenuItem.hasBeenSplit) &&
            !actionMenuItem.isSplitRow && (
              <MuiMenuItem
                onClick={() => {
                  if (actionMenuIndex !== null) {
                    onSplit(actionMenuIndex);
                  }
                  handleActionMenuClose();
                }}
                sx={{
                  fontSize: "0.85rem",
                  py: 1,
                  color: actionMenuItem.hasBeenSplit ? "error.main" : "secondary.main",
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 32,
                    color: actionMenuItem.hasBeenSplit ? "error.main" : "secondary.main",
                  }}
                >
                  <CallSplitIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={actionMenuItem.hasBeenSplit ? "Close Split" : "Split"}
                  primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 600 }}
                />
              </MuiMenuItem>
            )}
        </Menu>

        <CustomPagination
          page={page}
          pageSize={rowsPerPage}
          totalCount={displayedQRCodes.length}
          pageSizeOptions={[5, 10, 25, 50]}
          onPageChange={(newPage) => onPageChange(newPage)}
          onPageSizeChange={(newSize) => {
            onRowsPerPageChange(newSize);
          }}
        />

      </CardContent>
    </Card>
  );
};

export default React.memo(QRCodesTable);
