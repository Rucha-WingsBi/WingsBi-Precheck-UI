import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  UploadFile as UploadFileIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";

interface ExcelUploadResult {
  qrCodeNumber: string;
  productionOrderNumber: string;
  idNumber: number;
  success: boolean;
  message: string;
}

interface ExcelUploadResponse {
  totalRows: number;
  successCount: number;
  failedCount: number;
  results: ExcelUploadResult[];
}

interface ExcelUploadResultDialogProps {
  open: boolean;
  onClose: () => void;
  data: ExcelUploadResponse | null;
}

const ExcelUploadResultDialog: React.FC<ExcelUploadResultDialogProps> = ({
  open,
  onClose,
  data,
}) => {
  if (!data) return null;

  const failedResults = data.results.filter((r) => !r.success);
  const hasFailures = failedResults.length > 0;
  const allSuccess = data.failedCount === 0 && data.successCount > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
          pt: 2,
          background: allSuccess
            ? (theme) => `linear-gradient(135deg, ${theme.palette.secondary.light}15 0%, ${theme.palette.secondary.light}30 100%)`
            : hasFailures
              ? "linear-gradient(135deg, #fef7f0 0%, #fdebd0 100%)"
              : "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <UploadFileIcon
            sx={{
              color: allSuccess
                ? "#6db88a"
                : hasFailures
                  ? "#c4956a"
                  : "#8b9dc3",
            }}
          />
          <Typography variant="h6" fontWeight="600" sx={{ color: "#3d4f5f" }}>
            Excel Upload Result
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 5, pb: 1, mt: 2 }}>
        {/* Summary Chips */}
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            mb: 4,
            pb: 2,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Chip
            icon={<UploadFileIcon />}
            label={`Total Rows: ${data.totalRows}`}
            variant="outlined"
            sx={{
              fontWeight: 600,
              fontSize: "0.85rem",
              py: 2.5,
              px: 1,
              borderColor: "#a5b4cb",
              color: "#5a7094",
              bgcolor: "#f0f4fa",
              "& .MuiChip-icon": { color: "#7b93b8" },
            }}
          />
          <Chip
            icon={<CheckCircleIcon />}
            label={`Success: ${data.successCount}`}
            variant="outlined"
            sx={{
              fontWeight: 600,
              fontSize: "0.85rem",
              py: 2.5,
              px: 1,
              borderColor: "#a3d9b1",
              color: "#4a8c5c",
              bgcolor: "#f0faf3",
              "& .MuiChip-icon": { color: "#6db88a" },
            }}
          />
          <Chip
            icon={<ErrorIcon />}
            label={`Failed: ${data.failedCount}`}
            variant="outlined"
            sx={{
              fontWeight: 600,
              fontSize: "0.85rem",
              py: 2.5,
              px: 1,
              borderColor: data.failedCount > 0 ? "#e4a9a9" : "#d1d5db",
              color: data.failedCount > 0 ? "#b05656" : "#9ca3af",
              bgcolor: data.failedCount > 0 ? "#fdf2f2" : "#f9fafb",
              "& .MuiChip-icon": {
                color: data.failedCount > 0 ? "#d08888" : "#d1d5db",
              },
            }}
          />
        </Box>

        {/* Failed Items List */}
        {hasFailures && (
          <>
            <Divider sx={{ mb: 1.5, borderColor: "#e5e7eb" }} />
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 1,
              }}
            >
              <WarningIcon sx={{ color: "#d08888" }} fontSize="small" />
              <Typography
                variant="subtitle2"
                sx={{ color: "#9b4d4d" }}
                fontWeight={600}
              >
                Failed Items ({failedResults.length})
              </Typography>
            </Box>
            <List
              dense
              sx={{
                maxHeight: 300,
                overflow: "auto",
                bgcolor: "#fdf8f8",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "#f0d4d4",
                p: 0.5,
              }}
            >
              {failedResults.map((result, index) => (
                <ListItem
                  key={`${result.qrCodeNumber}-${index}`}
                  sx={{
                    borderBottom:
                      index < failedResults.length - 1
                        ? "1px solid #f5e0e0"
                        : "none",
                    py: 1,
                    px: 1.5,
                    alignItems: "flex-start",
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                    <ErrorIcon sx={{ color: "#d09090" }} fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          gap: 0.8,
                          flexWrap: "wrap",
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            bgcolor: "#e8d5d5",
                            color: "#7a3b3b",
                            px: 1,
                            py: 0.2,
                            borderRadius: 1,
                            fontWeight: 600,
                            fontSize: "0.7rem",
                          }}
                        >
                          QR: {result.qrCodeNumber}
                        </Typography>
                        {result.productionOrderNumber && (
                          <Typography
                            variant="caption"
                            sx={{
                              bgcolor: "#dde4ed",
                              color: "#4a5568",
                              px: 1,
                              py: 0.2,
                              borderRadius: 1,
                              fontWeight: 600,
                              fontSize: "0.7rem",
                            }}
                          >
                            PO: {result.productionOrderNumber}
                          </Typography>
                        )}
                        {result.idNumber !== undefined &&
                          result.idNumber !== null && (
                            <Typography
                              variant="caption"
                              sx={{
                                bgcolor: "#e2e8f0",
                                color: "#64748b",
                                px: 1,
                                py: 0.2,
                                borderRadius: 1,
                                fontWeight: 600,
                                fontSize: "0.7rem",
                              }}
                            >
                              ID: {result.idNumber}
                            </Typography>
                          )}
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.8rem",
                          lineHeight: 1.4,
                          color: "#8b4c4c",
                        }}
                      >
                        {result.message}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}

        {/* All success message */}
        {allSuccess && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              py: 2,
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 48, color: "#6db88a" }} />
            <Typography
              variant="body1"
              sx={{ color: "#4a8c5c" }}
              fontWeight={600}
            >
              All rows processed successfully!
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            borderRadius: 2,
            textTransform: "none",
            px: 4,
            fontWeight: 600,
            bgcolor: allSuccess ? "secondary.light" : "primary.main",
            "&:hover": {
              bgcolor: allSuccess ? "secondary.dark" : "primary.main",
            },
            boxShadow: "none",
          }}
          autoFocus
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExcelUploadResultDialog;
