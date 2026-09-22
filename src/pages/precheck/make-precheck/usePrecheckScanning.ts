import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { Html5Qrcode } from "html5-qrcode";
import type { AppDispatch } from "../../../store/store";
import { getBarcodeDetails } from "../../../store/slices/qrcodeSlice";
import {
  makePrecheckFromExcel,
  downloadBulkPrecheckTemplate,
  viewPrecheckDetails,
  remainingPrecheck,
} from "../../../store/slices/precheckSlice";
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
  onAutoSubmit?: (updatedResults?: GridItem[]) => void;
  /** Form-level context required for the ViewPrecheck duplicate-QR check */
  selectedDrawingId?: number;
  selectedProductionSeriesId?: number;
  selectedIdNumber?: string;
  selectedProductionOrderNumber?: string;
}

export const usePrecheckScanning = ({
  searchResults,
  setSearchResults,
  user,
  showAlertMessage,
  setBatchWarningOpen,
  onExcelUploadSuccess,
  onAutoSubmit,
  selectedDrawingId,
  selectedProductionSeriesId,
  selectedIdNumber,
  selectedProductionOrderNumber,
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
  ): GridItem[] => {
    // Get username from Redux auth state (which comes from JWT token)
    const currentUsername = user?.username || "Current User";

    const updatedResults = [...searchResults];
    if (!matchingItem || matchingItem.index < 0 || matchingItem.index >= updatedResults.length) {
      return updatedResults;
    }

    const item = { ...updatedResults[matchingItem.index] };

    // Update the item with all fields from QR code details
    item.qrCode = qrCodeDetails.qrCodeNumber;
    item.isPrecheckComplete = false;
    item.isUpdated = true;
    item.isSubmitted = false;
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

    setSearchResults(updatedResults);
    return updatedResults;
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

      // Helper to check if a grid row or API record matches the scanned drawing
      const isMatchingDrawing = (item: any) => {
        if (item.drawingNumberId != null && qrCodeDetails.drawingNumberId != null) {
          if (Number(item.drawingNumberId) === Number(qrCodeDetails.drawingNumberId)) {
            return true;
          }
        }
        const dwgA = String(item.drawingNumber || item.drawingNo || "").trim().toLowerCase();
        const dwgB = String(qrCodeDetails.drawingNumber || "").trim().toLowerCase();
        if (dwgA !== "" && dwgB !== "" && dwgA === dwgB) {
          return true;
        }
        return false;
      };

      // Find potential matches with the same Drawing Number
      const potentialMatches = searchResults
        .map((item, index) => ({ item, index }))
        .filter((x) => isMatchingDrawing(x.item));

      console.log("Potential Matches:", potentialMatches);

      // If no matching DrawingNumber found, show message and return
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
            isMatchingDrawing(item)
        );

        if (idAlreadyAssigned) {
          showAlertMessage(
            `ID ${qrCodeDetails.idNumber} has already been assigned to a component with drawing number ${qrCodeDetails.drawingNumber}.`,
            "warning"
          );
          return;
        }
      }

      // ── BATCH / FIM / SI: ViewPrecheck-based row matching ─────────────────
      // Check Remaining Qty first: if Remaining Qty > 0, apply the new QR-based
      // logic (same QR/ID update vs different QR RemainingPrecheck row creation).
      // If Remaining Qty = 0, bypass new logic and use existing/previous scan logic.
      const QUANTITY_DIALOG_TYPES = ["BATCH", "FIM", "SI"];
      const scannedCompType = qrCodeDetails.componentType?.toUpperCase() ?? "";

      const availableRemainingQty = potentialMatches.reduce(
        (max, x) => Math.max(max, x.item.remainingQuantity ?? x.item.quantity ?? 0),
        0
      );
      const qrRemainingQty =
        qrCodeDetails.remainingQuantity ?? qrCodeDetails.quantity ?? 0;
      const hasRemainingQty = availableRemainingQty > 0 || qrRemainingQty > 0;

      if (QUANTITY_DIALOG_TYPES.includes(scannedCompType) && hasRemainingQty) {
        // Step 1: Call ViewPrecheck with the current form context
        let viewPrecheckRows: any[] = [];
        try {
          const vpResponse = await dispatch(
            viewPrecheckDetails({
              DrawingNumberId: selectedDrawingId,
              ProductionSeriesId: selectedProductionSeriesId,
              Id: selectedIdNumber ? parseInt(selectedIdNumber) : undefined,
              ProductionOrderNumber: selectedProductionOrderNumber,
            })
          ).unwrap();
          viewPrecheckRows = Array.isArray(vpResponse)
            ? vpResponse
            : vpResponse?.data || vpResponse?.items || vpResponse?.$values || [];
        } catch {
          showAlertMessage(
            "Unable to verify QR scan history. Please try again.",
            "error"
          );
          return;
        }

        // Step 2: Look for an existing row matching this QR Code & IdNumber for THIS drawing
        // (check both ViewPrecheck response and local searchResults grid state)
        const targetQrCode = String(
          qrCodeDetails.qrCodeNumber || qrCodeDetails.qrCode || ""
        );
        const targetIdNumber = String(qrCodeDetails.idNumber || "");

        const existingVPRow = viewPrecheckRows.find(
          (row: any) =>
            isMatchingDrawing(row) &&
            (String(row.qrCodeNumber || row.qrCode || "") === targetQrCode) &&
            String(row.idNumber || "") === targetIdNumber
        );

        const existingGridIdx = searchResults.findIndex(
          (r: GridItem) =>
            isMatchingDrawing(r) &&
            String(r.qrCode || "") === targetQrCode &&
            String(r.idNumber || "") === targetIdNumber
        );

        if (existingVPRow || existingGridIdx !== -1) {
          // ── Case 1: Same QR + Same IdNumber ────────────────────────────────
          // Reuse the existing row; the QuantityDialog updates its remaining qty.
          const existingPrecheckId =
            existingVPRow?.precheckDetailsId || existingVPRow?.id;
          const resolvedIdx =
            existingGridIdx !== -1
              ? existingGridIdx
              : searchResults.findIndex(
                (r) => r.precheckDetailsId === existingPrecheckId
              );
          const existingGridItem =
            resolvedIdx !== -1
              ? searchResults[resolvedIdx]
              : potentialMatches[0]?.item;
          const finalIdx =
            resolvedIdx !== -1 ? resolvedIdx : (potentialMatches[0]?.index ?? -1);

          if (existingGridItem && finalIdx >= 0) {
            const remainQty =
              existingGridItem.remainingQuantity ??
              existingVPRow?.remainingQuantity ??
              0;

            if (
              remainQty <= 0 ||
              existingGridItem.isPrecheckComplete ||
              (existingVPRow && Number(existingVPRow.remainingQuantity) <= 0)
            ) {
              showAlertMessage(
                "Precheck is already completed.",
                "warning"
              );
              return;
            }

            const qrAvailQty =
              qrCodeDetails.remainingQuantity ?? qrCodeDetails.quantity ?? 0;
            setMaxQuantity(remainQty);
            setSelectedQuantity(Math.min(remainQty, qrAvailQty));
            setPendingBarcodeData({
              qrCodeDetails,
              matchingItem: { item: existingGridItem, index: finalIdx },
              isNewRow: false,
            });
            setQuantityDialogOpen(true);
          } else {
            showAlertMessage(
              "Could not find the existing row for this QR code.",
              "error"
            );
          }
        } else {
          // Check if ANY scan details / QR code numbers have already been assigned
          // SPECIFICALLY to THIS drawing (either in DB via ViewPrecheck or in local grid)
          const hasScannedDetails =
            viewPrecheckRows.some(
              (row: any) =>
                isMatchingDrawing(row) &&
                Boolean(
                  (row.qrCodeNumber && String(row.qrCodeNumber).trim() !== "") ||
                  (row.qrCode && String(row.qrCode).trim() !== "")
                )
            ) ||
            searchResults.some(
              (row: GridItem) =>
                isMatchingDrawing(row) &&
                Boolean(row.qrCode && String(row.qrCode).trim() !== "")
            );

          if (!hasScannedDetails) {
            // ── Case 2a: First scan ever for this Drawing/ID/PO/Series ─────────
            // No QR details have been assigned yet to this drawing.
            // Assign the QR directly to the existing BOM row; do NOT call RemainingPrecheck.
            const sourceMatch = potentialMatches.find(
              (x) =>
                !x.item.isPrecheckComplete &&
                (x.item.remainingQuantity ?? x.item.quantity ?? 0) > 0
            );

            if (!sourceMatch) {
              showAlertMessage(
                "QR code is already scanned or precheck is completed.",
                "warning"
              );
              return;
            }

            const qrAvailQty =
              qrCodeDetails.remainingQuantity ?? qrCodeDetails.quantity ?? 0;
            const neededQty =
              sourceMatch.item.remainingQuantity ??
              sourceMatch.item.quantity ??
              0;
            setMaxQuantity(qrAvailQty);
            setSelectedQuantity(Math.min(qrAvailQty, neededQty));
            setPendingBarcodeData({
              qrCodeDetails,
              matchingItem: { item: sourceMatch.item, index: sourceMatch.index },
              isNewRow: false,
            });
            setQuantityDialogOpen(true);
          } else {
            // ── Case 2b: Scan details exist, but this is a DIFFERENT QR code ──
            // Call RemainingPrecheck → insert a new row → open QuantityDialog.
            const sourceMatch = potentialMatches.find(
              (x) =>
                !x.item.isPrecheckComplete &&
                (x.item.remainingQuantity ?? x.item.quantity ?? 0) > 0
            );

            if (!sourceMatch) {
              showAlertMessage(
                "QR code is already scanned or precheck is completed.",
                "warning"
              );
              return;
            }

            try {
              const remainingResult = await dispatch(
                remainingPrecheck({
                  precheckDetailsId: sourceMatch.item.precheckDetailsId || 0,
                  drawingNumberId: sourceMatch.item.drawingNumberId || qrCodeDetails.drawingNumberId || 0,
                  productionSeriesId: sourceMatch.item.prodSeriesId || qrCodeDetails.productionSeriesId || 0,
                  idNumber: qrCodeDetails.idNumber || sourceMatch.item.idNumber || "",
                  qrCodeNumber: qrCodeDetails.qrCodeNumber || qrCodeDetails.qrCode || "",
                  componentType: qrCodeDetails.componentType || sourceMatch.item.componentType || "",
                  rejectedRemarks: "",
                  duplicateRemarks: "",
                  createdBy: Number(user?.id) || 0,
                  remainingQuantity: sourceMatch.item.remainingQuantity || 0,
                })
              ).unwrap();

              const newPrecheckDetailsId = remainingResult.newPrecheckDetailsId;

              // Insert the new empty row immediately below the scanned source row
              setSearchResults((prev) => {
                let sourceIdx = prev.findIndex(
                  (r) =>
                    (r.precheckDetailsId &&
                      sourceMatch.item.precheckDetailsId &&
                      r.precheckDetailsId === sourceMatch.item.precheckDetailsId) ||
                    (r.duplicateRowId &&
                      sourceMatch.item.duplicateRowId &&
                      r.duplicateRowId === sourceMatch.item.duplicateRowId)
                );

                if (sourceIdx === -1) {
                  sourceIdx = sourceMatch.index;
                }

                const newRow: GridItem = {
                  ...sourceMatch.item,
                  qrCode: "",
                  idNumber: "",
                  ir: "",
                  msn: "",
                  mrirNumber: "",
                  remarks: "",
                  isUpdated: false,
                  isSubmitted: false,
                  isPrecheckComplete: false,
                  scannedQuantity: 0,
                  isAddDisabled: false,
                  duplicateRowId: `${Date.now()}`,
                  precheckDetailsId: newPrecheckDetailsId,
                };

                const updated = [...prev];
                if (sourceIdx >= 0 && sourceIdx < updated.length) {
                  updated[sourceIdx] = { ...updated[sourceIdx], isAddDisabled: true };
                  updated.splice(sourceIdx + 1, 0, newRow);
                } else {
                  updated.splice(sourceMatch.index + 1, 0, newRow);
                }
                return updated.map((r, i) => ({ ...r, sr: i + 1 }));
              });

              // Open QuantityDialog; new row is resolved at confirm-time (safe)
              const qrAvailQty =
                qrCodeDetails.remainingQuantity ?? qrCodeDetails.quantity ?? 0;
              const neededQty =
                sourceMatch.item.remainingQuantity ??
                sourceMatch.item.quantity ??
                0;
              setMaxQuantity(qrAvailQty);
              setSelectedQuantity(Math.min(qrAvailQty, neededQty));
              setPendingBarcodeData({
                qrCodeDetails,
                matchingItem: null,
                isNewRow: true,
                newPrecheckDetailsId,
              });
              setQuantityDialogOpen(true);
            } catch (rmError: any) {
              const errMsg =
                rmError?.payload ||
                rmError?.message ||
                "Failed to create new row";
              showAlertMessage(`Error creating new row: ${errMsg}`, "error");
            }
          }
        }
        return; // BATCH / FIM / SI fully handled — skip the code below
      }
      // ────────────────────────────────────────────────────────────────────────

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
          const updatedResults = updateGridItem(
            qrCodeDetails,
            matchingItem,
            qrCodeDetails.quantity || 0
          );
          showAlertMessage(
            "Component details updated successfully.",
            "success"
          );
          if (onAutoSubmit) {
            setTimeout(() => onAutoSubmit(updatedResults), 300);
          }
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

      const formatUserFriendlyError = (rawErr: any): string => {
        let msg = "";
        if (typeof rawErr === "string") {
          msg = rawErr;
        } else if (rawErr?.payload && typeof rawErr.payload === "string") {
          msg = rawErr.payload;
        } else if (rawErr?.response?.data?.message) {
          msg = rawErr.response.data.message;
        } else if (rawErr?.message) {
          msg = rawErr.message;
        }

        const lower = msg.toLowerCase();

        if (
          lower.includes("timeout") ||
          lower.includes("server is not responding") ||
          lower.includes("elapsed prior") ||
          lower.includes("execution query") ||
          lower.includes("execution timeout")
        ) {
          return "Server timeout occurred. Please try scanning again in a few moments.";
        }
        if (
          lower.includes("network error") ||
          lower.includes("failed to fetch") ||
          lower.includes("econnrefused")
        ) {
          return "Unable to connect to server. Please check your network connection and try again.";
        }

        return msg || "An unexpected error occurred while processing the QR code. Please try again.";
      };

      const userFriendlyMsg = formatUserFriendlyError(error);

      showAlertMessage(
        `Error processing QR Code ${barcode}: ${userFriendlyMsg}`,
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
      const { qrCodeDetails, isNewRow, newPrecheckDetailsId } = pendingBarcodeData;

      // For Case 2 (new row): resolve the inserted row by precheckDetailsId.
      // This is safe because by the time the user clicks Confirm, React has
      // already flushed the setSearchResults update that inserted the new row.
      let resolvedMatchingItem = pendingBarcodeData.matchingItem;
      if (isNewRow && newPrecheckDetailsId) {
        const newRowIndex = searchResults.findIndex(
          (r) => r.precheckDetailsId === newPrecheckDetailsId
        );
        if (newRowIndex !== -1) {
          resolvedMatchingItem = {
            item: searchResults[newRowIndex],
            index: newRowIndex,
          };
        }
      }

      if (resolvedMatchingItem) {
        const updatedResults = updateGridItem(
          qrCodeDetails,
          resolvedMatchingItem,
          quantity
        );
        setPendingBarcodeData(null);
        if (onAutoSubmit) {
          setTimeout(() => onAutoSubmit(updatedResults), 300);
        }
      } else {
        setPendingBarcodeData(null);
        showAlertMessage(
          "Could not find the target row to update. Please try scanning again.",
          "error"
        );
      }
    } else if (selectedQuantityItem) {
      const currentRemQty =
        selectedQuantityItem.remainingQuantity ??
        selectedQuantityItem.quantity ??
        0;
      const newRemQty = Math.max(0, currentRemQty - quantity);

      let updatedResults: GridItem[] = [];
      setSearchResults((prev) => {
        updatedResults = prev.map((item) => {
          if (item === selectedQuantityItem) {
            return {
              ...item,
              remainingQuantity: newRemQty,
              scannedQuantity: quantity,
              isUpdated: true,
              isSubmitted: false,
              isPrecheckComplete: newRemQty === 0,
            };
          }
          return item;
        });
        return updatedResults;
      });
      setSelectedQuantityItem(null);
      if (onAutoSubmit) {
        setTimeout(() => onAutoSubmit(updatedResults), 300);
      }
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
