import React from "react";
import {
  Box,
  Button,
  Typography,
  Alert,
  Stack,
  Divider,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import {
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { TABS, type AssemblyStats } from "../constants/scriptExecutorConstants";

interface ResultDialogProps {
  open: boolean;
  onClose: () => void;
  activeTab: number;
  executionStats: { total: number; success: number; warnings: number; errors: number };
  executionMessage: string;
  executionOutput: string;
  totalNewRecords: number;
  assemblyStats: AssemblyStats;
  onDone: () => void;
}

export const ResultDialog: React.FC<ResultDialogProps> = ({
  open,
  onClose,
  activeTab,
  executionStats,
  executionMessage,
  executionOutput,
  totalNewRecords,
  assemblyStats,
  onDone,
}) => {
  const dialogSeverity = executionStats.errors > 0 ? (executionStats.success > 0 ? "warning" : "error") : "success";

  const dialogIcon = executionStats.errors > 0 ? (
    executionStats.success > 0 ? (
      <WarningIcon sx={{ color: "#f59e0b", fontSize: 28 }} />
    ) : (
      <WarningIcon sx={{ color: "#ef4444", fontSize: 28 }} />
    )
  ) : (
    <SuccessIcon sx={{ color: "#10b981", fontSize: 28 }} />
  );

  const dialogTitle = executionStats.errors > 0 ? (
    executionStats.success > 0 ? "Execution Completed with Warnings" : "Execution Failed"
  ) : "Execution Completed";

  const dialogAlertMessage = executionMessage || (executionStats.errors > 0 ? (
    executionStats.success > 0
      ? `Script executed with ${executionStats.errors} error(s) and ${executionStats.warnings} warning(s).`
      : `Script execution failed with ${executionStats.errors} error(s).`
  ) : "Script executed successfully.");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={executionOutput ? "md" : "sm"}
      fullWidth={!!executionOutput}
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          p: 1.5,
          width: "100%",
          maxWidth: executionOutput ? "md" : 440,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
        {dialogIcon}
        <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
          {dialogTitle}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ py: 2 }}>
        <Alert
          severity={dialogSeverity}
          icon={dialogIcon}
          sx={{ mb: 2, borderRadius: 2, fontWeight: 600, "& .MuiAlert-message": { whiteSpace: "pre-wrap" } }}
        >
          {dialogAlertMessage}
        </Alert>

        {activeTab === TABS.MASTER_DATA ? (
          <Stack spacing={1.5} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2.5, border: "1px solid", borderColor: "neutral.border" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption" color="text.secondary">TOTAL NEW RECORDS</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "success.main" }}>{totalNewRecords}</Typography>
            </Box>
            <Divider />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption" color="text.secondary">New drawings (child)</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "success.main" }}>{assemblyStats.childDrawings}</Typography>
            </Box>
            <Divider />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption" color="text.secondary">New drawings (parent)</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "success.main" }}>{assemblyStats.parentDrawings}</Typography>
            </Box>
            <Divider />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption" color="text.secondary">Updated assembly mappings</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "success.main" }}>{assemblyStats.updatedMappings}</Typography>
            </Box>
            <Divider />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption" color="text.secondary">Resolved Warnings</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "warning.main" }}>{executionStats.warnings}</Typography>
            </Box>
            <Divider />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption" color="text.secondary">Errors / Failed Rows</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: executionStats.errors > 0 ? "error.main" : "text.secondary" }}>{executionStats.errors}</Typography>
            </Box>
          </Stack>
        ) : (
          <Stack spacing={1.5} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2.5, border: "1px solid", borderColor: "neutral.border" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption" color="text.secondary">Processed Rows</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>{executionStats.total}</Typography>
            </Box>
            <Divider />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption" color="text.secondary">Successfully Saved</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "success.main" }}>{executionStats.success}</Typography>
            </Box>
            <Divider />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption" color="text.secondary">Resolved Warnings</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "warning.main" }}>{executionStats.warnings}</Typography>
            </Box>
            <Divider />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption" color="text.secondary">Errors / Failed Rows</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: executionStats.errors > 0 ? "error.main" : "text.secondary" }}>{executionStats.errors}</Typography>
            </Box>
          </Stack>
        )}

        {executionOutput && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block", mb: 1 }}>
              EXECUTION OUTPUT REPORT
            </Typography>
            <Box
              sx={{
                bgcolor: "grey.900",
                color: "grey.300",
                p: 2,
                borderRadius: 2.5,
                border: "1px solid",
                borderColor: "grey.800",
                fontFamily: 'Consolas, Monaco, "Andale Mono", monospace',
                fontSize: "0.825rem",
                lineHeight: 1.4,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                maxHeight: "300px",
                overflowY: "auto",
              }}
            >
              {executionOutput}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={onDone}
          sx={{ px: 3, fontWeight: 700 }}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface ValidationErrorDialogProps {
  open: boolean;
  onClose: () => void;
  missingFiles: string[];
  onBrowseFiles: () => void;
}

export const ValidationErrorDialog: React.FC<ValidationErrorDialogProps> = ({
  open,
  onClose,
  missingFiles,
  onBrowseFiles,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          p: 1.5,
          width: "100%",
          maxWidth: 420,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
        <WarningIcon sx={{ color: "warning.main", fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Missing Required File
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ py: 1 }}>
        {missingFiles.length > 0 && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            Missing file: <strong>{missingFiles.join(" and ")}</strong>
          </Alert>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
          Both <strong>Master Data Assembly</strong> and <strong>Master Data Drawing</strong> files are mandatory to upload.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
          Please ensure both files are selected before proceeding with the upload.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="contained"
          size="small"
          color="primary"
          onClick={() => {
            onClose();
            onBrowseFiles();
          }}
          sx={{ px: 3, fontWeight: 700 }}
        >
          Okay
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface LNValidationErrorDialogProps {
  open: boolean;
  onClose: () => void;
  lnValidationErrors: {
    missingInDrawing: string[];
    missingInAssembly: string[];
    assemblyFileName: string;
    drawingFileName: string;
  } | null;
}

export const LNValidationErrorDialog: React.FC<LNValidationErrorDialogProps> = ({
  open,
  onClose,
  lnValidationErrors,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          p: 1.5,
          width: "100%",
          maxWidth: 500,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
        <WarningIcon sx={{ color: "error.main", fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: "error.main" }}>
          LN Item Code Mismatch
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ py: 1.5 }}>
        {lnValidationErrors?.missingInDrawing && lnValidationErrors.missingInDrawing.length > 0 && (
          <Box sx={{ mb: (lnValidationErrors?.missingInAssembly?.length ?? 0) > 0 ? 3 : 0 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, lineHeight: 1.6, color: "text.primary" }}>
              The following LN Item Codes are present in the Master Drawing Assembly file ({lnValidationErrors?.assemblyFileName}) but do not exist in the Master Drawing file ({lnValidationErrors?.drawingFileName}):
            </Typography>

            <Box sx={{
              maxHeight: 120,
              overflowY: "auto",
              p: 1.5,
              mb: 1.5,
              bgcolor: (theme) => theme.palette.error.main + "0C",
              border: "1px solid",
              borderColor: "error.light",
              borderRadius: 2,
              fontFamily: "monospace",
              fontSize: "0.85rem",
              color: "error.main",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all"
            }}>
              {lnValidationErrors.missingInDrawing.join(", ")}
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, lineHeight: 1.5 }}>
              Please ensure all Assembly LN Item Codes and Child Part Item Codes are available in the Master Drawing file.
            </Typography>
          </Box>
        )}

        {lnValidationErrors?.missingInAssembly && lnValidationErrors.missingInAssembly.length > 0 && (
          <Box>
            {(lnValidationErrors?.missingInDrawing?.length ?? 0) > 0 && <Divider sx={{ my: 2.5 }} />}
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, lineHeight: 1.6, color: "text.primary" }}>
              The following LN Item Codes are present in the Master Drawing file ({lnValidationErrors?.drawingFileName}) but do not exist in the Master Drawing Assembly file ({lnValidationErrors?.assemblyFileName}):
            </Typography>

            <Box sx={{
              maxHeight: 120,
              overflowY: "auto",
              p: 1.5,
              mb: 1.5,
              bgcolor: (theme) => theme.palette.error.main + "0C",
              border: "1px solid",
              borderColor: "error.light",
              borderRadius: 2,
              fontFamily: "monospace",
              fontSize: "0.85rem",
              color: "error.main",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all"
            }}>
              {lnValidationErrors.missingInAssembly.join(", ")}
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, lineHeight: 1.5 }}>
              Please ensure all LN Item Codes from the Master Drawing file are mapped as either Assembly LN Item Codes or Child Part Item Codes in the Master Drawing Assembly file.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={onClose}
          sx={{ px: 3, fontWeight: 700 }}
        >
          Okay
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface ScriptErrorDialogProps {
  open: boolean;
  onClose: () => void;
  scriptErrorDetails: { message: string; output?: string; error?: string } | null;
  errorDialogTab: number;
  onErrorDialogTabChange: (val: number) => void;
  copied: boolean;
  onCopyLog: () => void;
}

export const ScriptErrorDialog: React.FC<ScriptErrorDialogProps> = ({
  open,
  onClose,
  scriptErrorDetails,
  errorDialogTab,
  onErrorDialogTabChange,
  copied,
  onCopyLog,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          p: 0,
          overflow: "hidden",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
        },
      }}
    >
      <Box
        sx={{
          background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: "white",
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <WarningIcon sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, color: "white" }}>
              Script Execution Failed
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8, fontSize: "0.75rem" }}>
              {scriptErrorDetails?.message || "Execution encountered an error."}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "white" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column", bgcolor: "grey.50" }}>
        {scriptErrorDetails?.output && scriptErrorDetails?.error && (
          <Tabs
            value={errorDialogTab}
            onChange={(_, val) => onErrorDialogTabChange(val)}
            sx={{
              borderBottom: "1px solid",
              borderColor: "neutral.border",
              px: 2,
              bgcolor: "background.paper",
              "& .MuiTabs-indicator": {
                backgroundColor: "primary.main",
                height: 3,
              },
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                color: "text.secondary",
                "&.Mui-selected": {
                  color: "primary.main",
                },
              },
            }}
          >
            <Tab label="Validation Report" value={0} />
            <Tab label="Developer Stacktrace" value={1} />
          </Tabs>
        )}

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 3, py: 1.5, bgcolor: "background.paper" }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {errorDialogTab === 0 ? "OUTPUT REPORT" : "DEVELOPER STACKTRACE"}
          </Typography>
          <Button
            size="small"
            onClick={onCopyLog}
            startIcon={copied ? <CheckIcon sx={{ fontSize: 14 }} /> : <DownloadIcon sx={{ fontSize: 14 }} />}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "primary.main",
              "&:hover": { bgcolor: (theme) => theme.palette.primary.main + "0A" },
            }}
          >
            {copied ? "Copied" : "Copy Log"}
          </Button>
        </Box>

        <Box sx={{ px: 3, pb: 3, pt: 0 }}>
          <Box
            sx={{
              bgcolor: "grey.900",
              color: "grey.300",
              p: 2.5,
              borderRadius: 2.5,
              border: "1px solid",
              borderColor: "grey.800",
              fontFamily: 'Consolas, Monaco, "Andale Mono", monospace',
              fontSize: "0.85rem",
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              maxHeight: "420px",
              overflowY: "auto",
            }}
          >
            {errorDialogTab === 0
              ? (scriptErrorDetails?.output || "No output report available.")
              : (scriptErrorDetails?.error || "No traceback available.")
            }
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: "background.paper", borderTop: "1px solid", borderColor: "neutral.border" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={onClose}
          sx={{ px: 4, fontWeight: 700 }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface WrongFileDialogProps {
  open: boolean;
  onClose: () => void;
  expectedTemplate: string;
}

export const WrongFileDialog: React.FC<WrongFileDialogProps> = ({
  open,
  onClose,
  expectedTemplate,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          p: 1.5,
          width: "100%",
          maxWidth: 450,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
        <WarningIcon sx={{ color: "error.main", fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: "error.main" }}>
          Wrong File Uploaded
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ py: 1.5 }}>
        <Typography variant="body2" sx={{ mb: 2, fontWeight: 500, color: "text.primary" }}>
          The uploaded file does not match the selected module template.
        </Typography>

        <Stack spacing={1.5} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2.5, border: "1px solid", borderColor: "neutral.border" }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Expected Template:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>{expectedTemplate}</Typography>
          </Box>
        </Stack>

        <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
          Please upload the correct template and try again.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={onClose}
          sx={{ px: 3, fontWeight: 700 }}
        >
          Okay
        </Button>
      </DialogActions>
    </Dialog>
  );
};
