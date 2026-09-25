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
  Alert,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  Chip,
  Grid,
  Typography,
  IconButton,
  Button,
} from "@mui/material";
import { Close as CloseIcon, FileDownload as FileDownloadIcon } from "@mui/icons-material";
import {
  viewPrecheckDetails,
  makePrecheck,
  clearPrecheckData,
  addQRCodeDetails,
  rejectComponentMRS,
  exportPrecheckDetails,
  remainingPrecheck,
  setHasPendingScans,
  deletePrecheckDetails,
  removePrecheckDetails,
} from "../../store/slices/precheckSlice";
import {
  getBarcodeDetails,
  updateQrCodeDetails,
} from "../../store/slices/qrcodeSlice";
import {
  useProductionSeries,
  useLnItemCodeSearch,
  useAllDrawingNumbers,
} from "../../hooks/useMasterData";
import {
  usePONumbers,
  usePODetails,
  type ProductionOrderMaster,
} from "../../hooks/usePONumbers";
import { useDebounce } from "../../hooks/useDebounce";

import type { RootState, AppDispatch } from "../../store/store";
import debounce from "lodash.debounce";
import { getErrorMessage } from "../../utils/errorUtils";
import { createMaterialRequisition } from "../../store/slices/materialRequisitionSlice";

// Sub-component imports
import type { GridItem } from "./make-precheck/types";

import QuantityDialog from "./make-precheck/QuantityDialog";
import RejectDialog from "./make-precheck/RejectDialog";
import AddQrCodeDialog from "./make-precheck/AddQrCodeDialog";
import {
  BatchWarningDialog,
  CameraPermissionDialog,
} from "./make-precheck/ConfirmationDialogs";
import QrScannerDialog from "./make-precheck/QrScannerDialog";
import PrecheckFormControls from "./make-precheck/PrecheckFormControls";
import PrecheckActionBar, { PrecheckHeaderBar } from "./make-precheck/PrecheckActionBar";
import PrecheckTable from "./make-precheck/PrecheckTable";
import { usePrecheckScanning } from "./make-precheck/usePrecheckScanning";
import ExcelUploadResultDialog from "./make-precheck/ExcelUploadResultDialog";
import AddBomDrawingDialog from "./make-precheck/AddBomDrawingDialog";
import AddMaterialRequisitionDialog from "./make-precheck/AddMaterialRequisitionDialog";

const MAKE_PRECHECK_EXPORT_COLUMNS = [
  { key: "lnItemCode", label: "Item Code" },
  { key: "drawingNumber", label: "Part Number" },
  { key: "nomenclature", label: "Item Description" },
  { key: "quantity", label: "Qty" },
  { key: "scannedQuantity", label: "Scanned Qty" },
  { key: "remainingQuantity", label: "Remaining Qty" },
  { key: "qrCode", label: "QR Code" },
  { key: "idNumber", label: "ID Number" },
  { key: "ir", label: "IR Number" },
  { key: "msn", label: "MSN Number" },
  { key: "mrirNumber", label: "MRIR Number" },
  { key: "componentType", label: "Type" },
  { key: "precheckStatus", label: "Precheck Status" },
  { key: "remarks", label: "Remarks" },
];

const findMatchingDrawingInList = (
  allDrawings: any[],
  target: { drawingNumberId?: number; drawingNumber?: string; lnItemCode?: string }
) => {
  if (!allDrawings || allDrawings.length === 0 || !target) return null;

  // 1. First priority: match by drawingNumberId / id
  if (target.drawingNumberId) {
    const byId = allDrawings.find(
      (d: any) => d.id === target.drawingNumberId || d.drawingNumberId === target.drawingNumberId
    );
    if (byId) return byId;
  }

  // 2. Second priority: match by drawingNumber (exact string match, case-insensitive)
  if (target.drawingNumber && String(target.drawingNumber).trim()) {
    const targetDwgLower = String(target.drawingNumber).trim().toLowerCase();
    const byDwg = allDrawings.find(
      (d: any) => d.drawingNumber && String(d.drawingNumber).trim().toLowerCase() === targetDwgLower
    );
    if (byDwg) return byDwg;
  }

  // 3. Third priority: fallback to lnItemCode ONLY if drawingNumber is NOT specified
  if (!target.drawingNumber && target.lnItemCode && String(target.lnItemCode).trim()) {
    const targetLnLower = String(target.lnItemCode).trim().toLowerCase();
    const byLn = allDrawings.find(
      (d: any) => d.lnItemCode && String(d.lnItemCode).trim().toLowerCase() === targetLnLower
    );
    if (byLn) return byLn;
  }

  return null;
};

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
  const { data: allDrawingNumbers = [], isLoading: drawingLoading } = useAllDrawingNumbers();
  const drawingNumbersData = allDrawingNumbers;
  const { isLoading: isLnSearchLoading } =
    useLnItemCodeSearch(debouncedLnSearch);
  const { data: poNumbers = [], isLoading: poLoading } =
    usePONumbers(debouncedPOSearch);

  const isClearedRef = useRef(false);

  // Get PO details from navigation state if available
  const navigationState = location.state as any;
  const activePONumber = selectedPO?.productionOrderNumber || navigationState?.productionOrderNumber;
  const { data: poDetailsData } = usePODetails(
    activePONumber,
  );

  const { user } = useSelector((state: RootState) => state.auth);

  const isAdminOrHead = true;

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

  // Add Material Requisition dialog state
  const [materialReqDialogOpen, setMaterialReqDialogOpen] = useState(false);
  const [selectedRowForMaterialReq, setSelectedRowForMaterialReq] = useState<GridItem | null>(null);

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
    openScanner,
    scannerError,
    uploadInProgress,
    uploadError,
    facingMode,
    scannerReady,
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

    handleDownloadTemplate,
  } = usePrecheckScanning({
    searchResults,
    setSearchResults,
    user,
    showAlertMessage,
    setBatchWarningOpen,
    onAutoSubmit: (updatedItems?: GridItem[]) => {
      handleSubmitPrecheck(updatedItems);
    },
    onExcelUploadSuccess: () => {
      // Reload current grid if we have loaded data
      if (hasLoadedData && selectedDrawing && selectedProductionSeries && idNumber) {
        executeMakePrecheck();
      }
    },
    // Form-level context forwarded to usePrecheckScanning for the ViewPrecheck
    // duplicate-QR check on BATCH / FIM / SI scans
    selectedDrawingId: selectedDrawing?.id ?? selectedDrawing?.drawingNumberId,
    selectedProductionSeriesId:
      selectedProductionSeries?.id ??
      selectedProductionSeries?.prodSeriesId ??
      selectedProductionSeries?.productionSeriesId,
    selectedIdNumber: idNumber,
    selectedProductionOrderNumber: selectedPO?.productionOrderNumber,
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

    if (navigationState && navigationState.drawingNumber && !hasLoadedData && !isClearedRef.current) {
      console.log("Navigation state detected:", navigationState);

      // Wait for master data to load
      if (allDrawingNumbers.length > 0 && productionSeriesData.length > 0) {
        // Find matching drawing number using precise matching
        const matchingDrawing = findMatchingDrawingInList(allDrawingNumbers, navigationState);

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
              })
              .catch((error) => {
                console.error("Error auto-loading BOM:", error);
                showAlertMessage(
                  getErrorMessage(error, "Error loading BOM data"),
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

  // Handle PO details when fetched via usePODetails (for both navigation and manual selection)
  useEffect(() => {
    if (poDetailsData && !isClearedRef.current) {
      if (!selectedPO || selectedPO.productionOrderNumber === poDetailsData.productionOrderNumber) {
        setSelectedPO((prev) => (prev ? { ...poDetailsData, ...prev } : poDetailsData));
      }

      // Map Production Series if not set yet or lacks id
      if ((poDetailsData.productionSeries || poDetailsData.prodSeriesId) && (!selectedProductionSeries || !selectedProductionSeries.id)) {
        let matchingProdSeries = null;
        if (productionSeriesData && productionSeriesData.length > 0) {
          matchingProdSeries = productionSeriesData.find(
            (ps: any) =>
              (poDetailsData.prodSeriesId && ps.id === poDetailsData.prodSeriesId) ||
              (ps.productionSeries && poDetailsData.productionSeries && String(ps.productionSeries).trim().toLowerCase() === String(poDetailsData.productionSeries).trim().toLowerCase()),
          );
        }
        if (matchingProdSeries) {
          setSelectedProductionSeries(matchingProdSeries);
        } else if (!selectedProductionSeries) {
          setSelectedProductionSeries({
            id: poDetailsData.prodSeriesId,
            productionSeries: poDetailsData.productionSeries || "",
          });
        }
      }

      // Map ID Number if not set yet
      const navState = location.state as any;
      const poStartId = poDetailsData.startIdNumber ?? poDetailsData.endIdNumber;
      const targetId = navState?.startIdNumber ?? navState?.idNumber ?? poStartId;
      if (targetId !== undefined && targetId !== null && !idNumber) {
        setIdNumber(targetId.toString());
      }

      // Map Drawing if not set yet or lacks id
      if (poDetailsData.drawingNumber || poDetailsData.drawingNumberId || poDetailsData.lnItemCode) {
        const matchingDrawing = findMatchingDrawingInList(allDrawingNumbers, poDetailsData);

        if (matchingDrawing) {
          setSelectedDrawing(matchingDrawing);
        } else if (!selectedDrawing || !selectedDrawing.id) {
          setSelectedDrawing({
            id: poDetailsData.drawingNumberId,
            drawingNumber: poDetailsData.drawingNumber || "",
            lnItemCode: poDetailsData.lnItemCode || "",
            nomenclature: poDetailsData.nomenclature || "",
            componentType: poDetailsData.componentType || "",
          });
        }
      }
    }
  }, [
    poDetailsData,
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
    const drawingVal = selectedDrawing?.drawingNumber || (typeof selectedDrawing === "string" ? selectedDrawing : null);
    const prodSeriesVal =
      selectedProductionSeries?.id ||
      selectedProductionSeries?.prodSeriesId ||
      selectedProductionSeries?.productionSeriesId ||
      selectedProductionSeries?.productionSeries ||
      (typeof selectedProductionSeries === "string" ? selectedProductionSeries : null);
    const mandatoryFieldsFilled = Boolean(drawingVal && prodSeriesVal && idNumber);

    // Check if ID Number is within valid range for the selected PO
    const isIdWithinRange =
      !selectedPO?.endIdNumber ||
      !idNumber ||
      parseInt(idNumber) <= selectedPO.endIdNumber;

    // Enable button whenever mandatory fields are filled and within range
    setIsMakePrecheckEnabled(Boolean(mandatoryFieldsFilled && isIdWithinRange));
  };

  const handleMakePrecheck = async () => {
    if (!validateInputs()) return;

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
      setHasLoadedData(true);
      setOriginalDrawingNumber(selectedDrawing?.drawingNumber || null);
      setOriginalProdSeries(
        selectedProductionSeries?.id ||
        selectedProductionSeries?.prodSeriesId ||
        selectedProductionSeries?.productionSeriesId ||
        null
      );
      setOriginalAssemblyNumber(activeIdNumber);

      const drawingIdVal = selectedDrawing?.id ?? selectedDrawing?.drawingNumberId;
      const prodSeriesIdVal =
        selectedProductionSeries?.id ??
        selectedProductionSeries?.prodSeriesId ??
        selectedProductionSeries?.productionSeriesId;

      const payload = {
        DrawingNumberId: drawingIdVal,
        ProductionSeriesId: prodSeriesIdVal,
        Id: activeIdNumber ? parseInt(activeIdNumber) : undefined,
        ProductionOrderNumber: selectedPO?.productionOrderNumber,
      };

      const response = await dispatch(viewPrecheckDetails(payload)).unwrap();
      await updateGridItems(response);

      setShowResults(true);
    } catch (error: any) {
      console.error("Error in LoadGridData:", error);
      setSearchResults([]);
      setShowResults(true);
      showAlertMessage(
        getErrorMessage(error, "Failed to fetch precheck details"),
        "error",
      );
    } finally {
      setIsLoadingLocal(false);
      validateFields();
    }
  };

  const validateInputs = () => {
    const missingFields = [];

    if (!selectedDrawing) missingFields.push("Part Number");
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

  const handleSubmitPrecheck = async (itemsList?: GridItem[]) => {
    try {
      setIsLoadingLocal(true);

      const targetList = (itemsList && itemsList.length > 0) ? itemsList : searchResults;

      const componentsToSubmit = targetList
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
      showAlertMessage(getErrorMessage(error, "Error submitting precheck"), "error");
    } finally {
      setIsLoadingLocal(false);
    }
  };

  // Cleanup function
  const resetAllData = useCallback(() => {
    isClearedRef.current = true;
    navigate(location.pathname, { replace: true, state: null });

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

  // Export Modal state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportMode, setExportMode] = useState<"all" | "custom">("all");
  const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>([]);

  const handleOpenExportDialog = () => {
    setSelectedExportColumns(MAKE_PRECHECK_EXPORT_COLUMNS.map((c) => c.key));
    setExportMode("all");
    setExportDialogOpen(true);
  };

  const handleToggleSelectAllColumns = () => {
    if (selectedExportColumns.length === MAKE_PRECHECK_EXPORT_COLUMNS.length) {
      setSelectedExportColumns([]);
    } else {
      setSelectedExportColumns(MAKE_PRECHECK_EXPORT_COLUMNS.map((c) => c.key));
    }
  };

  const handleToggleColumn = (key: string) => {
    setSelectedExportColumns((prev) => {
      const updated = prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key];
      return MAKE_PRECHECK_EXPORT_COLUMNS.map((c) => c.key).filter((k) => updated.includes(k));
    });
  };

  const handleConfirmExportData = () => {
    const selectedCols = exportMode === "all"
      ? MAKE_PRECHECK_EXPORT_COLUMNS.map((c) => c.key)
      : MAKE_PRECHECK_EXPORT_COLUMNS.filter((col) => selectedExportColumns.includes(col.key)).map((col) => col.key);

    const exportParams: any = {};

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

    if (Object.keys(exportParams).length === 0) {
      alert("Please enter at least one search criteria before exporting");
      return;
    }

    exportParams.remainingPrecheck = filterRemainingOnly;
    exportParams.selectedColumns = selectedCols;

    dispatch(exportPrecheckDetails(exportParams))
      .unwrap()
      .then(() => {
        setExportDialogOpen(false);
      })
      .catch((error) => {
        alert(error.message || "Failed to export precheck details");
      });
  };

  // handle export
  const handleExport = () => {
    handleOpenExportDialog();
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

  const updateGridItems = async (response: any) => {
    const rawList = Array.isArray(response)
      ? response
      : (response?.data || response?.items || response?.$values || []);

    if (!rawList || rawList.length === 0) {
      setSearchResults([]);
      showAlertMessage("No precheck records found for the selected filter.", "warning");
      return;
    }

    // Sort API response by drawingNumber in ascending order (grouping same drawing numbers together)
    const sortedRawList = [...rawList].sort((a: any, b: any) => {
      const dwgA = String(a.drawingNumber || a.drawingNo || "").trim().toLowerCase();
      const dwgB = String(b.drawingNumber || b.drawingNo || "").trim().toLowerCase();
      return dwgA.localeCompare(dwgB, undefined, { numeric: true, sensitivity: "base" });
    });

    // Map the response to objects and assign sequential SRs based on sorted order
    const finalItems = sortedRawList.map((item: any, index: number) => ({
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
      rejectedUserName: item.rejectedUserName || item.rejectedByUsername || item.rejectedUser || "",
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
      precheckStatus: (item.isRejected || item.precheckStatus?.toLowerCase() === "rejected") ? "Rejected" : item.precheckStatus,
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
        py: { xs: 0.5, sm: 0.75 }, px: { xs: 1.5, sm: 2 },
        height: "calc(100vh - 64px)",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
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

      {/* Page Title & More Action Button at Top Header */}
      <PrecheckHeaderBar
        filterRemainingOnly={filterRemainingOnly}
        onToggleFilter={() => setFilterRemainingOnly(!filterRemainingOnly)}
        onExport={handleExport}
        onReset={handleReset}
        onUploadExcel={() => excelFileInputRef.current?.click()}
        onDownloadTemplate={handleDownloadTemplate}
        onReject={() => navigate("/materialrequisition")}
        isSubmitEnabled={isSubmitEnabled}
        uploadInProgress={uploadInProgress}
        downloadTemplateInProgress={downloadTemplateInProgress}
        isLoadingLocal={isLoadingLocal}
      />

      {/* Filter Controls Bar */}
      <PrecheckFormControls
        selectedPO={selectedPO}
        poNumbers={poNumbers}
        poLoading={poLoading}
        onPOSearchChange={(inputValue) => setPOSearchText(inputValue)}
        onPOChange={(newValue) => {
          isClearedRef.current = false;
          if (newValue) {
            setSelectedPO(newValue);
            // Auto-fill form fields from PO using precise drawing matching
            const matchingDrawing = findMatchingDrawingInList(allDrawingNumbers, newValue);
            if (matchingDrawing) {
              setSelectedDrawing(matchingDrawing);
            } else if (newValue.drawingNumberId || newValue.drawingNumber || newValue.lnItemCode) {
              setSelectedDrawing({
                id: newValue.drawingNumberId,
                drawingNumber: newValue.drawingNumber || "",
                lnItemCode: newValue.lnItemCode || "",
                nomenclature: newValue.nomenclature || "",
                componentType: newValue.componentType || "",
              });
            }

            if (newValue.productionSeries || newValue.prodSeriesId) {
              let matchingPS = null;
              if (productionSeriesData && productionSeriesData.length > 0) {
                matchingPS = productionSeriesData.find(
                  (ps: any) =>
                    (newValue.prodSeriesId && ps.id === newValue.prodSeriesId) ||
                    (ps.productionSeries && newValue.productionSeries && String(ps.productionSeries).trim().toLowerCase() === String(newValue.productionSeries).trim().toLowerCase()),
                );
              }
              if (matchingPS) {
                setSelectedProductionSeries(matchingPS);
              } else {
                setSelectedProductionSeries({
                  id: newValue.prodSeriesId,
                  productionSeries: newValue.productionSeries || "",
                });
              }
            }

            if (newValue.startIdNumber !== undefined && newValue.startIdNumber !== null) {
              setIdNumber(newValue.startIdNumber.toString());
            }
          } else {
            setSelectedPO(null);
            setSelectedDrawing(null);
            setSelectedProductionSeries(null);
            setIdNumber("");
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
        onApply={handleMakePrecheck}
        onClear={handleReset}
        isApplyEnabled={isMakePrecheckEnabled}
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

      {/* Action Bar + Header + Scanner Hero Panel */}
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
        selectedPONumber={selectedPO?.productionOrderNumber || ""}
        selectedLnItemCode={selectedDrawing?.lnItemCode || ""}
        searchResults={searchResults}
        filterRemainingOnly={filterRemainingOnly}
        onToggleFilter={() => setFilterRemainingOnly(!filterRemainingOnly)}
        onExport={handleExport}
        onReset={handleReset}
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
        onRejectClick={(item) => {
          setSelectedRowForMaterialReq(item);
          setMaterialReqDialogOpen(true);
        }}
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

      {/* Add Material Requisition Dialog */}
      <AddMaterialRequisitionDialog
        open={materialReqDialogOpen}
        selectedRow={selectedRowForMaterialReq}
        selectedPO={selectedPO}
        selectedProductionSeries={selectedProductionSeries}
        allDrawingNumbers={allDrawingNumbers}
        poNumbersData={poNumbers}
        productionSeriesData={productionSeriesData}
        onClose={() => {
          setMaterialReqDialogOpen(false);
          setSelectedRowForMaterialReq(null);
        }}
        onSubmit={async (payload) => {
          try {
            await dispatch(createMaterialRequisition(payload)).unwrap();
            showAlertMessage("Material Requisition created successfully!", "success");
            setMaterialReqDialogOpen(false);
            setSelectedRowForMaterialReq(null);
            if (hasLoadedData && selectedDrawing && selectedProductionSeries && idNumber) {
              executeMakePrecheck();
            }
          } catch (err: any) {
            console.error("Error creating material requisition:", err);
            showAlertMessage(getErrorMessage(err, "Failed to create material requisition"), "error");
            throw err;
          }
        }}
      />

      {/* Batch Warning Dialog */}
      <BatchWarningDialog
        open={batchWarningOpen}
        onClose={() => setBatchWarningOpen(false)}
      />

      {/* Reload/Reset Confirmation Dialog (Disabled as requested) */}
      {/* <ReloadConfirmationDialog
        open={showReloadConfirmation}
        onClose={() => setShowReloadConfirmation(false)}
      /> */}

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

      {/* Export Options Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "16px", p: 1 },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: 700,
            color: "#101828",
            fontSize: "1.1rem",
            pb: 1,
          }}
        >
          Export Precheck Details
          <IconButton size="small" onClick={() => setExportDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2 }}>
          <FormControl component="fieldset" sx={{ width: "100%" }}>
            <Typography variant="subtitle2" fontWeight="600" color="#475467" sx={{ mb: 1 }}>
              Choose Export Option:
            </Typography>

            <RadioGroup
              value={exportMode}
              onChange={(e) => {
                const newMode = e.target.value as "all" | "custom";
                setExportMode(newMode);
                if (newMode === "custom") {
                  setSelectedExportColumns(MAKE_PRECHECK_EXPORT_COLUMNS.map((c) => c.key));
                }
              }}
              sx={{ mb: 2 }}
            >
              <FormControlLabel
                value="all"
                control={<Radio size="small" sx={{ color: "primary.main", "&.Mui-checked": { color: "primary.main" } }} />}
                label={<Typography variant="body2" fontWeight="600">Export All Columns</Typography>}
              />
              <FormControlLabel
                value="custom"
                control={<Radio size="small" sx={{ color: "primary.main", "&.Mui-checked": { color: "primary.main" } }} />}
                label={<Typography variant="body2" fontWeight="600">Select Specific Columns to Export</Typography>}
              />
            </RadioGroup>

            {exportMode === "custom" && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  bgcolor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5} pb={1} borderBottom="1px solid #e2e8f0">
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={selectedExportColumns.length === MAKE_PRECHECK_EXPORT_COLUMNS.length}
                        indeterminate={
                          selectedExportColumns.length > 0 &&
                          selectedExportColumns.length < MAKE_PRECHECK_EXPORT_COLUMNS.length
                        }
                        onChange={handleToggleSelectAllColumns}
                        sx={{ color: "primary.main", "&.Mui-checked": { color: "primary.main" } }}
                      />
                    }
                    label={
                      <Typography variant="body2" fontWeight="700">
                        {selectedExportColumns.length === MAKE_PRECHECK_EXPORT_COLUMNS.length ? "Deselect All" : "Select All Columns"}
                      </Typography>
                    }
                  />
                  <Chip
                    label={`${selectedExportColumns.length} / ${MAKE_PRECHECK_EXPORT_COLUMNS.length} selected`}
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: "primary.main", color: "primary.main" }}
                  />
                </Box>

                <Grid container spacing={1}>
                  {MAKE_PRECHECK_EXPORT_COLUMNS.map((col) => (
                    <Grid item xs={6} sm={4} key={col.key}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={selectedExportColumns.includes(col.key)}
                            onChange={() => handleToggleColumn(col.key)}
                            sx={{ color: "primary.main", "&.Mui-checked": { color: "primary.main" } }}
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontSize: "0.85rem" }}>{col.label}</Typography>}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </FormControl>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            onClick={() => setExportDialogOpen(false)}
            sx={{ minWidth: 110, fontWeight: 600, borderRadius: "8px", textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<FileDownloadIcon fontSize="small" />}
            onClick={handleConfirmExportData}
            disabled={exportMode === "custom" && selectedExportColumns.length === 0}
            sx={{
              minWidth: 110,
              fontWeight: 600,
              borderRadius: "8px",
              textTransform: "none",
              backgroundColor: "primary.main",
              "&:hover": { backgroundColor: "primary.dark" },
            }}
          >
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MakePrecheck;
