import { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Stack,
  FormLabel,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  TablePagination,
  Autocomplete,
  FormHelperText,
  Backdrop,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  QrCode as QrCodeIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  GetApp as GetAppIcon,
  Warning as WarningIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import type { RootState, AppDispatch } from "../../store/store";
import type {
  DrawingNumber,
  QRCodeFormData,
  IRNumber,
  MSNNumber,
  QRCodePayload,
  Shape,
} from "../../types";
import {
  generateQRCode,
  generateStandardFieldQRCode,
  exportQRCode,
  exportBulkQRCodes,
  bulkUpdateQRCode,
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

// Create typed versions of the hooks
const useAppDispatch: () => AppDispatch = useDispatch;

export default function BarcodeGeneration() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [qrTypeState, setQrTypeState] = useState<string>("ID");

  const dispatch = useAppDispatch();

  // Redux state
  const { qrcodeList, batchItems, loading, error, isDownloading } = useSelector(
    (state: RootState) => state.qrcode,
  );
  const lastAutoRemarkRef = useRef("");

  // TanStack Query Hooks
  const [drawingSearchText, setDrawingSearchText] = useState("");
  const [irSearchText, setIrSearchText] = useState("");
  const [msnSearchText, setMsnSearchText] = useState("");
  const [poSearchText, setPOSearchText] = useState("");
  const debouncedPOSearch = useDebounce(poSearchText, 500);

  const { data: productionSeries = [] } = useProductionSeries();
  const { data: allDrawingNumbers = [] } = useAllDrawingNumbers();
  const { data: searchedDrawingNumbers = [] } = useDrawingNumbers(
    "",
    drawingSearchText,
  );
  const drawingNumbers =
    (drawingSearchText.length >= 3
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
  const [idType, setIdType] = useState<"series" | "random" | "custom">(
    "series",
  );
  const [randomIds, setRandomIds] = useState<string[]>(Array(200).fill(""));
  const [visibleRandomCount, setVisibleRandomCount] = useState<number>(20);

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

  const handleEnterKey = (
    e: React.KeyboardEvent,
    rowIndex: number,
    isLastColumn: boolean,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isLastColumn && rowIndex === QrTableRows.length - 1) {
        const currentRow = QrTableRows[rowIndex];
        if (currentRow.idNo.trim() !== "") {
          addNewQrRow();
        }
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
      setIdType("series");
      setValue("idType", "series");
    }
  }, [watchComponentType, setValue]);

  // Update ID type
  useEffect(() => {
    setIdType(watchIdType);
  }, [watchIdType]);

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

  // Debounced search functions
  const debouncedDrawingSearch = useMemo(
    () =>
      debounce((searchValue: string) => {
        setDrawingSearchText(searchValue);
      }, 300),
    [],
  );

  const debouncedIRSearch = useMemo(
    () =>
      debounce((searchValue: string) => {
        setIrSearchText(searchValue);
      }, 300),
    [],
  );

  const debouncedMSNSearch = useMemo(
    () =>
      debounce((searchValue: string) => {
        setMsnSearchText(searchValue);
      }, 300),
    [],
  );

  // Handler for IR autocomplete - clear search on clear
  const handleIRInputChange = (_: any, value: string) => {
    if (value.length === 0) {
      // Clear search text when input is empty
      setIrSearchText("");
    } else if (value.length >= 3) {
      // Search when user types 3+ chars
      debouncedIRSearch(value);
    }
  };

  // Handler for MSN autocomplete - clear search on clear
  const handleMSNInputChange = (_: any, value: string) => {
    if (value.length === 0) {
      // Clear search text when input is empty
      setMsnSearchText("");
    } else if (value.length >= 3) {
      // Search when user types 3+ chars
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
        if (componentType === "BATCH") {
          setValue("batchId", response[0].idNumber?.toString() || "");
        }

        const newCount = response.filter(
          (item: any) => item.isNewQrCode,
        ).length;
        if (newCount > 0) {
          setSuccessMessage(
            `Successfully generated ${newCount} new QR code(s)!`,
          );
        }
      }
    } catch (error) {
      // Error is now handled by the Redux store and displayed by QRCodeErrorDisplay
      console.error("Error generating QR codes:", error);
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
    setIdType("series");
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
    setValue("poNumber", newValue.productionOrderNumber || "");
    setPoInputValue(newValue.productionOrderNumber || "");

    // Map related fields from PO master
    setValue("projectNumber", newValue.projectNumber || "");
    setValue("productionSeries", newValue.productionSeries || "");
    setValue("mrirNumber", newValue.mrirNumber || "");
    setValue("buildNumber" as any, newValue.buildNumber || "");

    // Note: Removed auto-filling of quantity, startRange, and endRange as per requirement

    // Find and set matching drawing from allDrawingNumbers
    if (newValue.drawingNumber || newValue.lnItemCode) {
      const matchingDrawing = allDrawingNumbers.find(
        (drawing) =>
          drawing.drawingNumber === newValue.drawingNumber ||
          drawing.lnItemCode === newValue.lnItemCode,
      );

      if (matchingDrawing) {
        setSelectedDrawing(matchingDrawing);
        setValue("drawingNumber", matchingDrawing.drawingNumber);
        setValue(
          "nomenclature",
          matchingDrawing.nomenclature || newValue.nomenclature || "",
        );
        setValue("unit", matchingDrawing.unitName || "");
        setValue("location", matchingDrawing.location || "");
        setValue(
          "partAssemblyId",
          matchingDrawing.parentDrawingNumbers?.[0] || "",
        );

        if (matchingDrawing.componentType) {
          updateComponentAndQrType(matchingDrawing.componentType);
        } else if (newValue.componentType) {
          updateComponentAndQrType(newValue.componentType);
        }
      } else {
        // If drawing not found, still map the fields from PO
        if (newValue.nomenclature) {
          setValue("nomenclature", newValue.nomenclature);
        }
        if (newValue.componentType) {
          updateComponentAndQrType(newValue.componentType);
        }
      }
    }
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

  const handleDownload = async () => {
    if (selectedBarcodes.length === 0) return;

    try {
      const selectedItems = displayedQRCodes.filter((qr) =>
        selectedBarcodes.includes(qr.id || qr.qrCodeNumber || qr.serialNumber),
      );

      const qrCodeNumbers = selectedItems
        .map((qr) => qr.qrCodeNumber || qr.serialNumber)
        .filter(Boolean);

      const batchIds = selectedItems
        .map((qr) => qr.batchId)
        .filter((id) => id && id !== "N/A");

      // Deduplicate the QR Code numbers
      const uniqueQRCodes = [...new Set(qrCodeNumbers)];

      await dispatch(
        exportBulkQRCodes({
          qrCodes: uniqueQRCodes,
          batchIds: batchIds,
        }),
      );
      setSuccessMessage("QR codes downloaded successfully!");
    } catch (error) {
      console.error("Error downloading:", error);
    }
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

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => setSuccessMessage("Copied to clipboard!"))
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed"; // Prevent scrolling to bottom of page in MS Edge.
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      // @ts-ignore - execCommand is deprecated but still functional
      document.execCommand("copy");
      setSuccessMessage("Copied to clipboard!");
    } catch (err) {
      setSuccessMessage("Failed to copy!");
    }
    document.body.removeChild(textarea);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          p: { xs: 1, sm: 1.5, md: 2 },
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

        {/* Header Title */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            mb: 1.5,
            flexWrap: "wrap",
            gap: { xs: 2, sm: 4, md: 6 },
            borderBottom: 1,
            borderColor: "divider",
            pb: 0.5,
          }}
        >
          <Typography
            variant="h4"
            color="primary.main"
            fontWeight={600}
            sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.5rem" }, mb: 0.5 }}
          >
            Generate QR Code
          </Typography>
        </Box>
        <>
          {/* Success/Error Messages */}
          {successMessage && (
            <Alert
              severity="success"
              sx={{ mb: 3 }}
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
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              {/* <Typography
              variant="h6"
              gutterBottom
              sx={{ color: "primary.main", fontWeight: 600, mb: 3 }}
            >
              Add Manufacturing Item
            </Typography> */}

              {/* Strategy 3: Dynamic Section Renderers */}
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* 1. Standard Fields Form (FIM & Purchase Item / SI) */}
                {(componentType === "FIM" || componentType === "SI") && (
                  <>
                    {/* Row 1: QR Type | RM Item Code * | RM Drawing Number * */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} md={4}>
                        <Controller
                          name="qrType"
                          control={control}
                          defaultValue="ID"
                          render={({ field }) => (
                            <FormControl fullWidth size="small">
                              <InputLabel>QR Type</InputLabel>
                              <Select
                                {...field}
                                label="QR Type"
                                value={field.value || qrTypeState}
                                onChange={(e) => {
                                  const val = String(e.target.value);
                                  field.onChange(val);
                                  setQrTypeState(val);
                                  const newCompType = (val === "Purchase Item" ? "SI" : val) as any;
                                  setComponentType(newCompType);
                                  setValue("componentType", newCompType);
                                }}
                              >
                                <MenuItem value="ID">ID</MenuItem>
                                <MenuItem value="BATCH">BATCH</MenuItem>
                                <MenuItem value="FIM">FIM</MenuItem>
                                <MenuItem value="Purchase Item">Purchase Item</MenuItem>
                              </Select>
                            </FormControl>
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Autocomplete
                          options={allDrawingNumbers || []}
                          groupBy={(option) => option.lnItemCode || "No LN Code"}
                          getOptionLabel={(option) => {
                            if (typeof option === "string") return option;
                            return option.lnItemCode || "";
                          }}
                          value={selectedDrawing}
                          loading={isLnSearchLoading || isLnSearchFetching}
                          size="small"
                          freeSolo={false}
                          filterOptions={(options, { inputValue }) => {
                            if (!inputValue) return options.slice(0, 100);
                            const searchLower = inputValue.toLowerCase();
                            return options
                              .filter(
                                (option) =>
                                  option.lnItemCode?.toLowerCase().includes(searchLower) ||
                                  option.drawingNumber?.toLowerCase().includes(searchLower) ||
                                  option.nomenclature?.toLowerCase().includes(searchLower),
                              )
                              .slice(0, 100);
                          }}
                          onInputChange={(_, value) => updateDebouncedLnSearch(value)}
                          onChange={(_, newValue) => {
                            if (newValue && typeof newValue !== "string") {
                              setSelectedDrawing(newValue);
                              setValue("drawingNumber", newValue.drawingNumber);
                              setValue("nomenclature", newValue.nomenclature);
                              setValue("unit", newValue.unitName || "");
                              setValue("location", newValue.location || "");
                              setValue(
                                "partAssemblyId",
                                newValue.parentDrawingNumbers?.[0] || "",
                              );
                              if (newValue.componentType) {
                                updateComponentAndQrType(newValue.componentType);
                              }
                            } else {
                              setValue("drawingNumber", "");
                              setValue("nomenclature", "");
                              setValue("unit", "");
                              setValue("partAssemblyId", "");
                              setValue("location", "");
                            }
                          }}
                          renderOption={(props, option) => {
                            const { key, ...optionProps } = props;
                            return (
                              <li {...optionProps} key={key}>
                                <Box sx={{ display: "flex", flexDirection: "column", py: 0.5, width: "100%" }}>
                                  <Typography variant="body2" fontWeight="500" sx={{ fontSize: "0.85rem", color: "text.primary" }}>
                                    Drawing: {option.drawingNumber}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
                                    {option.nomenclature} | Type: {formatComponentType(option.componentType)}
                                  </Typography>
                                </Box>
                              </li>
                            );
                          }}
                          renderGroup={(params) => (
                            <li key={params.key}>
                              <Typography variant="subtitle2" fontWeight="800" sx={{ px: 2, py: 0.5, backgroundColor: "grey.200", color: "primary.main", fontSize: "0.95rem", letterSpacing: "0.5px" }}>
                                LN CODE: {params.group}
                              </Typography>
                              <ul style={{ padding: 0, margin: 0 }}>{params.children}</ul>
                            </li>
                          )}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="RM Item Code *"
                              placeholder="Type to search..."
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <>
                                    {isLnSearchLoading || isLnSearchFetching ? <CircularProgress color="inherit" size={16} /> : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                ),
                              }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Controller
                          name="drawingNumber"
                          control={control}
                          rules={{ required: "RM Drawing Number is required" }}
                          render={({ field: { onChange } }) => (
                            <Autocomplete
                              options={drawingNumbers.filter(
                                (d: DrawingNumber) =>
                                  !selectedDrawing?.lnItemCode || d.lnItemCode === selectedDrawing.lnItemCode,
                              )}
                              getOptionLabel={(option) => {
                                if (typeof option === "string") return option;
                                return option.drawingNumber || "";
                              }}
                              value={selectedDrawing}
                              size="small"
                              onInputChange={(_, value, reason) => {
                                if (reason === "input" && value.length >= 3) debouncedDrawingSearch(value);
                              }}
                              onChange={(_, value) => {
                                setSelectedDrawing(value);
                                onChange(value ? value.drawingNumber : "");
                                if (value) {
                                  setValue("nomenclature", value.nomenclature);
                                  setValue("location", value.location || "");
                                  setValue("unit", value.unitName || "");
                                  if (value.componentType) {
                                    updateComponentAndQrType(value.componentType);
                                  }
                                  setValue("partAssemblyId", value.parentDrawingNumbers?.[0] || "");
                                } else {
                                  setValue("nomenclature", "");
                                  setValue("unit", "");
                                  setValue("partAssemblyId", "");
                                  setValue("location", "");
                                }
                              }}
                              renderOption={(props, option) => (
                                <li {...props} key={option.id}>
                                  <Box sx={{ display: "flex", flexDirection: "column", py: 0.5 }}>
                                    <Typography variant="body2" fontWeight="bold">{option.drawingNumber}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      LN: {option.lnItemCode} | {option.nomenclature} | {formatComponentType(option.componentType)}
                                    </Typography>
                                  </Box>
                                </li>
                              )}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="RM Drawing Number *"
                                  error={!!errors.drawingNumber}
                                  helperText={errors.drawingNumber?.message}
                                />
                              )}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>

                    {/* Row 2: LN Item Description | Available For | Production Series * */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} md={4}>
                        <Controller
                          name="nomenclature"
                          control={control}
                          render={({ field }) => (
                            <TextField {...field} label="LN Item Description" fullWidth size="small" InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }} InputLabelProps={{ shrink: true }} />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField label="Available For" value={selectedDrawing?.availableFor || ""} fullWidth size="small" InputProps={{ readOnly: true }} sx={{ bgcolor: "grey.50" }} />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Controller
                          name="productionSeries"
                          control={control}
                          rules={{ required: "Production Series is required" }}
                          render={({ field: { onChange, value } }) => (
                            <Autocomplete
                              size="small"
                              options={productionSeries || []}
                              getOptionLabel={(option) => typeof option === "string" ? option : option.productionSeries || ""}
                              value={(productionSeries || []).find((s) => s.productionSeries === value) || (value ? (value as any) : null)}
                              onChange={(_, newValue) => onChange(newValue ? (typeof newValue === "string" ? newValue : newValue.productionSeries) : "")}
                              renderInput={(params) => <TextField {...params} label="Production Series *" error={!!errors.productionSeries} helperText={errors.productionSeries?.message} />}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>

                    {/* FIM vs Purchase Item (SI) Specific Field Grid */}
                    {componentType === "SI" ? (
                      <>
                        {/* SI Row 3: Component Type | Project | Purchase Order Number */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={12} md={4}>
                            <TextField label="Component Type" value={formatComponentType(componentType) || ""} fullWidth size="small" InputProps={{ readOnly: true }} sx={{ bgcolor: "grey.50" }} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Controller name="projectNumber" control={control} render={({ field }) => <TextField {...field} label="Project" fullWidth size="small" />} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Controller
                              name="poNumber"
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  label="Purchase Order Number"
                                  fullWidth
                                  size="small"
                                />
                              )}
                            />
                          </Grid>
                        </Grid>
                        {/* SI Row 4: Location | Shape | Part Number (Assembly) */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={12} md={4}>
                            <Controller name="location" control={control} render={({ field }) => <TextField {...field} label="Location" fullWidth size="small" InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }} InputLabelProps={{ shrink: true }} />} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Controller name="shapes" control={control} render={({ field: { onChange, value } }) => (
                              <Autocomplete value={shapesData.find((s: Shape) => s.id.toString() === value) || null} onChange={(_, newValue) => onChange(newValue ? newValue.id.toString() : "")} options={shapesData} getOptionLabel={(option) => option.materialName || ""} renderInput={(params) => <TextField {...params} label="Shape" size="small" fullWidth placeholder="Select Shape" />} size="small" />
                            )} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Controller name="partAssemblyId" control={control} render={({ field }) => <TextField {...field} label="Part Number (Assembly)" fullWidth size="small" />} />
                          </Grid>
                        </Grid>
                        {/* SI Row 5: Total Quantity * | Unit | Material Specification */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={12} md={4}>
                            <Controller name="quantity" control={control} render={({ field }) => <TextField {...field} label="Total Quantity *" type="number" fullWidth size="small" helperText="Derived from table matrix sum." InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }} />} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Controller name="unit" control={control} rules={{ required: "Unit is required" }} render={({ field }) => (
                              <FormControl fullWidth error={!!errors.unit} size="small">
                                <InputLabel>Unit *</InputLabel>
                                <Select {...field} label="Unit *">{units.map((u) => <MenuItem key={u.id} value={u.unitName}>{u.unitName}</MenuItem>)}</Select>
                                {errors.unit && <FormHelperText>{errors.unit.message}</FormHelperText>}
                              </FormControl>
                            )} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Controller name="material" control={control} render={({ field }) => <TextField {...field} label="Material Specification" fullWidth size="small" />} />
                          </Grid>
                        </Grid>
                        {/* SI Row 6: IR Number * | MSN Number * | MFG Date */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={12} md={4}>
                            <Controller name="irNumber" control={control} rules={{ required: "IR Number is required" }} render={({ field, fieldState: { error } }) => (
                              <Autocomplete {...field} options={irNumbers} getOptionLabel={(option) => typeof option === "string" ? option : option.irNumber || ""} value={selectedIRNumber} loading={loading} size="small" onOpen={handleIROpen} onInputChange={handleIRInputChange} onChange={(_, value) => { setSelectedIRNumber(value); setValue("irNumber", value?.irNumber || ""); setIrSearchText(""); field.onChange(value?.irNumber || ""); }} renderInput={(params) => <TextField {...params} label="IR Number *" error={!!error} helperText={error?.message} />} />
                            )} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Controller name="msnNumber" control={control} rules={{ required: "MSN Number is required" }} render={({ field, fieldState: { error } }) => (
                              <Autocomplete {...field} options={msnNumbers} getOptionLabel={(option) => typeof option === "string" ? option : option.msnNumber || ""} value={selectedMSNNumber} loading={loading} size="small" onOpen={handleMSNOpen} onInputChange={handleMSNInputChange} onChange={(_, value) => { setSelectedMSNNumber(value); setValue("msnNumber", value?.msnNumber || ""); setMsnSearchText(""); field.onChange(value?.msnNumber || ""); }} renderInput={(params) => <TextField {...params} label="MSN Number *" error={!!error} helperText={error?.message} />} />
                            )} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Controller name="manufacturingDate" control={control} render={({ field }) => <DatePicker {...field} label="MFG Date" maxDate={new Date()} slotProps={{ textField: { size: "small", fullWidth: true, error: !!errors.manufacturingDate, helperText: errors.manufacturingDate?.message } }} />} />
                          </Grid>
                        </Grid>
                        {/* SI Row 7: Expiry Date */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={12} md={4}>
                            <Controller name="expiryDate" control={control} render={({ field }) => <DatePicker {...field} value={field.value || null} disabled={noExpiryDate} onChange={(newValue) => { field.onChange(newValue || null); if (newValue) setNoExpiryDate(false); }} label="Expiry Date" slotProps={{ textField: { size: "small", fullWidth: true } }} />} />
                          </Grid>
                        </Grid>
                      </>
                    ) : (
                      <>
                        {/* FIM Row 3: Component Type | FAN/MAN Number | FAN/MAN Serial Number */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={12} md={4}>
                            <TextField label="Component Type" value={formatComponentType(componentType) || ""} fullWidth size="small" InputProps={{ readOnly: true }} sx={{ bgcolor: "grey.50" }} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Controller name="fanManNumber" control={control} render={({ field }) => <TextField {...field} label="FAN/MAN Number" fullWidth size="small" />} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Controller name="fanManSerialNumber" control={control} render={({ field }) => <TextField {...field} label="FAN/MAN Serial Number" fullWidth size="small" />} />
                          </Grid>
                        </Grid>
                        {/* FIM Row 4: Location | Project | Purchase Order Number */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={12} md={4}>
                            <Controller name="location" control={control} render={({ field }) => <TextField {...field} label="Location" fullWidth size="small" InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }} InputLabelProps={{ shrink: true }} />} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Controller name="projectNumber" control={control} render={({ field }) => <TextField {...field} label="Project" fullWidth size="small" />} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Controller
                              name="poNumber"
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  label="Purchase Order Number"
                                  fullWidth
                                  size="small"
                                />
                              )}
                            />
                          </Grid>
                        </Grid>
                        {/* FIM Row 5: Shape | Customer Item Code | Part Number (Assembly) */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={12} md={4}>
                            <Controller name="shapes" control={control} render={({ field: { onChange, value } }) => (
                              <Autocomplete value={shapesData.find((s: Shape) => s.id.toString() === value) || null} onChange={(_, newValue) => onChange(newValue ? newValue.id.toString() : "")} options={shapesData} getOptionLabel={(option) => option.materialName || ""} renderInput={(params) => <TextField {...params} label="Shape" size="small" fullWidth placeholder="Select Shape" />} size="small" />
                            )} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Controller name="customerItemCode" control={control} render={({ field }) => <TextField {...field} label="Customer Item Code" fullWidth size="small" />} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Controller name="partAssemblyId" control={control} render={({ field }) => <TextField {...field} label="Part Number (Assembly)" fullWidth size="small" />} />
                          </Grid>
                        </Grid>
                        {/* FIM Row 6: Total Quantity * | Unit | Material Specification */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={12} md={4}>
                            <Controller name="quantity" control={control} render={({ field }) => <TextField {...field} label="Total Quantity *" type="number" fullWidth size="small" helperText="Derived from table matrix sum." InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }} />} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Controller name="unit" control={control} rules={{ required: "Unit is required" }} render={({ field }) => (
                              <FormControl fullWidth error={!!errors.unit} size="small">
                                <InputLabel>Unit *</InputLabel>
                                <Select {...field} label="Unit *">{units.map((u) => <MenuItem key={u.id} value={u.unitName}>{u.unitName}</MenuItem>)}</Select>
                                {errors.unit && <FormHelperText>{errors.unit.message}</FormHelperText>}
                              </FormControl>
                            )} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Controller name="material" control={control} render={({ field }) => <TextField {...field} label="Material Specification" fullWidth size="small" />} />
                          </Grid>
                          </Grid>
                        {/* FIM Row 7: IR Number * | MSN Number * | GFN No */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={12} md={4}>
                            <Controller name="irNumber" control={control} rules={{ required: "IR Number is required" }} render={({ field, fieldState: { error } }) => (
                              <Autocomplete {...field} options={irNumbers} getOptionLabel={(option) => typeof option === "string" ? option : option.irNumber || ""} value={selectedIRNumber} loading={loading} size="small" onOpen={handleIROpen} onInputChange={handleIRInputChange} onChange={(_, value) => { setSelectedIRNumber(value); setValue("irNumber", value?.irNumber || ""); setIrSearchText(""); field.onChange(value?.irNumber || ""); }} renderInput={(params) => <TextField {...params} label="IR Number *" error={!!error} helperText={error?.message} />} />
                            )} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Controller name="msnNumber" control={control} rules={{ required: "MSN Number is required" }} render={({ field, fieldState: { error } }) => (
                              <Autocomplete {...field} options={msnNumbers} getOptionLabel={(option) => typeof option === "string" ? option : option.msnNumber || ""} value={selectedMSNNumber} loading={loading} size="small" onOpen={handleMSNOpen} onInputChange={handleMSNInputChange} onChange={(_, value) => { setSelectedMSNNumber(value); setValue("msnNumber", value?.msnNumber || ""); setMsnSearchText(""); field.onChange(value?.msnNumber || ""); }} renderInput={(params) => <TextField {...params} label="MSN Number *" error={!!error} helperText={error?.message} />} />
                            )} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Controller name="gfnNo" control={control} render={({ field }) => <TextField {...field} label="GFN No" fullWidth size="small" />} />
                          </Grid>
                        </Grid>
                        {/* FIM Row 8: MFG Date | Expiry Date */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={12} md={4}>
                            <Controller name="manufacturingDate" control={control} render={({ field }) => <DatePicker {...field} label="MFG Date" maxDate={new Date()} slotProps={{ textField: { size: "small", fullWidth: true, error: !!errors.manufacturingDate, helperText: errors.manufacturingDate?.message } }} />} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Controller name="expiryDate" control={control} render={({ field }) => <DatePicker {...field} value={field.value || null} disabled={noExpiryDate} onChange={(newValue) => { field.onChange(newValue || null); if (newValue) setNoExpiryDate(false); }} label="Expiry Date" slotProps={{ textField: { size: "small", fullWidth: true } }} />} />
                          </Grid>
                        </Grid>
                      </>
                    )}
                  </>
                )}

                {/* 2. Manufacturing Fields Form (ID & BATCH - Matches Screenshots 1 & 2) */}
                {(componentType === "ID" || componentType === "BATCH") && (
                  <>
                    {/* Row 1: QR Type, PO Number, LN Item Code */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} md={4}>
                        <Controller
                          name="qrType"
                          control={control}
                          defaultValue="ID"
                          render={({ field }) => (
                            <FormControl fullWidth size="small">
                              <InputLabel>QR Type</InputLabel>
                              <Select
                                {...field}
                                label="QR Type"
                                value={field.value || qrTypeState}
                                onChange={(e) => {
                                  const val = String(e.target.value);
                                  field.onChange(val);
                                  setQrTypeState(val);
                                  const newCompType = (val === "Purchase Item" ? "SI" : val) as any;
                                  setComponentType(newCompType);
                                  setValue("componentType", newCompType);
                                }}
                              >
                                <MenuItem value="ID">ID</MenuItem>
                                <MenuItem value="BATCH">BATCH</MenuItem>
                                <MenuItem value="FIM">FIM</MenuItem>
                                <MenuItem value="Purchase Item">Purchase Item</MenuItem>
                              </Select>
                            </FormControl>
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Controller
                          name="poNumber"
                          control={control}
                          rules={{ required: "PO Number is required" }}
                          render={({ field: { onChange, ref }, fieldState: { error } }) => (
                            <Autocomplete
                              size="small"
                              freeSolo
                              forcePopupIcon={true}
                              options={Array.isArray(poNumbers) ? poNumbers : []}
                              getOptionLabel={(option) => typeof option === "string" ? option : option.productionOrderNumber || ""}
                              value={selectedPO || watch("poNumber") || null}
                              loading={poLoading}
                              inputValue={poInputValue}
                              onInputChange={(_, inputValue) => { setPoInputValue(inputValue); setPOSearchText(inputValue); }}
                              onChange={(_, newValue) => {
                                if (newValue && typeof newValue !== "string") { populatePOData(newValue); onChange(newValue.productionOrderNumber || ""); }
                                else if (typeof newValue === "string") { const matchingPO = poNumbers.find((po) => po.productionOrderNumber?.toLowerCase().includes(newValue.toLowerCase())); if (matchingPO) populatePOData(matchingPO); else { setSelectedPO(null); setPoInputValue(newValue || ""); } onChange(newValue); }
                                else { setSelectedPO(null); setValue("buildNumber" as any, ""); setValue("partAssemblyId", ""); onChange(""); }
                              }}
                              renderOption={(props, option) => {
                                const { key, ...optionProps } = props;
                                if (typeof option === "string") {
                                  return <li {...optionProps} key={key}>{option}</li>;
                                }
                                const details = [
                                  option.lnItemCode ? `LN: ${option.lnItemCode}` : null,
                                  option.drawingNumber ? `Drawing: ${option.drawingNumber}` : null,
                                  option.nomenclature ? `Nomenclature: ${option.nomenclature}` : null,
                                  option.componentType ? `Component Type: ${formatComponentType(option.componentType)}` : null,
                                ].filter(Boolean).join(" | ");

                                return (
                                  <li {...optionProps} key={key}>
                                    <Box sx={{ display: "flex", flexDirection: "column", py: 0.5, width: "100%" }}>
                                      <Typography variant="body2" fontWeight="700" sx={{ fontSize: "0.875rem", color: "primary.main" }}>
                                        PO: {option.productionOrderNumber}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem", lineHeight: 1.3 }}>
                                        {details}
                                      </Typography>
                                    </Box>
                                  </li>
                                );
                              }}
                              renderInput={(params) => <TextField {...params} label="PO Number *" fullWidth size="small" inputRef={ref} onKeyDown={handlePOKeyDown} error={!!error} helperText={error?.message} />}
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Autocomplete
                          options={allDrawingNumbers || []}
                          groupBy={(option) => option.lnItemCode || "No LN Code"}
                          getOptionLabel={(option) => typeof option === "string" ? option : option.lnItemCode || ""}
                          value={selectedDrawing}
                          loading={isLnSearchLoading || isLnSearchFetching}
                          size="small"
                          onInputChange={(_, value) => updateDebouncedLnSearch(value)}
                          onChange={(_, newValue) => {
                            if (newValue && typeof newValue !== "string") {
                              setSelectedDrawing(newValue);
                              setValue("drawingNumber", newValue.drawingNumber);
                              setValue("nomenclature", newValue.nomenclature);
                              setValue("unit", newValue.unitName || "");
                              setValue("location", newValue.location || "");
                              setValue("partAssemblyId", newValue.parentDrawingNumbers?.[0] || "");
                              if (newValue.componentType) { updateComponentAndQrType(newValue.componentType); }
                            } else { setValue("drawingNumber", ""); setValue("nomenclature", ""); setValue("unit", ""); setValue("partAssemblyId", ""); setValue("location", ""); }
                          }}
                          renderInput={(params) => <TextField {...params} label="LN Item Code" placeholder="Type to search..." />}
                        />
                      </Grid>
                    </Grid>

                    {/* Row 2: Drawing Number, Nomenclature, Available For */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} md={4}>
                        <Controller
                          name="drawingNumber"
                          control={control}
                          rules={{ required: "Drawing Number is required" }}
                          render={({ field: { onChange } }) => (
                            <Autocomplete
                              options={drawingNumbers.filter((d: DrawingNumber) => !selectedDrawing?.lnItemCode || d.lnItemCode === selectedDrawing.lnItemCode)}
                              getOptionLabel={(option) => typeof option === "string" ? option : option.drawingNumber || ""}
                              value={selectedDrawing}
                              size="small"
                              onChange={(_, value) => {
                                setSelectedDrawing(value);
                                onChange(value ? value.drawingNumber : "");
                                if (value) {
                                  setValue("nomenclature", value.nomenclature);
                                  setValue("location", value.location || "");
                                  setValue("unit", value.unitName || "");
                                  if (value.componentType) { updateComponentAndQrType(value.componentType); }
                                  setValue("partAssemblyId", value.parentDrawingNumbers?.[0] || "");
                                } else { setValue("nomenclature", ""); setValue("unit", ""); setValue("partAssemblyId", ""); setValue("location", ""); }
                              }}
                              renderInput={(params) => <TextField {...params} label="Drawing Number *" error={!!errors.drawingNumber} helperText={errors.drawingNumber?.message} />}
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Controller name="nomenclature" control={control} render={({ field }) => <TextField {...field} label="Nomenclature" fullWidth size="small" InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }} InputLabelProps={{ shrink: true }} />} />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <TextField label="Available For" value={selectedDrawing?.availableFor || ""} fullWidth size="small" InputProps={{ readOnly: true }} sx={{ bgcolor: "grey.50" }} />
                      </Grid>
                    </Grid>

                    {/* Row 3: Prod Series *, Component Type, Project Number */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} md={4}>
                        <Controller
                          name="productionSeries"
                          control={control}
                          rules={{ required: "Production Series is required" }}
                          render={({ field: { onChange, value } }) => (
                            <Autocomplete
                              size="small"
                              options={productionSeries || []}
                              getOptionLabel={(option) => typeof option === "string" ? option : option.productionSeries || ""}
                              value={(productionSeries || []).find((s) => s.productionSeries === value) || (value ? (value as any) : null)}
                              onChange={(_, newValue) => onChange(newValue ? (typeof newValue === "string" ? newValue : newValue.productionSeries) : "")}
                              renderInput={(params) => <TextField {...params} label="Production Series *" error={!!errors.productionSeries} helperText={errors.productionSeries?.message} />}
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <TextField label="Component Type" value={formatComponentType(componentType) || ""} fullWidth size="small" InputProps={{ readOnly: true }} sx={{ bgcolor: "grey.50" }} />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Controller name="projectNumber" control={control} render={({ field }) => <TextField {...field} label="Project Number" fullWidth size="small" />} />
                      </Grid>
                    </Grid>

                    {/* Row 4: Location, IR Number, MSN Number */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} md={4}>
                        <Controller name="location" control={control} render={({ field }) => <TextField {...field} label="Location" fullWidth size="small" InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }} InputLabelProps={{ shrink: true }} />} />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Controller name="irNumber" control={control} rules={{ required: "IR Number is required" }} render={({ field, fieldState: { error } }) => (
                          <Autocomplete {...field} options={irNumbers} getOptionLabel={(option) => typeof option === "string" ? option : option.irNumber || ""} value={selectedIRNumber} loading={loading} size="small" onOpen={handleIROpen} onInputChange={handleIRInputChange} onChange={(_, value) => { setSelectedIRNumber(value); setValue("irNumber", value?.irNumber || ""); setIrSearchText(""); field.onChange(value?.irNumber || ""); }} renderInput={(params) => <TextField {...params} label="IR Number *" error={!!error} helperText={error?.message} />} />
                        )} />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Controller name="msnNumber" control={control} rules={{ required: "MSN Number is required" }} render={({ field, fieldState: { error } }) => (
                          <Autocomplete {...field} options={msnNumbers} getOptionLabel={(option) => typeof option === "string" ? option : option.msnNumber || ""} value={selectedMSNNumber} loading={loading} size="small" onOpen={handleMSNOpen} onInputChange={handleMSNInputChange} onChange={(_, value) => { setSelectedMSNNumber(value); setValue("msnNumber", value?.msnNumber || ""); setMsnSearchText(""); field.onChange(value?.msnNumber || ""); }} renderInput={(params) => <TextField {...params} label="MSN Number *" error={!!error} helperText={error?.message} />} />
                        )} />
                      </Grid>
                    </Grid>

                    {/* Row 5: Unit, Manufacturing Date, Build No */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} md={4}>
                        <Controller name="unit" control={control} rules={{ required: "Unit is required" }} render={({ field }) => (
                          <FormControl fullWidth error={!!errors.unit} size="small">
                            <InputLabel>Unit *</InputLabel>
                            <Select {...field} label="Unit *">{units.map((unit) => <MenuItem key={unit.id} value={unit.unitName}>{unit.unitName}</MenuItem>)}</Select>
                            {errors.unit && <FormHelperText>{errors.unit.message}</FormHelperText>}
                          </FormControl>
                        )} />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Controller name="manufacturingDate" control={control} render={({ field }) => <DatePicker {...field} label="Manufacturing Date" maxDate={new Date()} slotProps={{ textField: { size: "small", fullWidth: true, error: !!errors.manufacturingDate, helperText: errors.manufacturingDate?.message } }} />} />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Controller name="buildNumber" control={control} render={({ field }) => <TextField {...field} label="Build No" fullWidth size="small" InputProps={{ readOnly: true }} InputLabelProps={{ shrink: true }} sx={{ bgcolor: "grey.50" }} />} />
                      </Grid>
                      {selectedDrawing?.isExpiry === true && (
                        <Grid item xs={12} md={4}>
                          <Controller name="expiryDate" control={control} render={({ field }) => <DatePicker {...field} value={field.value || null} onChange={(newValue) => field.onChange(newValue || null)} label="Expiry Date *" slotProps={{ textField: { size: "small", fullWidth: true } }} />} />
                        </Grid>
                      )}
                    </Grid>
                  </>
                )}

                {/* 3. ID Specific Section */}
                {componentType === "ID" && (
                  <>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} md={12}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <FormLabel component="legend" sx={{ mr: 2, fontSize: "0.875rem" }}>ID Type:</FormLabel>
                          <Controller name="idType" control={control} render={({ field }) => (
                            <RadioGroup {...field} row>
                              <FormControlLabel value="series" control={<Radio size="small" />} label="Series" />
                              <FormControlLabel value="custom" control={<Radio size="small" />} label="Custom" />
                              <FormControlLabel value="random" control={<Radio size="small" />} label="Random" />
                            </RadioGroup>
                          )} />
                        </Box>
                      </Grid>
                    </Grid>
                    {idType === "series" && (
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} md={4}>
                          <Controller
                            name="startRange"
                            control={control}
                            rules={{
                              required: "Start ID is required",
                              validate: (val) => {
                                if (!val) return true;
                                const num = Number(val);
                                if (selectedPO && poStartId > 0 && num < poStartId) return `ID should not be less than ${poStartId}`;
                                if (selectedPO && poEndId > 0 && num > poEndId) return `ID should not be greater than ${poEndId}`;
                                return true;
                              },
                            }}
                            render={({ field, fieldState: { error } }) => (
                              <TextField
                                {...field}
                                label="Start ID *"
                                type="number"
                                fullWidth
                                size="small"
                                error={!!error}
                                helperText={error?.message || idRangeNotice}
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Controller
                            name="endRange"
                            control={control}
                            rules={{
                              required: "End ID is required",
                              validate: (val) => {
                                if (!val) return true;
                                const num = Number(val);
                                if (selectedPO && poStartId > 0 && num < poStartId) return `ID should not be less than ${poStartId}`;
                                if (selectedPO && poEndId > 0 && num > poEndId) return `ID should not be greater than ${poEndId}`;
                                return true;
                              },
                            }}
                            render={({ field, fieldState: { error } }) => (
                              <TextField
                                {...field}
                                label="End ID *"
                                type="number"
                                fullWidth
                                size="small"
                                error={!!error}
                                helperText={error?.message || idRangeNotice}
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Controller name="quantity" control={control} render={({ field }) => <TextField {...field} label="Quantity" type="number" fullWidth size="small" InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }} />} />
                        </Grid>
                      </Grid>
                    )}
                    {idType === "custom" && (
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} md={4}>
                          <Controller
                            name="customIdRange"
                            control={control}
                            rules={{
                              required: "ID Range is required",
                              validate: (val) => {
                                if (!val) return true;
                                if (!selectedPO || poStartId <= 0 || poEndId <= 0) return true;
                                const parts = val.split(",").map((p) => p.trim());
                                for (const part of parts) {
                                  if (!part) continue;
                                  if (part.includes("-")) {
                                    const [s, e] = part.split("-").map((n) => Number(n.trim()));
                                    if (!isNaN(s) && s < poStartId) return `ID should not be less than ${poStartId}`;
                                    if (!isNaN(e) && e > poEndId) return `ID should not be greater than ${poEndId}`;
                                  } else {
                                    const n = Number(part);
                                    if (!isNaN(n) && n < poStartId) return `ID should not be less than ${poStartId}`;
                                    if (!isNaN(n) && n > poEndId) return `ID should not be greater than ${poEndId}`;
                                  }
                                }
                                return true;
                              },
                            }}
                            render={({ field, fieldState: { error } }) => (
                              <TextField
                                {...field}
                                label="ID Range *"
                                fullWidth
                                size="small"
                                placeholder="e.g., 1,2,3,4-7"
                                error={!!error}
                                helperText={error?.message || idRangeNotice}
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Controller name="quantity" control={control} render={({ field }) => <TextField {...field} label="Quantity" type="number" fullWidth size="small" InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }} />} />
                        </Grid>
                      </Grid>
                    )}
                    {idType === "random" && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                            Random IDs (Showing {visibleRandomCount} of 200 IDs)
                          </Typography>
                          {selectedPO && poStartId > 0 && poEndId > 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                              select id between {poStartId}-{poEndId}
                            </Typography>
                          )}
                        </Box>

                        <Grid container spacing={1} sx={{ mb: 2 }}>
                          {Array.from({ length: visibleRandomCount }, (_, index) => (
                            <Grid item xs={6} sm={4} md={2.4} lg={1.2} key={index}>
                              <Controller
                                name={`randomIds.${index}`}
                                control={control}
                                rules={{
                                  validate: (val) => {
                                    if (!val) return true;
                                    const num = Number(val);
                                    if (isNaN(num)) return "Invalid";
                                    if (!selectedPO) return true;
                                    if (poStartId > 0 && num < Number(poStartId))
                                      return `ID should not be less than ${poStartId}`;
                                    if (poEndId > 0 && num > Number(poEndId))
                                      return `ID should not be greater than ${poEndId}`;
                                    return true;
                                  },
                                }}
                                render={({ field, fieldState: { error } }) => (
                                  <TextField
                                    {...field}
                                    size="small"
                                    placeholder={`ID ${index + 1}`}
                                    error={!!error}
                                    helperText={error?.message}
                                    inputProps={{ maxLength: 10 }}
                                    fullWidth
                                    onChange={(e) => {
                                      field.onChange(e);
                                      handleRandomIdChange(index, e.target.value);
                                    }}
                                  />
                                )}
                              />
                            </Grid>
                          ))}
                        </Grid>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                          {visibleRandomCount < 200 && (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => setVisibleRandomCount((prev) => Math.min(prev + 20, 200))}
                              startIcon={<AddIcon />}
                              sx={{ textTransform: "none", fontWeight: 600 }}
                            >
                              Load More (+20 IDs)
                            </Button>
                          )}

                          <Controller
                            name="quantity"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="Quantity"
                                type="number"
                                size="small"
                                InputProps={{
                                  readOnly: true,
                                  style: { backgroundColor: "#f5f5f5" },
                                }}
                                sx={{ bgcolor: "grey.50", width: 150 }}
                              />
                            )}
                          />
                        </Box>
                      </Box>
                    )}
                  </>
                )}

                {/* 4. BATCH Specific Section */}
                {componentType === "BATCH" && (
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={4}>
                      <Controller
                        name="customIdRange"
                        control={control}
                        rules={{
                          required: "ID Range is required",
                          validate: (val) => {
                            if (!val) return true;
                            if (!selectedPO || poStartId <= 0 || poEndId <= 0) return true;
                            const parts = val.split(",").map((p) => p.trim());
                            for (const part of parts) {
                              if (!part) continue;
                              if (part.includes("-")) {
                                const [s, e] = part.split("-").map((n) => Number(n.trim()));
                                if (!isNaN(s) && s < poStartId) return `ID should not be less than ${poStartId}`;
                                if (!isNaN(e) && e > poEndId) return `ID should not be greater than ${poEndId}`;
                              } else {
                                const n = Number(part);
                                if (!isNaN(n) && n < poStartId) return `ID should not be less than ${poStartId}`;
                                if (!isNaN(n) && n > poEndId) return `ID should not be greater than ${poEndId}`;
                              }
                            }
                            return true;
                          },
                        }}
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            label="ID Range *"
                            fullWidth
                            size="small"
                            placeholder="e.g., 1,2,3,4-7"
                            error={!!error}
                            helperText={error?.message || idRangeNotice}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Controller name="quantity" control={control} render={({ field }) => <TextField {...field} label="Quantity" type="number" fullWidth size="small" InputProps={{ readOnly: true, style: { backgroundColor: "#f5f5f5" } }} />} />
                    </Grid>
                  </Grid>
                )}

                {/* 5. Matrix Table Section (FIM & Purchase Item) */}
                {(componentType === "FIM" || componentType === "SI") && (
                  <Box sx={{ mb: 3, pl: { xs: 2, md: 5.5 }, pr: { xs: 1, md: 2 } }}>
                    <Box sx={{ display: "flex", alignItems: "flex-end", width: "100%", gap: 1.5 }}>
                      <TableContainer component={Paper} variant="outlined" sx={{ flexGrow: 1, maxHeight: "500px", overflowY: "auto" }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell><b>Sr.No</b></TableCell>
                              <TableCell><b>ID No</b></TableCell>
                              <TableCell><b>Quantity</b></TableCell>
                              <TableCell><b>Size</b></TableCell>
                              <TableCell><b>MRIR</b></TableCell>
                              <TableCell><b>HEAT / LOT / BATCH No</b></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {QrTableRows.map((row, index) => (
                              <TableRow key={row.srNo}>
                                <TableCell>{row.srNo}</TableCell>
                                <TableCell><TextField value={row.idNo} size="small" fullWidth onChange={(e) => handleQrTableChange(index, "idNo", e.target.value)} onKeyDown={(e) => handleEnterKey(e, index, false)} /></TableCell>
                                <TableCell><TextField value={row.quantity} type="number" size="small" fullWidth onFocus={(e) => e.target.select()} onChange={(e) => handleQrTableChange(index, "quantity", e.target.value)} onKeyDown={(e) => handleEnterKey(e, index, false)} /></TableCell>
                                <TableCell><TextField value={row.size} size="small" fullWidth onChange={(e) => handleQrTableChange(index, "size", e.target.value)} onKeyDown={(e) => handleEnterKey(e, index, false)} /></TableCell>
                                <TableCell><TextField value={row.mirir} size="small" fullWidth onChange={(e) => handleQrTableChange(index, "mirir", e.target.value)} onKeyDown={(e) => handleEnterKey(e, index, false)} /></TableCell>
                                <TableCell><TextField value={row.heatLotBatchNo} size="small" fullWidth onChange={(e) => handleQrTableChange(index, "heatLotBatchNo", e.target.value)} onKeyDown={(e) => handleEnterKey(e, index, true)} /></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <Tooltip title="Add Row" arrow>
                        <IconButton onClick={addNewQrRow} sx={{ backgroundColor: "#A8005A", color: "#fff", width: 36, height: 36, "&:hover": { backgroundColor: "#800044" } }}>
                          <AddIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Total Quantity:</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main" }}>{totalQuantity}</Typography>
                    </Box>
                  </Box>
                )}

                {/* 6. MRIR & Part Assembly Section (ID & BATCH) */}
                {componentType !== "FIM" && componentType !== "SI" && (
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={4}>
                      <Controller name="mrirNumber" control={control} render={({ field }) => <TextField {...field} label="MRIR Number *" fullWidth size="small" error={!!errors.mrirNumber} helperText={errors.mrirNumber?.message} />} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Controller name="partAssemblyId" control={control} render={({ field: { onChange, value } }) => {
                        const parentCount = selectedDrawing?.parentDrawingNumbers?.length || 0;
                        return (
                          <Autocomplete
                            value={value || ""}
                            onChange={(_, newValue) => onChange(newValue || "")}
                            options={selectedDrawing?.parentDrawingNumbers || []}
                            freeSolo
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label={parentCount > 0 ? `Part Number (Assembly) (${parentCount} ${parentCount === 1 ? "assembly" : "assemblies"})` : "Part Number (Assembly)"}
                                helperText={parentCount > 0 ? `Used in ${parentCount} parent ${parentCount === 1 ? "assembly" : "assemblies"}` : undefined}
                                size="small"
                                fullWidth
                              />
                            )}
                            size="small"
                          />
                        );
                      }} />
                    </Grid>
                  </Grid>
                )}

                {/* 7. Disposition Section */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <FormLabel component="legend" sx={{ mr: 2, fontSize: "0.875rem" }}>Disposition *:</FormLabel>
                      <Controller name="desposition" control={control} rules={{ required: "Disposition is required" }} render={({ field }) => (
                        <RadioGroup {...field} row onChange={(e) => field.onChange(e.target.value)}>
                          <FormControlLabel value="Accepted" control={<Radio size="small" />} label="Accepted" />
                          <FormControlLabel value="Rejected" control={<Radio size="small" />} label="Rejected" />
                          {(componentType === "FIM" || componentType === "SI") ? (
                            <FormControlLabel value="Send Back to Customer" control={<Radio size="small" />} label="Send Back to Customer" />
                          ) : (
                            <FormControlLabel value="Used for QT" control={<Radio size="small" />} label="Used for QT" />
                          )}
                        </RadioGroup>
                      )} />
                    </Box>
                  </Grid>
                </Grid>

                {/* 8. Remarks Section (Available for all 4 types) */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12}>
                    <Controller name="remark" control={control} render={({ field }) => <TextField {...field} label="Remarks" fullWidth size="small" multiline rows={2} placeholder="Enter any additional remarks here..." />} />
                  </Grid>
                </Grid>

                {/* 9. Form Actions */}
                <Box sx={{ display: "flex", justifyContent: "center", gap: 2, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
                  <Button type="button" variant="outlined" size="medium" onClick={handleReset} startIcon={<RefreshIcon />} sx={{ minWidth: 120, py: 1.5, height: 40 }}>Reset</Button>
                  <Button type="submit" variant="contained" size="medium" startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <QrCodeIcon />} sx={{ minWidth: 200, py: 1.5, height: 40 }}>
                    {loading ? "Generating..." : "Generate QR Code"}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>

          {/* Generated QR Codes */}
          {displayedQRCodes.length > 0 && (
            <Card elevation={2}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Stack
                  direction={isMobile ? "column" : "row"}
                  justifyContent="space-between"
                  alignItems={isMobile ? "stretch" : "center"}
                  spacing={2}
                  sx={{ mb: 3 }}
                >
                  <Typography
                    variant="h6"
                    sx={{ color: "primary.main", fontWeight: 600 }}
                  >
                    Generated QR Codes ({displayedQRCodes.length})
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                  >
                    <Checkbox
                      checked={
                        displayedQRCodes.length > 0 &&
                        selectedBarcodes.length === displayedQRCodes.length
                      }
                      indeterminate={
                        selectedBarcodes.length > 0 &&
                        selectedBarcodes.length < displayedQRCodes.length
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                    <Typography variant="body2" sx={{ mr: 1 }}>
                      Select All
                    </Typography>

                    {/* Split All Button */}
                    {(componentType === "BATCH" || componentType === "Batch") &&
                      watch("unit") === "ECH" && (
                        <Button
                          variant="outlined"
                          color={hasAnySplit ? "error" : "secondary"}
                          size="small"
                          onClick={handleSplitAll}
                          disabled={
                            displayedQRCodes.length === 0 ||
                            (!hasAnySplit && !canSplitAny)
                          }
                          sx={{ mr: 1 }}
                        >
                          {hasAnySplit ? "Close All" : "Split All"}
                        </Button>
                      )}

                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={handleDownload}
                      disabled={selectedBarcodes.length === 0}
                    >
                      Download ({selectedBarcodes.length})
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={handleOpenBulkUpdateDialog}
                      disabled={selectedBarcodes.length === 0}
                    >
                      Update ({selectedBarcodes.length})
                    </Button>
                  </Stack>
                </Stack>

                <TableContainer component={Paper} variant="outlined">
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          padding="checkbox"
                          sx={{ fontWeight: 600, backgroundColor: "grey.200" }}
                        >
                          <Checkbox
                            checked={
                              selectedBarcodes.length === displayedQRCodes.length &&
                              displayedQRCodes.length > 0
                            }
                            indeterminate={
                              selectedBarcodes.length > 0 &&
                              selectedBarcodes.length < displayedQRCodes.length
                            }
                            onChange={(e) => handleSelectAll(e.target.checked)}
                          />
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 600, backgroundColor: "grey.200" }}
                        >
                          Sr. No
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 600, backgroundColor: "grey.200" }}
                        >
                          QR Code
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 600, backgroundColor: "grey.200" }}
                        >
                          ID Number
                        </TableCell>
                        {showBatchIdColumn && (
                          <TableCell
                            sx={{ fontWeight: 600, backgroundColor: "grey.200" }}
                          >
                            Batch ID
                          </TableCell>
                        )}
                        <TableCell
                          sx={{ fontWeight: 600, backgroundColor: "grey.200" }}
                        >
                          Status
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ fontWeight: 600, backgroundColor: "grey.200" }}
                        >
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayedQRCodes
                        .slice(
                          page * rowsPerPage,
                          page * rowsPerPage + rowsPerPage,
                        )
                        .map((item, index) => (
                          <TableRow
                            key={
                              item.id || item.qrCodeNumber || item.serialNumber
                            }
                            hover
                            sx={{
                              backgroundColor: item.isSplitRow ? "#f5f5f5" : "inherit",
                            }}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={selectedBarcodes.includes(
                                  item.id || item.qrCodeNumber || item.serialNumber,
                                )}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleSelectBarcode(
                                    item.id || item.qrCodeNumber || item.serialNumber,
                                    e.target.checked,
                                  );
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              {page * rowsPerPage + index + 1}
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{ fontFamily: "monospace" }}
                              >
                                {item.qrCodeNumber || item.serialNumber}
                              </Typography>
                            </TableCell>
                            <TableCell>{item.idNumber || "-"}</TableCell>
                            {showBatchIdColumn && (
                              <TableCell>{item.batchId || "N/A"}</TableCell>
                            )}
                            <TableCell>
                              <Chip
                                label={item.isNewQrCode ? "New" : "Existing"}
                                color={item.isNewQrCode ? "success" : "default"}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Stack
                                direction="row"
                                spacing={0.5}
                                justifyContent="center"
                                alignItems="center"
                              >
                                <Tooltip title="Copy QR Code">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      copyToClipboard(
                                        item.qrCodeNumber || item.serialNumber,
                                      )
                                    }
                                  >
                                    <CopyIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Download">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      dispatch(
                                        exportQRCode(
                                          item.batchId
                                            ? {
                                              qrCodeId: item.qrCodeNumber || item.serialNumber,
                                              batchId: item.batchId,
                                            }
                                            : (item.qrCodeNumber || item.serialNumber),
                                        ),
                                      )
                                    }
                                  >
                                    <GetAppIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>

                                {/* Row split button */}
                                {(componentType === "BATCH" || componentType === "Batch") &&
                                  watch("unit") === "ECH" &&
                                  ((Number(item.quantity) > 1 || item.hasBeenSplit) &&
                                    !item.isSplitRow ? (
                                    <Button
                                      size="small"
                                      variant="contained"
                                      color={item.hasBeenSplit ? "error" : "secondary"}
                                      onClick={() => handleSplit(page * rowsPerPage + index)}
                                      sx={{
                                        fontSize: "0.7rem",
                                        py: 0.5,
                                        px: 1.5,
                                        minWidth: "auto",
                                        height: "28px",
                                        ml: 0.5,
                                      }}
                                    >
                                      {item.hasBeenSplit ? "Close" : "Split"}
                                    </Button>
                                  ) : (
                                    <Button
                                      size="small"
                                      variant="contained"
                                      disabled
                                      sx={{
                                        fontSize: "0.7rem",
                                        py: 0.5,
                                        px: 1.5,
                                        minWidth: "auto",
                                        height: "28px",
                                        ml: 0.5,
                                        visibility: "hidden",
                                      }}
                                    >
                                      Split
                                    </Button>
                                  ))}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  component="div"
                  count={displayedQRCodes.length}
                  page={page}
                  onPageChange={(_, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                />
              </CardContent>
            </Card>
          )}

          {/* Existing QR Code Dialog */}
          <Dialog
            open={openExistingDialog}
            onClose={() => setOpenExistingDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <WarningIcon color="warning" />
              Existing QR Codes Found
            </DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ mb: 2 }}>
                The following IDs already have QR codes generated in the system.
                Please use the existing ones or check your ID range.
              </DialogContentText>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>ID Number</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>QR Code</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {existingItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.idNumber}</TableCell>
                        <TableCell sx={{ fontFamily: "monospace" }}>
                          {item.qrCodeNumber || item.serialNumber}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenExistingDialog(false)} autoFocus>
                Close
              </Button>
            </DialogActions>
          </Dialog>

          {/* Bulk Update Dialog */}
          <Dialog
            open={bulkUpdateDialogOpen}
            onClose={() => setBulkUpdateDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ fontWeight: 600, color: "primary.main" }}>
              Update QR Codes ({selectedBarcodes.length} Selected)
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ mt: 1 }}>
                <Grid container spacing={2}>
                  {/* Row 1: Prod Series & Available For */}
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      size="small"
                      options={productionSeries || []}
                      getOptionLabel={(option) => {
                        if (typeof option === "string") return option;
                        return option.productionSeries || "";
                      }}
                      value={bulkSelectedProductionSeries}
                      onChange={(_, newValue) => {
                        setBulkSelectedProductionSeries(newValue);
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="Prod Series" fullWidth />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Available For"
                      value={bulkAvailableFor}
                      onChange={(e) => setBulkAvailableFor(e.target.value)}
                      fullWidth
                      size="small"
                    />
                  </Grid>

                  {/* Row 2: Project Number & Location */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Project Number"
                      value={bulkProject}
                      onChange={(e) => setBulkProject(e.target.value)}
                      fullWidth
                      size="small"
                      placeholder="Enter Project Number"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Location"
                      type="number"
                      value={bulkRackLocationId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBulkRackLocationId(val === "" ? "" : Number(val));
                      }}
                      fullWidth
                      size="small"
                      placeholder="Enter Location ID"
                    />
                  </Grid>

                  {/* Row 3: Unit & MRIR */}
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      size="small"
                      options={units || []}
                      getOptionLabel={(option) => {
                        if (typeof option === "string") return option;
                        return option.unitName || "";
                      }}
                      value={bulkSelectedUnit}
                      onChange={(_, newValue) => {
                        setBulkSelectedUnit(newValue);
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="Unit" fullWidth />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="MRIR"
                      value={bulkMrir}
                      onChange={(e) => setBulkMrir(e.target.value)}
                      fullWidth
                      size="small"
                      placeholder="Enter MRIR"
                    />
                  </Grid>

                  {/* Row 4: IR & MSN */}
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      size="small"
                      options={bulkIrNumbers}
                      getOptionLabel={(option) => {
                        if (typeof option === "string") return option;
                        return option.irNumber || "";
                      }}
                      value={bulkSelectedIR}
                      onChange={(_, newValue) => {
                        setBulkSelectedIR(newValue);
                      }}
                      filterOptions={(options, { inputValue }) => {
                        if (!inputValue) return options;
                        const searchLower = inputValue.toLowerCase();
                        return options.filter((option) =>
                          option.irNumber?.toLowerCase().includes(searchLower) ||
                          option.drawingNumber?.toLowerCase().includes(searchLower) ||
                          option.idNumberRange?.toLowerCase().includes(searchLower)
                        );
                      }}
                      renderOption={(props, option) => {
                        const { key, ...optionProps } = props;
                        return (
                          <li {...optionProps} key={key}>
                            <Box sx={{ display: "flex", flexDirection: "column", py: 0.5, width: "100%" }}>
                              <Typography variant="body2">{option.irNumber}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {option.drawingNumber || ""} | IDs: {option.idNumberRange || ""}
                              </Typography>
                            </Box>
                          </li>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="IR"
                          placeholder="Search IR..."
                          fullWidth
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      size="small"
                      options={bulkMsnNumbers}
                      getOptionLabel={(option) => {
                        if (typeof option === "string") return option;
                        return option.msnNumber || "";
                      }}
                      value={bulkSelectedMSN}
                      onChange={(_, newValue) => {
                        setBulkSelectedMSN(newValue);
                      }}
                      filterOptions={(options, { inputValue }) => {
                        if (!inputValue) return options;
                        const searchLower = inputValue.toLowerCase();
                        return options.filter((option) =>
                          option.msnNumber?.toLowerCase().includes(searchLower) ||
                          option.drawingNumber?.toLowerCase().includes(searchLower) ||
                          option.idNumberRange?.toLowerCase().includes(searchLower)
                        );
                      }}
                      renderOption={(props, option) => {
                        const { key, ...optionProps } = props;
                        return (
                          <li {...optionProps} key={key}>
                            <Box sx={{ display: "flex", flexDirection: "column", py: 0.5, width: "100%" }}>
                              <Typography variant="body2">{option.msnNumber}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {option.drawingNumber || ""} | IDs: {option.idNumberRange || ""}
                              </Typography>
                            </Box>
                          </li>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="MSN"
                          placeholder="Search MSN..."
                          fullWidth
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button
                onClick={() => setBulkUpdateDialogOpen(false)}
                color="inherit"
                variant="outlined"
                size="small"
                disabled={bulkLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkUpdateSubmit}
                color="primary"
                variant="contained"
                size="small"
                disabled={bulkLoading}
                startIcon={bulkLoading && <CircularProgress size={20} color="inherit" />}
              >
                {bulkLoading ? "Updating..." : "Update"}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      </Box>
    </LocalizationProvider>
  );
}
