import React from "react";
import {
  Box,
  Button,
  Card,
  Typography,
  Alert,
  Chip,
  Divider,
  IconButton,
  Grid,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  PlayArrow as PlayIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
  Check as CheckIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";

interface UploadDropzoneProps {
  selectedFiles: File[];
  fileValidationStatuses: Record<string, { isValid: boolean; error?: string; columns: string[]; rows: any[] }>;
  isFileUploadedToServer: boolean;
  isUploading: boolean;
  isExecuting: boolean;
  isFileValid: boolean;
  hasInvalidFile: boolean;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (fileName: string) => void;
  onConfirmUpload: () => void;
  onExecuteScript: () => void;
  onCancel: () => void;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  selectedFiles,
  fileValidationStatuses,
  isFileUploadedToServer,
  isUploading,
  isExecuting,
  isFileValid,
  hasInvalidFile,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onInputChange,
  onRemoveFile,
  onConfirmUpload,
  onExecuteScript,
  onCancel,
}) => {
  return (
    <Card
      elevation={0}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      sx={{
        border: "2px dashed",
        borderColor: isDragOver ? "primary.main" : (theme) => theme.palette.primary.light + "60",
        borderRadius: 3,
        bgcolor: isDragOver ? (theme) => theme.palette.primary.main + "0A" : (theme) => theme.palette.primary.main + "04",
        transition: "all 0.25s ease",
        p: 2,
        cursor: "pointer",
        textAlign: "center",
        mb: 2,
        "&:hover": {
          borderColor: "primary.main",
          bgcolor: (theme) => theme.palette.primary.main + "06",
        },
      }}
    >
      <input
        type="file"
        id="file-upload-input"
        hidden
        multiple
        accept=".xlsx,.xls,.csv"
        onChange={onInputChange}
      />

      {selectedFiles.length === 0 ? (
        <label htmlFor="file-upload-input" style={{ width: "100%", cursor: "pointer" }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.25,
              py: 1,
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                bgcolor: "background.paper",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UploadIcon sx={{ fontSize: 22, color: "primary.main" }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary" }}>
                Drag & drop your Excel file here
              </Typography>
              <Typography variant="body2" sx={{ color: "primary.main", fontWeight: 700, mt: 0.25 }}>
                or browse files
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                .xlsx, .xls, or .csv · up to 5 MB · multiple files supported
              </Typography>
            </Box>
          </Box>
        </label>
      ) : (
        <Box sx={{ width: "100%", cursor: "default" }} onClick={(e) => e.stopPropagation()}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {selectedFiles.map((file) => {
              const status = fileValidationStatuses[file.name];

              return (
                <Box
                  key={file.name}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: status?.isValid === false ? (theme) => theme.palette.error.main + "0A" : "background.paper",
                    p: 1.25,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: status?.isValid === false ? "error.light" : "neutral.border",
                    flexWrap: "wrap",
                    gap: 2,
                    boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1.5,
                        bgcolor: status?.isValid ? (theme) => theme.palette.success.main + "12" : (theme) => theme.palette.error.main + "12",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FileIcon sx={{ fontSize: 18, color: status?.isValid ? "success.main" : "error.main" }} />
                    </Box>
                    <Box sx={{ textAlign: "left" }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary", fontSize: "0.85rem" }}>
                        {file.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
                        {(file.size / 1024).toFixed(1)} KB • {status?.isValid ? "Headers OK" : status?.error || "Validating..."}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      label={isFileUploadedToServer ? "Uploaded" : status?.isValid ? "Verified" : "Invalid"}
                      color={isFileUploadedToServer ? "info" : status?.isValid ? "success" : "error"}
                      size="small"
                      sx={{ fontWeight: 600, height: 24, fontSize: "0.72rem" }}
                    />

                    {!isFileUploadedToServer && (
                      <IconButton
                        size="small"
                        onClick={() => onRemoveFile(file.name)}
                        sx={{
                          bgcolor: "neutral.chipBg",
                          p: 0.4,
                          "&:hover": { bgcolor: "neutral.border" },
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 12 }} />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              );
            })}

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                bgcolor: (theme) => theme.palette.primary.main + "08",
                p: 1,
                borderRadius: 2,
                border: "1px solid",
                borderColor: (theme) => theme.palette.primary.main + "20",
                flexWrap: "wrap",
                gap: 2,
                mt: 0.5,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main", fontSize: "0.825rem" }}>
                {selectedFiles.length} File(s) Selected
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                {!isFileUploadedToServer && (
                  <Button
                    variant="contained"
                    onClick={onConfirmUpload}
                    disabled={isUploading || !isFileValid || hasInvalidFile}
                    color="success"
                    size="small"
                    startIcon={<CheckIcon sx={{ fontSize: 14 }} />}
                    sx={{ height: 32, fontSize: "0.775rem" }}
                  >
                    {isUploading ? `Uploading (${selectedFiles.length})...` : "Confirm & Upload"}
                  </Button>
                )}

                {isFileUploadedToServer && (
                  <Button
                    variant="contained"
                    onClick={onExecuteScript}
                    disabled={isExecuting || !isFileValid || hasInvalidFile}
                    color="primary"
                    size="small"
                    startIcon={<PlayIcon sx={{ fontSize: 14 }} />}
                    sx={{ height: 32, fontSize: "0.775rem" }}
                  >
                    {isExecuting ? "Executing..." : "Execute Script"}
                  </Button>
                )}

                <Button
                  variant="outlined"
                  color="inherit"
                  size="small"
                  onClick={onCancel}
                  sx={{ height: 32, fontSize: "0.775rem", borderColor: "grey.300" }}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </Box>

          <Box sx={{ mt: 1, textAlign: "left" }}>
            {isFileUploadedToServer ? (
              <Alert severity="info" icon={<SuccessIcon sx={{ fontSize: 16, color: "success.main" }} />} sx={{ py: 0, px: 1.5, borderRadius: 1.5, bgcolor: (theme) => theme.palette.success.main + "0A", "& .MuiAlert-message": { fontSize: "0.775rem" } }}>
                All files are successfully stored on the server. Click <strong>Execute Script</strong> to commit database changes.
              </Alert>
            ) : !isFileValid ? (
              <Alert severity="error" icon={<WarningIcon sx={{ fontSize: 16 }} />} sx={{ py: 0, px: 1.5, borderRadius: 1.5, "& .MuiAlert-message": { fontSize: "0.775rem" } }}>
                Header columns mismatch in one or more selected files. Correct your file headers before executing.
              </Alert>
            ) : (
              <Alert severity="info" icon={<InfoIcon sx={{ fontSize: 16 }} />} sx={{ py: 0, px: 1.5, borderRadius: 1.5, "& .MuiAlert-message": { fontSize: "0.775rem" } }}>
                Template columns validated successfully across all files. Click <strong>Confirm & Upload</strong> to send files to the server.
              </Alert>
            )}
          </Box>
        </Box>
      )}
    </Card>
  );
};

interface PostUploadSummaryCardProps {
  fileName: string;
  totalRows: number;
  uploadTimeStr: string;
  userName: string;
  executionStats: { total: number; success: number; warnings: number; errors: number };
  attentionRows: Array<{ row: number; key: string; field: string; issue: string }>;
  onDownloadErrorReport: () => void;
  onResetUpload: () => void;
  onFixInSheet: (row: number, issue: string) => void;
}

export const PostUploadSummaryCard: React.FC<PostUploadSummaryCardProps> = ({
  fileName,
  totalRows,
  uploadTimeStr,
  userName,
  executionStats,
  attentionRows,
  onDownloadErrorReport,
  onResetUpload,
  onFixInSheet,
}) => {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "neutral.border",
        borderRadius: 2.5,
        bgcolor: "background.paper",
        p: 2,
        mb: 2,
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, flexWrap: "wrap", gap: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: "grey.100",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid",
              borderColor: "neutral.border",
            }}
          >
            <FileIcon sx={{ color: "grey.600", fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary", fontSize: "0.875rem" }}>
              {fileName}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
              {totalRows.toLocaleString()} rows · uploaded today at {uploadTimeStr || "10:15"} by {userName}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon sx={{ fontSize: 15 }} />}
            onClick={onDownloadErrorReport}
            sx={{
              height: 34,
              px: 1.75,
              borderRadius: 2,
              borderColor: "neutral.border",
              color: "text.primary",
              fontWeight: 600,
              textTransform: "none",
              fontSize: "0.8rem",
              bgcolor: "background.paper",
              "&:hover": { borderColor: "grey.400", bgcolor: "neutral.hoverBg" },
            }}
          >
            Download error report
          </Button>
          <Button
            variant="text"
            size="small"
            onClick={onResetUpload}
            sx={{
              color: "text.primary",
              fontWeight: 600,
              textTransform: "none",
              fontSize: "0.8rem",
              "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
            }}
          >
            Upload another file
          </Button>
        </Box>
      </Box>

      <Divider sx={{ mb: 2, borderColor: "neutral.chipBg" }} />

      <Grid container spacing={2} sx={{ mb: 1.5 }}>
        <Grid item xs={4}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "success.main", fontSize: "1.65rem" }}>
            {executionStats.success.toLocaleString()}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.75rem" }}>
            Imported
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: executionStats.errors > 0 ? "error.main" : "text.secondary", fontSize: "1.65rem" }}>
            {executionStats.errors.toLocaleString()}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.75rem" }}>
            Errors — not imported
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "grey.500", fontSize: "1.65rem" }}>
            {executionStats.warnings.toLocaleString()}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.75rem" }}>
            Duplicates skipped
          </Typography>
        </Grid>
      </Grid>

      <Box sx={{ width: "100%", height: 6, bgcolor: "grey.200", borderRadius: 3, overflow: "hidden", display: "flex", mb: executionStats.errors > 0 ? 2 : 0 }}>
        <Box
          sx={{
            width: `${executionStats.total > 0 ? (executionStats.success / executionStats.total) * 100 : 100}%`,
            bgcolor: "success.main",
            height: "100%",
            transition: "width 0.5s ease",
          }}
        />
        {executionStats.errors > 0 && (
          <Box
            sx={{
              width: `${(executionStats.errors / executionStats.total) * 100}%`,
              bgcolor: "error.main",
              height: "100%",
              transition: "width 0.5s ease",
            }}
          />
        )}
      </Box>

      {executionStats.errors > 0 && (
        <Box sx={{ mt: 2 }}>
          <Divider sx={{ mb: 1.5, borderColor: "neutral.chipBg" }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary", mb: 1.25, fontSize: "0.85rem" }}>
            Rows that need attention
          </Typography>

          <Box sx={{ border: "1px solid", borderColor: "neutral.border", borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ display: "flex", bgcolor: "grey.50", py: 0.8, px: 2, borderBottom: "1px solid", borderColor: "neutral.border" }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", width: "10%", fontSize: "0.75rem" }}>Row</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", width: "20%", fontSize: "0.75rem" }}>Key</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", width: "25%", fontSize: "0.75rem" }}>Field</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", width: "30%", fontSize: "0.75rem" }}>Issue</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", width: "15%", textAlign: "right" }}></Typography>
            </Box>

            {attentionRows.map((item, idx) => (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  py: 1,
                  px: 2,
                  borderBottom: idx < attentionRows.length - 1 ? "1px solid" : "none",
                  borderColor: "neutral.chipBg",
                }}
              >
                <Typography variant="body2" sx={{ width: "10%", fontSize: "0.8rem", color: "text.primary" }}>
                  {item.row}
                </Typography>
                <Typography variant="body2" sx={{ width: "20%", fontSize: "0.8rem", color: "text.primary", fontWeight: 600 }}>
                  {item.key}
                </Typography>
                <Typography variant="body2" sx={{ width: "25%", fontSize: "0.8rem", color: "text.primary" }}>
                  {item.field}
                </Typography>
                <Box sx={{ width: "30%", display: "flex", alignItems: "center", gap: 0.75 }}>
                  <WarningIcon sx={{ fontSize: 14, color: "error.main" }} />
                  <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                    {item.issue}
                  </Typography>
                </Box>
                <Box sx={{ width: "15%", textAlign: "right" }}>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => onFixInSheet(item.row, item.issue)}
                    sx={{
                      color: "primary.main",
                      fontWeight: 700,
                      fontSize: "0.775rem",
                      textTransform: "none",
                      p: 0,
                      minWidth: "auto",
                      "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                    }}
                  >
                    Fix in sheet
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Card>
  );
};
