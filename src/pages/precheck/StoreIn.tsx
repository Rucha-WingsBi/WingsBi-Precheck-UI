import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  Snackbar,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useMediaQuery,
  useTheme,
  Stack,
  FormControl,
  Select,
  MenuItem,
  Tooltip,
  Tabs,
  Tab,
  Menu,
  ListItemIcon,
  ListItemText,
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
  FlashOn as FlashOnIcon,
  FlashOff as FlashOffIcon,
  CropFree as CropFreeIcon,
  Search as SearchIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  CalendarToday as CalendarTodayIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  FileDownload as FileDownloadIcon,
  CloudUpload as CloudUploadIcon,
  Inventory as InventoryIcon,
} from "@mui/icons-material";
import { getStoreInData } from "../../store/slices/precheckSlice";
import { format } from "date-fns";
import {
  updateQrCodeDetails,
  bulkStoreInFromExcel,
  downloadBulkStoreInTemplate,
} from "../../store/slices/qrcodeSlice";
import type { AppDispatch, RootState } from "../../store/store";
import { Html5Qrcode } from "html5-qrcode";
import { usePageAccess, useProductionSeries } from "../../hooks/useMasterData";
import { getErrorMessage } from "../../utils/errorUtils";
import { isPageAccessible } from "../../utils/accessUtils";
import { useHasPermission } from "../../hooks/useHasPermission";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { CustomPagination } from "../../components/CustomPagination";
import { MultiSelectFilter } from "../../components/MultiSelectFilter";
import { EmptyState } from "../../components/EmptyState";
import { ClearIcon } from "@mui/x-date-pickers";
import AvailableInStore from "./AvailableInStore";

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
  precheckStatusId: number;
}

const formatQuantity = (qty: any) => {
  if (qty === undefined || qty === null || qty === "") return "-";
  const num = Number(qty);
  if (isNaN(num)) return String(qty);
  const match = String(qty).match(/^-?\d+(?:\.\d{0,4})?/);
  return match ? match[0] : String(qty);
};

const StoreIn: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [storeTab, setStoreTab] = useState<"store-in" | "available">("store-in");
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: pageAccessData } = usePageAccess(
    user?.roleid ? Number(user.roleid) : null
  );
  const hasMakeAccess = useHasPermission("Part Verification");

  // Production Series hook for filter
  const { data: productionSeriesData = [] } = useProductionSeries();
  const seriesOptions = useMemo(() => {
    return productionSeriesData.map((s: any) => ({
      id: s.id || s.productionSeries,
      label: s.productionSeries || String(s),
    }));
  }, [productionSeriesData]);

  const scanInputRef = useRef<HTMLInputElement | null>(null);
  const [qrCodeInput, setQrCodeInput] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleExpandClick = (qrCodeId: string) => {
    setExpandedRow(expandedRow === qrCodeId ? null : qrCodeId);
  };

  const [alertMessage, setAlertMessage] = useState<{
    message: string;
    type: "success" | "error" | "info";
  }>({ message: "", type: "info" });

  const [qrCodeList, setQrCodeList] = useState<QRCodeDetailsResponse[]>([]);
  const [storeInList, setStoreInList] = useState<StoreInResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Awaiting Precheck Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeries, setSelectedSeries] = useState<(string | number)[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [dateFilterMode] = useState<"single" | "range">("range");
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [fromDateFocused, setFromDateFocused] = useState(false);
  const [toDateFocused, setToDateFocused] = useState(false);

  // Pagination State for Awaiting Precheck
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const isDropdownFilterSelected = selectedSeries.length > 0 || !!selectedStatus || !!fromDate || !!toDate || !!filterDate;
  const hasAnyFilter = searchTerm.trim().length > 0 || isDropdownFilterSelected;

  // Active Filter Chips for Awaiting Precheck Table
  const activeChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onRemove: () => void }> = [];

    if (searchTerm.trim()) {
      chips.push({
        id: "search",
        label: `Search: "${searchTerm.trim()}"`,
        onRemove: () => {
          setSearchTerm("");
          setPage(0);
          fetchStoreInData({ searchQuery: "", pageNumber: 0 });
        },
      });
    }
    selectedSeries.forEach((ser) => {
      chips.push({
        id: `series_${ser}`,
        label: `Series: ${ser}`,
        onRemove: () => {
          const updated = selectedSeries.filter((s) => s !== ser);
          setSelectedSeries(updated);
          setPage(0);
          fetchStoreInData({ prodSeries: updated, pageNumber: 0 });
        },
      });
    });
    if (selectedStatus) {
      chips.push({
        id: "status",
        label: `Status: ${selectedStatus}`,
        onRemove: () => {
          setSelectedStatus("");
          setPage(0);
          fetchStoreInData({ status: "", pageNumber: 0 });
        },
      });
    }
    if (fromDate && toDate) {
      chips.push({
        id: "dateRange",
        label: `From: ${format(fromDate, "dd/MM/yyyy")} - To: ${format(toDate, "dd/MM/yyyy")}`,
        onRemove: () => {
          setFromDate(null);
          setToDate(null);
          setPage(0);
          fetchStoreInData({ fromDate: null, toDate: null, pageNumber: 0 });
        },
      });
    } else if (fromDate) {
      chips.push({
        id: "fromDateChip",
        label: `From: ${format(fromDate, "dd/MM/yyyy")}`,
        onRemove: () => {
          setFromDate(null);
          setPage(0);
          fetchStoreInData({ fromDate: null, pageNumber: 0 });
        },
      });
    } else if (toDate) {
      chips.push({
        id: "toDateChip",
        label: `To: ${format(toDate, "dd/MM/yyyy")}`,
        onRemove: () => {
          setToDate(null);
          setPage(0);
          fetchStoreInData({ toDate: null, pageNumber: 0 });
        },
      });
    }

    return chips;
  }, [searchTerm, selectedSeries, selectedStatus, fromDate, toDate, filterDate]);

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
  const bulkStoreInFileInputRef = useRef<HTMLInputElement | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Bulk Store In Menu state
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState<null | HTMLElement>(null);
  const isBulkMenuOpen = Boolean(bulkMenuAnchor);

  const handleBulkMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setBulkMenuAnchor(event.currentTarget);
  };

  const handleBulkMenuClose = () => {
    setBulkMenuAnchor(null);
  };

  const handleExportStoreIn = () => {
    handleBulkMenuClose();
    const listToExport = storeInList.length > 0 ? storeInList : qrCodeList;
    if (!listToExport || listToExport.length === 0) {
      setAlertMessage({
        message: "No store-in data available to export.",
        type: "info",
      });
      return;
    }

    const headers = [
      "QR Code Number",
      "Production Order Number",
      "Project Number",
      "Prod Series",
      "Part Number",
      "ID Number",
      "Quantity",
      "Description",
      "Created Date",
    ];

    const rows = listToExport.map((row: any) => [
      `"${row.qrCodeNumber || row.qrCode || ""}"`,
      `"${row.productionOrderNumber || ""}"`,
      `"${row.projectNumber || ""}"`,
      `"${row.productionSeries || ""}"`,
      `"${row.drawingNumber || ""}"`,
      `"${row.idNumber || ""}"`,
      `"${row.quantity || ""}"`,
      `"${(row.nomenclature || "").replace(/"/g, '""')}"`,
      `"${row.createdDate || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Store_In_Export_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setAlertMessage({
      message: "Store-in data exported successfully.",
      type: "success",
    });
  };

  const handleDownloadStoreInTemplate = async () => {
    handleBulkMenuClose();
    setIsLoading(true);
    setAlertMessage({
      message: "Downloading Bulk Store In template...",
      type: "info",
    });
    try {
      await dispatch(downloadBulkStoreInTemplate()).unwrap();
      setAlertMessage({
        message: "Bulk Store In template downloaded successfully.",
        type: "success",
      });
    } catch (err: any) {
      console.error("Error downloading template:", err);
      setAlertMessage({
        message: getErrorMessage(err, "Failed to download Bulk Store In template"),
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setAlertMessage({
      message: `Uploading ${file.name} for Bulk Store In...`,
      type: "info",
    });

    try {
      const result = await dispatch(bulkStoreInFromExcel(file)).unwrap();
      const messageStr =
        typeof result === "string"
          ? result
          : result?.message || `Bulk Store In file ${file.name} imported successfully.`;
      setAlertMessage({
        message: messageStr,
        type: "success",
      });
      fetchStoreInData();
    } catch (err: any) {
      console.error("Error performing bulk store in:", err);
      setAlertMessage({
        message: getErrorMessage(err, "Failed to process Bulk Store In Excel file"),
        type: "error",
      });
    } finally {
      setIsLoading(false);
      if (event.target) event.target.value = "";
    }
  };

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

  const handleTorchToggle = useCallback(async () => {
    const qr = html5QrCodeRef.current;
    if (!qr) return;
    try {
      const capabilities = (qr as any).getRunningTrackCameraCapabilities?.();
      if (capabilities?.torchFeature?.isSupported?.()) {
        await capabilities.torchFeature.apply(!torchOn);
        setTorchOn((v) => !v);
      }
    } catch (e) {
      console.warn("Torch not supported on this device", e);
    }
  }, [torchOn]);

  const handleCameraFlip = useCallback(() => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }, []);

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
        const qr = new Html5Qrcode("qr-reader-video-store-in", false);
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
          () => { }
        );
        setScannerReady(true);
      } catch (err: any) {
        console.error("Scanner initialization error:", err);
        let detailedError =
          "Could not initialize camera. Please ensure camera permissions are granted and no other app is using it.";
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

    const isNumeric = /^\d+$/.test(qrCodeInput);
    if (!isNumeric) return;

    if (qrCodeInput.length === 15) {
      submitQRCode(qrCodeInput);
      setQrCodeInput("");
    } else if (qrCodeInput.length === 12) {
      const timer = setTimeout(() => {
        submitQRCode(qrCodeInput);
        setQrCodeInput("");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [qrCodeInput]);

  const activeQrCode = qrCodeList[0]?.qrCodeNumber || "";

  // Core function to fetch store-in data from API (/api/Precheck/GetStoreAvailablComponents)
  const fetchStoreInData = useCallback(
    (overrides?: {
      searchQuery?: string;
      prodSeries?: (string | number)[];
      status?: string;
      fromDate?: Date | null;
      toDate?: Date | null;
      filterDate?: Date | null;
      pageNumber?: number;
      pageSize?: number;
      isInitialQrScan?: boolean;
    }) => {
      const queryVal = overrides?.searchQuery !== undefined ? overrides.searchQuery : searchTerm;
      const seriesVal = overrides?.prodSeries !== undefined ? overrides.prodSeries : selectedSeries;
      const statusVal = overrides?.status !== undefined ? overrides.status : selectedStatus;
      const fromDateVal = overrides?.fromDate !== undefined ? overrides.fromDate : fromDate;
      const toDateVal = overrides?.toDate !== undefined ? overrides.toDate : toDate;
      const filterDateVal = overrides?.filterDate !== undefined ? overrides.filterDate : filterDate;
      const pageVal = overrides?.pageNumber !== undefined ? overrides.pageNumber : page;
      const sizeVal = overrides?.pageSize !== undefined ? overrides.pageSize : rowsPerPage;

      let reqFromDate: string | undefined = undefined;
      let reqToDate: string | undefined = undefined;

      if (fromDateVal) {
        reqFromDate = format(fromDateVal, "yyyy-MM-dd");
      }
      if (toDateVal) {
        reqToDate = format(toDateVal, "yyyy-MM-dd");
      }

      const seriesArray = seriesVal.map((s) => String(s));

      const hasSearchOrFilter =
        queryVal.trim().length > 0 ||
        seriesArray.length > 0 ||
        !!statusVal ||
        !!fromDateVal ||
        !!toDateVal ||
        !!filterDateVal;

      // Do not trigger API call with empty QR code if no search or filter criteria are applied
      if (!activeQrCode && !hasSearchOrFilter) {
        setStoreInList([]);
        return;
      }

      setIsLoading(true);
      dispatch(
        getStoreInData({
          qrCode: activeQrCode,
          fromDate: reqFromDate,
          toDate: reqToDate,
          searchQuery: queryVal.trim(),
          prodSeries: seriesArray,
          status: statusVal,
          pageNumber: pageVal + 1,
          pageSize: sizeVal,
        })
      )
        .unwrap()
        .then((storeInResult) => {
          const rawList = Array.isArray(storeInResult)
            ? storeInResult
            : storeInResult?.data || storeInResult?.items || [];
          if (rawList && rawList.length > 0) {
            setStoreInList(rawList);
            if (activeQrCode && overrides?.isInitialQrScan) {
              setAlertMessage({
                message: `QR Code ${activeQrCode} processed successfully. ${rawList.length} awaiting pending precheck record(s) found.`,
                type: "success",
              });
            }
          } else {
            setStoreInList([]);
            if (activeQrCode && overrides?.isInitialQrScan) {
              setAlertMessage({
                message: `QR Code ${activeQrCode} processed successfully. No awaiting pending precheck found for QR Code ${activeQrCode}.`,
                type: "info",
              });
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching store-in data:", error);
          setStoreInList([]);
          setAlertMessage({
            message: getErrorMessage(error, "Error fetching store-in data"),
            type: "error",
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
    [
      activeQrCode,
      searchTerm,
      selectedSeries,
      selectedStatus,
      fromDate,
      toDate,
      filterDate,
      dateFilterMode,
      page,
      rowsPerPage,
      dispatch,
    ]
  );

  // Initial fetch when active QR code changes or component mounts
  const prevQrCodeRef = useRef<string>("");
  useEffect(() => {
    const isNewScan = !!activeQrCode && activeQrCode !== prevQrCodeRef.current;
    prevQrCodeRef.current = activeQrCode;
    fetchStoreInData({ isInitialQrScan: isNewScan });
  }, [activeQrCode]);

  // Direct API call when typing in Search bar (debounced 400ms)
  const isSearchMountedRef = useRef(false);
  useEffect(() => {
    if (!isSearchMountedRef.current) {
      isSearchMountedRef.current = true;
      return;
    }
    const timer = setTimeout(() => {
      setPage(0);
      fetchStoreInData({ searchQuery: searchTerm, pageNumber: 0 });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedSeries([]);
    setSelectedStatus("");
    setFromDate(null);
    setToDate(null);
    setFilterDate(null);
    setPage(0);
    fetchStoreInData({
      searchQuery: "",
      prodSeries: [],
      status: "",
      fromDate: null,
      toDate: null,
      filterDate: null,
      pageNumber: 0,
    });
  };

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

      setQrCodeList([]);
      setStoreInList([]);

      const qrCodeResult = await dispatch(updateQrCodeDetails(qrCode)).unwrap();

      if (!qrCodeResult) {
        setAlertMessage({
          message: `QR Code ${qrCode} not found.`,
          type: "error",
        });
        return;
      }

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
        message: getErrorMessage(error, `Error processing QR Code ${qrCode}`),
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Box
      sx={{
        py: { xs: 1.5, sm: 2 },
        px: { xs: 1.5, sm: 2.5 },
        maxWidth: 1600,
        mx: "auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* 1. Page Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "primary.main",
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
            }}
          >
            {storeTab === "store-in"
              ? "Store In"
              : "Stored Components"}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#667085", mt: 0.5 }}
          >
            {storeTab === "store-in"
              ? "Scan verified components to receive them into store inventory locations."
              : "View and filter available components and QR codes in store."}
          </Typography>
        </Box>

        <Tabs
          value={storeTab}
          onChange={(_, newValue) => setStoreTab(newValue)}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            "& .MuiTab-root": {
              fontWeight: 600,
              fontSize: "0.875rem",
              textTransform: "none",
              minWidth: 120,
            },
            "& .MuiTab-root.Mui-selected": { color: "primary.main" },
            "& .MuiTabs-indicator": {
              backgroundColor: "primary.main",
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
          }}
        >
          <Tab label="Store In" value="store-in" />
          <Tab label="Stored Components" value="available" />
        </Tabs>
      </Stack>

      <Box sx={{ display: storeTab === "available" ? "block" : "none" }}>
        <AvailableInStore hideHeader />
      </Box>

      <Box sx={{ display: storeTab === "store-in" ? "block" : "none" }}>

        {/* Alert Message Toast */}
        <Snackbar
          open={Boolean(alertMessage.message)}
          autoHideDuration={4000}
          onClose={() => setAlertMessage({ message: "", type: "info" })}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            severity={alertMessage.type}
            sx={{ width: "100%", borderRadius: "8px", boxShadow: 3 }}
            onClose={() => setAlertMessage({ message: "", type: "info" })}
          >
            {alertMessage.message}
          </Alert>
        </Snackbar>

        {/* 2. Hero Scan QR Panel */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: "12px",
            border: "1px solid #EAECF0",
            backgroundColor: "#ffffff",
            boxShadow: "0 1px 3px rgba(16, 24, 40, 0.05)",
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontWeight: 600, color: "#344054", fontSize: "0.8rem", display: "block", mb: 1 }}
          >
            Scan QR
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: { xs: "wrap", md: "nowrap" },
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1, width: "100%" }}>
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
                  inputRef={scanInputRef}
                  fullWidth
                  variant="standard"
                  value={qrCodeInput}
                  onChange={handleQRCodeScan}
                  placeholder="Enter QR code number (12 to 15) digit"
                  InputProps={{
                    disableUnderline: true,
                    endAdornment: isLoading && (
                      <InputAdornment position="end">
                        <CircularProgress size={18} sx={{ color: "primary.main" }} />
                      </InputAdornment>
                    ),
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
                onClick={handleOpenScanner}
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

            {/* Bulk Store In Menu Button */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                pl: { xs: 0, md: 2 },
                borderLeft: { xs: "none", md: "1px solid #EAECF0" },
              }}
            >
              <Button
                variant="outlined"
                onClick={handleBulkMenuOpen}
                endIcon={<KeyboardArrowDownIcon />}

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
                Bulk Store In
              </Button>

              <Menu
                anchorEl={bulkMenuAnchor}
                open={isBulkMenuOpen}
                onClose={handleBulkMenuClose}
                transitionDuration={150}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    borderRadius: "10px",
                    mt: 1,
                    minWidth: 160,
                    border: "1px solid #EAECF0",
                    py: 0.5,
                  },
                }}
              >
                <MenuItem
                  onClick={() => {
                    handleBulkMenuClose();
                    bulkStoreInFileInputRef.current?.click();
                  }}
                  sx={{ py: 1, px: 2, fontSize: "0.875rem", fontWeight: 600, color: "#344054" }}
                >
                  <ListItemIcon sx={{ color: "#D97706", minWidth: 32 }}>
                    <CloudUploadIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Import" primaryTypographyProps={{ fontWeight: 600, fontSize: "0.875rem" }} />
                </MenuItem>
                <MenuItem
                  onClick={handleDownloadStoreInTemplate}
                  sx={{ py: 1, px: 2, fontSize: "0.875rem", fontWeight: 600, color: "#344054" }}
                >
                  <ListItemIcon sx={{ color: "#4B5563", minWidth: 32 }}>
                    <FileDownloadIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Template" primaryTypographyProps={{ fontWeight: 600, fontSize: "0.875rem" }} />
                </MenuItem>
              </Menu>

              {/* Hidden file input for Bulk Store In import */}
              <input
                type="file"
                accept=".xlsx, .xls, .csv, .txt"
                ref={bulkStoreInFileInputRef}
                style={{ display: "none" }}
                onChange={handleBulkImportFile}
              />
            </Box>
          </Box>

          {/* Confirmation & Manual Link Bar */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mt: 1.5,
              pt: 1,
              borderTop: "1px solid #F2F4F7",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: "#475467", fontSize: "0.775rem" }}
            >
              Last scan: <strong>{activeQrCode}</strong>
            </Typography>

          </Box>
        </Paper>

        {/* 3. "Scanned this session" Table Section */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: "12px",
            border: "1px solid #EAECF0",
            backgroundColor: "#ffffff",
            overflow: "hidden",
            mb: 3,
            boxShadow: "0 1px 3px rgba(16, 24, 40, 0.05)",
          }}
        >
          <Box
            sx={{
              p: 2,
              borderBottom: "1px solid #EAECF0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontSize: "0.875rem", fontWeight: 600, color: "primary.main" }}
            >
              Scanned this session
            </Typography>
          </Box>

          <TableContainer sx={{ overflowX: "auto", maxHeight: 200 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ height: 42 }}>
                  {[
                    "QRCode ID",
                    "PO Number",
                    "Project Number",
                    "Prod Series",
                    "Part Number",
                    "ID",
                    "Qty",
                    "Item Description",
                    "Details",
                  ].map((col) => (
                    <TableCell
                      key={col}
                      align={
                        col === "Qty" || col === "Details"
                          ? "center"
                          : "left"
                      }
                      sx={{
                        fontWeight: 700,
                        backgroundColor: "#F9FAFB",
                        color: "#475467",
                        fontSize: "0.8rem",
                        borderBottom: "1px solid #EAECF0",
                        py: 1,
                        px: 1.5,
                      }}
                    >
                      {col === "PO Number" ? (
                        <Tooltip title="Production Order Number" arrow placement="bottom">
                          <span>{col}</span>
                        </Tooltip>
                      ) : (
                        col
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {qrCodeList.length > 0 ? (
                  qrCodeList.map((row, idx) => (
                    <React.Fragment key={idx}>
                      <TableRow
                        hover
                        sx={{
                          height: 42,
                          "&:hover": { backgroundColor: "#F9FAFB" },
                          "& td": { borderBottom: "1px solid #F2F4F7", fontSize: "0.825rem" },
                        }}
                      >
                        <TableCell sx={{ fontWeight: 600, color: "#101828" }}>
                          {row.qrCodeNumber}
                        </TableCell>
                        <TableCell>{row.productionOrderNumber || "-"}</TableCell>
                        <TableCell>{row.projectNumber || "-"}</TableCell>
                        <TableCell>{row.productionSeries || "-"}</TableCell>
                        <TableCell>{row.drawingNumber || "-"}</TableCell>
                        <TableCell>{row.idNumber || "-"}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>
                          {formatQuantity(row.quantity)}
                        </TableCell>
                        <TableCell>{row.nomenclature || "-"}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleExpandClick(row.qrCodeNumber)}
                            sx={{ color: "#667085" }}
                          >
                            {expandedRow === row.qrCodeNumber ? (
                              <ExpandLessIcon fontSize="small" />
                            ) : (
                              <ExpandMoreIcon fontSize="small" />
                            )}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      <TableRow sx={{ height: "auto" }}>
                        <TableCell style={{ padding: 0 }} colSpan={9}>
                          <Collapse in={expandedRow === row.qrCodeNumber} timeout="auto" unmountOnExit>
                            <Box
                              sx={{
                                width: "100%",
                                backgroundColor: "#F8FAFC",
                                borderTop: "1px solid #EAECF0",
                                borderBottom: "1px solid #EAECF0",
                              }}
                            >
                              <Table size="small" sx={{ width: "100%" }}>
                                <TableHead>
                                  <TableRow sx={{ backgroundColor: "#F2F4F7" }}>
                                    {[
                                      "Consumed in Part",
                                      "Status",
                                      "IR Number",
                                      "MSN Number",
                                      "MRIR Number",
                                      "Disposition",
                                      "Username",
                                      "Created Date",
                                    ].map((subCol) => (
                                      <TableCell
                                        key={subCol}
                                        align={subCol === "Consumed in Part" ? "left" : "center"}
                                        sx={{
                                          fontWeight: 700,
                                          color: "#344054",
                                          fontSize: "0.75rem",
                                          py: 1,
                                          px: 1,
                                          borderBottom: "1px solid #EAECF0",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {subCol}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  <TableRow sx={{ backgroundColor: "#FFFFFF" }}>
                                    <TableCell sx={{ fontSize: "0.75rem", color: "#475467", py: 1, px: 1, whiteSpace: "nowrap" }}>
                                      {row.consumedInDrawing || "-"}
                                    </TableCell>
                                    <TableCell align="center" sx={{ py: 1, px: 1 }}>
                                      <Chip
                                        label={row.qrCodeStatus || "N/A"}
                                        size="small"
                                        color={
                                          row.qrCodeStatus?.toLowerCase() === "available"
                                            ? "success"
                                            : "default"
                                        }
                                        variant="outlined"
                                        sx={{ height: 20, fontSize: "0.7rem", fontWeight: 600 }}
                                      />
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontSize: "0.75rem", color: "#475467", py: 1, px: 1, whiteSpace: "nowrap" }}>
                                      {row.irNumber || "-"}
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontSize: "0.75rem", color: "#475467", py: 1, px: 1, whiteSpace: "nowrap" }}>
                                      {row.msnNumber || "-"}
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontSize: "0.75rem", color: "#475467", py: 1, px: 1, whiteSpace: "nowrap" }}>
                                      {row.mrirNumber || "-"}
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontSize: "0.75rem", color: "#475467", py: 1, px: 1, whiteSpace: "nowrap" }}>
                                      {row.desposition || "-"}
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontSize: "0.75rem", color: "#475467", py: 1, px: 1, whiteSpace: "nowrap" }}>
                                      {row.users || "-"}
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontSize: "0.75rem", color: "#475467", py: 1, px: 1, whiteSpace: "nowrap" }}>
                                      {row.createdDate ? formatDate(row.createdDate) : "-"}
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
                  <EmptyState colSpan={9} title="Scan QR to see results" height={100} />
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* 4. "Awaiting precheck" Table Section */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: "12px",
            border: "1px solid #EAECF0",
            backgroundColor: "#ffffff",
            overflow: "hidden",
            mb: 2,
            boxShadow: "0 1px 3px rgba(16, 24, 40, 0.05)",
          }}
        >
          {/* Card Header */}
          <Box
            sx={{
              p: 2,
              borderBottom: "1px solid #EAECF0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <Typography
                variant="h6"
                sx={{ fontSize: "0.875rem", fontWeight: 600, color: "primary.main" }}
              >
                Awaiting precheck
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#667085", fontSize: "0.8rem", fontWeight: 500 }}
              >
                {storeInList.length} orders
              </Typography>
            </Box>
          </Box>

          {/* Filter Controls Bar */}
          <Box
            sx={{
              pt: 0.5,
              px: 1,
              pb: 0.5,
              borderBottom: "1px solid #EAECF0",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-end",
                gap: 1,
                flexWrap: "nowrap",
                width: "100%",
                overflowX: "auto",
                overflowY: "hidden",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                pt: 1.5,
                pb: 0.5,
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              <TextField
                size="small"
                placeholder="Search PO, Part Number, ID Number..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "#98A2B3", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSearchTerm("");
                          setPage(0);
                        }}
                        edge="end"
                        sx={{ p: 0.25, color: "#98A2B3", "&:hover": { color: "#344054" } }}
                      >
                        <ClearIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
                sx={{
                  flex: "1 1 340px",
                  minWidth: 260,
                }}
              />

              <MultiSelectFilter
                label="Prod Series"
                value={selectedSeries}
                options={seriesOptions}
                onChange={(newValue) => setSelectedSeries(newValue)}
                flex="0 0 150px"
                minWidth={120}
              />

              <FormControl size="small" sx={{ flex: "0 0 120px", minWidth: 100 }}>
                <Select
                  displayEmpty
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setPage(0);
                  }}
                  sx={{ fontSize: "0.82rem", height: 38 }}
                  renderValue={(val) =>
                    val ? (
                      <Typography sx={{ fontSize: "0.82rem", color: "#344054", fontWeight: 600 }}>
                        {val}
                      </Typography>
                    ) : (
                      <Typography sx={{ fontSize: "0.82rem", color: "#98A2B3" }}>
                        Status
                      </Typography>
                    )
                  }
                >
                  <MenuItem value="">
                    <em style={{ fontSize: "0.82rem" }}>All Statuses</em>
                  </MenuItem>
                  <MenuItem value="Pending" sx={{ fontSize: "0.82rem" }}>
                    Pending
                  </MenuItem>
                  <MenuItem value="Partial" sx={{ fontSize: "0.82rem" }}>
                    Partial
                  </MenuItem>
                </Select>
              </FormControl>

              {/* From Date */}
              <TextField
                size="small"
                type={fromDateFocused || Boolean(fromDate) ? "date" : "text"}
                label="From Date"
                InputLabelProps={{ shrink: Boolean(fromDateFocused || fromDate) }}
                value={fromDate ? format(fromDate, "yyyy-MM-dd") : ""}
                onFocus={() => setFromDateFocused(true)}
                onBlur={() => setFromDateFocused(false)}
                onChange={(e) => {
                  const val = e.target.value;
                  setFromDate(val ? new Date(val) : null);
                  setPage(0);
                }}
                inputProps={{ title: "From Date" }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end" sx={{ cursor: "pointer" }}>
                      <CalendarTodayIcon
                        sx={{ fontSize: 16, color: "#667085" }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setFromDateFocused(true);
                          const root = e.currentTarget.closest(".MuiInputBase-root") as HTMLElement;
                          const input = root?.querySelector("input") as HTMLInputElement | null;
                          if (input) {
                            input.type = "date";
                            input.focus();
                            setTimeout(() => {
                              if ("showPicker" in input) {
                                try { (input as any).showPicker(); } catch { }
                              }
                            }, 10);
                          }
                        }}
                        onClick={(e) => {
                          setFromDateFocused(true);
                          const root = e.currentTarget.closest(".MuiInputBase-root") as HTMLElement;
                          const input = root?.querySelector("input") as HTMLInputElement | null;
                          if (input) {
                            input.type = "date";
                            input.focus();
                            setTimeout(() => {
                              if ("showPicker" in input) {
                                try { (input as any).showPicker(); } catch { }
                              }
                            }, 10);
                          }
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  flex: "0 0 148px",
                  minWidth: 140,
                  position: "relative",
                  "& .MuiOutlinedInput-root": {
                    height: 38,
                    backgroundColor: "background.paper",
                    borderRadius: "6px",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#D0D5DD" },
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: "0.82rem",
                    bgcolor: "#ffffff",
                    px: 0.5,
                    color: "#98A2B3",
                    "&.MuiInputLabel-shrink": {
                      fontSize: "0.75rem",
                      color: "#667085",
                    },
                    "&.Mui-focused": { color: "primary.main" },
                  },
                  "& .MuiOutlinedInput-input": {
                    py: "8.5px",
                    px: 1.5,
                    fontSize: "0.82rem",
                    color: fromDate ? "#344054" : "#98A2B3",
                  },
                  "& input::-webkit-calendar-picker-indicator": {
                    position: "absolute",
                    right: 8,
                    top: 8,
                    width: 24,
                    height: 24,
                    opacity: 0,
                    cursor: "pointer",
                  },
                }}
              />

              {/* To Date */}
              <TextField
                size="small"
                type={toDateFocused || Boolean(toDate) ? "date" : "text"}
                label="To Date"
                InputLabelProps={{ shrink: Boolean(toDateFocused || toDate) }}
                value={toDate ? format(toDate, "yyyy-MM-dd") : ""}
                onFocus={() => setToDateFocused(true)}
                onBlur={() => setToDateFocused(false)}
                onChange={(e) => {
                  const val = e.target.value;
                  setToDate(val ? new Date(val) : null);
                  setPage(0);
                }}
                inputProps={{ title: "To Date" }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end" sx={{ cursor: "pointer" }}>
                      <CalendarTodayIcon
                        sx={{ fontSize: 16, color: "#667085" }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setToDateFocused(true);
                          const root = e.currentTarget.closest(".MuiInputBase-root") as HTMLElement;
                          const input = root?.querySelector("input") as HTMLInputElement | null;
                          if (input) {
                            input.type = "date";
                            input.focus();
                            setTimeout(() => {
                              if ("showPicker" in input) {
                                try { (input as any).showPicker(); } catch { }
                              }
                            }, 10);
                          }
                        }}
                        onClick={(e) => {
                          setToDateFocused(true);
                          const root = e.currentTarget.closest(".MuiInputBase-root") as HTMLElement;
                          const input = root?.querySelector("input") as HTMLInputElement | null;
                          if (input) {
                            input.type = "date";
                            input.focus();
                            setTimeout(() => {
                              if ("showPicker" in input) {
                                try { (input as any).showPicker(); } catch { }
                              }
                            }, 10);
                          }
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  flex: "0 0 148px",
                  minWidth: 140,
                  position: "relative",
                  "& .MuiOutlinedInput-root": {
                    height: 38,
                    backgroundColor: "background.paper",
                    borderRadius: "6px",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#D0D5DD" },
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: "0.82rem",
                    bgcolor: "#ffffff",
                    px: 0.5,
                    color: "#98A2B3",
                    "&.MuiInputLabel-shrink": {
                      fontSize: "0.75rem",
                      color: "#667085",
                    },
                    "&.Mui-focused": { color: "primary.main" },
                  },
                  "& .MuiOutlinedInput-input": {
                    py: "8.5px",
                    px: 1.5,
                    fontSize: "0.82rem",
                    color: toDate ? "#344054" : "#98A2B3",
                  },
                  "& input::-webkit-calendar-picker-indicator": {
                    position: "absolute",
                    right: 8,
                    top: 8,
                    width: 24,
                    height: 24,
                    opacity: 0,
                    cursor: "pointer",
                  },
                }}
              />

              <Button
                size="small"
                variant="contained"
                onClick={() => {
                  setPage(0);
                  fetchStoreInData({ pageNumber: 0 });
                }}
                disabled={!isDropdownFilterSelected || isLoading}
                sx={{
                  flex: "0 0 auto",
                  backgroundColor: "primary.main",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  borderRadius: "6px",
                  px: 2,
                  height: 38,
                  textTransform: "none",
                  boxShadow: "none",
                  minWidth: 65,
                  "&:hover": { backgroundColor: "primary.dark", boxShadow: "none" },
                  "&.Mui-disabled": {
                    backgroundColor: "#EAECF0",
                    color: "#98A2B3",
                  },
                }}
              >
                Apply
              </Button>

              <Button
                size="small"
                variant="outlined"
                onClick={handleClearFilters}
                sx={{
                  flex: "0 0 auto",
                  color: "#667085",
                  borderColor: "#D0D5DD",
                  backgroundColor: "#ffffff",
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  height: 38,
                  px: 1.5,
                  minWidth: 55,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "#98A2B3",
                    backgroundColor: "#F9FAFB",
                    color: "#101828",
                  },
                }}
              >
                Clear
              </Button>
            </Box>

            {/* Active Chips Row */}
            {activeChips.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mt: 1,
                  pt: 0.75,
                  borderTop: "1px solid #F2F4F7",
                  flexWrap: "wrap",
                  gap: 0.75,
                }}
              >
                {activeChips.map((chip) => (
                  <Chip
                    key={chip.id}
                    label={chip.label}
                    onDelete={chip.onRemove}
                    size="small"
                    sx={{
                      backgroundColor: "#F2F4F7",
                      color: "#344054",
                      fontWeight: 600,
                      fontSize: "0.775rem",
                      height: 24,
                      borderRadius: "14px",
                      border: "1px solid #E9EAEB",
                    }}
                  />
                ))}
                <Button
                  variant="text"
                  size="small"
                  onClick={handleClearFilters}
                  sx={{
                    color: "#6D2A8F",
                    fontWeight: 600,
                    fontSize: "0.775rem",
                    textTransform: "none",
                    p: 0,
                  }}
                >
                  Clear all
                </Button>
              </Box>
            )}
          </Box>

          {/* Table */}
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ height: 42 }}>
                  {[
                    "S.No.",
                    "Part Number",
                    "PO Number",
                    "Prod Series",
                    "ID Number",
                    "Quantity",
                    "Project Number",
                    "Created By",
                    "Created Date",
                    "Precheck Status",
                    "Action",
                  ].map((col) => (
                    <TableCell
                      key={col}
                      align={
                        col === "S.No." ||
                          col === "Quantity" ||
                          col === "Precheck Status" ||
                          col === "Action"
                          ? "center"
                          : "left"
                      }
                      sx={{
                        fontWeight: 700,
                        backgroundColor: "#F9FAFB",
                        color: "#475467",
                        fontSize: "0.8rem",
                        borderBottom: "1px solid #EAECF0",
                        py: 1,
                        px: 1.5,
                      }}
                    >
                      {col === "PO Number" ? (
                        <Tooltip title="Production Order Number" arrow placement="bottom">
                          <span>{col}</span>
                        </Tooltip>
                      ) : (
                        col
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : storeInList.length > 0 ? (
                  storeInList.map((row, index) => (
                    <TableRow
                      key={index}
                      hover
                      sx={{
                        height: 44,
                        "&:hover": { backgroundColor: "#F9FAFB" },
                        "& td": { borderBottom: "1px solid #F2F4F7", fontSize: "0.775rem" },
                      }}
                    >
                      <TableCell align="center">
                        {page * rowsPerPage + index + 1}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#101828" }}>
                        {row.drawingNumber}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {row.productionOrderNumber}
                      </TableCell>
                      <TableCell>{row.productionSeries}</TableCell>
                      <TableCell>{row.idNumber}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        {formatQuantity(row.quantity)}
                      </TableCell>
                      <TableCell>{row.projectNumber}</TableCell>
                      <TableCell>{row.createdByName}</TableCell>
                      <TableCell>{formatDate(row.createdDate)}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={row.precheckStatus || "Pending"}
                          size="small"
                          sx={{
                            backgroundColor: "#F0F9FF",
                            color: "#026AA2",
                            fontWeight: 700,
                            fontSize: "0.725rem",
                            height: 22,
                            borderRadius: "16px",
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip
                          title={!hasMakeAccess ? "You do not have access to make precheck" : ""}
                          arrow
                        >
                          <span>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() =>
                                navigate("/verification/parts", { state: row })
                              }
                              disabled={!hasMakeAccess}
                              sx={{
                                borderColor: "#6D2A8F",
                                color: "#6D2A8F",
                                fontWeight: 600,
                                fontSize: "0.775rem",
                                borderRadius: "6px",
                                py: 0.25,
                                px: 1.5,
                                height: 28,
                                textTransform: "none",
                                "&:hover": {
                                  borderColor: "#551F6F",
                                  backgroundColor: "#F5EEF8",
                                },
                              }}
                            >
                              Part Verification
                            </Button>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <EmptyState
                    colSpan={11}
                    title={hasAnyFilter || storeInList.length > 0 ? "No Matching Records found" : "Scan QR code to see results"}
                  />
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <CustomPagination
            totalCount={storeInList.length}
            page={page}
            pageSize={rowsPerPage}
            onPageChange={(newPage) => {
              setPage(newPage);
              fetchStoreInData({ pageNumber: newPage });
            }}
            onPageSizeChange={(newRpp) => {
              setRowsPerPage(newRpp);
              setPage(0);
              fetchStoreInData({ pageNumber: 0, pageSize: newRpp });
            }}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </Paper>
      </Box>



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
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
          <PhotoCameraIcon color="primary" />
          <Typography variant="h6" fontWeight="600">
            Camera Access
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <DialogContentText sx={{ color: "text.primary", fontSize: "0.95rem" }}>
            To scan QR codes, we need your permission to access the camera. Would you like to allow access?
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

          {!scannerError && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                zIndex: 2,
              }}
            >
              {[
                { top: 0, left: 0, borderTop: "3px solid #4FC3F7", borderLeft: "3px solid #4FC3F7", borderRadius: "12px 0 0 0" },
                { top: 0, right: 0, borderTop: "3px solid #4FC3F7", borderRight: "3px solid #4FC3F7", borderRadius: "0 12px 0 0" },
                { bottom: 0, left: 0, borderBottom: "3px solid #4FC3F7", borderLeft: "3px solid #4FC3F7", borderRadius: "0 0 0 12px" },
                { bottom: 0, right: 0, borderBottom: "3px solid #4FC3F7", borderRight: "3px solid #4FC3F7", borderRadius: "0 0 12px 0" },
              ].map((style, i) => (
                <Box
                  key={i}
                  sx={{
                    position: "absolute",
                    width: 36,
                    height: 36,
                    ...(style.top !== undefined && { top: `calc(50% - 120px + ${style.top}px)` }),
                    ...(style.bottom !== undefined && { bottom: `calc(50% - 120px + ${style.bottom}px)` }),
                    ...(style.left !== undefined && { left: `calc(50% - 120px + ${style.left}px)` }),
                    ...(style.right !== undefined && { right: `calc(50% - 120px + ${style.right}px)` }),
                    borderTop: style.borderTop,
                    borderBottom: style.borderBottom,
                    borderLeft: style.borderLeft,
                    borderRight: style.borderRight,
                    borderRadius: style.borderRadius,
                  }}
                />
              ))}

              <Box
                sx={{
                  position: "absolute",
                  left: "calc(50% - 116px)",
                  width: "232px",
                  height: "2px",
                  background: "linear-gradient(90deg, transparent, #4FC3F7 30%, #29B6F6 50%, #4FC3F7 70%, transparent)",
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

          {/* Top Bar */}
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
              background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)",
            }}
          >
            <IconButton onClick={() => setOpenScanner(false)} sx={{ color: "#fff" }}>
              <CloseIcon />
            </IconButton>
            <Typography variant="subtitle1" sx={{ color: "#fff", fontWeight: 600, ml: 1 }}>
              Scan QR Code
            </Typography>
          </Box>

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
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
                Starting camera...
              </Typography>
            </Box>
          )}

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
              <PhotoCameraIcon sx={{ fontSize: 56, color: "rgba(255,255,255,0.3)", mb: 2 }} />
              <Alert severity="error" sx={{ mb: 3, maxWidth: 340 }}>
                {scannerError}
              </Alert>
              <Button
                variant="contained"
                onClick={() => setOpenScanner(false)}
                sx={{ borderRadius: 6, px: 4, textTransform: "none", fontWeight: 600 }}
              >
                Close
              </Button>
            </Box>
          )}

          {uploadError && (
            <Box sx={{ position: "absolute", top: 64, left: 16, right: 16, zIndex: 12 }}>
              <Alert
                severity="error"
                onClose={() => setUploadError(null)}
                sx={{ borderRadius: 2, boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}
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
              background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
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
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadInProgress}
                  sx={{
                    color: "rgba(255,255,255,0.8)",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    width: 56,
                    height: 56,
                    border: "2px solid rgba(255,255,255,0.25)",
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
                  }}
                >
                  {uploadInProgress ? (
                    <CircularProgress size={24} sx={{ color: "#4FC3F7" }} />
                  ) : (
                    <UploadFileIcon sx={{ fontSize: 26 }} />
                  )}
                </IconButton>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.65rem" }}>
                  Upload from device
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                <IconButton
                  onClick={handleCameraFlip}
                  sx={{
                    color: "rgba(255,255,255,0.8)",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    width: 48,
                    height: 48,
                  }}
                >
                  {facingMode === "environment" ? <CameraFrontIcon /> : <CameraRearIcon />}
                </IconButton>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.65rem" }}>
                  Flip
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                <IconButton
                  onClick={handleTorchToggle}
                  sx={{
                    color: "rgba(255,255,255,0.8)",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    width: 48,
                    height: 48,
                  }}
                >
                  {torchOn ? <FlashOnIcon /> : <FlashOffIcon />}
                </IconButton>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.65rem" }}>
                  Torch
                </Typography>
              </Box>
            </Box>
          </Box>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleScanFileUpload}
          />
          <Box
            id="qr-reader-file-store-in"
            sx={{ visibility: "hidden", position: "absolute", width: 0, height: 0 }}
          />
        </Box>
      </Dialog>
    </Box>
  );
};

export default StoreIn;
