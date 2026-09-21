import { useState, useEffect, useMemo, useRef } from "react";
import QRCode from "qrcode";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Alert,
  useTheme,
  Stack,
  CircularProgress,
  Backdrop,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
} from "@mui/material";

import {
  QrCode as QrCodeIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import type { RootState, AppDispatch } from "../../store/store";
import type {
  DrawingNumber,
  QRCodeFormData,
  IRNumber,
  MSNNumber,
  QRCodePayload,
} from "../../types";
import {
  generateQRCode,
  generateStandardFieldQRCode,
  exportQRCode,
  exportBulkQRCodes,
  bulkUpdateQRCode,
  getBarcodeDetails,
  clearError,
  clearGeneratedNumber,
  clearQRCodeList,
} from "../../store/slices/qrcodeSlice";
import {
  useDrawingNumbers,
  useUnits,
  useIRNumbers,
  useMSNNumbers,
  useLnItemCodeSearch,
  useAllDrawingNumbers,
  useProductionSeries,
  useShapes,
} from "../../hooks/useMasterData";
import {
  usePONumbers,
  type ProductionOrderMaster,
} from "../../hooks/usePONumbers";
import debounce from "lodash/debounce";
import QRCodeErrorDisplay from "../../components/QRCodeErrorDisplay";
import { useDebounce } from "../../hooks/useDebounce";
import {
  DrawingDetailsStep,
  ComponentTypeStep,
  DispositionStep,
  LabelPreviewPanel,
  QRCodesTable,
  ExportColumnDialog,
  BulkUpdateDialog,
  ExistingQRCodesDialog,
  ALL_BARCODE_EXPORT_COLUMNS,
} from "./barcode-generation";

// Create typed versions of the hooks
const useAppDispatch: () => AppDispatch = useDispatch;

export default function BarcodeGeneration() {
  const theme = useTheme();
  const [qrTypeState, setQrTypeState] = useState<string>("ID");

  const dispatch = useAppDispatch();

  // Redux state
  const { qrcodeList, batchItems, loading, error, isDownloading } = useSelector(
    (state: RootState) => state.qrcode,
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const lastAutoRemarkRef = useRef("");

  // Clear previous error from Redux state on component mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // TanStack Query Hooks
  const [drawingSearchText, setDrawingSearchText] = useState("");
  const [irSearchText, setIrSearchText] = useState("");
  const [msnSearchText, setMsnSearchText] = useState("");
  const [poSearchText, setPOSearchText] = useState("");
  const debouncedPOSearch = useDebounce(poSearchText, 150);

  const { data: productionSeries = [] } = useProductionSeries();
  const { data: allDrawingNumbers = [] } = useAllDrawingNumbers();
  const { data: searchedDrawingNumbers = [] } = useDrawingNumbers(
    "",
    drawingSearchText,
  );
  const drawingNumbers =
    (drawingSearchText.length >= 1
      ? searchedDrawingNumbers
      : allDrawingNumbers) || [];

  const { data: units = [] } = useUnits();
  const { data: shapesData = [] } = useShapes();
  const [noExpiryDate, setNoExpiryDate] = useState(false);
  // Local state
  const [selectedDrawing, setSelectedDrawing] = useState<DrawingNumber | null>(
    null,
  );
  const [selectedIRNumber, setSelectedIRNumber] = useState<IRNumber | null>(
    null,
  );
  const [selectedMSNNumber, setSelectedMSNNumber] = useState<MSNNumber | null>(
    null,
  );
  const [selectedPO, setSelectedPO] = useState<ProductionOrderMaster | null>(
    null,
  );

  const { data: poNumbers = [], isLoading: poLoading } =
    usePONumbers(debouncedPOSearch);

  // TanStack Query: Search state for LN item codes
  const [debouncedLnSearch, setDebouncedLnSearch] = useState("");

  // Debounce the search term to avoid too many API calls
  const updateDebouncedLnSearch = useMemo(
    () => debounce((value: string) => setDebouncedLnSearch(value), 300),
    [],
  );

  // Search hook - only used when user types 2+ characters
  const { isLoading: isLnSearchLoading, isFetching: isLnSearchFetching } =
    useLnItemCodeSearch(debouncedLnSearch);
  const [componentType, setComponentType] = useState<
    "ID" | "BATCH" | "Batch" | "FIM" | "SI"
  >("ID");
  const [randomIds, setRandomIds] = useState<string[]>(Array(200).fill(""));
  const [visibleRandomCount, setVisibleRandomCount] = useState<number>(20);


  // Export Column Selection Dialog state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [pendingExportTarget, setPendingExportTarget] = useState<{
    type: "single" | "bulk";
    qrCodeId?: string;
    batchId?: string;
  } | null>(null);

  const handleOpenSingleExportDialog = (qrCodeId: string, batchId?: string) => {
    setPendingExportTarget({ type: "single", qrCodeId, batchId });
    setExportDialogOpen(true);
  };

  const handleOpenBulkExportDialog = () => {
    setPendingExportTarget({ type: "bulk" });
    setExportDialogOpen(true);
  };

  const handleConfirmExportData = async (selectedCols: string[], exportMode: "all" | "custom") => {
    const cols =
      exportMode === "all"
        ? ALL_BARCODE_EXPORT_COLUMNS.map((c) => c.key)
        : selectedCols;

    if (pendingExportTarget?.type === "single" && pendingExportTarget.qrCodeId) {
      await dispatch(
        exportQRCode({
          qrCodeId: pendingExportTarget.qrCodeId,
          batchId: pendingExportTarget.batchId,
          selectedColumns: cols,
        }),
      );
    } else {
      await dispatch(
        exportBulkQRCodes({
          qrCodes: selectedBarcodes,
          selectedColumns: cols,
        }) as any,
      );
    }
    setExportDialogOpen(false);
  };

  // QrTableRows for FIM / Purchase Item matrix table
  const [QrTableRows, setQrTableRows] = useState<Array<{
    srNo: number;
    idNo: string;
    quantity: number | string;
    size: string;
    mirir: string;
    heatLotBatchNo: string;
  }>>(
    Array.from({ length: 5 }, (_, index) => ({
      srNo: index + 1,
      idNo: "",
      quantity: "",
      size: "",
      mirir: "",
      heatLotBatchNo: "",
    })),
  );

  const addNewQrRow = () => {
    setQrTableRows((prev) => [
      ...prev,
      {
        srNo: prev.length + 1,
        idNo: "",
        quantity: "",
        size: "",
        mirir: "",
        heatLotBatchNo: "",
      },
    ]);
  };

  // State & Handlers for Add Multiple Rows Dialog
  const [addRowsDialogOpen, setAddRowsDialogOpen] = useState(false);
  const [rowsToAddCount, setRowsToAddCount] = useState<number | string>(1);

  const handleOpenAddRowsDialog = () => {
    setRowsToAddCount(1);
    setAddRowsDialogOpen(true);
  };

  const handleCloseAddRowsDialog = () => {
    setAddRowsDialogOpen(false);
  };

  const handleAddMultipleRowsSubmit = () => {
    const count = parseInt(String(rowsToAddCount), 10);
    if (!isNaN(count) && count > 0) {
      setQrTableRows((prev) => {
        const currentLength = prev.length;
        const newRows = Array.from({ length: count }, (_, i) => ({
          srNo: currentLength + i + 1,
          idNo: "",
          quantity: "",
          size: "",
          mirir: "",
          heatLotBatchNo: "",
        }));
        return [...prev, ...newRows];
      });
    }
    setAddRowsDialogOpen(false);
  };

  const handleEnterKey = (
    e: React.KeyboardEvent,
    rowIndex: number,
    fieldName: "idNo" | "quantity" | "size" | "mirir" | "heatLotBatchNo",
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextRowIndex = rowIndex + 1;
      if (nextRowIndex < QrTableRows.length) {
        setTimeout(() => {
          const el = document.getElementById(`qr-matrix-${fieldName}-${nextRowIndex}`);
          if (el) el.focus();
        }, 0);
      } else {
        addNewQrRow();
        setTimeout(() => {
          const el = document.getElementById(`qr-matrix-${fieldName}-${nextRowIndex}`);
          if (el) el.focus();
        }, 50);
      }
    }
  };

  const handleQrTableChange = (
    index: number,
    field: "idNo" | "quantity" | "size" | "mirir" | "heatLotBatchNo",
    value: string | number,
  ) => {
    setQrTableRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const totalQuantity = useMemo(
    () =>
      QrTableRows.reduce((acc, row) => {
        if (row.idNo.trim() !== "") {
          const qty = typeof row.quantity === "number"
            ? row.quantity
            : typeof row.quantity === "string"
              ? parseFloat(row.quantity) || 0
              : 0;
          return acc + qty;
        }
        return acc;
      }, 0),
    [QrTableRows],
  );
  const [selectedBarcodes, setSelectedBarcodes] = useState<string[]>([]);
  const [displayedQRCodes, setDisplayedQRCodes] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };
  const [openExistingDialog, setOpenExistingDialog] = useState(false);
  const [existingItems, setExistingItems] = useState<any[]>([]);
  const [poInputValue, setPoInputValue] = useState("");

  // Bulk Update states
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkSelectedProductionSeries, setBulkSelectedProductionSeries] = useState<any>(null);
  const [bulkAvailableFor, setBulkAvailableFor] = useState("");
  const [bulkProject, setBulkProject] = useState("");
  const [bulkRackLocationId, setBulkRackLocationId] = useState<number | "">("");
  const [bulkSelectedUnit, setBulkSelectedUnit] = useState<any>(null);
  const [bulkMrir, setBulkMrir] = useState("");
  const [bulkSelectedIR, setBulkSelectedIR] = useState<any>(null);
  const [bulkSelectedMSN, setBulkSelectedMSN] = useState<any>(null);
  const poStartId = Number(selectedPO?.startIdNumber || (selectedPO as any)?.startRange || 0);
  const poEndId = Number(selectedPO?.endIdNumber || (selectedPO as any)?.endRange || (poStartId > 0 && selectedPO?.quantity ? poStartId + Number(selectedPO.quantity) - 1 : 0));
  const idRangeNotice = (selectedPO && poStartId > 0 && poEndId > 0) ? `select id between ${poStartId}-${poEndId}` : "";

  // Helper to format component type for display
  const formatComponentType = (type: string | undefined | null) => {
    if (!type) return "";
    const upper = type.toUpperCase();
    if (upper === "BATCH") return "Batch";
    return upper;
  };

  // Helper to sync componentType and qrType dropdown whenever PO or Drawing changes
  const updateComponentAndQrType = (typeStr: string | undefined | null) => {
    if (!typeStr) return;
    const upper = typeStr.toUpperCase();
    const normalizedCompType = (upper === "BATCH" ? "BATCH" : upper) as any;
    setComponentType(normalizedCompType);
    setValue("componentType", normalizedCompType);

    let targetQrType = upper;
    if (upper === "SI" || upper === "PURCHASE ITEM") {
      targetQrType = "Purchase Item";
    }
    setQrTypeState(targetQrType);
    setValue("qrType", targetQrType);
    clearErrors();
  };


  // Calculate quantity from ID range (similar to GenerateIRMSN logic)
  const calculateQuantityFromRange = (range: string): number => {
    const ids: number[] = [];
    const parts = range.split(",").map((part) => part.trim());

    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        for (let i = start; i <= end; i++) {
          ids.push(i);
        }
      } else {
        ids.push(Number(part));
      }
    }

    // Remove duplicates and return the count
    return [...new Set(ids.filter((id) => !isNaN(id)))].length;
  };

  // Form
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    clearErrors,
    formState: { errors },
  } = useForm<QRCodeFormData>({
    mode: "all",
    defaultValues: {
      qrType: "ID",
      drawingNumber: "",
      lnItemCode: "",
      nomenclature: "",
      productionSeries: "",
      componentType: "ID",
      idType: "series",
      startRange: 0,
      endRange: 0,
      quantity: 0,
      randomIds: Array(200).fill(""),
      customIdRange: "",
      batchId: "",
      unit: "",
      manufacturingDate: new Date() as any,
      expiryDate: undefined,
      irNumber: "",
      msnNumber: "",
      poNumber: "",
      projectNumber: "",
      mrirNumber: "",
      desposition: "" as any,
      location: "",
      partAssemblyId: "",
      remark: "",
      buildNumber: "",
      fanManNumber: "",
      fanManSerialNumber: "",
      customerItemCode: "",
      gfnNo: "",
      shapes: "",
      material: "",
      rmItemCode: "",
    },
  });

  const watchComponentType = watch("componentType");
  const watchIdType = watch("idType");
  const watchQuantity = watch("quantity");
  const watchStartRange = watch("startRange");
  const watchEndRange = watch("endRange");
  const watchCustomIdRange = watch("customIdRange" as any);
  const watchRemarks = watch("remark");
  const watchProductionSeries = watch("productionSeries");
  const watchPoNumber = watch("poNumber");
  const watchDrawingNumber = watch("drawingNumber");
  const watchUnit = watch("unit");
  const watchIrNumber = watch("irNumber");
  const watchMsnNumber = watch("msnNumber");
  const watchMrirNumber = watch("mrirNumber");
  const watchMfgDate = watch("manufacturingDate");
  const watchDesposition = watch("desposition");
  const watchNomenclature = watch("nomenclature");
  const watchExpiryDate = watch("expiryDate");

  // State for live QR Code Label Preview image & input
  const [previewQrInput, setPreviewQrInput] = useState<string>("");
  const [labelQrDataUrl, setLabelQrDataUrl] = useState<string>("");
  const [fetchedPreviewItem, setFetchedPreviewItem] = useState<any | null>(null);

  // Fetch or look up barcode details when user enters a QR code number
  useEffect(() => {
    const trimmed = previewQrInput.trim();
    if (!trimmed) {
      setFetchedPreviewItem(null);
      return;
    }

    const matchQr = (item: any) => {
      if (!item) return false;
      const candidates = [
        item.qrCodeNumber,
        item.QrCodeNumber,
        item.serialNumber,
        item.SerialNumber,
        item.qrCode,
        item.QrCode,
        item.idNumber,
        item.IdNumber,
        item.idNo,
        item.IdNo,
      ];
      return candidates.some(
        (val) => val !== undefined && val !== null && String(val).toLowerCase() === trimmed.toLowerCase()
      );
    };

    // 1. Search in qrcodeList (generated QR codes list in state) and displayedQRCodes (local table rows)
    const localMatch =
      (qrcodeList || []).find(matchQr) ||
      (displayedQRCodes || []).find(matchQr);

    if (localMatch) {
      setFetchedPreviewItem(localMatch);
      return;
    }

    // 2. Fetch from backend API if length >= 3
    if (trimmed.length >= 3) {
      const timer = setTimeout(async () => {
        try {
          const result = await dispatch(getBarcodeDetails(trimmed)).unwrap();
          const rawObj = result?.data ? result.data : result;
          const data = Array.isArray(rawObj) ? rawObj[0] : rawObj;
          if (data && typeof data === "object" && Object.keys(data).length > 0) {
            setFetchedPreviewItem(data);
          } else {
            setFetchedPreviewItem(null);
          }
        } catch (e) {
          setFetchedPreviewItem(null);
        }
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setFetchedPreviewItem(null);
    }
  }, [previewQrInput, qrcodeList, displayedQRCodes, dispatch]);

  const labelQrText = useMemo(() => {
    if (previewQrInput.trim()) {
      return previewQrInput.trim();
    }
    const po = watchPoNumber || "PO-0001";
    const drw = watchDrawingNumber || "DRW-0001";
    const series = watchProductionSeries || "SERIES-A";
    const idStr =
      watchIdType === "series"
        ? `${watchStartRange || 1}-${watchEndRange || 1}`
        : watchCustomIdRange || "ID-001";
    return `${po}|${drw}|${series}|${idStr}`;
  }, [
    previewQrInput,
    watchPoNumber,
    watchDrawingNumber,
    watchProductionSeries,
    watchIdType,
    watchStartRange,
    watchEndRange,
    watchCustomIdRange,
  ]);

  const debouncedLabelQrText = useDebounce(labelQrText, 300);

  useEffect(() => {
    if (!debouncedLabelQrText) {
      setLabelQrDataUrl("");
      return;
    }
    QRCode.toDataURL(debouncedLabelQrText, { margin: 1, width: 120 })
      .then((url) => setLabelQrDataUrl(url))
      .catch(() => setLabelQrDataUrl(""));
  }, [debouncedLabelQrText]);

  const requiredFieldsRemainingCount = useMemo(() => {
    let count = 0;

    const isIdOrBatch = componentType === "ID" || componentType === "BATCH";
    const isFimOrSi = componentType === "FIM" || componentType === "SI";

    // 1. PO Number (only required for ID & BATCH)
    if (isIdOrBatch && !watchPoNumber) {
      count++;
    }

    // 2. Drawing Number / LN Item Code
    if (isIdOrBatch) {
      if (!watchDrawingNumber && !selectedDrawing) count++;
    } else if (isFimOrSi) {
      if (!watchDrawingNumber && !selectedDrawing) count++;
    }

    // 3. Production Series (required for all)
    if (!watchProductionSeries) count++;

    // 4. Unit (required for all)
    if (!watchUnit) count++;

    // 5. IR Number (required for all)
    if (!watchIrNumber) count++;

    // 6. MSN Number (required for all)
    if (!watchMsnNumber) count++;

    // 6. MFG Date (required for all)
    if (!watchMfgDate) count++;

    // 7. Disposition (required for all)
    if (!watchDesposition) count++;

    // 8. ID Range / Matrix Table specific checks
    if (componentType === "ID") {
      if (watchIdType === "series") {
        if (!watchStartRange || Number(watchStartRange) <= 0) count++;
        if (!watchEndRange || Number(watchEndRange) <= 0) count++;
      } else if (watchIdType === "custom") {
        if (!watchCustomIdRange || !watchCustomIdRange.trim()) count++;
      } else if (watchIdType === "random") {
        const hasRandomId =
          Array.isArray(randomIds) &&
          randomIds.some((id) => id && String(id).trim() !== "");
        if (!hasRandomId && (!watchQuantity || Number(watchQuantity) <= 0))
          count++;
      }
    } else if (componentType === "BATCH") {
      if (!watchCustomIdRange || !watchCustomIdRange.trim()) count++;
    } else if (isFimOrSi) {
      const hasValidRow =
        Array.isArray(QrTableRows) &&
        QrTableRows.some(
          (row) =>
            row.idNo &&
            String(row.idNo).trim() !== "" &&
            row.quantity !== "" &&
            Number(row.quantity) > 0,
        );
      if (!hasValidRow) count++;
    }

    return count;
  }, [
    componentType,
    watchIdType,
    watchPoNumber,
    watchDrawingNumber,
    selectedDrawing,
    watchProductionSeries,
    watchUnit,
    watchMsnNumber,
    watchMfgDate,
    watchDesposition,
    watchStartRange,
    watchEndRange,
    watchCustomIdRange,
    watchQuantity,
    randomIds,
    QrTableRows,
  ]);

  // Master data handled by hooks
  const { data: irNumbers = [] } = useIRNumbers(
    irSearchText,
    undefined,
    undefined,
    selectedDrawing?.lnItemCode || undefined,
    watchProductionSeries || undefined,
  );
  const { data: msnNumbers = [] } = useMSNNumbers(
    msnSearchText,
    undefined,
    undefined,
    selectedDrawing?.lnItemCode || undefined,
    watchProductionSeries || undefined,
  );

  // Unfiltered IR and MSN Numbers specifically for bulk update dialog
  const { data: bulkIrNumbers = [] } = useIRNumbers(
    "",
    undefined,
    undefined,
    undefined,
    undefined,
  );
  const { data: bulkMsnNumbers = [] } = useMSNNumbers(
    "",
    undefined,
    undefined,
    undefined,
    undefined,
  );

  // Auto-update quantity when start range or end range changes for ID series
  useEffect(() => {
    if (
      watchStartRange !== undefined &&
      watchEndRange !== undefined &&
      (watchComponentType === "ID" ||
        watchComponentType === "FIM" ||
        watchComponentType === "SI") &&
      watchIdType === "series"
    ) {
      const start = Number(watchStartRange);
      const end = Number(watchEndRange);

      if (end >= start && !(start === 0 && end === 0)) {
        const quantity = end - start + 1;
        setValue("quantity", Math.floor(quantity));
      } else {
        setValue("quantity", 0);
      }
    }
  }, [
    watchStartRange,
    watchEndRange,
    watchComponentType,
    watchIdType,
    setValue,
  ]);

  // Auto-update quantity and remark for BATCH type or custom ID range
  useEffect(() => {
    if (
      watchCustomIdRange &&
      (watchComponentType === "BATCH" ||
        (watchComponentType === "ID" && watchIdType === "custom")) &&
      /^(\d+(-\d+)?)(,\s*\d+(-\d+)?)*$/.test(watchCustomIdRange)
    ) {
      const quantity = calculateQuantityFromRange(watchCustomIdRange);
      setValue("quantity", quantity);

      // For BATCH type, sync ID Range to Remark ONLY IF the user hasn't manually deviated
      if (watchComponentType === "BATCH") {
        if (watchRemarks === lastAutoRemarkRef.current) {
          setValue("remark", watchCustomIdRange);
          lastAutoRemarkRef.current = watchCustomIdRange;
        }
      }
    }
  }, [
    watchCustomIdRange,
    watchComponentType,
    watchIdType,
    watchRemarks, // Added to watch for manual changes
    setValue,
    calculateQuantityFromRange,
  ]);

  // Update component type visibility
  useEffect(() => {
    const typeToUse = watchComponentType || componentType || "ID";
    const normalizedType = typeToUse.toUpperCase() as any;
    setComponentType(normalizedType);
    if (normalizedType !== "ID") {
      setValue("idType", "series");
    }
  }, [watchComponentType, setValue]);

  // Sync FIM / SI total quantity from table matrix sum
  useEffect(() => {
    if (componentType === "FIM" || componentType === "SI") {
      setValue("quantity", totalQuantity, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [totalQuantity, componentType, setValue]);

  // Sync displayed QR codes with Redux qrcodeList
  useEffect(() => {
    setDisplayedQRCodes(qrcodeList || []);
    setPage(0);
  }, [qrcodeList]);

  // Close open dropdowns when scrolling the page (except when scrolling within option listbox)
  useEffect(() => {
    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement;
      if (
        target &&
        target.classList &&
        (target.classList.contains("MuiAutocomplete-listbox") ||
          target.closest?.(".MuiAutocomplete-popper") ||
          target.closest?.(".MuiAutocomplete-listbox"))
      ) {
        return;
      }
      if (
        document.activeElement instanceof HTMLElement &&
        (document.activeElement.tagName === "INPUT" ||
          document.activeElement.getAttribute("role") === "combobox")
      ) {
        document.activeElement.blur();
      }
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  // Debounced search functions
  const debouncedDrawingSearch = useMemo(
    () =>
      debounce((searchValue: string) => {
        setDrawingSearchText(searchValue);
      }, 150),
    [],
  );

  const debouncedIRSearch = useMemo(
    () =>
      debounce((searchValue: string) => {
        setIrSearchText(searchValue);
      }, 150),
    [],
  );

  const debouncedMSNSearch = useMemo(
    () =>
      debounce((searchValue: string) => {
        setMsnSearchText(searchValue);
      }, 150),
    [],
  );

  // Handler for IR autocomplete - clear search on clear
  const handleIRInputChange = (_: any, value: string) => {
    if (value.length === 0) {
      setIrSearchText("");
    } else {
      debouncedIRSearch(value);
    }
  };

  // Handler for MSN autocomplete - clear search on clear
  const handleMSNInputChange = (_: any, value: string) => {
    if (value.length === 0) {
      setMsnSearchText("");
    } else {
      debouncedMSNSearch(value);
    }
  };

  const handleIROpen = () => {
    setIrSearchText(""); // Clear search to show full list
  };

  const handleMSNOpen = () => {
    setMsnSearchText(""); // Clear search to show full list
  };

  // Handle random ID changes
  const handleRandomIdChange = (index: number, value: string) => {
    const newRandomIds = [...randomIds];
    newRandomIds[index] = value;
    setRandomIds(newRandomIds);
    setValue("randomIds", newRandomIds);

    // Update quantity based on filled random IDs
    const filledCount = newRandomIds.filter((id) => id.trim() !== "").length;
    setValue("quantity", filledCount);
  };



  // Prepare payload for QR code generation
  const preparePayload = (data: QRCodeFormData) => {
    const basePayload: QRCodePayload = {
      productionSeriesId:
        (productionSeries || []).find(
          (ps) => ps.productionSeries === data.productionSeries,
        )?.id || 0,
      componentTypeId: selectedDrawing?.componentTypeId || 0,
      nomenclatureId: selectedDrawing?.nomenclatureId || 0,
      lnItemCodeId: selectedDrawing?.lnItemCodeId || 0,
      rackLocationId: selectedDrawing?.rackLocationId || 0,
      irNumberId: Number(selectedIRNumber?.id) || 0,
      msnNumberId: Number(selectedMSNNumber?.id) || 0,
      desposition: data.desposition,
      productionOrderNumber: data.poNumber,
      projectNumber: data.projectNumber,
      expiryDate: (() => {
        if (!data.expiryDate) return null;

        const expiry = new Date(data.expiryDate);
        if (isNaN(expiry.getTime())) return null;

        const now = new Date();
        const indianTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);

        expiry.setHours(indianTime.getHours());
        expiry.setMinutes(indianTime.getMinutes());
        expiry.setSeconds(indianTime.getSeconds());
        expiry.setMilliseconds(indianTime.getMilliseconds());

        return expiry.toISOString();
      })(),

      manufacturingDate: (() => {
        // Get current Indian time (IST - UTC+5:30)
        const now = new Date();
        const indianTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000); // Add 5.5 hours for IST

        // Combine the selected manufacturing date with current Indian time
        const manufacturingDateWithTime = data.manufacturingDate ? new Date(data.manufacturingDate) : new Date();
        manufacturingDateWithTime.setHours(indianTime.getHours());
        manufacturingDateWithTime.setMinutes(indianTime.getMinutes());
        manufacturingDateWithTime.setSeconds(indianTime.getSeconds());
        manufacturingDateWithTime.setMilliseconds(indianTime.getMilliseconds());

        return manufacturingDateWithTime.toISOString();
      })(),
      drawingNumberId: selectedDrawing?.id || 0,
      unitId: (units || []).find((u) => u.unitName === data.unit)?.id || 0,
      mrirNumber: data.mrirNumber,
      buildNumber: data.buildNumber,
      remark: data.remark,
      quantity: Number(data.quantity),
      ids: [],
      batchIds: batchItems.map((item) => ({
        quantity: item.quantity,
        batchQuantity: item.batchQuantity,
        assemblyDrawingId: item.assemblyDrawingId,
      })),
    };

    // Handle different component types
    switch (data.componentType) {
      case "ID":
        if (data.idType === "series") {
          const startRange = Number(data.startRange);
          const quantity = Number(data.quantity);
          basePayload.ids = Array.from(
            { length: quantity },
            (_, i) => startRange + i,
          );
        } else if (data.idType === "custom") {
          // Parse custom ID range (e.g., "1,2,3,4-7")
          const ids: number[] = [];
          const customRange = (data as any).customIdRange;
          if (customRange) {
            const parts = customRange
              .split(",")
              .map((part: string) => part.trim());

            for (const part of parts) {
              if (part.includes("-")) {
                const [start, end] = part.split("-").map(Number);
                for (let i = start; i <= end; i++) {
                  ids.push(i);
                }
              } else {
                ids.push(Number(part));
              }
            }
          }

          // Remove duplicates and filter out NaN values
          basePayload.ids = [...new Set(ids.filter((id) => !isNaN(id)))];
        } else {
          // For random IDs, extract valid IDs and set quantity to match
          basePayload.ids = data.randomIds
            .filter((id) => id.trim() !== "")
            .map((id) => parseInt(id, 10))
            .filter((id) => !isNaN(id));
          // Ensure quantity matches the number of valid IDs
          basePayload.quantity = basePayload.ids.length;
        }
        break;
      case "BATCH":
        basePayload.idNumber = data.batchId;
        basePayload.ids = [parseInt(data.batchId, 10) || 0];
        basePayload.quantity = Number(data.quantity);
        basePayload.batchIds = batchItems.map((item) => ({
          quantity: item.quantity,
          batchQuantity: item.batchQuantity,
          assemblyDrawingId: item.assemblyDrawingId,
        }));
        break;
      case "FIM":
      case "SI":
        basePayload.ids = [1];
        basePayload.quantity = Number(data.quantity);
        basePayload.batchIds = [
          { quantity: 0, batchQuantity: 0, assemblyDrawingId: 0 },
        ];
        break;
    }

    return basePayload;
  };

  // Form submission
  const onSubmit = async (data: any) => {
    try {
      let response: any;
      if (componentType === "FIM" || componentType === "SI") {
        const isFIM = componentType === "FIM";
        const stdPayload = {
          productionSeriesId:
            (productionSeries || []).find(
              (ps) => ps.productionSeries === data.productionSeries,
            )?.id || 0,
          componentTypeId: selectedDrawing?.componentTypeId || (isFIM ? 1 : 4),
          nomenclatureId: selectedDrawing?.nomenclatureId || 0,
          lnItemCodeId: selectedDrawing?.lnItemCodeId || 0,
          rackLocationId: selectedDrawing?.rackLocationId || 0,
          desposition: data.desposition,
          purchaseOrderNumber: data.poNumber,
          projectNumber: data.projectNumber,
          expiryDate: data.expiryDate
            ? new Date(data.expiryDate).toISOString()
            : null,
          manufacturingDate: (() => {
            if (!data.manufacturingDate) return null;
            const now = new Date();
            const indianTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
            const mfgDate = new Date(data.manufacturingDate);
            mfgDate.setHours(indianTime.getHours());
            mfgDate.setMinutes(indianTime.getMinutes());
            mfgDate.setSeconds(indianTime.getSeconds());
            mfgDate.setMilliseconds(indianTime.getMilliseconds());
            return mfgDate.toISOString();
          })(),
          irNumber: data.irNumber,
          irNumberId: Number(selectedIRNumber?.id) || 0,
          msnNumberId: Number(selectedMSNNumber?.id) || 0,
          drawingNumberId: selectedDrawing?.id || 0,
          unitId: (units || []).find((u) => u.unitName === data.unit)?.id || 0,
          quantity: Number(data.quantity),
          mrirNumber: isFIM ? data.mrir || "" : "",
          partNo: data.partAssemblyId || "",
          size: data.size || "",
          shapeId: data.shapes ? parseInt(data.shapes) : null,
          customerItemCode: isFIM ? data.customerItemCode || "" : "",
          material: data.material || "",
          htLotNo: data.htLotNo || "",
          fanManNumber: isFIM ? data.fanManNumber || "" : "",
          fanManSerialNumber: isFIM ? data.fanManSerialNumber || "" : "",
          msnIrNumber: selectedMSNNumber?.msnNumber || "NA",
          gfnNo: isFIM ? data.gfnNo || "" : "",
          wc: data.wc || "",
          projectDescription: data.nomenclature || "",
          remark: data.remark || "",
          remarks: data.remark || "",
          toggleComponentTypeId: componentType === "FIM" ? 1 : 4,
          ids: [],
          matrixRows: QrTableRows.filter(
            (row) => row.idNo.trim() !== "",
          ).map((row) => {
            const rowData: any = {
              srNo: row.srNo,
              idNo: row.idNo,
              quantity:
                typeof row.quantity === "string"
                  ? parseFloat(row.quantity) || 0
                  : row.quantity,
            };
            if (row.size && row.size.trim() !== "")
              rowData.size = row.size.trim();
            if (row.mirir && row.mirir.trim() !== "")
              rowData.mirir = row.mirir.trim();
            if (row.heatLotBatchNo && row.heatLotBatchNo.trim() !== "")
              rowData.heatLotBatchNo = row.heatLotBatchNo.trim();
            return rowData;
          }),
        };

        response = await dispatch(
          generateStandardFieldQRCode(stdPayload),
        ).unwrap();
      } else {
        const payload = preparePayload(data);
        response = await dispatch(generateQRCode(payload)).unwrap();
      }

      setValue("expiryDate", null);

      // Check if any of the generated QR codes already exist
      const existing =
        response &&
        Array.isArray(response) &&
        response.filter((item: any) => item.isNewQrCode === false);

      if (existing && existing.length > 0) {
        // Show popup for existing QR codes
        setExistingItems(existing);
        setOpenExistingDialog(true);
      }

      if (response && response.length > 0) {
        const firstItem = response[0];
        if (componentType === "BATCH") {
          setValue("batchId", firstItem?.idNumber?.toString() || firstItem?.IdNumber?.toString() || "");
        }

        const generatedQrNum =
          firstItem?.qrCodeNumber ||
          firstItem?.QrCodeNumber ||
          firstItem?.serialNumber ||
          firstItem?.SerialNumber ||
          firstItem?.qrCode ||
          firstItem?.QrCode;

        if (generatedQrNum) {
          setPreviewQrInput(String(generatedQrNum));
          setFetchedPreviewItem(firstItem);
        }

        const newCount = response.filter(
          (item: any) => item.isNewQrCode !== false,
        ).length;
        if (newCount > 0) {
          const msg = `Successfully generated ${newCount} new QR code(s)!`;
          setSuccessMessage(msg);
          setSnackbar({
            open: true,
            message: msg,
            severity: "success",
          });
        } else if (response && response.length > 0) {
          const msg = "QR Code(s) generated successfully!";
          setSuccessMessage(msg);
          setSnackbar({
            open: true,
            message: msg,
            severity: "success",
          });
        }
      }
    } catch (error: any) {
      console.error("Error generating QR codes:", error);
      const errorMsg =
        typeof error === "string"
          ? error
          : error?.message || error?.payload || "Error generating QR codes.";
      setSnackbar({
        open: true,
        message: errorMsg,
        severity: "error",
      });
    }
  };

  // Handle actions
  const handleReset = () => {
    // Reset react-hook-form with empty values for all fields
    reset({
      qrType: "ID",
      productionOrderNumber: "",
      drawingNumber: "",
      nomenclature: "",
      productionSeries: "",
      componentType: "ID",
      idType: "series",
      startRange: 0,
      endRange: 0,
      quantity: 0,
      randomIds: Array(200).fill(""),
      customIdRange: "",
      batchId: "",
      unit: "",
      manufacturingDate: null,
      expiryDate: null,
      irNumber: "",
      msnNumber: "",
      poNumber: "",
      projectNumber: "",
      mrirNumber: "",
      desposition: "" as any,
      location: "",
      partAssemblyId: "",
      remark: "",
    });

    // Reset the manual override ref for remarks
    lastAutoRemarkRef.current = "";

    // Reset all local state variables
    setSelectedDrawing(null);
    setSelectedIRNumber(null);
    setSelectedMSNNumber(null);
    setSelectedPO(null);
    setPOSearchText("");
    setPoInputValue("");
    setQrTypeState("ID");
    setComponentType("ID");
    setRandomIds(Array(200).fill(""));
    setVisibleRandomCount(20);
    setQrTableRows(
      Array.from({ length: 5 }, (_, index) => ({
        srNo: index + 1,
        idNo: "",
        quantity: "",
        size: "",
        mirir: "",
        heatLotBatchNo: "",
      })),
    );
    setSelectedBarcodes([]);
    setPage(0);
    setRowsPerPage(10);

    // Reset preview states
    setPreviewQrInput("");
    setFetchedPreviewItem(null);
    setLabelQrDataUrl("");
    setDisplayedQRCodes([]);
    setNoExpiryDate(false);

    // Reset all search text states for Autocomplete fields
    setDrawingSearchText("");
    setIrSearchText("");
    setMsnSearchText("");
    setDebouncedLnSearch("");

    // Clear Redux state
    dispatch(clearGeneratedNumber());
    dispatch(clearQRCodeList());
    dispatch(clearError());

    // Clear messages
    setSuccessMessage("");
    setExistingItems([]);
    setOpenExistingDialog(false);

    // Clear validation errors
    clearErrors();
  };

  // Handle QR Type change - clear all form fields and local states when switching QR Type
  const handleQrTypeChange = (newQrType: string) => {
    const newCompType = (newQrType === "Purchase Item" ? "SI" : newQrType) as any;

    setQrTypeState(newQrType);
    setComponentType(newCompType);

    // Reset react-hook-form fields with clean state for new QR type
    reset({
      qrType: newQrType,
      productionOrderNumber: "",
      drawingNumber: "",
      nomenclature: "",
      productionSeries: "",
      componentType: newCompType,
      idType: "series",
      startRange: 0,
      endRange: 0,
      quantity: 0,
      randomIds: Array(200).fill(""),
      customIdRange: "",
      batchId: "",
      unit: "",
      manufacturingDate: new Date() as any,
      expiryDate: undefined,
      irNumber: "",
      msnNumber: "",
      poNumber: "",
      projectNumber: "",
      mrirNumber: "",
      desposition: "" as any,
      location: "",
      partAssemblyId: "",
      remark: "",
      buildNumber: "",
      fanManNumber: "",
      fanManSerialNumber: "",
      customerItemCode: "",
      gfnNo: "",
      shapes: "",
      material: "",
      rmItemCode: "",
    });

    // Reset manual override ref for remarks
    lastAutoRemarkRef.current = "";

    // Reset local state variables
    setSelectedDrawing(null);
    setSelectedIRNumber(null);
    setSelectedMSNNumber(null);
    setSelectedPO(null);
    setPOSearchText("");
    setPoInputValue("");
    setRandomIds(Array(200).fill(""));
    setVisibleRandomCount(20);
    setQrTableRows(
      Array.from({ length: 5 }, (_, index) => ({
        srNo: index + 1,
        idNo: "",
        quantity: "",
        size: "",
        mirir: "",
        heatLotBatchNo: "",
      })),
    );
    setSelectedBarcodes([]);
    setPage(0);

    // Reset preview & search states
    setPreviewQrInput("");
    setFetchedPreviewItem(null);
    setLabelQrDataUrl("");
    setDisplayedQRCodes([]);
    setNoExpiryDate(false);

    setDrawingSearchText("");
    setIrSearchText("");
    setMsnSearchText("");
    setDebouncedLnSearch("");

    // Clear Redux & messages
    dispatch(clearGeneratedNumber());
    dispatch(clearQRCodeList());
    dispatch(clearError());
    setSuccessMessage("");
    setExistingItems([]);
    setOpenExistingDialog(false);

    clearErrors();
  };

  // Handle PO field key press (Enter or Tab)
  const handlePOKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      const inputValue = (event.target as HTMLInputElement).value;

      if (inputValue && !selectedPO) {
        // Try to find exact match first, then partial match
        let matchingPO = poNumbers.find(
          (po) => po.productionOrderNumber === inputValue,
        );

        if (!matchingPO) {
          matchingPO = poNumbers.find((po) =>
            po.productionOrderNumber
              ?.toLowerCase()
              .includes(inputValue.toLowerCase()),
          );
        }

        if (matchingPO) {
          populatePOData(matchingPO);
        }
      }

      // Close the dropdown by triggering blur
      (event.target as HTMLInputElement).blur();

      // Move to next field if Tab
      if (event.key === "Tab") {
        setTimeout(() => {
          const drawingField = document.querySelector(
            'input[aria-label*="LN Item Code"]',
          ) as HTMLInputElement;
          if (drawingField) {
            drawingField.focus();
          }
        }, 0);
      }
    }
  };

  const populatePOData = (newValue: ProductionOrderMaster) => {
    // Selected from dropdown - object value
    setSelectedPO(newValue);
    setValue("poNumber", newValue.productionOrderNumber || "", {
      shouldValidate: true,
      shouldDirty: true,
    });
    setPoInputValue(newValue.productionOrderNumber || "");

    // Map related fields from PO master
    setValue("projectNumber", newValue.projectNumber || "", { shouldDirty: true });
    setValue("productionSeries", newValue.productionSeries || "", {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("mrirNumber", newValue.mrirNumber || "", {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("buildNumber" as any, newValue.buildNumber || "", { shouldDirty: true });

    // Find and set matching drawing from allDrawingNumbers
    if (newValue.drawingNumber || newValue.lnItemCode) {
      const matchingDrawing = allDrawingNumbers.find(
        (drawing) =>
          drawing.drawingNumber === newValue.drawingNumber ||
          drawing.lnItemCode === newValue.lnItemCode,
      );

      if (matchingDrawing) {
        setSelectedDrawing(matchingDrawing);
        setValue("drawingNumber", matchingDrawing.drawingNumber || newValue.drawingNumber || "", {
          shouldValidate: true,
          shouldDirty: true,
        });
        setValue("lnItemCode", matchingDrawing.lnItemCode || newValue.lnItemCode || "", {
          shouldValidate: true,
          shouldDirty: true,
        });
        setValue(
          "nomenclature",
          matchingDrawing.nomenclature || newValue.nomenclature || "",
          { shouldDirty: true },
        );
        const unitVal =
          matchingDrawing.unitName ||
          (newValue as any).unit ||
          (newValue as any).unitName ||
          "";
        setValue("unit", unitVal, { shouldValidate: true, shouldDirty: true });
        setValue("location", matchingDrawing.location || "", { shouldDirty: true });
        setValue(
          "partAssemblyId",
          matchingDrawing.parentDrawingNumbers?.[0] || "",
          { shouldDirty: true },
        );

        if (matchingDrawing.componentType) {
          updateComponentAndQrType(matchingDrawing.componentType);
        } else if (newValue.componentType) {
          updateComponentAndQrType(newValue.componentType);
        }
      } else {
        // If drawing not found, still map the fields from PO
        setValue("drawingNumber", newValue.drawingNumber || "", {
          shouldValidate: true,
          shouldDirty: true,
        });
        setValue("lnItemCode", newValue.lnItemCode || "", {
          shouldValidate: true,
          shouldDirty: true,
        });
        if (newValue.nomenclature) {
          setValue("nomenclature", newValue.nomenclature, { shouldDirty: true });
        }
        const unitVal = (newValue as any).unit || (newValue as any).unitName || "";
        if (unitVal) {
          setValue("unit", unitVal, { shouldValidate: true, shouldDirty: true });
        }
        if (newValue.componentType) {
          updateComponentAndQrType(newValue.componentType);
        }
      }
    }

    // Explicitly clear validation errors for all auto-populated fields
    clearErrors([
      "poNumber",
      "drawingNumber",
      "lnItemCode",
      "productionSeries",
      "unit",
      "mrirNumber",
      "nomenclature",
    ]);
  };

  const hasAnySplit = useMemo(() => {
    return displayedQRCodes.some((item) => item.hasBeenSplit);
  }, [displayedQRCodes]);

  const canSplitAny = useMemo(() => {
    const isBatch = componentType === "BATCH" || componentType === "Batch";
    const unit = watch("unit");
    return (
      isBatch &&
      unit === "ECH" &&
      displayedQRCodes.some(
        (item) =>
          Number(item.quantity) > 1 && !item.isSplitRow && !item.hasBeenSplit,
      )
    );
  }, [displayedQRCodes, componentType, watch]);

  const showBatchIdColumn = useMemo(() => {
    return displayedQRCodes.some((item) => item.batchId);
  }, [displayedQRCodes]);

  const handleSplit = (globalIndex: number) => {
    const item = displayedQRCodes[globalIndex];
    if (!item) return;

    const parentId =
      item.isSplitRow ? item.parentId : (item.id || item.qrCodeNumber || item.serialNumber);

    if (item.hasBeenSplit || item.isSplitRow) {
      // Unsplit: remove rows that were created for this parent
      const newData = displayedQRCodes.filter((row) => row.parentId !== parentId);
      const updatedIndex = newData.findIndex(
        (row) =>
          (row.id || row.qrCodeNumber || row.serialNumber) === parentId &&
          !row.isSplitRow,
      );

      if (updatedIndex !== -1) {
        // Restore original values from qrcodeList
        const originalItem = qrcodeList.find(
          (orig) =>
            (orig.id || orig.qrCodeNumber || orig.serialNumber) === parentId,
        );
        if (originalItem) {
          newData[updatedIndex] = { ...originalItem, hasBeenSplit: false };
        } else {
          newData[updatedIndex] = { ...newData[updatedIndex], hasBeenSplit: false };
        }
      }
      setDisplayedQRCodes(newData);
      return;
    }

    const qty = Number(item.quantity);
    const newRows = [];

    for (let i = 2; i <= qty; i++) {
      newRows.push({
        ...item,
        quantity: 1,
        batchId: `${i}/${qty}`,
        isSplitRow: true,
        parentId: parentId,
        qrCodeNumber: item.qrCodeNumber || item.serialNumber,
        id: `${parentId}-split-${i}`,
      });
    }

    const newData = [...displayedQRCodes];
    newData[globalIndex] = {
      ...item,
      hasBeenSplit: true,
      quantity: 1,
      batchId: `1/${qty}`,
    };
    newData.splice(globalIndex + 1, 0, ...newRows);
    setDisplayedQRCodes(newData);
  };

  const handleSplitAll = () => {
    const hasAnySplitLocal = displayedQRCodes.some((item) => item.hasBeenSplit);

    if (hasAnySplitLocal) {
      // Close all splits: restore original data from qrcodeList
      setDisplayedQRCodes([...qrcodeList]);
      return;
    }

    const newData: any[] = [];
    let hasSplit = false;

    displayedQRCodes.forEach((item) => {
      const isBatch = componentType === "BATCH" || componentType === "Batch";
      const unit = watch("unit");
      const isSplitEligible =
        isBatch &&
        unit === "ECH" &&
        Number(item.quantity) > 1 &&
        !item.isSplitRow &&
        !item.hasBeenSplit;

      if (isSplitEligible) {
        hasSplit = true;
        const qty = Number(item.quantity);
        const parentId = item.id || item.qrCodeNumber || item.serialNumber;

        newData.push({
          ...item,
          hasBeenSplit: true,
          quantity: 1,
          batchId: `1/${qty}`,
        });

        for (let i = 2; i <= qty; i++) {
          newData.push({
            ...item,
            quantity: 1,
            batchId: `${i}/${qty}`,
            isSplitRow: true,
            parentId: parentId,
            qrCodeNumber: item.qrCodeNumber || item.serialNumber,
            id: `${parentId}-split-${i}`,
          });
        }
      } else {
        newData.push(item);
      }
    });

    if (hasSplit) {
      setDisplayedQRCodes(newData);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (selectedBarcodes.length > 0 && selectedBarcodes.length < displayedQRCodes.length) {
      setSelectedBarcodes([]);
      return;
    }
    if (checked) {
      setSelectedBarcodes(
        displayedQRCodes.map((item) => item.id || item.qrCodeNumber || item.serialNumber),
      );
    } else {
      setSelectedBarcodes([]);
    }
  };

  const handleSelectBarcode = (id: string, checked: boolean) => {
    setSelectedBarcodes((prev) => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id];
      } else {
        return prev.filter((bId) => bId !== id);
      }
    });
  };

  const handleDownload = () => {
    if (selectedBarcodes.length === 0) return;
    handleOpenBulkExportDialog();
  };

  const handleOpenBulkUpdateDialog = () => {
    // Find the first selected item in displayedQRCodes
    const firstSelected = displayedQRCodes.find(
      (item) =>
        selectedBarcodes.includes(item.id || item.qrCodeNumber || item.serialNumber),
    ) as any;

    // 1. Production Series (bulkSelectedProductionSeries)
    let series = null;
    if (firstSelected?.productionSeriesId) {
      series = productionSeries.find((ps: any) => ps.id === firstSelected.productionSeriesId);
    }
    if (!series && firstSelected?.productionSeries) {
      series = productionSeries.find((ps: any) => ps.productionSeries === firstSelected.productionSeries);
    }
    if (!series) {
      const mainSeries = getValues("productionSeries");
      series = productionSeries.find((ps: any) => ps.productionSeries === mainSeries) || null;
    }
    setBulkSelectedProductionSeries(series);

    // 2. Available For (bulkAvailableFor)
    let drawing = null;
    if (firstSelected?.drawingNumberId) {
      drawing = allDrawingNumbers.find((d: any) => d.id === firstSelected.drawingNumberId);
    }
    if (!drawing && firstSelected?.drawingNumber) {
      drawing = allDrawingNumbers.find((d: any) => d.drawingNumber === firstSelected.drawingNumber);
    }
    if (!drawing) {
      drawing = selectedDrawing;
    }
    setBulkAvailableFor(drawing?.availableFor || selectedDrawing?.availableFor || "");

    // 3. Unit (bulkSelectedUnit)
    let unit = null;
    if (firstSelected?.unitId) {
      unit = units.find((u: any) => u.id === firstSelected.unitId);
    }
    if (!unit && firstSelected?.unit) {
      unit = units.find((u: any) => u.unitName === firstSelected.unit);
    }
    if (!unit) {
      const mainUnit = getValues("unit");
      unit = units.find((u: any) => u.unitName === mainUnit) || null;
    }
    setBulkSelectedUnit(unit);

    // 4. Project Number (bulkProject)
    const project = firstSelected?.projectNumber || getValues("projectNumber") || "";
    setBulkProject(project);

    // 5. Location (bulkRackLocationId)
    let locationId = firstSelected?.rackLocationId || selectedDrawing?.rackLocationId || "";
    if (!locationId) {
      locationId = getValues("location") || "";
    }
    setBulkRackLocationId(locationId);

    // 6. IR Number (bulkSelectedIR)
    let ir = null;
    if (firstSelected?.irNumberId) {
      ir = bulkIrNumbers.find((i: any) => i.id === firstSelected.irNumberId);
    }
    if (!ir && firstSelected?.irNumber) {
      ir = bulkIrNumbers.find((i: any) => i.irNumber === firstSelected.irNumber);
    }
    if (!ir) {
      const mainIR = getValues("irNumber");
      ir = bulkIrNumbers.find((i: any) => i.irNumber === mainIR) || selectedIRNumber || null;
    }
    setBulkSelectedIR(ir);

    // 7. MSN Number (bulkSelectedMSN)
    let msn = null;
    if (firstSelected?.msnNumberId) {
      msn = bulkMsnNumbers.find((m: any) => m.id === firstSelected.msnNumberId);
    }
    if (!msn && (firstSelected?.msnNumber || firstSelected?.msnIrNumber)) {
      const targetMsn = firstSelected?.msnNumber || firstSelected?.msnIrNumber;
      msn = bulkMsnNumbers.find((m: any) => m.msnNumber === targetMsn);
    }
    if (!msn) {
      const mainMSN = getValues("msnNumber");
      msn = bulkMsnNumbers.find((m: any) => m.msnNumber === mainMSN) || selectedMSNNumber || null;
    }
    setBulkSelectedMSN(msn);

    // 8. MRIR Number
    setBulkMrir(firstSelected?.mrirNumber || getValues("mrirNumber") || "");

    setBulkUpdateDialogOpen(true);
  };

  const handleBulkUpdateSubmit = async () => {
    if (selectedBarcodes.length === 0) {
      setSuccessMessage("Please select at least one barcode to update");
      return;
    }

    setBulkLoading(true);
    try {
      // Map unique IDs back to real QR code numbers
      const realSelectedBarcodes = displayedQRCodes
        .filter((item) =>
          selectedBarcodes.includes(item.id || item.qrCodeNumber || item.serialNumber),
        )
        .map((item) => item.qrCodeNumber || item.serialNumber)
        .filter(Boolean);

      // Deduplicate
      const uniqueBarcodes = [...new Set(realSelectedBarcodes)];

      const payload: any = {
        qrCodeNumbers: uniqueBarcodes,
      };

      if (bulkMrir && bulkMrir.trim() !== "") {
        payload.mrirNumber = bulkMrir.trim();
      }
      if (bulkSelectedIR?.id) {
        payload.irNumberId = bulkSelectedIR.id;
      }
      if (bulkSelectedMSN?.id) {
        payload.msnNumberId = bulkSelectedMSN.id;
      }
      if (bulkProject && bulkProject.trim() !== "") {
        payload.projectNumber = bulkProject.trim();
      }
      if (bulkSelectedProductionSeries?.id) {
        payload.productionSeriesId = bulkSelectedProductionSeries.id;
      }
      if (bulkSelectedUnit?.id) {
        payload.unitId = bulkSelectedUnit.id;
      }
      if (
        bulkRackLocationId !== "" &&
        bulkRackLocationId !== undefined &&
        bulkRackLocationId !== null &&
        Number(bulkRackLocationId) !== 0
      ) {
        payload.rackLocationId = Number(bulkRackLocationId);
      }
      if (bulkAvailableFor && bulkAvailableFor.trim() !== "") {
        payload.availableFor = bulkAvailableFor.trim();
      }

      await dispatch(bulkUpdateQRCode(payload)).unwrap();

      setSuccessMessage("Selected QR Codes updated successfully!");
      setBulkUpdateDialogOpen(false);
      setSelectedBarcodes([]);

      // Reset bulk inputs
      setBulkMrir("");
      setBulkSelectedIR(null);
      setBulkSelectedMSN(null);
      setBulkProject("");
      setBulkSelectedProductionSeries(null);
      setBulkSelectedUnit(null);
      setBulkRackLocationId("");
      setBulkAvailableFor("");

      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
    } catch (err: any) {
      console.error("Error bulk updating QR codes:", err);
      setSuccessMessage("Failed to update QR codes");
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          py: { xs: 1, sm: 1.25 },
          px: { xs: 1.5, sm: 2 },
          maxWidth: "100%",
          mx: "auto",
        }}
      >
        {/* Loading Backdrop */}
        <Backdrop
          open={isDownloading}
          sx={{ zIndex: theme.zIndex.drawer + 1, color: "#fff" }}
        >
          <Box sx={{ textAlign: "center" }}>
            <CircularProgress color="inherit" size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Downloading QR Code, please wait...
            </Typography>
          </Box>
        </Backdrop>

        {/* Header Section */}
        <Box sx={{ mb: 1.5 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "primary.main",
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
            }}
          >
            New QR Code
          </Typography>
          <Typography variant="body2" sx={{ color: "#667085", mt: 0.5 }}>
            Generate, preview, and print QR codes and barcodes for components and materials.
          </Typography>
        </Box>

        <>
          {/* Success/Error Messages */}
          {successMessage && (
            <Alert
              severity="success"
              sx={{ mb: 1.5 }}
              onClose={() => setSuccessMessage("")}
            >
              {successMessage}
            </Alert>
          )}

          <QRCodeErrorDisplay
            error={error}
            onClose={() => dispatch(clearError())}
          />

          {/* Main Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2} sx={{ mb: 1.5 }}>
              {/* Left Column: Form Steps */}
              <Grid item xs={12} lg={8.5}>
                {/* Step 1: Drawing & Order Details */}
                <DrawingDetailsStep
                  control={control}
                  errors={errors}
                  setValue={setValue}
                  clearErrors={clearErrors}
                  watch={watch}
                  componentType={componentType}
                  setComponentType={setComponentType}
                  qrTypeState={qrTypeState}
                  setQrTypeState={setQrTypeState}
                  onQrTypeChange={handleQrTypeChange}
                  poNumbers={poNumbers}
                  selectedPO={selectedPO}
                  setSelectedPO={setSelectedPO}
                  poLoading={poLoading}
                  poInputValue={poInputValue}
                  setPoInputValue={setPoInputValue}
                  setPOSearchText={setPOSearchText}
                  populatePOData={populatePOData}
                  handlePOKeyDown={handlePOKeyDown}
                  allDrawingNumbers={allDrawingNumbers}
                  selectedDrawing={selectedDrawing}
                  setSelectedDrawing={setSelectedDrawing}
                  isLnSearchLoading={isLnSearchLoading}
                  isLnSearchFetching={isLnSearchFetching}
                  updateDebouncedLnSearch={updateDebouncedLnSearch}
                  setDrawingSearchText={setDrawingSearchText}
                  debouncedDrawingSearch={debouncedDrawingSearch}
                  drawingNumbers={drawingNumbers}
                  updateComponentAndQrType={updateComponentAndQrType}
                  productionSeries={productionSeries}
                  units={units}
                  irNumbers={irNumbers}
                  selectedIRNumber={selectedIRNumber}
                  setSelectedIRNumber={setSelectedIRNumber}
                  handleIROpen={handleIROpen}
                  handleIRInputChange={handleIRInputChange}
                  setIrSearchText={setIrSearchText}
                  msnNumbers={msnNumbers}
                  selectedMSNNumber={selectedMSNNumber}
                  setSelectedMSNNumber={setSelectedMSNNumber}
                  handleMSNOpen={handleMSNOpen}
                  handleMSNInputChange={handleMSNInputChange}
                  setMsnSearchText={setMsnSearchText}
                  noExpiryDate={noExpiryDate}
                  setNoExpiryDate={setNoExpiryDate}
                  shapesData={shapesData}
                  formatComponentType={formatComponentType}
                  loading={loading}
                />

                {/* Step 2: ID Range & Quantities */}
                <ComponentTypeStep
                  control={control}
                  componentType={componentType}
                  watchIdType={watchIdType}
                  watchStartRange={watchStartRange}
                  watchEndRange={watchEndRange}
                  watchCustomIdRange={watchCustomIdRange}
                  selectedPO={selectedPO}
                  poStartId={poStartId}
                  poEndId={poEndId}
                  idRangeNotice={idRangeNotice}
                  visibleRandomCount={visibleRandomCount}
                  setVisibleRandomCount={setVisibleRandomCount}
                  handleRandomIdChange={handleRandomIdChange}
                  totalQuantity={totalQuantity}
                  QrTableRows={QrTableRows}
                  handleQrTableChange={handleQrTableChange}
                  handleEnterKey={handleEnterKey}
                  addNewQrRow={addNewQrRow}
                  onOpenAddRowsDialog={handleOpenAddRowsDialog}
                />

                {/* Step 3: Disposition & Remarks */}
                <DispositionStep
                  control={control}
                  componentType={componentType}
                />
              </Grid>

              {/* Right Column: Master Data Panel & Label Preview */}
              <LabelPreviewPanel
                selectedDrawing={selectedDrawing}
                componentType={componentType}
                formatComponentType={formatComponentType}
                watchNomenclature={watchNomenclature}
                watchProjectNumber={watch("projectNumber")}
                watchBuildNumber={watch("buildNumber") || ""}
                watchLocation={watch("location") || ""}
                watchFanManNumber={watch("fanManNumber") || ""}
                watchGfnNo={watch("gfnNo") || ""}
                watchMaterial={watch("material") || ""}
                previewQrInput={previewQrInput}
                onPreviewQrInputChange={setPreviewQrInput}
                fetchedPreviewItem={fetchedPreviewItem}
                labelQrDataUrl={labelQrDataUrl}
                labelQrText={labelQrText}
                watchDrawingNumber={watchDrawingNumber}
                watchDesposition={watchDesposition}
                watchProductionSeries={watchProductionSeries}
                watchUnit={watchUnit}
                watchQuantity={watchQuantity}
                watchMrirNumber={watchMrirNumber}
                watchMfgDate={watchMfgDate}
                watchExpiryDate={watchExpiryDate}
                watchIdType={watchIdType}
                watchStartRange={watchStartRange}
                watchEndRange={watchEndRange}
                watchCustomIdRange={watchCustomIdRange}
                watchBatchId={watch("batchId") || ""}
                noExpiryDate={noExpiryDate}
                userName={user?.username || user?.id || ""}
              />
            </Grid>
            {/* Sticky Footer Bar */}
            <Paper
              elevation={3}
              sx={{
                position: "sticky",
                bottom: 0,
                zIndex: 100,
                backgroundColor: "#FFFFFF",
                borderTop: "1px solid #E5E7EB",
                px: { xs: 2, sm: 3 },
                py: 1,
                mt: 1.5,
                mb: 1.5,
                mx: { xs: -1.5, sm: -2 },
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 -4px 6px -1px rgba(0, 0, 0, 0.05), 0 -2px 4px -1px rgba(0, 0, 0, 0.03)",
              }}
            >
              <Typography variant="body2" sx={{ color: "#6B7280", fontWeight: 500, fontSize: "0.875rem" }}>
                {requiredFieldsRemainingCount > 0
                  ? `${requiredFieldsRemainingCount} required field${requiredFieldsRemainingCount > 1 ? "s" : ""} remaining`
                  : "All required fields filled"}
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Button
                  type="button"
                  variant="text"
                  size="small"
                  onClick={handleReset}
                  startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    color: "#667085",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    textTransform: "none",
                    "&:hover": { backgroundColor: "#F2F4F7" },
                  }}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  size="small"
                  disabled={loading}
                  startIcon={
                    loading ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <QrCodeIcon sx={{ fontSize: 18 }} />
                    )
                  }
                  sx={{
                    backgroundColor: "primary.main",
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    borderRadius: "8px",
                    px: 2.5,
                    py: 0.75,
                    textTransform: "none",
                    boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
                    "&:hover": { backgroundColor: "primary.dark" },
                  }}
                >
                  {loading ? "Generating..." : "Generate QR Code"}
                </Button>
              </Stack>
            </Paper>
          </form>

          {/* Generated QR Codes */}
          {displayedQRCodes.length > 0 && (
            <QRCodesTable
              displayedQRCodes={displayedQRCodes}
              selectedBarcodes={selectedBarcodes}
              onSelectAll={handleSelectAll}
              onSelectBarcode={handleSelectBarcode}
              onDownload={handleDownload}
              onOpenBulkUpdateDialog={handleOpenBulkUpdateDialog}
              onSplit={handleSplit}
              onSplitAll={handleSplitAll}
              hasAnySplit={hasAnySplit}
              canSplitAny={canSplitAny}
              showBatchIdColumn={showBatchIdColumn}
              componentType={componentType}
              isDownloading={isDownloading}
              onOpenSingleExportDialog={handleOpenSingleExportDialog}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={(newPage) => setPage(newPage)}
              onRowsPerPageChange={(newSize) => {
                setRowsPerPage(newSize);
                setPage(0);
              }}
            />
          )}

          {/* Existing QR Code Dialog */}
          <ExistingQRCodesDialog
            open={openExistingDialog}
            onClose={() => setOpenExistingDialog(false)}
            existingItems={existingItems}
          />

          {/* Column Selection Export Dialog */}
          <ExportColumnDialog
            open={exportDialogOpen}
            onClose={() => setExportDialogOpen(false)}
            isDownloading={isDownloading}
            onConfirmExport={handleConfirmExportData}
          />

          {/* Bulk Update Dialog */}
          <BulkUpdateDialog
            open={bulkUpdateDialogOpen}
            onClose={() => setBulkUpdateDialogOpen(false)}
            selectedCount={selectedBarcodes.length}
            productionSeries={productionSeries || []}
            units={units || []}
            bulkSelectedProductionSeries={bulkSelectedProductionSeries}
            onProductionSeriesChange={setBulkSelectedProductionSeries}
            bulkAvailableFor={bulkAvailableFor}
            onAvailableForChange={setBulkAvailableFor}
            bulkProject={bulkProject}
            onProjectChange={setBulkProject}
            bulkRackLocationId={bulkRackLocationId}
            onRackLocationChange={setBulkRackLocationId}
            bulkSelectedUnit={bulkSelectedUnit}
            onUnitChange={setBulkSelectedUnit}
            bulkMrir={bulkMrir}
            onMrirChange={setBulkMrir}
            bulkIrNumbers={bulkIrNumbers}
            bulkSelectedIR={bulkSelectedIR}
            onIRChange={setBulkSelectedIR}
            bulkMsnNumbers={bulkMsnNumbers}
            bulkSelectedMSN={bulkSelectedMSN}
            onMSNChange={setBulkSelectedMSN}
            bulkLoading={bulkLoading}
            onSubmit={handleBulkUpdateSubmit}
          />

          {/* Add Rows Dialog */}
          <Dialog
            open={addRowsDialogOpen}
            onClose={handleCloseAddRowsDialog}
            maxWidth="xs"
            fullWidth
            PaperProps={{
              sx: { borderRadius: "12px", p: 1 },
            }}
          >
            <DialogTitle sx={{ fontWeight: 600, fontSize: "1.1rem" }}>
              Add Rows
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                Specify how many rows you would like to add to the table:
              </Typography>
              <TextField
                autoFocus
                fullWidth
                size="small"
                type="number"
                label="Number of Rows"
                value={rowsToAddCount}
                onChange={(e) => setRowsToAddCount(e.target.value)}
                inputProps={{ min: 1, max: 500 }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddMultipleRowsSubmit();
                  }
                }}
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={handleCloseAddRowsDialog} color="inherit" size="small">
                Cancel
              </Button>
              <Button
                onClick={handleAddMultipleRowsSubmit}
                size="small"
                variant="contained"
                disableElevation
              >
                Add
              </Button>
            </DialogActions>
          </Dialog>
        </>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%", borderRadius: "8px", boxShadow: 3 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </LocalizationProvider>
  );
}
