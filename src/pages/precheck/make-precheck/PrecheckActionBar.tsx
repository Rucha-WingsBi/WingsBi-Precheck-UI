import React from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Stack,
  CircularProgress,
} from "@mui/material";
import {
  QrCode as QrCodeIcon,
  QrCodeScanner as QrCodeScannerIcon,
  Send as SendIcon,
  FileDownload as FileDownloadIcon,
  UploadFile as UploadFileIcon,
  CloudUpload as UploadIcon,
  Add as AddIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";

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

  onBarcodeChange: (value: string) => void;
  onBarcodeKeyDown: (e: React.KeyboardEvent) => void;
  onOpenScanner: () => void;
  onUploadExcel: () => void;
  onDownloadTemplate: () => void;
  onMakePrecheck: () => void;
  onSubmitPrecheck: () => void;
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
  onBarcodeChange,
  onBarcodeKeyDown,
  onOpenScanner,
  onUploadExcel,
  onDownloadTemplate,
  onMakePrecheck,
  onSubmitPrecheck,
  onPrevId,
  onNextId,
  onReject,
  isAdminOrHead = false,
  isAddEnabled = false,
  onAddBomDrawingClick,
  isSidebarOpen = false,
}) => {
  return (
    <>
      {/* QR Code Scanner Section */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 0.75,
          gap: isSidebarOpen ? 0.5 : 0.75,
          flexWrap: "wrap",
          width: "100%",
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: "bold",
            fontSize: "0.875rem",
            minWidth: "auto",
            width: { xs: "100%", sm: "auto" },
          }}
        >
          Scan Qr:
        </Typography>
        <TextField
          size="small"
          value={barcodeText}
          onChange={(e) => onBarcodeChange(e.target.value)}
          onKeyDown={onBarcodeKeyDown}
          placeholder="Scan or enter QR code (12 or 15 digits)"
          inputProps={{
            maxLength: 15,
          }}
          sx={{
            width: { xs: "100%", sm: isSidebarOpen ? 200 : 220 },
            flex: { xs: "1 1 100%", sm: "0 1 auto" },
          }}
          disabled={!showResults || searchResultsLength === 0}
          autoFocus={showResults && searchResultsLength > 0}
        />
        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={onOpenScanner}
          disabled={!showResults || searchResultsLength === 0}
          startIcon={<QrCodeScannerIcon />}
          sx={{
            height: 40,
            minWidth: { xs: "100%", sm: "auto" },
            px: isSidebarOpen ? 1 : 1.5,
          }}
        >
          Scan QR
        </Button>


        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={onDownloadTemplate}
          disabled={downloadTemplateInProgress || uploadInProgress}
          startIcon={downloadTemplateInProgress ? <CircularProgress size={16} color="inherit" /> : <FileDownloadIcon />}
          sx={{
            height: 40,
            minWidth: { xs: "100%", sm: "auto" },
            px: isSidebarOpen ? 1 : 1.5,
          }}
        >
          {downloadTemplateInProgress ? "Downloading..." : "Download Template"}
        </Button>

        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={onUploadExcel}
          disabled={uploadInProgress}
          startIcon={uploadInProgress ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
          sx={{
            height: 40,
            minWidth: { xs: "100%", sm: "auto" },
            px: isSidebarOpen ? 1 : 1.5,
          }}
        >
          {uploadInProgress ? "Uploading..." : "Upload Excel"}
        </Button>

        <Button
          variant="contained"
          color="primary"
          sx={{
            minWidth: { xs: "100%", sm: isSidebarOpen ? 100 : 110 },
            height: 40,
            flex: { xs: "1 1 100%", sm: "0 0 auto" },
            px: isSidebarOpen ? 1 : 1.5,
          }}
          size="small"
          onClick={onMakePrecheck}
          disabled={!isMakePrecheckEnabled}
          startIcon={<QrCodeIcon />}
        >
          View Precheck
        </Button>

        <Button
          variant="contained"
          color="success"
          sx={{
            minWidth: { xs: "100%", sm: isSidebarOpen ? 70 : 80 },
            height: 40,
            flex: { xs: "1 1 100%", sm: "0 0 auto" },
            px: isSidebarOpen ? 1 : 1.5,
          }}
          size="small"
          onClick={onSubmitPrecheck}
          disabled={!isSubmitEnabled || isLoadingLocal}
          startIcon={<SendIcon />}
        >
          Submit
        </Button>

        {isAdminOrHead && (
          <Button
            variant="contained"
            color="secondary"
            sx={{
              minWidth: { xs: 80, sm: isSidebarOpen ? 50 : 60 },
              height: 40,
              flex: { xs: "1 1 100%", sm: "0 0 auto" },
              px: isSidebarOpen ? 1 : 1.5,
            }}
            size="small"
            onClick={onAddBomDrawingClick}
            disabled={!isAddEnabled || isLoadingLocal}
            startIcon={<AddIcon />}
          >
            Add
          </Button>
        )}

        <Button
          variant="contained"
          color="error"
          sx={{
            minWidth: { xs: "100%", sm: isSidebarOpen ? 75 : 85 },
            height: 40,
            flex: { xs: "1 1 100%", sm: "0 0 auto" },
            px: isSidebarOpen ? 1 : 1.5,
          }}
          size="small"
          onClick={onReject}
          disabled={!onReject || isLoadingLocal}
          startIcon={<CancelIcon />}
        >
          Reject
        </Button>
      </Box>

      {/* Results Display Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1}
        sx={{ width: "100%", mb: 0.5 }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: "bold",
            fontSize: "0.875rem",
            overflowWrap: "break-word",
          }}
        >
          <span>BOM Details of </span>
          <span style={{ color: "#1976d2" }}>
            {selectedDrawingNumber || ""}
          </span>
        </Typography>

        {showResults && (
          <Typography
            variant="body2"
            sx={{
              fontWeight: "medium",
              overflowWrap: "break-word",
            }}
          >
            (
            Showing results for{" "}
            {selectedProductionSeries || "A"} /{" "}
            {selectedDrawingNumber || ""} / {idNumber || ""}
            )
          </Typography>
        )}
      </Stack>
    </>
  );
};

export default PrecheckActionBar;
