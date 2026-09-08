import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import {
  Box,
  Typography,
  Alert,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  viewPrecheckDetails,
  makePrecheck,
  clearPrecheckData,
  addQRCodeDetails,
  rejectComponentMRS,
  exportPrecheckDetails,
  remainingPrecheck,
  setHasPendingScans,
  resetQrQuantity,
  deletePrecheckDetails,
  removePrecheckDetails,
} from "../../store/slices/precheckSlice";
import {
  getBarcodeDetails,
  updateQrCodeDetails,
} from "../../store/slices/qrcodeSlice";
import {
  useProductionSeries,
  useDrawingNumbers,
  useLnItemCodeSearch,
  useAllDrawingNumbers,
} from "../../hooks/useMasterData";
import {
  usePONumbers,
  usePODetails,
  type ProductionOrderMaster,
} from "../../hooks/usePONumbers";
import { useDebounce } from "../../hooks/useDebounce";
import { Html5Qrcode } from "html5-qrcode";
import * as XLSX from "xlsx";

import type { RootState, AppDispatch } from "../../store/store";
import debounce from "lodash.debounce";

// Sub-component imports
import type { GridItem } from "./make-precheck/types";
import { formatDate } from "./make-precheck/utils";
import QuantityDialog from "./make-precheck/QuantityDialog";
import RejectDialog from "./make-precheck/RejectDialog";
import AddQrCodeDialog from "./make-precheck/AddQrCodeDialog";
import {
  BatchWarningDialog,
  ReloadConfirmationDialog,
  CameraPermissionDialog,
} from "./make-precheck/ConfirmationDialogs";
import QrScannerDialog from "./make-precheck/QrScannerDialog";
import PrecheckFormControls from "./make-precheck/PrecheckFormControls";
import PrecheckActionBar from "./make-precheck/PrecheckActionBar";
import PrecheckTable from "./make-precheck/PrecheckTable";
import { usePrecheckScanning } from "./make-precheck/usePrecheckScanning";
import ExcelUploadResultDialog from "./make-precheck/ExcelUploadResultDialog";
import AddBomDrawingDialog from "./make-precheck/AddBomDrawingDialog";

const MakePrecheck: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { isSidebarOpen = false } = useOutletContext<{ isSidebarOpen?: boolean }>() || {};
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Form state
  const [selectedDrawing, setSelectedDrawing] = useState<any>(null);
  const [selectedProductionSeries, setSelectedProductionSeries] =
    useState<any>(null);
  const [idNumber, setIdNumber] = useState("");
  const [drawingSearchText, setDrawingSearchText] = useState("");
  const [debouncedLnSearch, setDebouncedLnSearch] = useState("");
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<ProductionOrderMaster | null>(
    null,
  );
  const [poSearchText, setPOSearchText] = useState("");
  const debouncedPOSearch = useDebounce(poSearchText, 500);

  // Generate ID range options from selected PO
  const idOptions = useMemo(() => {
    if (
      selectedPO &&
      selectedPO.startIdNumber !== undefined
    ) {
      const start = Number(selectedPO.startIdNumber);
      if (!isNaN(start)) {
        const options = [];
        if (
          selectedPO.endIdNumber !== undefined &&
          selectedPO.endIdNumber !== null &&
          Number(selectedPO.endIdNumber) > 0
        ) {
          const end = Number(selectedPO.endIdNumber);
          if (!isNaN(end) && start <= end) {
            for (let i = start; i <= end; i++) {
              options.push(i.toString());
            }
            return options;
          }
        } else if (
          selectedPO.quantity !== undefined &&
          selectedPO.quantity !== null &&
          Number(selectedPO.quantity) > 0
        ) {
          const qty = Number(selectedPO.quantity);
          if (!isNaN(qty)) {
            for (let i = 0; i < qty; i++) {
              options.push((start + i).toString());
            }
            return options;
          }
        }
      }
    }
    return [];
  }, [selectedPO]);

  // TanStack Query Hooks
  const { data: productionSeriesData = [], isLoading: prodSeriesLoading } =
    useProductionSeries();
  const { data: drawingNumbersData = [], isLoading: drawingLoading } =
    useDrawingNumbers("", drawingSearchText);
  const { data: allDrawingNumbers = [] } = useAllDrawingNumbers();
  const { isLoading: isLnSearchLoading } =
    useLnItemCodeSearch(debouncedLnSearch);
  const { data: poNumbers = [], isLoading: poLoading } =
    usePONumbers(debouncedPOSearch);

  // Get PO details from navigation state if available
  const navigationState = location.state as any;
  const { data: navigationPODetails } = usePODetails(
    navigationState?.productionOrderNumber,
  );

  const { user } = useSelector((state: RootState) => state.auth);

  const isAdminOrHead = useMemo(() => {
    const role = user?.role?.toLowerCase() || "";
    return role === "admin" || role === "head";
  }, [user]);

  // Track original values for validation
  const [originalDrawingNumber, setOriginalDrawingNumber] = useState<
    string | null
  >(null);
  const [originalProdSeries, setOriginalProdSeries] = useState<number | null>(
    null,
  );
  const [originalAssemblyNumber, setOriginalAssemblyNumber] = useState<
    string | null
  >(null);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  // Search results
  const [searchResults, setSearchResults] = useState<GridItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [filterRemainingOnly, setFilterRemainingOnly] = useState(false);

  // Add QR Code dialog state
  const [addQrDialogOpen, setAddQrDialogOpen] = useState(false);
  const [selectedRowForAdd, setSelectedRowForAdd] = useState<GridItem | null>(
    null,
  );
  const [addQrFormData, setAddQrFormData] = useState({
    prodSeriesId: "",
    idNumber: "",
    qrCodeNumber: "",
  });
  const [qrCodeError, setQrCodeError] = useState("");
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);

  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRowForReject, setSelectedRowForReject] =
    useState<GridItem | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [duplicateRemarks, setDuplicateRemarks] = useState("");

  // Add BOM Drawing dialog state
  const [addBomDrawingOpen, setAddBomDrawingOpen] = useState(false);

  // Alert state
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState<
    "success" | "error" | "info" | "warning"
  >("info");
  const [showAlert, setShowAlert] = useState(false);

  // Sorting state
  const [orderBy, setOrderBy] = useState<string>("sr");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  // Expanded rows state
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Batch warning dialog state
  const [batchWarningOpen, setBatchWarningOpen] = useState(false);

  // Reload/Reset confirmation dialog state
  const [showReloadConfirmation, setShowReloadConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState<"reset" | "reload" | null>(
    null,
  );

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Selected row state
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  // Button states
  const [isMakePrecheckEnabled, setIsMakePrecheckEnabled] = useState(false);

  // Call scanning hook to manage all scanner/upload states and handlers
  const {
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
    fileInputRef,
    excelFileInputRef,
    setBarcodeText,
    setOpenScanner,
    setUploadError,
    setShowPermissionDialog,
    setQuantityDialogOpen,
    setPendingBarcodeData,
    setSelectedQuantityItem,
    setExcelResultDialogOpen,
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
  } = usePrecheckScanning({
    searchResults,
    setSearchResults,
    user,
    showAlertMessage,
    setBatchWarningOpen,
    onExcelUploadSuccess: () => {
      // Reload current grid if we have loaded data
      if (hasLoadedData && selectedDrawing && selectedProductionSeries && idNumber) {
        executeMakePrecheck();
      }
    },
  });

  // Debounced search functions
  const debouncedDrawingSearch = useMemo(
    () =>
      debounce((searchValue: string) => {
        setDrawingSearchText(searchValue);
      }, 300),
    [],
  );

  const debouncedProdSeriesSearch = useMemo(
    () =>
      debounce(() => {
        // Handled by hook
      }, 300),
    [],
  );

  const updateDebouncedLnSearch = useMemo(
    () => debounce((value: string) => setDebouncedLnSearch(value), 300),
    [],
  );

  // Master data handled by hooks
  useEffect(() => {
    if (showAlert && alertSeverity !== "error") {
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showAlert, alertSeverity]);

  // Sync pending state to Redux for global navigation guard
  useEffect(() => {
    const hasPending = searchResults.some(
      (item) => item.isUpdated && !item.isSubmitted,
    );
    dispatch(setHasPendingScans(hasPending));

    // Cleanup on unmount
    return () => {
      dispatch(setHasPendingScans(false));
    };
  }, [searchResults, dispatch]);

  // Browser-level protection (refresh, close tab)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasPending = searchResults.some(
        (item) => item.isUpdated && !item.isSubmitted,
      );
      if (hasPending) {
        e.preventDefault();
        e.returnValue = ""; // Standard way to show default browser warning
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [searchResults]);



  function showAlertMessage(
    message: string,
    severity: "success" | "error" | "info" | "warning" = "info",
  ) {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setShowAlert(true);
  }

  // Sorting functions
  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  // Filtered results for remaining precheck only (updated and pending statuses)
  const filteredResults = useMemo(() => {
    if (!filterRemainingOnly) return searchResults;
    return searchResults.filter((item) => {
      const status = (item.precheckStatus || "").toLowerCase();
      return status === "updated" || status === "pending";
    });
  }, [searchResults, filterRemainingOnly]);

  const sortedResults = useMemo(() => {
    if (!orderBy) return filteredResults;

    return [...filteredResults].sort((a: any, b: any) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      if (
        orderBy === "sr" ||
        orderBy === "quantity" ||
        orderBy === "remainingQuantity"
      ) {
        const aNum = Number(aValue);
        const bNum = Number(bValue);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return order === "asc" ? aNum - bNum : bNum - aNum;
        }
      }

      // Default string/alphanumeric comparison
      aValue = String(aValue || "").toLowerCase();
      bValue = String(bValue || "").toLowerCase();

      if (order === "asc") {
        return aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' });
      } else {
        return bValue.localeCompare(aValue, undefined, { numeric: true, sensitivity: 'base' });
      }
    });
  }, [filteredResults, orderBy, order]);

  // Map to store maximum precheckDetailsId for each unique component (drawing + LN code)
  const maxPrecheckDetailsIdMap = useMemo(() => {
    const map: Record<string, number> = {};
    searchResults.forEach((item) => {
      if (item.drawingNumber && item.precheckDetailsId) {
        // Use a more specific key to distinguish different BOM items with the same drawing number
        const key = `${item.drawingNumber}-${item.lnItemCode || ""}`;
        if (!map[key] || item.precheckDetailsId > map[key]) {
          map[key] = item.precheckDetailsId;
        }
      }
    });
    return map;
  }, [searchResults]);

  // Validate fields whenever relevant properties change
  useEffect(() => {
    validateFields();
  }, [selectedDrawing, selectedProductionSeries, idNumber, selectedPO]);

  // Enable submit button when BOM is loaded (allow partial/complete submissions)
  useEffect(() => {
    const hasLoadedBOM = showResults && searchResults.length > 0;
    setIsSubmitEnabled(hasLoadedBOM);

    if (hasLoadedBOM) {
      const updatedItems = searchResults.filter(
        (item) => item.isUpdated && !item.isSubmitted,
      );
      console.log("Submit button state check:", {
        bomLoaded: hasLoadedBOM,
        totalItems: searchResults.length,
        availableToSubmit: updatedItems.length,
        submittedItems: searchResults.filter((item) => item.isSubmitted).length,
        completedItems: searchResults.filter((item) => item.isPrecheckComplete)
          .length,
      });
    }
  }, [searchResults, showResults]);

  // Handle navigation state from Production Order Upload
  useEffect(() => {
    const navigationState = location.state as any;

    if (navigationState && navigationState.drawingNumber && !hasLoadedData) {
      console.log("Navigation state detected:", navigationState);

      // Wait for master data to load
      if (allDrawingNumbers.length > 0 && productionSeriesData.length > 0) {
        // Find matching drawing number (case-insensitive and trimmed)
        const matchingDrawing = allDrawingNumbers.find(
          (d: any) =>
            d.drawingNumber &&
            navigationState.drawingNumber &&
            d.drawingNumber.trim().toLowerCase() === navigationState.drawingNumber.trim().toLowerCase(),
        );

        // Find matching production series (case-insensitive and trimmed)
        const matchingProdSeries = productionSeriesData.find(
          (ps: any) =>
            ps.productionSeries !== undefined &&
            navigationState.productionSeries !== undefined &&
            String(ps.productionSeries).trim().toLowerCase() === String(navigationState.productionSeries).trim().toLowerCase(),
        );

        // Find matching PO number if provided
        if (navigationState.productionOrderNumber) {
          // First try to find in already loaded poNumbers
          const matchingPO = poNumbers.find(
            (po: ProductionOrderMaster) =>
              po.productionOrderNumber ===
              navigationState.productionOrderNumber,
          );
          if (matchingPO) {
            setSelectedPO(matchingPO);
            setPOSearchText(matchingPO.productionOrderNumber);
          }
        }

        const startId = navigationState.startIdNumber !== undefined && navigationState.startIdNumber !== null
          ? navigationState.startIdNumber
          : navigationState.idNumber;

        if (
          matchingDrawing &&
          matchingProdSeries &&
          startId !== undefined &&
          startId !== null
        ) {
          console.log("Auto-filling form with:", {
            drawing: matchingDrawing,
            prodSeries: matchingProdSeries,
            startId: startId,
          });

          // Set form fields
          setSelectedDrawing(matchingDrawing);
          setSelectedProductionSeries(matchingProdSeries);
          setIdNumber(startId.toString());

          // Trigger auto-load after a short delay to ensure state is set
          setTimeout(() => {
            const payload = {
              DrawingNumberId: matchingDrawing.id,
              ProductionSeriesId: matchingProdSeries.id,
              Id: parseInt(startId.toString()),
              ProductionOrderNumber: navigationState.productionOrderNumber,
            };

            setIsLoadingLocal(true);
            setHasLoadedData(true);
            setOriginalDrawingNumber(matchingDrawing.drawingNumber);
            setOriginalProdSeries(matchingProdSeries.id);
            setOriginalAssemblyNumber(startId.toString());

            dispatch(viewPrecheckDetails(payload))
              .unwrap()
              .then((response) => {
                updateGridItems(response);
                setShowResults(true);
                showAlertMessage(
                  "BOM loaded successfully from production order",
                  "success",
                );
              })
              .catch((error) => {
                console.error("Error auto-loading BOM:", error);
                showAlertMessage(
                  "Error loading BOM: " + (error as Error).message,
                  "error",
                );
              })
              .finally(() => {
                setIsLoadingLocal(false);
              });
          }, 500);
        }
      }
    }
  }, [
    location.state,
    allDrawingNumbers,
    productionSeriesData,
    poNumbers,
    hasLoadedData,
    dispatch,
  ]);

  // Handle PO details from navigation state when fetched via usePODetails
  useEffect(() => {
    if (
      navigationPODetails &&
      navigationState?.productionOrderNumber
    ) {
      if (!selectedPO) {
        setSelectedPO(navigationPODetails);
        setPOSearchText(navigationPODetails.productionOrderNumber);
      }

      // Map Production Series if not set yet
      if (navigationPODetails.productionSeries && !selectedProductionSeries && productionSeriesData.length > 0) {
        const matchingProdSeries = productionSeriesData.find(
          (ps) => String(ps.productionSeries).trim().toLowerCase() === String(navigationPODetails.productionSeries).trim().toLowerCase(),
        );
        if (matchingProdSeries) {
          setSelectedProductionSeries(matchingProdSeries);
        }
      }

      // Map ID Number if not set yet
      const poStartId = navigationPODetails.startIdNumber ?? navigationPODetails.endIdNumber;
      const targetId = navigationState?.startIdNumber ?? navigationState?.idNumber ?? poStartId;
      if (targetId !== undefined && targetId !== null && !idNumber) {
        setIdNumber(targetId.toString());
      }

      // Map Drawing if not set yet
      if ((navigationPODetails.drawingNumber || navigationPODetails.lnItemCode) && !selectedDrawing && allDrawingNumbers.length > 0) {
        const matchingDrawing = allDrawingNumbers.find(
          (drawing) =>
            (drawing.drawingNumber && navigationPODetails.drawingNumber && drawing.drawingNumber.trim().toLowerCase() === navigationPODetails.drawingNumber.trim().toLowerCase()) ||
            (drawing.lnItemCode && navigationPODetails.lnItemCode && drawing.lnItemCode.trim().toLowerCase() === navigationPODetails.lnItemCode.trim().toLowerCase()),
        );

        if (matchingDrawing) {
          setSelectedDrawing(matchingDrawing);
        }
      }
    }
  }, [
    navigationPODetails,
    selectedPO,
    navigationState,
    productionSeriesData,
    allDrawingNumbers,
    selectedProductionSeries,
    idNumber,
    selectedDrawing,
  ]);

  const validateFields = () => {
    // Check if mandatory fields are filled
    const mandatoryFieldsFilled =
      selectedDrawing?.drawingNumber &&
      selectedProductionSeries?.id &&
      idNumber;

    // Check if the current combination is different from the previously loaded one
    const hasDifferentCombination =
      !hasLoadedData ||
      selectedDrawing?.drawingNumber !== originalDrawingNumber ||
      selectedProductionSeries?.id !== originalProdSeries ||
      idNumber !== originalAssemblyNumber;

    // Check if ID Number is within valid range for the selected PO
    const isIdWithinRange =
      !selectedPO?.endIdNumber ||
      !idNumber ||
      parseInt(idNumber) <= selectedPO.endIdNumber;

    // Enable button only if mandatory fields are filled AND
    // either we haven't loaded data yet OR the combination is different AND
    // the ID number is within valid range
    setIsMakePrecheckEnabled(
      mandatoryFieldsFilled && hasDifferentCombination && isIdWithinRange,
    );
  };

  const handleMakePrecheck = async () => {
    if (!validateInputs()) return;

    // Check if there are pending scans before overwriting
    const hasPending = searchResults.some(
      (item) => item.isUpdated && !item.isSubmitted,
    );

    if (hasPending) {
      setPendingAction("reload");
      setShowReloadConfirmation(true);
      return;
    }

    await executeMakePrecheck();
  };

  const executeMakePrecheck = async (overrideId?: string) => {
    const activeIdNumber = overrideId !== undefined ? overrideId : idNumber;
    // Check if ID Number exceeds endIdNumber for the selected PO
    if (
      selectedPO?.endIdNumber &&
      activeIdNumber &&
      parseInt(activeIdNumber) > selectedPO.endIdNumber
    ) {
      showAlertMessage(
        "Invalid ID Number range, ID number should be less than or equal to end ID number.",
        "error",
      );
      return;
    }

    try {
      setIsLoadingLocal(true);
      // Disable the button immediately
      setHasLoadedData(true);
      setOriginalDrawingNumber(selectedDrawing?.drawingNumber);
      setOriginalProdSeries(selectedProductionSeries?.id);
      setOriginalAssemblyNumber(activeIdNumber);

      setIsMakePrecheckEnabled(false);

      const payload = {
        DrawingNumberId: selectedDrawing?.id,
        ProductionSeriesId: selectedProductionSeries?.id,
        Id: activeIdNumber ? parseInt(activeIdNumber) : undefined,
        ProductionOrderNumber: selectedPO?.productionOrderNumber,
      };

      const response = await dispatch(viewPrecheckDetails(payload)).unwrap();
      await updateGridItems(response);

      setShowResults(true);
      // Submit button will be enabled automatically by useEffect when showResults becomes true
    } catch (error) {
      console.error("Error in LoadGridData:", error);
      showAlertMessage(
        "Error loading data: " + (error as Error).message,
        "error",
      );
    } finally {
      setIsLoadingLocal(false);
      setIsMakePrecheckEnabled(false);
    }
  };

  const validateInputs = () => {
    const missingFields = [];

    if (!selectedDrawing) missingFields.push("Drawing Number");
    if (!selectedProductionSeries) missingFields.push("Production Series");
    if (!idNumber) missingFields.push("Assembly Number");

    if (missingFields.length > 0) {
      showAlertMessage(
        `Please fill the following required fields:\n${missingFields.join(
          ", ",
        )}`,
        "error",
      );
      return false;
    }

    return true;
  };

  const handleSubmitPrecheck = async () => {
    try {
      setIsLoadingLocal(true);

      const componentsToSubmit = searchResults
        .filter((item) => item.isUpdated && !item.isSubmitted && item.qrCode)
        .map((item) => ({
          ConsumedDrawingNo: `${selectedProductionSeries?.productionSeries}/${selectedDrawing?.drawingNumber}/${idNumber}`,
          ConsumedInDrawingNumberID: selectedDrawing?.id || 0,
          assemblyDrawingNo: selectedDrawing?.drawingNumber || "",
          ConsumedInProdSeriesID: selectedProductionSeries?.id || 0,
          ConsumeInProductionOrderNumber: selectedPO?.productionOrderNumber,
          ConsumedInId: parseInt(idNumber) || 0,
          QrCodeNumber: item.qrCode || "",
          Quantity: item.quantity ?? 0,
          UpdatedQuantity: item.scannedQuantity ?? 0,
          DrawingNumberId: item.drawingNumberId || 0,
          Id: item.precheckDetailsId || 0, // Sending existing precheckDetailsId
          ProductionSeriesId: item.prodSeriesId || 0,
          Remarks: item.remarks || "",
          Unit: item.unit ? String(item.unit) : "1", // Ensure Unit is string
          IrNumber: item.ir || "",
          MsnNumber: item.msn || "",
          MrirNumber: item.mrirNumber || "",
          IdNumbers: item.idNumber || "",
          ComponentType: item.componentType || "",
          ProductionOrderNumber: item.productionOrderNumber || "NA",
          CreatedBy: Number(user?.id) || 0, // Use logged-in user's ID
          LnItemCodeId: item.lnItemCodeId || 0, // Ensure Id is set
          LnItemCode: item.lnItemCode || "",
          RemainingQuantity: item.remainingQuantity || 0,
        }));

      if (!componentsToSubmit.length) {
        showAlertMessage(
          "No scanned components to submit. Please scan QR codes first.",
          "info",
        );
        return;
      }

      console.log(
        `Submitting ${componentsToSubmit.length} component(s):`,
        componentsToSubmit,
      );

      // Validate payload before sending
      const invalidComponents = componentsToSubmit.filter(
        (comp) =>
          !comp.QrCodeNumber ||
          !comp.DrawingNumberId ||
          !comp.ConsumedInDrawingNumberID,
      );

      if (invalidComponents.length > 0) {
        console.error("Invalid components found:", invalidComponents);
        throw new Error(
          `${invalidComponents.length} component(s) have missing required data`,
        );
      }

      const response = await dispatch(
        makePrecheck(componentsToSubmit),
      ).unwrap();

      console.log("Response make precheck:", response);

      // Handle different response structures
      const responseData = Array.isArray(response)
        ? response
        : response?.data || response || [];

      if (responseData && responseData.length > 0) {
        // Create a map of submitted QR codes for faster lookup
        const submittedQRCodes = new Set(
          componentsToSubmit.map((comp) => comp.QrCodeNumber),
        );
        console.log("Submission successful, reloading data from server...");

        const reloadPayload = {
          DrawingNumberId: selectedDrawing?.id,
          ProductionSeriesId: selectedProductionSeries?.id,
          Id: idNumber ? parseInt(idNumber) : undefined,
          ProductionOrderNumber:
            selectedPO?.productionOrderNumber ||
            navigationState?.productionOrderNumber,
        };

        const reloadResponse = await dispatch(
          viewPrecheckDetails(reloadPayload),
        ).unwrap();
        await updateGridItems(reloadResponse);

        showAlertMessage("Precheck submitted successfully!", "success");
      } else {
        showAlertMessage(
          "No data submitted or invalid response format.",
          "warning",
        );
      }
    } catch (error: any) {
      console.error("Error submitting precheck:", error);

      // Extract user-friendly error message
      let errorMessage = "Error submitting precheck";

      if (error?.payload) {
        // Redux rejected action with payload
        errorMessage = error.payload;
      } else if (error?.response?.data?.message) {
        // API returned a structured error response
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        // Standard error object
        errorMessage = error.message;
      } else if (typeof error === "string") {
        // String error
        errorMessage = error;
      }

      showAlertMessage(`Error submitting precheck: ${errorMessage}`, "error");
    } finally {
      setIsLoadingLocal(false);
    }
  };

  // Cleanup function
  const resetAllData = useCallback(() => {
    // Clear form fields
    setHasLoadedData(false);
    setSelectedDrawing(null);
    setSelectedProductionSeries(null);
    setIdNumber("");
    setBarcodeText("");
    setSelectedPO(null);
    setPOSearchText("");

    // Clear original values
    setOriginalDrawingNumber(null);
    setOriginalProdSeries(null);
    setOriginalAssemblyNumber(null);

    // Clear grid data
    setSearchResults([]);
    setShowResults(false);
    setFilterRemainingOnly(false);

    // Reset button states
    setIsMakePrecheckEnabled(false);
    setIsSubmitEnabled(false); // Will be re-enabled when BOM is loaded

    // Clear alerts
    setAlertMessage("");
    setShowAlert(false);

    // Reset dialog states
    setQuantityDialogOpen(false);
    setPendingBarcodeData(null);

    // Reset pagination and sorting
    setPage(0);
    setSelectedRow(null);
    setOrderBy("sr");
    setOrder("asc");

    // Reset expanded rows
    setExpandedRows(new Set());

    // Clear Redux state
    dispatch(clearPrecheckData());

    // Re-validate fields
    validateFields();
  }, [dispatch]);

  // Handle the reset button click
  const handleReset = () => {
    const hasPending = searchResults.some(
      (item) => item.isUpdated && !item.isSubmitted,
    );

    if (hasPending) {
      setPendingAction("reset");
      setShowReloadConfirmation(true);
    } else {
      resetAllData();
    }
  };

  const handleConfirmReload = () => {
    setShowReloadConfirmation(false);
    if (pendingAction === "reset") {
      resetAllData();
    } else if (pendingAction === "reload") {
      executeMakePrecheck();
    }
    setPendingAction(null);
  };



  // Handle row expansion
  const handleRowExpand = (index: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };

  // Handle row selection on double-click
  const handleRowDoubleClick = (index: number) => {
    const actualIndex = page * rowsPerPage + index;
    setSelectedRow(selectedRow === actualIndex ? null : actualIndex);
  };

  // Handle plus button click
  const handlePlusClick = (item: GridItem) => {
    setSelectedRowForAdd(item);
    setAddQrFormData({
      prodSeriesId: selectedProductionSeries?.id?.toString() || "",
      idNumber: "",
      qrCodeNumber: "",
    });
    setAddQrDialogOpen(true);
  };
  const handleAddRow = async (item: GridItem) => {
    try {
      setIsLoadingLocal(true);
      const payload = {
        precheckDetailsId: item.precheckDetailsId || 0,
        drawingNumberId: item.drawingNumberId || 0,
        productionSeriesId: item.prodSeriesId || 0,
        idNumber: item.idNumber || "",
        qrCodeNumber: item.qrCode || "",
        componentType: item.componentType || "",
        rejectedRemarks: item.remarks || "",
        duplicateRemarks: "",
        createdBy: Number(user?.id) || 0,
        remainingQuantity: item.remainingQuantity || 0,
      };

      console.log("Calling remainingPrecheck API with payload:", payload);
      const remainingResult = await dispatch(
        remainingPrecheck(payload),
      ).unwrap();
      console.log(
        "remainingPrecheck API successful, response:",
        remainingResult,
      );

      const newRow: GridItem = {
        ...item,
        sr: item.sr,
        componentType: item.componentType,
        qrCode: "",
        idNumber: "",
        ir: "",
        msn: "",
        mrirNumber: "",
        remarks: "",
        isUpdated: false,
        isSubmitted: false,
        isPrecheckComplete: false,
        remainingQuantity: item.remainingQuantity,
        scannedQuantity: 0,
        isAddDisabled: false,
        duplicateRowId: `${Date.now()}`,
        precheckDetailsId: remainingResult.newPrecheckDetailsId,
      };

      setSearchResults((prev) => {
        const index = prev.indexOf(item);
        let updatedResults;
        if (index !== -1) {
          const newResults = [...prev];
          // Disable add button and fade out the current row
          newResults[index] = {
            ...newResults[index],
            isAddDisabled: true,
          };
          newResults.splice(index + 1, 0, newRow);
          updatedResults = newResults;
        } else {
          updatedResults = [...prev, newRow];
        }

        // Re-assign SRs for all items to ensure uniqueness and sequence
        return updatedResults.map((row, idx) => ({
          ...row,
          sr: idx + 1,
        }));
      });
    } catch (error: any) {
      console.error("Error in handleAddRow:", error);
      showAlertMessage(`Failed to add row Scan Qr Code first`);
    } finally {
      setIsLoadingLocal(false);
    }
  };

  // Validate QR code format
  const validateQrCode = (qrCode: string) => {
    if (!qrCode) {
      setQrCodeError("");
      return true;
    }

    // Check if QR code is 12 or 15 digits
    if (!/^\d{12}$|^\d{15}$/.test(qrCode)) {
      setQrCodeError("QR code must be 12 or 15 digits");
      return false;
    }

    setQrCodeError("");
    return true;
  };

  // Handle QR code input change
  const handleQrCodeChange = (value: string) => {
    // Only allow digits and limit to 15 characters
    const numericValue = value.replace(/\D/g, "").slice(0, 15);
    setAddQrFormData((prev) => ({
      ...prev,
      qrCodeNumber: numericValue,
    }));
    validateQrCode(numericValue);
  };

  // Handle add QR code form submission
  const handleAddQrCode = async () => {
    if (
      !selectedRowForAdd ||
      !addQrFormData.qrCodeNumber ||
      !addQrFormData.idNumber
    ) {
      showAlertMessage("Please fill all required fields", "error");
      return;
    }

    // Validate QR code format
    if (!validateQrCode(addQrFormData.qrCodeNumber)) {
      showAlertMessage("Please enter a valid 15-digit QR code", "error");
      return;
    }

    try {
      setIsLoadingLocal(true);

      // Step 1: Call AddQRCodeDetails API
      const addQRPayload = {
        drawingNumberId: selectedRowForAdd.drawingNumberId || 0,
        productionSeriesId: parseInt(addQrFormData.prodSeriesId) || 0,
        idNumber: parseInt(addQrFormData.idNumber) || 0,
        qrCodeNumber: addQrFormData.qrCodeNumber,
        createdBy: Number(user?.id) || 0,
        createdDate: new Date().toISOString(),
        isActive: true,
      };

      console.log("Calling AddQRCodeDetails API with payload:", addQRPayload);
      const addQRResult = await dispatch(
        addQRCodeDetails(addQRPayload),
      ).unwrap();
      console.log("AddQRCodeDetails API response:", addQRResult);

      // Step 2: Call the store-in API (updateQrCodeDetails)
      console.log(
        "Calling store-in API for QR code:",
        addQrFormData.qrCodeNumber,
      );
      const storeInResult = await dispatch(
        updateQrCodeDetails(addQrFormData.qrCodeNumber),
      ).unwrap();
      console.log("Store-in API response:", storeInResult);

      // Step 3: Get updated barcode details after store-in
      console.log(
        "Getting updated barcode details for QR code:",
        addQrFormData.qrCodeNumber,
      );
      const qrCodeDetails = await dispatch(
        getBarcodeDetails(addQrFormData.qrCodeNumber),
      ).unwrap();

      if (!qrCodeDetails) {
        showAlertMessage("Invalid QR code or no data found", "error");
        return;
      }

      console.log("QR Code Details from store-in API:", qrCodeDetails);

      // Batch available check
      if (qrCodeDetails.batchAvailable === true) {
        showAlertMessage(
          "Previous QR code is not scanned, scan that QR code first",
          "warning",
        );
        return;
      }

      // Step 4: Execute scan QR code functionality automatically
      // Check QR code status first
      if (
        qrCodeDetails.qrCodeStatusId === 3 ||
        qrCodeDetails.qrCodeStatus?.toLowerCase() === "qrcodegenerated"
      ) {
        showAlertMessage(
          "Component not stored in. QR code is generated but not ready for consumption.",
          "warning",
        );
        return;
      }

      if (
        qrCodeDetails.qrCodeStatusId === 2 ||
        qrCodeDetails.qrCodeStatus?.toLowerCase() === "consumed"
      ) {
        showAlertMessage(
          "This QR code has already been consumed and cannot be used again.",
          "error",
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

      // Find the matching item in search results
      console.log("Looking for matching item:", {
        selectedRowSr: selectedRowForAdd.sr,
        selectedRowDrawingNumber: selectedRowForAdd.drawingNumber,
        searchResultsLength: searchResults.length,
      });

      const matchingItemIndex = searchResults.findIndex(
        (item) =>
          item.sr === selectedRowForAdd.sr &&
          item.drawingNumber === selectedRowForAdd.drawingNumber,
      );

      console.log("Matching item index:", matchingItemIndex);

      if (matchingItemIndex !== -1) {
        const updatedResults = [...searchResults];
        const item = updatedResults[matchingItemIndex];

        // Update the item with all fields from QR code details (same as scan functionality)
        console.log("Updating grid item with QR code details:", qrCodeDetails);
        console.log("Current item before update:", item);

        item.qrCode = qrCodeDetails.qrCodeNumber;
        item.isPrecheckComplete = false;
        item.isUpdated = true;
        if (item.componentType?.toUpperCase() === "BATCH" || item.componentType?.toUpperCase() === "FIM") {
          item.isSubmitted = false;
        }
        item.ir = qrCodeDetails.irNumber;
        item.msn = qrCodeDetails.msnNumber;
        // Use the ID number from the form input, not from QR code details
        item.idNumber = addQrFormData.idNumber || qrCodeDetails.idNumber;

        // Track the quantity being scanned
        const scanQty = qrCodeDetails.quantity || item.quantity || 0;
        item.scannedQuantity = scanQty;

        // Subtract scanned quantity from remainingQuantity
        const currentRemQty = item.remainingQuantity ?? item.quantity ?? 0;
        const newRemQty = Math.max(0, currentRemQty - scanQty);

        // Preserve original BOM quantity, update remainingQuantity
        item.remainingQuantity = newRemQty;

        // If remainingQuantity === 0, set isPrecheckComplete = true
        if (newRemQty === 0) {
          item.isPrecheckComplete = true;
        }

        item.componentType = qrCodeDetails.componentType;
        item.mrirNumber = qrCodeDetails.mrirNumber;
        item.remarks = qrCodeDetails.remark;
        item.username = user?.username || "Current User";
        item.modifiedDate = new Date().toISOString();
        item.productionOrderNumber =
          qrCodeDetails.productionOrderNumber || "NA";
        item.projectNumber = qrCodeDetails.projectNumber || "NA";
        item.disposition = qrCodeDetails.desposition || "NA";
        item.unit = qrCodeDetails.unit || item.unit || "1";

        console.log("Updated item after changes:", item);

        // Force re-render by creating a new array reference
        setSearchResults([...updatedResults]);

        // Small delay to ensure state update is processed
        setTimeout(() => {
          showAlertMessage(
            "QR Code added and scanned successfully!",
            "success",
          );
        }, 100);
      } else {
        console.error("No matching item found in search results");
        showAlertMessage(
          "Error: Could not find matching item in the grid to update",
          "error",
        );
        return;
      }

      // Close dialog and reset form
      setAddQrDialogOpen(false);
      setSelectedRowForAdd(null);
      setAddQrFormData({
        prodSeriesId: "",
        idNumber: "",
        qrCodeNumber: "",
      });
      setQrCodeError("");
    } catch (error: any) {
      console.error("Error adding QR code:", error);

      // Extract user-friendly error message
      let errorMessage = "Error adding QR code";

      if (error?.payload) {
        errorMessage = error.payload;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      showAlertMessage(`Error adding QR Code: ${errorMessage}`, "error");
    } finally {
      setIsLoadingLocal(false);
    }
  };

  // Handle dialog close
  const handleAddQrDialogClose = () => {
    setAddQrDialogOpen(false);
    setSelectedRowForAdd(null);
    setAddQrFormData({
      prodSeriesId: "",
      idNumber: "",
      qrCodeNumber: "",
    });
    setQrCodeError("");
  };

  // Handle edit button click - open reject dialog
  const handleEditClick = (item: GridItem) => {
    setSelectedRowForReject(item);
    setRejectRemarks(item.remarks || "");
    setDuplicateRemarks("");
    setRejectDialogOpen(true);
  };

  // Handle reject confirmation
  const handleRejectConfirm = async () => {
    if (!selectedRowForReject) return;

    try {
      setIsLoadingLocal(true);

      // Call API to reject component and create duplicate
      const rejectPayload = {
        precheckDetailsId: selectedRowForReject.precheckDetailsId || 0,
        drawingNumberId: selectedRowForReject.drawingNumberId || 0,
        productionSeriesId: selectedRowForReject.prodSeriesId || 0,
        componentType: selectedRowForReject.componentType || "",
        idNumber: selectedRowForReject.idNumber || "",
        qrCodeNumber: selectedRowForReject.qrCode || "",
        rejectedRemarks: rejectRemarks,
        duplicateRemarks: duplicateRemarks || "",
        createdBy: Number(user?.id) || 0,
      };

      await dispatch(rejectComponentMRS(rejectPayload)).unwrap();

      // Refresh data from backend to get updated entries (rejected and duplicate)
      const refreshPayload = {
        DrawingNumberId: selectedDrawing?.id,
        ProductionSeriesId: selectedProductionSeries?.id,
        Id: idNumber ? parseInt(idNumber) : undefined,
        ProductionOrderNumber: selectedPO?.productionOrderNumber,
      };

      const refreshedResponse = await dispatch(
        viewPrecheckDetails(refreshPayload),
      ).unwrap();
      await updateGridItems(refreshedResponse);

      showAlertMessage(
        "Component rejected successfully. Duplicate entry created.",
        "success",
      );

      // Close dialog
      setRejectDialogOpen(false);
      setSelectedRowForReject(null);
      setRejectRemarks("");
      setDuplicateRemarks("");
    } catch (error: any) {
      console.error("Error rejecting component:", error);
      let errorMessage = "Error rejecting component";
      if (error?.payload) {
        errorMessage = error.payload;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      showAlertMessage(`Error rejecting component: ${errorMessage}`, "error");
    } finally {
      setIsLoadingLocal(false);
    }
  };

  // Handle reject dialog close
  const handleRejectDialogClose = () => {
    setRejectDialogOpen(false);
    setSelectedRowForReject(null);
    setRejectRemarks("");
    setDuplicateRemarks("");
  };

  // Handle undo scan button click
  const handleUndoScan = (item: GridItem) => {
    // Revert the scanned item locally without API call
    const updatedResults = searchResults.map((row) => {
      if (row === item) {
        const hasRemQty = row.hadOriginalRemainingQuantity;
        const restoredRemQty = hasRemQty
          ? (row.remainingQuantity ?? 0) + (row.scannedQuantity ?? 0)
          : undefined;

        return {
          ...row,
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
          remainingQuantity: restoredRemQty,
          username: "",
          modifiedDate: "",
          productionOrderNumber: "",
          projectNumber: "",
          disposition: "",
        };
      }
      return row;
    });

    setSearchResults(updatedResults);
    showAlertMessage("Scanned QR code reverted successfully!", "success");
  };

  // Handle database delete precheck details click
  const handleDeletePrecheck = async (item: GridItem) => {
    try {
      setIsLoadingLocal(true);
      const payload = {
        productionOrderNumber: item.productionOrderNumber || selectedPO?.productionOrderNumber || "NA",
        idNumber: parseInt(idNumber, 10),
        drawingNumberId: item.drawingNumberId,
      };

      console.log("Calling deletePrecheckDetails API with payload:", payload);
      await dispatch(deletePrecheckDetails(payload)).unwrap();

      showAlertMessage("Precheck details deleted successfully", "success");

      // Reload BOM data from database to update grid
      await executeMakePrecheck();
    } catch (error: any) {
      console.error("Error deleting precheck details:", error);
      showAlertMessage(error || "Failed to delete precheck details", "error");
    } finally {
      setIsLoadingLocal(false);
    }
  };

  // Handle database remove/undo precheck details click
  const handleRemovePrecheck = async (item: GridItem) => {
    try {
      setIsLoadingLocal(true);
      const payload = {
        productionOrderNumber: item.productionOrderNumber || selectedPO?.productionOrderNumber || "NA",
        idNumber: parseInt(idNumber, 10),
        drawingNumberId: item.drawingNumberId,
      };

      console.log("Calling removePrecheckDetails API with payload:", payload);
      await dispatch(removePrecheckDetails(payload)).unwrap();

      showAlertMessage("Precheck details undone successfully", "success");

      // Reload BOM data from database to update grid
      await executeMakePrecheck();
    } catch (error: any) {
      console.error("Error removing precheck details:", error);
      showAlertMessage(error || "Failed to remove precheck details", "error");
    } finally {
      setIsLoadingLocal(false);
    }
  };

  // handle export
  const handleExport = () => {
    // Create export parameters object with only defined values
    const exportParams: {
      productionOrderNumber?: string;
      productionSeriesId?: number;
      id?: number;
      drawingNumberId?: number;
      remainingPrecheck?: boolean;
    } = {};

    // Only add parameters that have values
    if (selectedPO?.productionOrderNumber) {
      exportParams.productionOrderNumber = selectedPO.productionOrderNumber;
    }
    if (selectedProductionSeries?.id) {
      exportParams.productionSeriesId = selectedProductionSeries.id;
    }
    if (idNumber) {
      exportParams.id = parseInt(idNumber);
    }
    if (selectedDrawing?.id) {
      exportParams.drawingNumberId = selectedDrawing.id;
    }

    // Check if at least one parameter is provided
    if (Object.keys(exportParams).length === 0) {
      alert("Please enter at least one search criteria before exporting");
      return;
    }

    // Add remainingPrecheck parameter based on filterRemainingOnly state
    exportParams.remainingPrecheck = filterRemainingOnly;

    // Call the export API
    dispatch(exportPrecheckDetails(exportParams))
      .unwrap()
      .then((result) => {
        if (result.success) {
          // You can show a success message here if needed
          // toast.success(result.message);
        }
      })
      .catch((error) => {
        alert(error.message || "Failed to export precheck details");
      });
  };

  //handle next 
  const handleNextId = () => {
    const currentIndex = idOptions.findIndex(
      (id) => id === idNumber
    );

    if (currentIndex !== -1 && currentIndex < idOptions.length - 1) {
      const nextId = idOptions[currentIndex + 1];

      setIdNumber(nextId);

      // Automatically reload BOM data
      executeMakePrecheck(nextId);
    } else {
      showAlertMessage("No more ID numbers available", "info");
    }
  };

  //handle previous
  const handlePrevId = () => {
    const currentIndex = idOptions.findIndex(
      (id) => id === idNumber
    );

    if (currentIndex !== -1 && currentIndex > 0) {
      const prevId = idOptions[currentIndex - 1];

      setIdNumber(prevId);

      // Automatically reload BOM data
      executeMakePrecheck(prevId);
    } else {
      showAlertMessage("No previous ID numbers available", "info");
    }
  };

  // Handle remarks change for any row
  const handleRemarksChange = (item: GridItem, newRemarks: string) => {
    const updatedResults = searchResults.map((row) => {
      // Match by unique identifier: originalRowId for duplicates, or by sr + drawingNumber + isRejected for others
      if (item.duplicateRowId && row.duplicateRowId === item.duplicateRowId) {
        return { ...row, remarks: newRemarks };
      } else if (
        item.originalRowId &&
        row.originalRowId === item.originalRowId &&
        row.isRejected
      ) {
        return { ...row, remarks: newRemarks };
      } else if (
        !item.duplicateRowId &&
        !item.originalRowId &&
        row.sr === item.sr &&
        row.drawingNumber === item.drawingNumber &&
        row.isRejected === item.isRejected
      ) {
        return { ...row, remarks: newRemarks };
      }
      return row;
    });
    setSearchResults(updatedResults);
  };

  // Pagination handlers
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Paginated results
  const paginatedResults = useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedResults.slice(startIndex, endIndex);
  }, [sortedResults, page, rowsPerPage]);

  // Check if all components are completed/submitted
  const allComponentsCompleted = useMemo(() => {
    if (searchResults.length === 0) return false;
    return searchResults.every((item) => item.isPrecheckComplete);
  }, [searchResults]);

  const updateGridItems = async (response: any[]) => {
    if (!response?.length) return;

    // Map the response to objects and assign sequential SRs based on the API response sequence
    const finalItems = response.map((item, index) => ({
      drawingNumber: item.drawingNumber,
      nomenclature: item.nomenclature,
      quantity: item.quantity,
      idNumber: item.idNumber,
      ir: item.irNumber,
      msn: item.msnNumber,
      mrirNumber: item.mrirNumber,
      drawingNumberId: item.drawingNumberId,
      prodSeriesId: item.prodSeriesId,
      isPrecheckComplete: item.isPrecheckComplete,
      isUpdated: item.isUpdated,
      isSubmitted: false,
      componentType: item.componentType,
      username: item.username,
      modifiedDate: item.modifiedDate,
      remarks: item.remarks,
      productionOrderNumber: item.productionOrderNumber,
      projectNumber: item.projectNumber,
      disposition: item.disposition,
      unit: item.unit || "1",
      lnItemCodeId: item.lnItemCodeId,
      lnItemCode: item.lnItemCode,
      precheckDetailsId:
        item.precheckDetailsId || item.id || item.precheckDetailId,
      isRejected: item.isRejected || false,
      readyForRejection: item.readyForRejection || false,
      materialRequisitionStatus: item.materialRequisitionStatus,
      remainingQuantity: item.remainingQuantity,
      qrCode: item.qrCodeNumber || item.qrCode || item.QRCodeNumber,
      precheckStatus: item.precheckStatus,
      originalRowId: item.originalRowId,
      duplicateRowId: item.duplicateRowId,
      sr: index + 1,
      findNo: item.findNo,
      hadOriginalRemainingQuantity: item.remainingQuantity !== null && item.remainingQuantity !== undefined,
    }));

    setSearchResults(finalItems);
  };

  return (
    <Box
      sx={{
        p: { xs: 0.5, sm: 1, md: 1.5 },
        height: "calc(100vh - 64px)",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Typography
        variant="h4"
        sx={{
          color: "primary.main",
          fontWeight: 600,
          fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.5rem" },
          mb: 0.5,
        }}
      >
        Make Precheck
      </Typography>

      {/* Alert */}
      {showAlert && (
        <Alert
          severity={alertSeverity}
          sx={{ mb: 2 }}
          onClose={() => setShowAlert(false)}
        >
          {alertMessage}
        </Alert>
      )}

      {/* Form Controls */}
      <PrecheckFormControls
        selectedPO={selectedPO}
        poNumbers={poNumbers}
        poLoading={poLoading}
        onPOSearchChange={(inputValue) => setPOSearchText(inputValue)}
        onPOChange={(newValue) => {
          if (newValue) {
            setSelectedPO(newValue);
            // Auto-fill form fields from PO
            if (newValue.drawingNumber && allDrawingNumbers.length > 0) {
              const matchingDrawing = allDrawingNumbers.find(
                (d: any) =>
                  d.drawingNumber &&
                  d.drawingNumber.trim().toLowerCase() ===
                  newValue.drawingNumber?.trim().toLowerCase(),
              );
              if (matchingDrawing) setSelectedDrawing(matchingDrawing);
            }
            if (newValue.productionSeries && productionSeriesData.length > 0) {
              const matchingPS = productionSeriesData.find(
                (ps: any) =>
                  String(ps.productionSeries).trim().toLowerCase() ===
                  String(newValue.productionSeries).trim().toLowerCase(),
              );
              if (matchingPS) setSelectedProductionSeries(matchingPS);
            }
            if (newValue.startIdNumber !== undefined && newValue.startIdNumber !== null) {
              setIdNumber(newValue.startIdNumber.toString());
            }
          } else {
            setSelectedPO(null);
          }
        }}
        selectedDrawing={selectedDrawing}
        allDrawingNumbers={allDrawingNumbers}
        drawingNumbersData={drawingNumbersData}
        drawingLoading={drawingLoading}
        isLnSearchLoading={isLnSearchLoading}
        onLnSearchChange={(value) => updateDebouncedLnSearch(value)}
        onDrawingSearchChange={(value) => debouncedDrawingSearch(value)}
        onDrawingChange={(value) => setSelectedDrawing(value)}
        selectedProductionSeries={selectedProductionSeries}
        productionSeriesData={productionSeriesData}
        prodSeriesLoading={prodSeriesLoading}
        onProdSeriesSearchChange={() => debouncedProdSeriesSearch()}
        onProdSeriesChange={(value) => setSelectedProductionSeries(value)}
        idNumber={idNumber}
        idOptions={idOptions}
        onIdNumberChange={(val) => setIdNumber(val)}
        onIdInputChange={(val) => setIdNumber(val)}
        onReset={handleReset}
        showAlertMessage={showAlertMessage}
        selectedPOEndIdNumber={selectedPO?.endIdNumber}
        selectedPOStartIdNumber={selectedPO?.startIdNumber}
        selectedPOQuantity={selectedPO?.quantity}
        isSubmitEnabled={isSubmitEnabled}
        filterRemainingOnly={filterRemainingOnly}
        onToggleFilter={() => setFilterRemainingOnly(!filterRemainingOnly)}
        onExport={handleExport}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Action Bar + BOM Header */}
      <PrecheckActionBar
        barcodeText={barcodeText}
        isSidebarOpen={isSidebarOpen}
        showResults={showResults}
        searchResultsLength={searchResults.length}
        isMakePrecheckEnabled={isMakePrecheckEnabled}
        isSubmitEnabled={isSubmitEnabled}
        isLoadingLocal={isLoadingLocal}
        uploadInProgress={uploadInProgress}
        downloadTemplateInProgress={downloadTemplateInProgress}
        idOptionsLength={idOptions.length}
        selectedDrawingNumber={selectedDrawing?.drawingNumber || ""}
        selectedProductionSeries={selectedProductionSeries?.productionSeries || ""}
        idNumber={idNumber}
        onBarcodeChange={handleBarcodeChange}
        onBarcodeKeyDown={handleBarcodeKeyDown}
        onOpenScanner={handleOpenScanner}
        onUploadExcel={() => excelFileInputRef.current?.click()}
        onDownloadTemplate={handleDownloadTemplate}
        onMakePrecheck={handleMakePrecheck}
        onSubmitPrecheck={handleSubmitPrecheck}
        onReject={() => navigate("/materialrequisition")}
        isAdminOrHead={isAdminOrHead}
        isAddEnabled={isSubmitEnabled}
        onAddBomDrawingClick={() => setAddBomDrawingOpen(true)}
      />

      {/* BOM Details Table */}
      <PrecheckTable
        paginatedResults={paginatedResults}
        filteredResults={filteredResults}
        searchResults={searchResults}
        isLoading={isLoadingLocal}
        showResults={showResults}
        page={page}
        rowsPerPage={rowsPerPage}
        selectedRow={selectedRow}
        expandedRows={expandedRows}
        maxPrecheckDetailsIdMap={maxPrecheckDetailsIdMap}
        onChangePage={handleChangePage}
        onChangeRowsPerPage={handleChangeRowsPerPage}
        onRowExpand={handleRowExpand}
        onRowDoubleClick={handleRowDoubleClick}
        onAddRow={handleAddRow}
        onEditClick={handleEditClick}
        onUndoScan={handleUndoScan}
        onRemarksChange={handleRemarksChange}
        onUndoPrecheck={handleRemovePrecheck}
        onDeletePrecheck={handleDeletePrecheck}
        orderBy={orderBy}
        order={order}
        onRequestSort={handleRequestSort}
      />

      {/* Quantity Dialog */}
      <QuantityDialog
        open={quantityDialogOpen}
        maxQuantity={maxQuantity}
        defaultQuantity={selectedQuantity}
        onClose={() => {
          setQuantityDialogOpen(false);
          setPendingBarcodeData(null);
          setSelectedQuantityItem(null);
        }}
        onConfirm={handleQuantityConfirm}
      />

      {/* Add QR Code Dialog */}
      <AddQrCodeDialog
        open={addQrDialogOpen}
        selectedRow={selectedRowForAdd}
        formData={addQrFormData}
        qrCodeError={qrCodeError}
        productionSeriesData={productionSeriesData}
        prodSeriesLoading={prodSeriesLoading}
        onFormDataChange={(data) =>
          setAddQrFormData((prev) => ({ ...prev, ...data }))
        }
        onQrCodeChange={handleQrCodeChange}
        onSubmit={handleAddQrCode}
        onClose={handleAddQrDialogClose}
      />

      {/* Reject Dialog */}
      <RejectDialog
        open={rejectDialogOpen}
        selectedRow={selectedRowForReject}
        rejectRemarks={rejectRemarks}
        duplicateRemarks={duplicateRemarks}
        isLoading={isLoadingLocal}
        onRejectRemarksChange={setRejectRemarks}
        onDuplicateRemarksChange={setDuplicateRemarks}
        onConfirm={handleRejectConfirm}
        onClose={handleRejectDialogClose}
      />

      {/* Add BOM Drawing Dialog */}
      <AddBomDrawingDialog
        open={addBomDrawingOpen}
        onClose={() => setAddBomDrawingOpen(false)}
        assemblyItemCode={selectedDrawing?.lnItemCode || ""}
        assemblyDrawingNumber={selectedDrawing?.drawingNumber || ""}
        onSuccess={(msg) => {
          showAlertMessage(msg || "BOM drawing item added successfully!", "success");
          if (hasLoadedData && selectedDrawing && selectedProductionSeries && idNumber) {
            executeMakePrecheck();
          }
        }}
      />

      {/* Batch Warning Dialog */}
      <BatchWarningDialog
        open={batchWarningOpen}
        onClose={() => setBatchWarningOpen(false)}
      />

      {/* Reload/Reset Confirmation Dialog */}
      <ReloadConfirmationDialog
        open={showReloadConfirmation}
        onClose={() => setShowReloadConfirmation(false)}
      />

      {/* Camera Permission Dialog */}
      <CameraPermissionDialog
        open={showPermissionDialog}
        onClose={() => setShowPermissionDialog(false)}
        onAllow={async () => {
          setShowPermissionDialog(false);
          const granted = await handleRequestPermission();
          if (granted) {
            setOpenScanner(true);
          }
        }}
      />

      {/* QR Scanner Dialog */}
      <QrScannerDialog
        open={openScanner}
        isMobile={isMobile}
        scannerReady={scannerReady}
        scannerError={scannerError}
        uploadInProgress={uploadInProgress}
        uploadError={uploadError}
        facingMode={facingMode}
        fileInputRef={fileInputRef}
        onClose={() => setOpenScanner(false)}
        onCameraFlip={handleCameraFlip}
        onFileUpload={handleScanFileUpload}
        onUploadErrorDismiss={() => setUploadError(null)}
      />

      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleScanFileUpload}
      />

      {/* Hidden Excel file input */}
      <input
        type="file"
        accept=".xlsx, .xls"
        ref={excelFileInputRef}
        style={{ display: "none" }}
        onChange={handleExcelUpload}
      />

      {/* Hidden container for file-based QR scanning */}
      <div
        id="qr-reader-file"
        style={{
          visibility: "hidden",
          position: "absolute",
          width: 0,
          height: 0,
          pointerEvents: "none",
        }}
      />
      {/* Excel Upload Result Dialog */}
      <ExcelUploadResultDialog
        open={excelResultDialogOpen}
        onClose={() => setExcelResultDialogOpen(false)}
        data={excelUploadResult}
      />
    </Box>
  );
};

export default MakePrecheck;
