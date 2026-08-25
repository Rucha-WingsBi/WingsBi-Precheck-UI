import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { Html5Qrcode } from "html5-qrcode";
import * as XLSX from "xlsx";
import type { AppDispatch } from "../../../store/store";
import { getBarcodeDetails } from "../../../store/slices/qrcodeSlice";
import { makePrecheckFromExcel, downloadBulkPrecheckTemplate } from "../../../store/slices/precheckSlice";
import type { GridItem } from "./types";

interface UsePrecheckScanningProps {
  searchResults: GridItem[];
  setSearchResults: React.Dispatch<React.SetStateAction<GridItem[]>>;
  user: any;
  showAlertMessage: (
    message: string,
    severity?: "success" | "error" | "info" | "warning"
  ) => void;
  setBatchWarningOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onExcelUploadSuccess?: () => void;
}

export const usePrecheckScanning = ({
  searchResults,
  setSearchResults,
  user,
  showAlertMessage,
  setBatchWarningOpen,
  onExcelUploadSuccess,
}: UsePrecheckScanningProps) => {
  const dispatch = useDispatch<AppDispatch>();

  // QR Code scanner state
  const [barcodeText, setBarcodeText] = useState("");

  // Quantity dialog state
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false);
  const [maxQuantity, setMaxQuantity] = useState(0);
  const [selectedQuantity, setSelectedQuantity] = useState(0);
  const [pendingBarcodeData, setPendingBarcodeData] = useState<any>(null);
  const [selectedQuantityItem, setSelectedQuantityItem] =
    useState<GridItem | null>(null);

  // Scanner state
  const [openScanner, setOpenScanner] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const excelFileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [excelUploadResult, setExcelUploadResult] = useState<any>(null);
  const [excelResultDialogOpen, setExcelResultDialogOpen] = useState(false);
  const [downloadTemplateInProgress, setDownloadTemplateInProgress] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [scannerReady, setScannerReady] = useState(false);
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<string>("unknown");
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

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

  const updateGridItem = (
    qrCodeDetails: any,
    matchingItem: any,
    quantity: number,
    serverRemQty?: number
  ) => {
    // Get username from Redux auth state (which comes from JWT token)
    const currentUsername = user?.username || "Current User";

    setSearchResults((prevResults) => {
      const updatedResults = [...prevResults];
      const item = { ...updatedResults[matchingItem.index] };

      // Update the item with all fields from QR code details
      item.qrCode = qrCodeDetails.qrCodeNumber;
      item.isPrecheckComplete = false;
      item.isUpdated = true;
      if (item.componentType?.toUpperCase() === "BATCH" || item.componentType?.toUpperCase() === "FIM") {
        item.isSubmitted = false;
      }
      item.ir = qrCodeDetails.irNumber;
      item.msn = qrCodeDetails.msnNumber;
      item.idNumber = qrCodeDetails.idNumber;

      // Subtract scanned quantity from remainingQuantity or use server value
      const currentRemQty = item.remainingQuantity ?? item.quantity ?? 0;
      const newRemQty =
        serverRemQty !== undefined
          ? serverRemQty
          : Math.max(0, currentRemQty - quantity);

      // Track the quantity being scanned/assigned
      item.scannedQuantity = quantity;

      // Update remainingQuantity, but preserve original BOM quantity
      item.remainingQuantity = newRemQty;

      // If remainingQuantity === 0, set isPrecheckComplete = true
      if (newRemQty === 0) {
        item.isPrecheckComplete = true;
      }

      item.componentType = qrCodeDetails.componentType;
      item.mrirNumber = qrCodeDetails.mrirNumber;
      item.remarks = qrCodeDetails.remark;
      item.username = currentUsername;
      item.modifiedDate = new Date().toISOString();
      item.productionOrderNumber =
        qrCodeDetails.productionOrderNumber ||
        qrCodeDetails.poNumber ||
        qrCodeDetails.productionOrder ||
        item.productionOrderNumber ||
        "NA";
      item.projectNumber = qrCodeDetails.projectNumber || "NA";
      item.disposition = qrCodeDetails.desposition || "NA";
      item.unit = qrCodeDetails.unit || item.unit || "1";

      console.log("Updated Grid Item:", item);
      updatedResults[matchingItem.index] = item;

      // Show success message with scan time
      const scanTime = formatDate(new Date().toISOString());
      showAlertMessage(`QR Code scanned successfully at ${scanTime}!`, "success");

      // Check if all items are processed
      const unprocessedItems = updatedResults.filter(
        (x) => !x.isPrecheckComplete && !x.isUpdated
      );

      if (unprocessedItems.length === 0) {
        showAlertMessage("All components have been pre-checked!", "info");
      }

      return updatedResults;
    });
  };

  const processBarcodeAsync = async (barcode: string) => {
    try {
      // Call the getBarcodeDetails API
      const qrCodeDetails = await dispatch(getBarcodeDetails(barcode)).unwrap();

      if (!qrCodeDetails) {
        showAlertMessage("Invalid QR code or no data found", "error");
        return;
      }

      console.log("QR Code Details:", qrCodeDetails);

      // Batch available check
      if (qrCodeDetails.batchAvailable === true) {
        setBatchWarningOpen(true);
        return;
      }

      // Check QR code status first - using the statusId from API
      if (
        qrCodeDetails.qrCodeStatusId === 3 ||
        qrCodeDetails.qrCodeStatus?.toLowerCase() === "qrcodegenerated"
      ) {
        showAlertMessage(
          "Component not stored in. QR code is generated but not ready for consumption.",
          "warning"
        );
        return;
      }

      if (
        qrCodeDetails.qrCodeStatusId === 2 ||
        qrCodeDetails.qrCodeStatus?.toLowerCase() === "consumed"
      ) {
        showAlertMessage(
          "This QR code has already been consumed and cannot be used again.",
          "error"
        );
        return;
      }

      // Only proceed if status is 1 (Available)
      if (
        qrCodeDetails.qrCodeStatusId !== 1 &&
        qrCodeDetails.qrCodeStatus?.toLowerCase() !== "available"
      ) {
        showAlertMessage("Invalid QR code status.", "error");
        return;
      }

      // Find potential matches with the same DrawingNumberId
      const potentialMatches = searchResults
        .map((item, index) => ({ item, index }))
        .filter(
          (x) => x.item.drawingNumberId === qrCodeDetails.drawingNumberId
        );

      console.log("Potential Matches:", potentialMatches);

      // If no matching DrawingNumberId found, show message and return
      if (!potentialMatches.length) {
        showAlertMessage(
          `No components found with drawing number ${qrCodeDetails.drawingNumber}.`,
          "info"
        );
        return;
      }

      // Check for ID component type
      if (
        potentialMatches.some(
          (x) => x.item.componentType?.toUpperCase() === "ID"
        )
      ) {
        const idAlreadyAssigned = searchResults.some(
          (item) =>
            item.idNumber === qrCodeDetails.idNumber &&
            item.drawingNumberId === qrCodeDetails.drawingNumberId
        );

        if (idAlreadyAssigned) {
          showAlertMessage(
            `ID ${qrCodeDetails.idNumber} has already been assigned to a component with drawing number ${qrCodeDetails.drawingNumber}.`,
            "warning"
          );
          return;
        }
      }

      // Find the first unprocessed item from potential matches
      // First pass: Look for a completely untouched row
      let matchingItem = potentialMatches.find((x) => {
        const isBatchOrFim = x.item.componentType?.toUpperCase() === "BATCH" || x.item.componentType?.toUpperCase() === "FIM";
        return (
          !x.item.isPrecheckComplete &&
          !x.item.isUpdated &&
          !x.item.idNumber &&
          (isBatchOrFim
            ? (x.item.remainingQuantity ?? x.item.quantity ?? 0) > 0
            : true)
        );
      });

      // Second pass: If no untouched row found, and it's a BATCH, allow matching an already updated row with remaining quantity
      if (!matchingItem) {
        matchingItem = potentialMatches.find((x) => {
          const isBatchOrFim = x.item.componentType?.toUpperCase() === "BATCH" || x.item.componentType?.toUpperCase() === "FIM";
          return (
            isBatchOrFim &&
            !x.item.isPrecheckComplete &&
            (x.item.remainingQuantity ?? x.item.quantity ?? 0) > 0
          );
        });
      }

      if (matchingItem) {
        if (qrCodeDetails.componentType?.toUpperCase() !== "ID") {
          const qrCodeQty =
            qrCodeDetails.remainingQuantity ?? qrCodeDetails.quantity ?? 0;
          const neededQty =
            matchingItem.item.remainingQuantity ??
            matchingItem.item.quantity ??
            0;

          // For the scan path, max quantity is what's available in the QR code
          setMaxQuantity(qrCodeQty);
          // Default selection to the minimum of QR code qty and needed qty
          setSelectedQuantity(Math.min(qrCodeQty, neededQty));
          setPendingBarcodeData({ qrCodeDetails, matchingItem });
          setQuantityDialogOpen(true);
        } else {
          // For ID type, use the quantity from qrCodeDetails
          updateGridItem(
            qrCodeDetails,
            matchingItem,
            qrCodeDetails.quantity || 0
          );
          showAlertMessage(
            "Component details updated successfully.",
            "success"
          );
        }
      } else {
        // No unprocessed row found
        const totalMatchingItems = potentialMatches.length;
        const processedMatchingItems = potentialMatches.filter(
          (x) =>
            x.item.isPrecheckComplete || x.item.isUpdated || x.item.idNumber
        ).length;

        if (
          totalMatchingItems > 0 &&
          processedMatchingItems === totalMatchingItems
        ) {
          showAlertMessage(
            `All components with drawing number ${qrCodeDetails.drawingNumber} have already been processed.`,
            "info"
          );
        } else {
          showAlertMessage(
            "No matching unprocessed component found for the scanned barcode.",
            "info"
          );
        }
      }
    } catch (error: any) {
      console.error("Error processing barcode:", error);

      // Extract user-friendly error message from API response
      let errorMessage = "Error processing QR code";

      if (error?.payload) {
        errorMessage = error.payload;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      showAlertMessage(
        `Error processing QR Code ${barcode}: ${errorMessage}`,
        "error"
      );
    }
  };

  const handleScanFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadError(null);
    setUploadInProgress(true);

    const html5QrCode = new Html5Qrcode("qr-reader-file");

    try {
      let decodedText: string | undefined;

      try {
        const result = await html5QrCode.scanFileV2(file, false);
        decodedText = result?.decodedText;
      } catch (scanV2Error: any) {
        console.warn(
          "scanFileV2 failed, falling back to scanFile:",
          scanV2Error
        );
        try {
          decodedText = await html5QrCode.scanFile(file, false);
        } catch (scanError: any) {
          console.error("scanFile fallback failed:", scanError);
          throw scanError;
        }
      }

      if (decodedText && decodedText.trim()) {
        setBarcodeText(decodedText.trim());
        setOpenScanner(false);
        showAlertMessage("QR Code uploaded and scanned successfully!", "success");
      } else {
        const errorMsg = "Unable to read QR code from the selected image.";
        setUploadError(errorMsg);
        showAlertMessage(errorMsg, "error");
      }
    } catch (error: any) {
      console.error("File scan error:", error);
      const errorMsg =
        error?.message || "Unable to read QR code from the selected image.";
      setUploadError(errorMsg);
      showAlertMessage(errorMsg, "error");
    } finally {
      setUploadInProgress(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadInProgress(true);
    showAlertMessage("Uploading Excel file...", "info");

    try {
      const response = await dispatch(makePrecheckFromExcel(file)).unwrap();
      console.log("Excel upload response:", response);

      // Store the response and open result dialog
      if (response && response.totalRows !== undefined) {
        setExcelUploadResult(response);
        setExcelResultDialogOpen(true);

        // Show appropriate alert based on results
        if (response.failedCount > 0 && response.successCount > 0) {
          showAlertMessage(
            `Excel upload: ${response.successCount} succeeded, ${response.failedCount} failed out of ${response.totalRows} rows.`,
            "warning"
          );
        } else if (response.failedCount > 0) {
          showAlertMessage(
            `Excel upload: All ${response.failedCount} rows failed.`,
            "error"
          );
        } else {
          showAlertMessage(
            `Excel upload: All ${response.successCount} rows processed successfully!`,
            "success"
          );
        }
      } else {
        showAlertMessage("Excel precheck processed successfully!", "success");
      }

      if (onExcelUploadSuccess) {
        onExcelUploadSuccess();
      }
    } catch (err: any) {
      console.error("Error processing Excel:", err);
      showAlertMessage(err || "Error processing Excel file", "error");
    } finally {
      setUploadInProgress(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleDownloadTemplate = async () => {
    setDownloadTemplateInProgress(true);
    showAlertMessage("Downloading template...", "info");
    try {
      await dispatch(downloadBulkPrecheckTemplate()).unwrap();
      showAlertMessage("Template downloaded successfully!", "success");
    } catch (err: any) {
      console.error("Error downloading template:", err);
      showAlertMessage(err || "Error downloading template", "error");
    } finally {
      setDownloadTemplateInProgress(false);
    }
  };

  const handleBarcodeChange = (value: string) => {
    setBarcodeText(value);
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      (barcodeText.length === 12 || barcodeText.length === 15) &&
      /^\d+$/.test(barcodeText)
    ) {
      processBarcodeAsync(barcodeText);
      setBarcodeText("");
    }
  };

  // Smart QR Code processing logic
  useEffect(() => {
    if (!barcodeText) return;

    // Only process if it's numeric and matches target lengths
    const isNumeric = /^\d+$/.test(barcodeText);
    if (!isNumeric) return;

    if (barcodeText.length === 15) {
      // Process 15-digit codes immediately
      processBarcodeAsync(barcodeText);
      setBarcodeText("");
    } else if (barcodeText.length === 12) {
      // Process 12-digit codes after a 2000ms delay to allow manual 15-digit entry
      const timer = setTimeout(() => {
        processBarcodeAsync(barcodeText);
        setBarcodeText("");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [barcodeText]);

  // Modern QR Code Scanner Effect — uses Html5Qrcode directly for camera control
  useEffect(() => {
    if (!openScanner) return;

    setScannerReady(false);
    setScannerError(null);

    const timer = setTimeout(async () => {
      try {
        const qr = new Html5Qrcode("qr-reader-video", false);
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
            setBarcodeText(decodedText);
            setOpenScanner(false);
          },
          () => {}
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

  // Check camera permission status on mount
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

  const handleCameraFlip = useCallback(() => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }, []);

  const handleQuantityConfirm = (quantity: number) => {
    if (pendingBarcodeData) {
      const { qrCodeDetails, matchingItem } = pendingBarcodeData;
      updateGridItem(qrCodeDetails, matchingItem, quantity);
      setPendingBarcodeData(null);
    } else if (selectedQuantityItem) {
      const currentRemQty =
        selectedQuantityItem.remainingQuantity ??
        selectedQuantityItem.quantity ??
        0;
      const newRemQty = Math.max(0, currentRemQty - quantity);

      setSearchResults((prev) =>
        prev.map((item) => {
          if (item === selectedQuantityItem) {
            return {
              ...item,
              remainingQuantity: newRemQty,
              scannedQuantity: quantity,
              isUpdated: true,
              isSubmitted:
                (item.componentType?.toUpperCase() === "BATCH" || item.componentType?.toUpperCase() === "FIM")
                  ? false
                  : item.isSubmitted,
              isPrecheckComplete: newRemQty === 0,
            };
          }
          return item;
        })
      );
      setSelectedQuantityItem(null);
    }
    setQuantityDialogOpen(false);
  };

  return {
    // States
    barcodeText,
    quantityDialogOpen,
    maxQuantity,
    selectedQuantity,
    pendingBarcodeData,
    selectedQuantityItem,
    openScanner,
    scannerError,
    uploadInProgress,
    uploadError,
    facingMode,
    scannerReady,
    cameraPermissionStatus,
    showPermissionDialog,
    excelUploadResult,
    excelResultDialogOpen,
    downloadTemplateInProgress,
    // Refs
    fileInputRef,
    excelFileInputRef,
    // Setters
    setBarcodeText,
    setOpenScanner,
    setUploadError,
    setShowPermissionDialog,
    setQuantityDialogOpen,
    setPendingBarcodeData,
    setSelectedQuantityItem,
    setExcelResultDialogOpen,
    // Handlers
    handleBarcodeChange,
    handleBarcodeKeyDown,
    handleOpenScanner,
    handleCameraFlip,
    handleRequestPermission,
    handleScanFileUpload,
    handleExcelUpload,
    handleQuantityConfirm,
    processBarcodeAsync,
    handleDownloadTemplate,
  };
};
