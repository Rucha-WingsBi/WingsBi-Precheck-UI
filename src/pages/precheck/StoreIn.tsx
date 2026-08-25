import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  IconButton,
  Collapse,
  Chip,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  Tooltip,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useMediaQuery,
  useTheme,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  QrCodeScanner as QrCodeScannerIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
  CameraFront as CameraFrontIcon,
  CameraRear as CameraRearIcon,
  UploadFile as UploadFileIcon,
  Today as TodayIcon,
  CalendarMonth as CalendarMonthIcon,
  DateRange as DateRangeIcon,
  FlashOn as FlashOnIcon,
  FlashOff as FlashOffIcon,
  PlaylistAddCheck as PlaylistAddCheckIcon
} from "@mui/icons-material";
import { getStoreInData } from "../../store/slices/precheckSlice";
import { format } from "date-fns";
import { updateQrCodeDetails } from "../../store/slices/qrcodeSlice";
import type { AppDispatch, RootState } from "../../store/store";
import { Html5Qrcode } from "html5-qrcode";
import { usePageAccess } from "../../hooks/useMasterData";
import { isPageAccessible } from "../../utils/accessUtils";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

interface QRCodeDetailsResponse {
  qrCodeNumber: string;
  productionSeries: string;
  drawingNumber: string;
  nomenclature: string;
  productionOrderNumber: string;
  projectNumber: string;
  consumedInDrawing: string;
  irNumber: string;
  msnNumber: string;
  quantity: number;
  desposition: string;
  users: string;
  qrCodeStatus: string;
  mrirNumber: string;
  idNumber: string;
  createdDate?: string;
}

interface StoreInResponse {
  precheckStatus: string;
  drawingNumber: string;
  productionSeries: string;
  idNumber: string;
  quantity: string;
  projectNumber: string;
  productionOrderNumber: string;
  createdByName: string;
  createdDate: string;
  precheckStatusId: number
}

const formatQuantity = (qty: any) => {
  if (qty === undefined || qty === null || qty === '') return '-';
  const num = Number(qty);
  if (isNaN(num)) return String(qty);
  const match = String(qty).match(/^-?\d+(?:\.\d{0,4})?/);
  return match ? match[0] : String(qty);
};

const StoreIn: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: pageAccessData } = usePageAccess(
    user?.roleid ? Number(user.roleid) : null
  );
  const hasMakeAccess = isPageAccessible(pageAccessData, "Make Precheck");

  const [qrCodeInput, setQrCodeInput] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{
    message: string;
    type: "success" | "error" | "info";
  }>({ message: "", type: "info" });
  const [qrCodeList, setQrCodeList] = useState<QRCodeDetailsResponse[]>([]);
  const [storeInList, setStoreInList] = useState<StoreInResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter States
  const [dateFilterMode, setDateFilterMode] = useState<"single" | "range">("range");
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // Filtered Store In List
  const filteredStoreInList = React.useMemo(() => {
    let result = storeInList;

    // Filter by Date
    if (dateFilterMode === "single" && filterDate) {
      const targetStr = new Date(filterDate).toDateString();
      result = result.filter((row) => {
        if (!row.createdDate) return false;
        return new Date(row.createdDate).toDateString() === targetStr;
      });
    } else if (dateFilterMode === "range" && fromDate && toDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter((row) => {
        if (!row.createdDate) return false;
        const d = new Date(row.createdDate);
        return d >= start && d <= end;
      });
    }

    return result;
  }, [storeInList, dateFilterMode, filterDate, fromDate, toDate]);

  // Camera QR Scanner state
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [openScanner, setOpenScanner] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [scannerReady, setScannerReady] = useState(false);
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<string>("unknown");
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Check camera permission on mount
  useEffect(() => {
    if (navigator.permissions && (navigator.permissions as any).query) {
      (navigator.permissions as any)
        .query({ name: "camera" })
        .then((permissionStatus: any) => {
          setCameraPermissionStatus(permissionStatus.state);
          permissionStatus.onchange = () => {
            setCameraPermissionStatus(permissionStatus.state);
          };
        })
        .catch((err: any) => {
          console.warn("Permission API error:", err);
          setCameraPermissionStatus("unknown");
        });
    }
  }, []);

  // Proactive permission request
  const handleRequestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setCameraPermissionStatus("granted");
      return true;
    } catch (err: any) {
      console.error("Camera permission denied:", err);
      setCameraPermissionStatus("denied");
      return false;
    }
  };

  const handleOpenScanner = () => {
    setScannerError(null);
    if (cameraPermissionStatus === "granted") {
      setOpenScanner(true);
    } else {
      setShowPermissionDialog(true);
    }
  };

  // Torch toggle handler
  const handleTorchToggle = useCallback(async () => {
    const qr = html5QrCodeRef.current;
    if (!qr) return;
    try {
      const track = (qr as any).getRunningTrackSettings?.();
      if (!track) return;
      const capabilities = (qr as any).getRunningTrackCameraCapabilities?.();
      if (capabilities?.torchFeature?.isSupported?.()) {
        await capabilities.torchFeature.apply(!torchOn);
        setTorchOn((v) => !v);
      }
    } catch (e) {
      console.warn("Torch not supported on this device", e);
    }
  }, [torchOn]);

  // Camera flip handler
  const handleCameraFlip = useCallback(() => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }, []);

  // Handle uploaded file scan
  const handleScanFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadInProgress(true);

    const html5QrCode = new Html5Qrcode("qr-reader-file-store-in");

    try {
      let decodedText: string | undefined;
      try {
        const result = await html5QrCode.scanFileV2(file, false);
        decodedText = result?.decodedText;
      } catch (scanV2Error: any) {
        console.warn("scanFileV2 failed, falling back to scanFile:", scanV2Error);
        try {
          decodedText = await html5QrCode.scanFile(file, false);
        } catch (scanError: any) {
          console.error("scanFile fallback failed:", scanError);
          throw scanError;
        }
      }

      if (decodedText && decodedText.trim()) {
        submitQRCode(decodedText.trim());
        setOpenScanner(false);
      } else {
        setUploadError("Unable to read QR code from the selected image.");
      }
    } catch (error: any) {
      console.error("File scan error:", error);
      setUploadError(error?.message || "Unable to read QR code from the selected image.");
    } finally {
      setUploadInProgress(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  // Camera initialization and lifecycle
  useEffect(() => {
    if (!openScanner) return;

    setScannerReady(false);
    setScannerError(null);
    setTorchOn(false);

    const timer = setTimeout(async () => {
      try {
        const qr = new Html5Qrcode("qr-reader-video-store-in", /* verbose= */ false);
        html5QrCodeRef.current = qr;

        await qr.start(
          { facingMode },
          {
            fps: 15,
            aspectRatio: 1.0,
            disableFlip: false,
          },
          (decodedText) => {
            console.log("QR Code Scanned:", decodedText);
            if (decodedText && decodedText.trim()) {
              submitQRCode(decodedText.trim());
            }
            setOpenScanner(false);
          },
          () => {
            // Scan frame failure (normal behavior per-frame)
          }
        );
        setScannerReady(true);
      } catch (err: any) {
        console.error("Scanner initialization error:", err);
        let detailedError = "Could not initialize camera. Please ensure camera permissions are granted and no other app is using it.";
        if (err?.message) detailedError = err.message;
        else if (typeof err === "string") detailedError = err;
        setScannerError(detailedError);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      const qr = html5QrCodeRef.current;
      if (qr) {
        qr.stop()
          .then(() => qr.clear())
          .catch((e) => console.warn("Scanner cleanup:", e));
        html5QrCodeRef.current = null;
      }
    };
  }, [openScanner, facingMode]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "N/A";
    }
  };

  const handleQRCodeScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQrCodeInput(value);
  };

  // Smart QR Code processing logic for manual and gun scanning
  useEffect(() => {
    if (!qrCodeInput) return;

    // Only process if it's numeric and matches target lengths
    const isNumeric = /^\d+$/.test(qrCodeInput);
    if (!isNumeric) return;

    if (qrCodeInput.length === 15) {
      // Process 15-digit codes immediately
      submitQRCode(qrCodeInput);
      setQrCodeInput("");
    } else if (qrCodeInput.length === 12) {
      // Process 12-digit codes after a 2000ms delay to allow manual or fast 15-digit scanner completion
      const timer = setTimeout(() => {
        submitQRCode(qrCodeInput);
        setQrCodeInput("");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [qrCodeInput]);

  const activeQrCode = qrCodeList[0]?.qrCodeNumber || "";

  // Re-fetch store-in data when date filters or the active QR code changes
  useEffect(() => {
    if (!activeQrCode) return;

    const reqFromDate = fromDate ? format(fromDate, "yyyy-MM-dd") : undefined;
    const reqToDate = toDate ? format(toDate, "yyyy-MM-dd") : undefined;

    setIsLoading(true);
    dispatch(
      getStoreInData({
        qrCode: activeQrCode,
        fromDate: reqFromDate,
        toDate: reqToDate,
      })
    )
      .unwrap()
      .then((storeInResult) => {
        if (storeInResult && storeInResult.length > 0) {
          setStoreInList(storeInResult);
          setAlertMessage({
            message: `QR Code ${activeQrCode} processed successfully. ${storeInResult.length} awaiting pending precheck record(s) found.`,
            type: "success",
          });
        } else {
          setStoreInList([]);
          setAlertMessage({
            message: `QR Code ${activeQrCode} processed successfully. No awaiting pending precheck found for QR Code ${activeQrCode}.`,
            type: "info",
          });
        }
      })
      .catch((error) => {
        console.error("Error fetching store-in data:", error);
        setStoreInList([]);
        setAlertMessage({
          message: `Error fetching store-in data: ${error.message || error}`,
          type: "error",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [fromDate, toDate, activeQrCode, dispatch]);

  const submitQRCode = async (qrCode: string) => {
    try {
      setIsLoading(true);

      if (!qrCode?.trim()) {
        setAlertMessage({
          message: "Please enter a valid QR Code ID.",
          type: "error",
        });
        return;
      }

      // Clear existing data before making new requests
      setQrCodeList([]);
      setStoreInList([]);

      // Call the UpdateQrCodeDetails API
      const qrCodeResult = await dispatch(updateQrCodeDetails(qrCode)).unwrap();

      if (!qrCodeResult) {
        setAlertMessage({
          message: `QR Code ${qrCode} not found.`,
          type: "error",
        });
        return;
      }

      // Process QR code details
      const gridModel: QRCodeDetailsResponse = {
        qrCodeNumber: qrCodeResult.qrCodeNumber,
        productionSeries: qrCodeResult.productionSeries,
        drawingNumber: qrCodeResult.drawingNumber,
        nomenclature: qrCodeResult.nomenclature,
        productionOrderNumber: qrCodeResult.productionOrderNumber,
        projectNumber: qrCodeResult.projectNumber,
        consumedInDrawing: qrCodeResult.consumedInDrawing,
        irNumber: qrCodeResult.irNumber,
        msnNumber: qrCodeResult.msnNumber,
        quantity: qrCodeResult.quantity,
        desposition: qrCodeResult.desposition,
        users: qrCodeResult.users,
        qrCodeStatus: qrCodeResult.qrCodeStatus,
        mrirNumber: qrCodeResult.mrirNumber,
        idNumber: qrCodeResult.idNumber,
        createdDate: qrCodeResult.createdDate,
      };
      setQrCodeList([gridModel]);

      if (qrCodeResult.qrCodeStatus?.toLowerCase() === "consumed") {
        setAlertMessage({
          message: `QR Code ${qrCode} has been consumed.`,
          type: "info",
        });
      }

      setQrCodeInput("");
    } catch (error: any) {
      console.error("Error processing QR Code:", error);
      setAlertMessage({
        message: `Error processing QR Code ${qrCode}: ${error.message || error
          }`,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpandClick = (qrCodeId: string) => {
    setExpandedRow(expandedRow === qrCodeId ? null : qrCodeId);
  };

  const reset = () => {
    setQrCodeInput("");
    setQrCodeList([]);
    setStoreInList([]);
    setAlertMessage({ message: "", type: "info" });
  };

  return (
    <Box sx={{ p: 1 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 2,
          gap: 2,
        }}
      >
        <Typography variant="h4" color="primary.main" fontWeight={600}>
          Store In
        </Typography>
      </Box>

      {/* Alert Message */}
      {alertMessage.message && (
        <Alert
          severity={alertMessage.type}
          sx={{ mb: 2 }}
          onClose={() => setAlertMessage({ message: "", type: "info" })}
        >
          {alertMessage.message}
        </Alert>
      )}

      {/* QR Code Scanning Section */}
      <Paper sx={{ p: 1.5, mt: 1.5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            mb: 3,
          }}
        >
          <Typography
            variant="h6"
            color="primary.main"
            sx={{
              fontWeight: 600,
              minWidth: "fit-content",
              whiteSpace: "nowrap",

            }}
          >
            Scanned QR Code Details:
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexGrow: 1,
              width: "100%",
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Scan QR Code"
              value={qrCodeInput}
              onChange={handleQRCodeScan}

              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconButton
                      onClick={handleOpenScanner}
                      size="small"
                      sx={{ p: 0.5 }}
                      title="Scan QR Code"
                    >
                      <QrCodeScannerIcon color="primary" />
                    </IconButton>
                  </InputAdornment>
                ),
                endAdornment: isLoading && (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ),
              }}
              sx={{
                maxWidth: { xs: "100%", sm: "300px" },
                "& .MuiOutlinedInput-root": {
                  height: 45,
                }
              }}
            />
            <Button
              variant="outlined"
              color="primary"
              onClick={handleOpenScanner}
              startIcon={<QrCodeScannerIcon />}
              size="small"
              sx={{
                height: 45,
                px: 2,
                textTransform: "none",
                borderRadius: 1,
                minWidth: "fit-content",
                width: { xs: "100%", sm: "auto" },
              }}
            >
              Scan QR
            </Button>

          </Box>
        </Box>


        {/* QR Code Details Table */}
        <TableContainer sx={{ p: 0.5 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ height: 50 }}>
                <TableCell sx={{ textAlign: "center" }}>QRCode ID</TableCell>
                <TableCell sx={{ textAlign: "center" }}>PO Number</TableCell>
                <TableCell sx={{ textAlign: "center" }}>
                  Project Number
                </TableCell>
                <TableCell sx={{ textAlign: "center" }}>Prod Series</TableCell>
                <TableCell sx={{ textAlign: "center" }}>
                  Drawing Number
                </TableCell>
                <TableCell sx={{ textAlign: "center" }}>ID</TableCell>
                <TableCell sx={{ textAlign: "center" }}>Qty</TableCell>
                <TableCell sx={{ textAlign: "center" }}>Nomenclature</TableCell>
                <TableCell sx={{ textAlign: "center" }}>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {qrCodeList.length > 0 ? (
                qrCodeList.map((details, index) => (
                  <React.Fragment key={index}>
                    <TableRow>
                      <TableCell sx={{ textAlign: "left", minWidth: "150px" }}>
                        {details.qrCodeNumber}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {details.productionOrderNumber}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {details.projectNumber}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {details.productionSeries}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {details.drawingNumber}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {details.idNumber}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {formatQuantity(details.quantity)}
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        {details.nomenclature}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleExpandClick(details.qrCodeNumber)
                          }
                        >
                          {expandedRow === details.qrCodeNumber ? (
                            <ExpandLessIcon />
                          ) : (
                            <ExpandMoreIcon />
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow sx={{ height: 'auto' }}>
                      <TableCell
                        style={{ paddingBottom: 0, paddingTop: 0 }}
                        colSpan={9}
                      >
                        <Collapse
                          in={expandedRow === details.qrCodeNumber}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box sx={{ margin: 0.5 }}>
                            <Table size="small" aria-label="details">
                              <TableHead>
                                <TableRow sx={{ height: 50 }}>
                                  <TableCell>Consumed in Drawing</TableCell>
                                  <TableCell sx={{ textAlign: "center" }}>
                                    Status
                                  </TableCell>
                                  <TableCell sx={{ textAlign: "center" }}>
                                    IR Number
                                  </TableCell>
                                  <TableCell sx={{ textAlign: "center" }}>
                                    MSN Number
                                  </TableCell>
                                  <TableCell sx={{ textAlign: "center" }}>
                                    MRIR Number
                                  </TableCell>
                                  <TableCell sx={{ textAlign: "center" }}>
                                    Disposition
                                  </TableCell>
                                  <TableCell sx={{ textAlign: "center" }}>
                                    Username
                                  </TableCell>
                                  <TableCell sx={{ textAlign: "center" }}>
                                    Created Date
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                <TableRow>
                                  <TableCell>
                                    {details.consumedInDrawing || "-"}
                                  </TableCell>
                                  <TableCell sx={{ textAlign: "center" }}>
                                    <Chip
                                      label={details.qrCodeStatus || "N/A"}
                                      size="small"
                                      color={
                                        details.qrCodeStatus?.toLowerCase() ===
                                          "available"
                                          ? "success"
                                          : "default"
                                      }
                                      variant="outlined"
                                    />
                                  </TableCell>
                                  <TableCell sx={{ textAlign: "center" }}>
                                    {details.irNumber || "-"}
                                  </TableCell>
                                  <TableCell sx={{ textAlign: "center" }}>
                                    {details.msnNumber || "-"}
                                  </TableCell>
                                  <TableCell sx={{ textAlign: "center" }}>
                                    {details.mrirNumber || "-"}
                                  </TableCell>
                                  <TableCell sx={{ textAlign: "center" }}>
                                    {details.desposition || "-"}
                                  </TableCell>
                                  <TableCell sx={{ textAlign: "center" }}>
                                    {details.users || "-"}
                                  </TableCell>
                                  <TableCell sx={{ textAlign: "center" }}>
                                    {details.createdDate
                                      ? formatDate(details.createdDate)
                                      : "-"}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No QR code scanned
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Store In Dashboard Section */}
      <Paper sx={{ p: 1.5, mt: 1.5 }}>
        {/* Heading + Filters Row */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          spacing={2}
          mb={2}
        >
          {/* Heading */}
          <Typography variant="h6" color="primary.main" fontWeight={600}>
            Awaiting Pending Precheck
          </Typography>

          {/* Filters */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
            >
              {/* From Date */}
              <DatePicker
                label="From Date"
                value={fromDate}
                onChange={(newValue: Date | null) => setFromDate(newValue)}
                disabled={!activeQrCode}
                slotProps={{
                  textField: {
                    size: "small",
                    sx: { width: 180 },
                  },
                }}
              />

              {/* To Date */}
              <DatePicker
                label="To Date"
                value={toDate}
                onChange={(newValue: Date | null) => setToDate(newValue)}
                disabled={!activeQrCode}
                slotProps={{
                  textField: {
                    size: "small",
                    sx: { width: 180 },
                  },
                }}
              />

              {/* Today Button */}
              <Button
                size="small"
                variant="outlined"
                startIcon={<TodayIcon />}
                disabled={!activeQrCode}
                onClick={() => {
                  const today = new Date();
                  setFromDate(today);
                  setToDate(today);
                }}
              >
                Today
              </Button>

              {/* Clear Filters */}
              <Button
                size="small"
                variant="text"
                color="error"
                disabled={!activeQrCode || (!fromDate && !toDate)}
                onClick={() => {
                  setFromDate(null);
                  setToDate(null);
                }}
              >
                Clear
              </Button>
            </Stack>
          </LocalizationProvider>
        </Stack>

        {/* Table */}
        <TableContainer sx={{ maxHeight: { xs: 400, sm: 550, md: 650, lg: 750 } }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ height: 50 }}>
                <TableCell sx={{ fontWeight: 600 }}>
                  S.No.
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  Drawing Number
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  PO Number
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  Prod Series
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  ID Number
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  Quantity
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  Project Number
                </TableCell>
                
                <TableCell sx={{ fontWeight: 600 }}>
                  Created By 
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  Created Date
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  Precheck Status
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <CircularProgress size={20} />
                  </TableCell>
                </TableRow>
              ) : filteredStoreInList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    No store-in records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredStoreInList.map((row, index) => (
                  <TableRow key={index} sx={{ height: 50 }}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell
                      sx={{ textAlign: "left", minWidth: "200px" }}
                    >
                      {row.drawingNumber}
                    </TableCell>
                    <TableCell>{row.productionOrderNumber}</TableCell>
                    <TableCell>{row.productionSeries}</TableCell>
                    <TableCell>{row.idNumber}</TableCell>
                    <TableCell>{formatQuantity(row.quantity)}</TableCell>
                    <TableCell>{row.projectNumber}</TableCell>
                    
                    <TableCell>{row.createdByName}</TableCell>
                    <TableCell>
                      {formatDate(row.createdDate)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.precheckStatus || "N/A"}
                        size="small"
                        color={
                          row.precheckStatus?.toLowerCase() === "partial"
                            ? "warning"
                            : row.precheckStatus?.toLowerCase() === "pending"
                              ? "info"
                              : row.precheckStatus?.toLowerCase() === "pending-planner"
                                ? "default"
                                : "default"
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip
                        title={
                          hasMakeAccess
                            ? "Make Precheck"
                            : "You do not have permission to perform precheck"
                        }
                        PopperProps={{ disablePortal: true }}
                        disableFocusListener
                      >
                        <span>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() =>
                              navigate("/precheck/make", { state: row })
                            }
                            disabled={!hasMakeAccess}
                          >
                            <PlaylistAddCheckIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Camera Permission Dialog */}
      <Dialog
        open={showPermissionDialog}
        onClose={() => setShowPermissionDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 },
        }}
      >
        <DialogTitle
          sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}
        >
          <PhotoCameraIcon color="primary" />
          <Typography variant="h6" fontWeight="600">
            Camera Access
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <DialogContentText
            sx={{ color: "text.primary", fontSize: "0.95rem" }}
          >
            To scan QR codes, we need your permission to access the camera.
            Would you like to allow access?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setShowPermissionDialog(false)}
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 2, textTransform: "none", px: 3 }}
          >
            Deny
          </Button>
          <Button
            onClick={async () => {
              setShowPermissionDialog(false);
              const granted = await handleRequestPermission();
              if (granted) {
                setOpenScanner(true);
              } else {
                setOpenScanner(true);
              }
            }}
            color="primary"
            variant="contained"
            autoFocus
            sx={{ borderRadius: 2, textTransform: "none", px: 3, boxShadow: 2 }}
          >
            Allow
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Scanner Dialog */}
      <Dialog
        open={openScanner}
        onClose={() => setOpenScanner(false)}
        fullScreen={isMobile}
        maxWidth={false}
        PaperProps={{
          sx: {
            backgroundColor: "#000",
            overflow: "hidden",
            ...(isMobile
              ? {}
              : {
                width: 420,
                height: 520,
                borderRadius: 3,
                maxHeight: "85vh",
              }),
          },
        }}
        TransitionProps={{ timeout: 300 }}
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Camera video element */}
          <Box
            id="qr-reader-video-store-in"
            sx={{
              flex: 1,
              width: "100%",
              position: "relative",
              overflow: "hidden",
              "& video": {
                width: "100% !important",
                height: "100% !important",
                objectFit: "cover",
              },
              "& br, & img[alt='Info icon'], & span, & #qr-shaded-region": {
                display: "none !important",
              },
            }}
          />

          {/* Dark overlay with transparent cutout */}
          {!scannerError && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                zIndex: 2,
              }}
            >
              {/* Top dark band */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "calc(50% - 120px)",
                  background: "rgba(0,0,0,0.55)",
                }}
              />
              {/* Bottom dark band */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "calc(50% - 120px)",
                  background: "rgba(0,0,0,0.55)",
                }}
              />
              {/* Left dark band */}
              <Box
                sx={{
                  position: "absolute",
                  top: "calc(50% - 120px)",
                  left: 0,
                  width: "calc(50% - 120px)",
                  height: "240px",
                  background: "rgba(0,0,0,0.55)",
                }}
              />
              {/* Right dark band */}
              <Box
                sx={{
                  position: "absolute",
                  top: "calc(50% - 120px)",
                  right: 0,
                  width: "calc(50% - 120px)",
                  height: "240px",
                  background: "rgba(0,0,0,0.55)",
                }}
              />

              {/* Scan frame corner brackets */}
              {[
                {
                  top: 0,
                  left: 0,
                  borderTop: "3px solid #4FC3F7",
                  borderLeft: "3px solid #4FC3F7",
                  borderRadius: "12px 0 0 0",
                },
                {
                  top: 0,
                  right: 0,
                  borderTop: "3px solid #4FC3F7",
                  borderRight: "3px solid #4FC3F7",
                  borderRadius: "0 12px 0 0",
                },
                {
                  bottom: 0,
                  left: 0,
                  borderBottom: "3px solid #4FC3F7",
                  borderLeft: "3px solid #4FC3F7",
                  borderRadius: "0 0 0 12px",
                },
                {
                  bottom: 0,
                  right: 0,
                  borderBottom: "3px solid #4FC3F7",
                  borderRight: "3px solid #4FC3F7",
                  borderRadius: "0 0 12px 0",
                },
              ].map((style, i) => (
                <Box
                  key={i}
                  sx={{
                    position: "absolute",
                    width: 36,
                    height: 36,
                    ...(style.top !== undefined && {
                      top: `calc(50% - 120px + ${style.top}px)`,
                    }),
                    ...(style.bottom !== undefined && {
                      bottom: `calc(50% - 120px + ${style.bottom}px)`,
                    }),
                    ...(style.left !== undefined && {
                      left: `calc(50% - 120px + ${style.left}px)`,
                    }),
                    ...(style.right !== undefined && {
                      right: `calc(50% - 120px + ${style.right}px)`,
                    }),
                    borderTop: style.borderTop,
                    borderBottom: style.borderBottom,
                    borderLeft: style.borderLeft,
                    borderRight: style.borderRight,
                    borderRadius: style.borderRadius,
                  }}
                />
              ))}

              {/* Animated scan line */}
              <Box
                sx={{
                  position: "absolute",
                  left: "calc(50% - 116px)",
                  width: "232px",
                  height: "2px",
                  background:
                    "linear-gradient(90deg, transparent, #4FC3F7 30%, #29B6F6 50%, #4FC3F7 70%, transparent)",
                  boxShadow: "0 0 12px 2px rgba(79, 195, 247, 0.5)",
                  animation: "scanLine 2.2s ease-in-out infinite",
                  "@keyframes scanLine": {
                    "0%": { top: "calc(50% - 115px)" },
                    "50%": { top: "calc(50% + 113px)" },
                    "100%": { top: "calc(50% - 115px)" },
                  },
                }}
              />
            </Box>
          )}

          {/* Top bar: close button + title */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              display: "flex",
              alignItems: "center",
              px: 1,
              py: 1,
              zIndex: 10,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)",
            }}
          >
            <IconButton
              onClick={() => setOpenScanner(false)}
              sx={{ color: "#fff" }}
            >
              <CloseIcon />
            </IconButton>
            <Typography
              variant="subtitle1"
              sx={{
                color: "#fff",
                fontWeight: 600,
                ml: 1,
                textShadow: "0 1px 4px rgba(0,0,0,0.6)",
              }}
            >
              Scan QR Code
            </Typography>
          </Box>

          {/* Help text */}
          {!scannerError && (
            <Typography
              variant="body2"
              sx={{
                position: "absolute",
                bottom: "calc(50% - 150px)",
                left: 0,
                right: 0,
                textAlign: "center",
                color: "rgba(255,255,255,0.85)",
                fontWeight: 500,
                zIndex: 5,
                textShadow: "0 1px 6px rgba(0,0,0,0.7)",
                letterSpacing: "0.3px",
              }}
            >
              Align QR code within the frame
            </Typography>
          )}

          {/* Scanner loading spinner */}
          {!scannerReady && !scannerError && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 8,
                backgroundColor: "rgba(0,0,0,0.7)",
              }}
            >
              <CircularProgress sx={{ color: "#4FC3F7", mb: 2 }} size={44} />
              <Typography
                variant="body2"
                sx={{ color: "rgba(255,255,255,0.8)" }}
              >
                Starting camera...
              </Typography>
            </Box>
          )}

          {/* Scanner error state */}
          {scannerError && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 8,
                backgroundColor: "rgba(0,0,0,0.85)",
                px: 4,
              }}
            >
              <PhotoCameraIcon
                sx={{ fontSize: 56, color: "rgba(255,255,255,0.3)", mb: 2 }}
              />
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  maxWidth: 340,
                  backgroundColor: "rgba(211,47,47,0.15)",
                  color: "#fff",
                  "& .MuiAlert-icon": { color: "#ef5350" },
                  borderRadius: 2,
                }}
              >
                {scannerError}
              </Alert>
              <Button
                variant="contained"
                onClick={() => setOpenScanner(false)}
                sx={{
                  borderRadius: 6,
                  px: 4,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Close
              </Button>
            </Box>
          )}

          {/* Upload error banner */}
          {uploadError && (
            <Box
              sx={{
                position: "absolute",
                top: 64,
                left: 16,
                right: 16,
                zIndex: 12,
              }}
            >
              <Alert
                severity="error"
                onClose={() => setUploadError(null)}
                sx={{
                  borderRadius: 2,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                }}
              >
                {uploadError}
              </Alert>
            </Box>
          )}

          {/* Bottom control bar */}
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
              pb: 3,
              pt: 6,
              px: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-around",
                alignItems: "center",
                maxWidth: 320,
                mx: "auto",
              }}
            >
              {/* Upload from device */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadInProgress}
                  sx={{
                    color: "rgba(255,255,255,0.8)",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    width: 56,
                    height: 56,
                    border: "2px solid rgba(255,255,255,0.25)",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.2)",
                      borderColor: "rgba(255,255,255,0.5)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  {uploadInProgress ? (
                    <CircularProgress size={24} sx={{ color: "#4FC3F7" }} />
                  ) : (
                    <UploadFileIcon sx={{ fontSize: 26 }} />
                  )}
                </IconButton>
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.65rem" }}
                >
                  Upload from device
                </Typography>
              </Box>

              {/* Camera flip */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <IconButton
                  onClick={handleCameraFlip}
                  sx={{
                    color: "rgba(255,255,255,0.8)",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    width: 48,
                    height: 48,
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.2)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  {facingMode === "environment" ? (
                    <CameraFrontIcon />
                  ) : (
                    <CameraRearIcon />
                  )}
                </IconButton>
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.65rem" }}
                >
                  Flip
                </Typography>
              </Box>

              {/* Torch Toggle */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <IconButton
                  onClick={handleTorchToggle}
                  sx={{
                    color: "rgba(255,255,255,0.8)",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    width: 48,
                    height: 48,
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.2)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  {torchOn ? <FlashOnIcon /> : <FlashOffIcon />}
                </IconButton>
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.65rem" }}
                >
                  Torch
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Hidden file input */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleScanFileUpload}
          />

          {/* Hidden container for file-based QR scanning */}
          <Box
            id="qr-reader-file-store-in"
            sx={{
              visibility: "hidden",
              position: "absolute",
              width: 0,
              height: 0,
              pointerEvents: "none",
            }}
          />
        </Box>
      </Dialog>
    </Box>
  );
};

export default StoreIn;
