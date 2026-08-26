import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
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
  Alert,
  FormHelperText,
  FormControlLabel,
  Autocomplete,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  TablePagination,
  Paper,
  Stack,
  IconButton,
  Tooltip,
  Chip,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  QrCode as QrCodeIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  GetApp as GetAppIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useForm, Controller } from "react-hook-form";
import type { RootState, AppDispatch } from "../../store/store";
import type {
  DrawingNumber,
  NewQRCodeFormData,
  SerialNumberSummary,
  ProductionSeries,
  Unit,
  Shape,
  IRNumber,
  MSNNumber,
} from "../../types";

import {
  generateStandardFieldQRCode,
  clearError,
  clearGeneratedNumber,
  clearQRCodeList,
  exportQRCode,
  exportBulkQRCodes,
  bulkUpdateQRCode,
} from "../../store/slices/qrcodeSlice";
import {
  useProductionSeries,
  useDrawingNumbers,
  useUnits,
  useShapes,
  useLnItemCodeSearch,
  useAllDrawingNumbers,
  useIRNumbers,
  useMSNNumbers,
} from "../../hooks/useMasterData";
import debounce from "lodash/debounce";

//For Table
interface QrTableRow {
  srNo: number;
  idNo: string;
  quantity: number | string;
  size: string;
  mirir: string;
  heatLotBatchNo: string;
}

const createDefaultValues = (): NewQRCodeFormData => ({
  productionOrderNumber: "",
  drawingNumber: "",
  nomenclature: "",
  productionSeries: "",
  unit: "",
  manufacturingDate: null,
  expiryDate: null,
  irNumber: "",
  msnNumber: "",
  poNumber: "",
  projectNumber: "",
  mrirNumber: "",
  quantity: 0,
  componentType: "FIM",
  idType: "custom",
  startRange: 0,
  endRange: 0,
  randomIds: Array(200).fill(""),
  customIdRange: "",
  batchId: "",
  location: "",
  remark: "",
  lnItemDescription: "",
  partNo: "",
  size: "",
  shapes: "",
  customerItemCode: "",
  mrir: "",
  qty: 1,
  material: "",
  htLotNo: "",
  mfgDate: null,
  expireDate: null,
  fanManNumber: "",
  fanManSerialNumber: "",
  purchaseOrderNumber: "",
  qc: "Accepted",
  msnIrNumber: "",
  gfnNo: "",
  wc: "",
  desposition: "Accepted",
  partAssemblyId: "",
});

const NewBarcodeGeneration: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useDispatch<AppDispatch>();

  // TanStack Query Hooks for Master Data
  const { data: productionSeriesData = [] } = useProductionSeries();
  const { data: unitsData = [] } = useUnits();
  const { data: shapesData = [] } = useShapes();

  // Drawing Numbers: Load all on page load, search when user types
  const [drawingSearchText, setDrawingSearchText] = useState("");
  const [drawingInputValue, setDrawingInputValue] = useState("");

  const { data: allDrawingNumbers = [] } = useAllDrawingNumbers();
  const { data: searchedDrawingNumbers = [] } = useDrawingNumbers(
    "",
    drawingSearchText,
  );

  // Use searched results if user has typed 3+ characters, otherwise use all
  const drawingNumbers =
    (drawingSearchText.length >= 3
      ? searchedDrawingNumbers
      : allDrawingNumbers) || [];



  // IR and MSN Numbers state
  const [selectedIRNumber, setSelectedIRNumber] = useState<IRNumber | null>(
    null,
  );
  const [selectedMSNNumber, setSelectedMSNNumber] = useState<MSNNumber | null>(
    null,
  );

  // Redux state for operational data
  const { qrcodeList, loading, serialNumberSummary } = useSelector(
    (state: RootState) => state.qrcode,
  );

  // Local state
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedDrawing, setSelectedDrawing] = useState<DrawingNumber | null>(
    null,
  );
  const [selectedBarcodes, setSelectedBarcodes] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [componentType, setComponentType] = useState<"FIM" | "SI">("FIM");
  const [noMfgDate, setNoMfgDate] = useState(false);
  const [noExpiryDate, setNoExpiryDate] = useState(false);

  // Bulk Update state variables
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  const [bulkMrir, setBulkMrir] = useState("");
  const [bulkSelectedIR, setBulkSelectedIR] = useState<any>(null);
  const [bulkSelectedMSN, setBulkSelectedMSN] = useState<any>(null);
  const [bulkProject, setBulkProject] = useState("");
  const [bulkHeatLot, setBulkHeatLot] = useState("");
  const [bulkSize, setBulkSize] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkSelectedDrawing, setBulkSelectedDrawing] = useState<any>(null);
  const [bulkSelectedProductionSeries, setBulkSelectedProductionSeries] = useState<any>(null);
  const [bulkSelectedUnit, setBulkSelectedUnit] = useState<any>(null);
  const [bulkFanManNumber, setBulkFanManNumber] = useState("");
  const [bulkFanManSerialNumber, setBulkFanManSerialNumber] = useState("");
  const [bulkRackLocationId, setBulkRackLocationId] = useState<number | "">(
    "",
  );
  const [bulkQuantity, setBulkQuantity] = useState<number | string>("");
  const [bulkIdNumber, setBulkIdNumber] = useState("");
  //new
  const [QrTableRows, setQrTableRows] = useState<QrTableRow[]>(
    Array.from({ length: 5 }, (_, index) => ({
      srNo: index + 1,
      idNo: "",
      quantity: "",
      size: "",
      mirir: "",
      heatLotBatchNo: "",
    })),
  );
  //Add new row in table
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
  //New
  const handleEnterKey = (
    e: React.KeyboardEvent,
    rowIndex: number,
    isLastColumn: boolean,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Add new row only if pressing Enter in last column of last row AND current row has ID No data
      if (isLastColumn && rowIndex === QrTableRows.length - 1) {
        const currentRow = QrTableRows[rowIndex];
        if (currentRow.idNo.trim() !== "") {
          addNewQrRow();
        }
      }
    }
  };

  // Visibility rules based on FIM vs SI (Purchase)
  const fieldVisibility = useMemo(() => {
    const isFIM = componentType === "FIM";
    return {
      lnItemDescription: true, // Project Description: Y (FIM), Y (SI)
      partNo: true, // Part No: Y, Y
      size: true, // Size: Y, Y
      shapes: true, // Shapes: Y, Y
      customerItemCode: isFIM, // Customer Item Code: Y (FIM), N (SI)
      mrir: isFIM, // MRIR: Y (FIM), N (SI)
      qty: true, // Qty: Y, Y
      material: true, // Material: Y, Y
      htLotNo: true, // HT/Lot No: Y, Y
      mfgDate: true, // MFG DT: Y, Y
      expireDate: true, // EXPIRE DT: Y, Y
      fanManNumber: isFIM, // FAN/MAN Number: Y (FIM), N (SI)
      fanManSerialNumber: isFIM, // FAN/MAN Serial Number: Y (FIM), N (SI)
      msnIrNumber: true, // MSN/IR Number: Y, Y
      gfnNo: isFIM, // GFN No: Y (FIM), N (SI)
    } as const;
  }, [componentType]);

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

  const serialSummaryMap = useMemo(() => {
    const map = new Map<string, SerialNumberSummary>();
    (serialNumberSummary || []).forEach((summary) => {
      if (summary?.qrCodeNumber) {
        map.set(summary.qrCodeNumber, summary);
      }
    });
    return map;
  }, [serialNumberSummary]);

  const dateColumnMd = fieldVisibility.mrir ? 4 : 6;

  // Disposition options for dropdown
  const dispositionOptions = ["Accepted", "Rejected", "Send Back to Customer"];

  // Form setup
  const defaultValuesRef = useRef<NewQRCodeFormData>(createDefaultValues());
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NewQRCodeFormData>({
    defaultValues: defaultValuesRef.current,
  });

  // IR and MSN Numbers - show all without filters (remover ir msn lock for this page only)
  const { data: irNumbers = [] } = useIRNumbers(
    "",
    undefined,
    undefined,
    undefined,
    undefined,
  );
  const { data: msnNumbers = [] } = useMSNNumbers(
    "",
    undefined,
    undefined,
    undefined,
    undefined,
  );

  // Clear FIM-only fields when switching to SI
  useEffect(() => {
    if (componentType === "SI") {
      setValue("customerItemCode", "");
      setValue("mrir", "");
      setValue("fanManNumber", "");
      setValue("fanManSerialNumber", "");
      setValue("gfnNo", "");
    }
  }, [componentType, setValue]);

  // Clear QR code list when component mounts and unmounts
  useEffect(() => {
    dispatch(clearQRCodeList());
    return () => {
      dispatch(clearQRCodeList());
    };
  }, [dispatch]);

  // TanStack Query: Search state for LN item codes
  const [lnSearchTerm, setLnSearchTerm] = useState("");
  const [debouncedLnSearch, setDebouncedLnSearch] = useState("");

  // Debounce the search term to avoid too many API calls
  const updateDebouncedLnSearch = useMemo(
    () => debounce((value: string) => setDebouncedLnSearch(value), 300),
    [],
  );

  // Search hook - only used when user types 2+ characters
  const { isLoading: isLnSearchLoading, isFetching: isLnSearchFetching } =
    useLnItemCodeSearch(debouncedLnSearch);

  // Master data handled by hooks

  useEffect(() => {
    setValue("qty", totalQuantity, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [totalQuantity, setValue]);

  useEffect(() => {
    setNoMfgDate(false);
    setNoExpiryDate(false);
  }, [selectedDrawing]);

  // Debounced search functions
  const debouncedDrawingSearch = useMemo(
    () =>
      debounce((searchValue: string) => {
        setDrawingSearchText(searchValue);
      }, 300),
    [],
  );

  // Handle selection functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBarcodes(
        qrcodeList.map((item) => item.qrCodeNumber || item.serialNumber),
      );
    } else {
      setSelectedBarcodes([]);
    }
  };

  const handleSelectBarcode = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedBarcodes((prev) => [...prev, id]);
    } else {
      setSelectedBarcodes((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  //for table
  const handleQrTableChange = (
    index: number,
    field: keyof Omit<QrTableRow, "srNo">,
    value: string | number,
  ) => {
    setQrTableRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const handleDownload = async () => {
    if (selectedBarcodes.length > 0) {
      const selectedQRCodes = qrcodeList
        .filter((item) =>
          selectedBarcodes.includes(item.qrCodeNumber || item.serialNumber),
        )
        .map((item) => item.qrCodeNumber || item.serialNumber);
      await dispatch(exportBulkQRCodes(selectedQRCodes) as any);
    }
  };

  const handleOpenBulkUpdateDialog = () => {
    // Find the first selected item in qrcodeList
    const firstSelected = qrcodeList.find(
      (item) => selectedBarcodes.includes(item.qrCodeNumber || item.serialNumber)
    ) as any;

    // 1. RM Item Code & RM Drawing Number (bulkSelectedDrawing)
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
    setBulkSelectedDrawing(drawing);

    // 2. Production Series (bulkSelectedProductionSeries)
    let series = null;
    if (firstSelected?.productionSeriesId) {
      series = productionSeriesData.find((ps: any) => ps.id === firstSelected.productionSeriesId);
    }
    if (!series && firstSelected?.productionSeries) {
      series = productionSeriesData.find((ps: any) => ps.productionSeries === firstSelected.productionSeries);
    }
    if (!series) {
      const mainSeries = watch("productionSeries");
      series = productionSeriesData.find((ps: any) => ps.productionSeries === mainSeries) || null;
    }
    setBulkSelectedProductionSeries(series);

    // 3. Unit (bulkSelectedUnit)
    let unit = null;
    if (firstSelected?.unitId) {
      unit = unitsData.find((u: any) => u.id === firstSelected.unitId);
    }
    if (!unit && firstSelected?.unit) {
      unit = unitsData.find((u: any) => u.unitName === firstSelected.unit);
    }
    if (!unit) {
      const mainUnit = watch("unit");
      unit = unitsData.find((u: any) => u.unitName === mainUnit) || null;
    }
    setBulkSelectedUnit(unit);

    // 4. Project Number (bulkProject)
    const project = firstSelected?.projectNumber || watch("projectNumber") || "";
    setBulkProject(project);

    // 5. Location (bulkRackLocationId)
    const locationId = firstSelected?.rackLocationId || selectedDrawing?.rackLocationId || "";
    setBulkRackLocationId(locationId);

    // 6. FAN/MAN number (bulkFanManNumber)
    const fanMan = firstSelected?.fanManNumber || watch("fanManNumber") || "";
    setBulkFanManNumber(fanMan);

    // 7. FAN/MAN serial Number (bulkFanManSerialNumber)
    const fanManSerial = firstSelected?.fanManSerialNumber || watch("fanManSerialNumber") || "";
    setBulkFanManSerialNumber(fanManSerial);

    // 8. IR Number (bulkSelectedIR)
    let ir = null;
    if (firstSelected?.irNumberId) {
      ir = irNumbers.find((i: any) => i.id === firstSelected.irNumberId);
    }
    if (!ir && firstSelected?.irNumber) {
      ir = irNumbers.find((i: any) => i.irNumber === firstSelected.irNumber);
    }
    if (!ir) {
      ir = selectedIRNumber;
    }
    setBulkSelectedIR(ir);

    // 9. MSN Number (bulkSelectedMSN)
    let msn = null;
    if (firstSelected?.msnNumberId) {
      msn = msnNumbers.find((m: any) => m.id === firstSelected.msnNumberId);
    }
    if (!msn && (firstSelected?.msnNumber || firstSelected?.msnIrNumber)) {
      const targetMsn = firstSelected?.msnNumber || firstSelected?.msnIrNumber;
      msn = msnNumbers.find((m: any) => m.msnNumber === targetMsn);
    }
    if (!msn) {
      msn = selectedMSNNumber;
    }
    setBulkSelectedMSN(msn);

    // Reset fields that must NOT be autofilled
    setBulkQuantity("");
    setBulkSize("");
    setBulkMrir("");
    setBulkHeatLot("");

    // 10. ID Number (bulkIdNumber)
    if (selectedBarcodes.length === 1) {
      const qrCodeKey = firstSelected?.qrCodeNumber || firstSelected?.serialNumber || "";
      const summaryInfo = serialSummaryMap.get(qrCodeKey);
      const idNo = summaryInfo?.id || firstSelected?.idNumber || "";
      setBulkIdNumber(idNo);
    } else {
      setBulkIdNumber("");
    }

    setBulkUpdateDialogOpen(true);
  };

  const handleBulkDrawingSelect = (newValue: any) => {
    setBulkSelectedDrawing(newValue);
    if (newValue) {
      // Auto-fill Unit
      if (newValue.unitName) {
        const matchingUnit = unitsData.find(
          (u: any) => u.unitName === newValue.unitName,
        );
        if (matchingUnit) {
          setBulkSelectedUnit(matchingUnit);
        }
      }
      // Auto-fill Rack Location ID
      if (newValue.rackLocationId) {
        setBulkRackLocationId(newValue.rackLocationId);
      } else {
        setBulkRackLocationId("");
      }

      // Reset IR and MSN if they do not match the selected drawing
      if (
        bulkSelectedIR &&
        bulkSelectedIR.drawingNumber !== newValue.drawingNumber
      ) {
        setBulkSelectedIR(null);
      }
      if (
        bulkSelectedMSN &&
        bulkSelectedMSN.drawingNumber !== newValue.drawingNumber
      ) {
        setBulkSelectedMSN(null);
      }
    } else {
      setBulkSelectedUnit(null);
      setBulkRackLocationId("");
      setBulkSelectedIR(null);
      setBulkSelectedMSN(null);
    }
  };

  const handleBulkUpdateSubmit = async () => {
    if (selectedBarcodes.length === 0) {
      setErrorMessage("Please select at least one barcode to update");
      return;
    }

    setBulkLoading(true);
    try {
      // Dynamically build payload with only populated values
      const payload: any = {
        qrCodeNumbers: selectedBarcodes,
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
      if (bulkHeatLot && bulkHeatLot.trim() !== "") {
        payload.heatLotNumber = bulkHeatLot.trim();
      }
      if (bulkSize && bulkSize.trim() !== "") {
        payload.size = bulkSize.trim();
      }
      if (bulkSelectedDrawing?.id) {
        payload.drawingNumberId = bulkSelectedDrawing.id;
      }
      if (bulkSelectedDrawing?.lnItemCodeId) {
        payload.lnItemCodeId = bulkSelectedDrawing.lnItemCodeId;
      }
      if (bulkSelectedProductionSeries?.id) {
        payload.productionSeriesId = bulkSelectedProductionSeries.id;
      }
      if (bulkSelectedUnit?.id) {
        payload.unitId = bulkSelectedUnit.id;
      }
      if (bulkFanManNumber && bulkFanManNumber.trim() !== "") {
        payload.fanManNumber = bulkFanManNumber.trim();
      }
      if (bulkFanManSerialNumber && bulkFanManSerialNumber.trim() !== "") {
        payload.fanManSerialNumber = bulkFanManSerialNumber.trim();
      }
      if (bulkRackLocationId !== "" && bulkRackLocationId !== undefined && bulkRackLocationId !== null && Number(bulkRackLocationId) !== 0) {
        payload.rackLocationId = Number(bulkRackLocationId);
      }
      if (bulkQuantity !== "" && bulkQuantity !== undefined && bulkQuantity !== null && Number(bulkQuantity) !== 0) {
        payload.quantity = Number(bulkQuantity);
      }
      if (selectedBarcodes.length === 1 && bulkIdNumber && bulkIdNumber.trim() !== "") {
        payload.idNumber = bulkIdNumber.trim();
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
      setBulkHeatLot("");
      setBulkSize("");
      setBulkSelectedDrawing(null);
      setBulkSelectedProductionSeries(null);
      setBulkSelectedUnit(null);
      setBulkFanManNumber("");
      setBulkFanManSerialNumber("");
      setBulkRackLocationId("");
      setBulkQuantity("");
      setBulkIdNumber("");

      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
    } catch (err: any) {
      setErrorMessage(err || "Failed to bulk update QR codes");
      setTimeout(() => {
        setErrorMessage("");
      }, 5000);
    } finally {
      setBulkLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Form submission
  const onSubmit = async (data: NewQRCodeFormData) => {
    try {
      // Validate mandatory fields
      if (!selectedDrawing) {
        setErrorMessage("Please select a RM item code");
        return;
      }

      if (!data.productionSeries) {
        setErrorMessage("Please select a production series");
        return;
      }

      if (!data.unit) {
        setErrorMessage("Please select a unit");
        return;
      }

      if (!data.qty || data.qty <= 0) {
        setErrorMessage("Please enter a valid quantity");
        return;
      }

      const isFIM = componentType === "FIM";
      // Matrix IDs can be alphanumeric, so we don't parse them into the 'ids' number array.
      // The backend will use 'matrixRows' which supports string IDs.
      const ids: number[] = [];

      const payload = {
        productionSeriesId:
          (productionSeriesData || []).find(
            (ps: ProductionSeries) =>
              ps.productionSeries === data.productionSeries,
          )?.id || 0,
        componentTypeId: selectedDrawing?.componentTypeId || 1,
        nomenclatureId: selectedDrawing?.nomenclatureId || 0,
        lnItemCodeId: selectedDrawing?.lnItemCodeId || 0,
        rackLocationId: selectedDrawing?.rackLocationId || 0,
        desposition: data.desposition,
        purchaseOrderNumber: data.purchaseOrderNumber,
        projectNumber: data.projectNumber,
        expiryDate: data.expireDate ? data.expireDate.toISOString() : null,
        manufacturingDate: (() => {
          if (!data.mfgDate) return null;

          // Get current Indian time (IST - UTC+5:30)
          const now = new Date();
          const indianTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000); // Add 5.5 hours for IST

          // Combine the selected manufacturing date with current Indian time
          const manufacturingDateWithTime = new Date(data.mfgDate);
          manufacturingDateWithTime.setHours(indianTime.getHours());
          manufacturingDateWithTime.setMinutes(indianTime.getMinutes());
          manufacturingDateWithTime.setSeconds(indianTime.getSeconds());
          manufacturingDateWithTime.setMilliseconds(
            indianTime.getMilliseconds(),
          );

          return manufacturingDateWithTime.toISOString();
        })(),
        irNumber: data.irNumber,
        irNumberId: selectedIRNumber?.id || 0,
        msnNumberId: Number(data.msnNumber) || 0,
        drawingNumberId: selectedDrawing?.id || 0,
        unitId:
          (unitsData || []).find((u: Unit) => u.unitName === data.unit)?.id ||
          0,
        quantity: data.qty,
        mrirNumber: isFIM ? data.mrir : "",
        partNo: data.partNo,
        size: data.size,
        shapeId: data.shapes ? parseInt(data.shapes) : null,
        customerItemCode: isFIM ? data.customerItemCode : "",
        material: data.material,
        htLotNo: data.htLotNo,
        fanManNumber: isFIM ? data.fanManNumber : "",
        fanManSerialNumber: isFIM ? data.fanManSerialNumber : "",
        msnIrNumber: selectedMSNNumber?.msnNumber || "NA",
        gfnNo: isFIM ? data.gfnNo : "",
        wc: data.wc,
        projectDescription: data.lnItemDescription, // Map to projectDescription for backend
        toggleComponentTypeId: componentType === "FIM" ? 1 : 4,
        ids,
        matrixRows: QrTableRows.filter((row) => row.idNo.trim() !== "") // Only send rows with data
          .map((row) => {
            const rowData: any = {
              srNo: row.srNo,
              idNo: row.idNo,
              quantity:
                typeof row.quantity === "string"
                  ? parseFloat(row.quantity) || 0
                  : row.quantity,
            };
            if (row.size && row.size.trim() !== "") {
              rowData.size = row.size.trim();
            }
            if (row.mirir && row.mirir.trim() !== "") {
              rowData.mirir = row.mirir.trim();
            }
            if (row.heatLotBatchNo && row.heatLotBatchNo.trim() !== "") {
              rowData.heatLotBatchNo = row.heatLotBatchNo.trim();
            }
            return rowData;
          }),
      };

      await dispatch(generateStandardFieldQRCode(payload)).unwrap();
      setSuccessMessage("QR Code generated successfully!");
      // handleAddToQrTable(data); // Removed to fix extra row issue

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to generate QR code");
    }
  };

  // Handle form reset
  const handleReset = () => {
    reset(createDefaultValues());
    setSelectedDrawing(null);
   
    setSelectedIRNumber(null);
    setSelectedMSNNumber(null);
    setSuccessMessage("");
    setErrorMessage("");
    setNoMfgDate(false);
    setNoExpiryDate(false);
    setSelectedBarcodes([]);
    setPage(0);
    setRowsPerPage(10);
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
    setDrawingSearchText("");
    setDrawingInputValue("");
    setLnSearchTerm("");
    setBulkIdNumber("");
    
    dispatch(clearError());
    dispatch(clearGeneratedNumber());
    dispatch(clearQRCodeList());
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          p: { xs: 1, sm: 2, md: 3 },
          maxWidth: "100%",
          mx: "auto",
        }}
      >
        <Card elevation={2} sx={{ width: "100%", maxWidth: "100%" }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Typography
                variant="h4"
                sx={{
                  color: "primary.main",
                  fontWeight: 600,
                  fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.5rem" },
                }}
              >
                Generate Standard QR Code
              </Typography>
              <ToggleButtonGroup
                value={componentType}
                exclusive
                onChange={(_, newValue) => {
                  if (newValue !== null) {
                    setComponentType(newValue);
                  }
                }}
                size="small"
                color="primary"
                sx={{
                  gap: 20,
                  "& .MuiToggleButton-root": {
                    minWidth: 120,
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: "12px !important",
                    border: "1px solid !important",
                    borderColor: "divider !important",
                    marginLeft: "0px !important",
                    "&.Mui-selected": {
                      color: "#A8005A",
                      backgroundColor: "rgba(168, 0, 90, 0.12)",
                      borderColor: "#A8005A !important",
                      boxShadow: "0 2px 6px rgba(168, 0, 90, 0.25)",
                    },
                    "&.Mui-selected:hover": {
                      backgroundColor: "rgba(168, 0, 90, 0.16)",
                    },
                  },
                }}
              >
                <ToggleButton value="FIM" sx={{ gap: 10 }}>FIM</ToggleButton>
                <ToggleButton value="SI" sx={{ gap: 10 }}>Purchase Item</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {successMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {successMessage}
              </Alert>
            )}

            {errorMessage && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage("")}>
                {errorMessage}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Row 0: PO Number (Auto-fill helper) */}

              {/* Row 1:  RM Item Code, Drawing Number, Nomenclature - Common fields */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <Autocomplete
                    options={allDrawingNumbers || []}
                    groupBy={(option) => option.lnItemCode || "No LN Code"}
                    getOptionLabel={(option) => {
                      if (typeof option === "string") return option;
                      // Show LN code in the input field when selected
                      return option.lnItemCode || "";
                    }}
                    value={selectedDrawing}
                    inputValue={lnSearchTerm}
                    loading={isLnSearchLoading || isLnSearchFetching}
                    size="small"
                    freeSolo={false}
                    filterOptions={(options, { inputValue }) => {
                      if (!inputValue) return options.slice(0, 100);
                      const searchLower = inputValue.toLowerCase();
                      const filtered = options.filter(
                        (option) =>
                          option.lnItemCode
                            ?.toLowerCase()
                            .includes(searchLower) ||
                          option.drawingNumber
                            ?.toLowerCase()
                            .includes(searchLower) ||
                          option.nomenclature
                            ?.toLowerCase()
                            .includes(searchLower),
                      );
                      return filtered.slice(0, 100);
                    }}
                    onInputChange={(_, value) => {
                      setLnSearchTerm(value);
                      updateDebouncedLnSearch(value);
                    }}
                    onChange={(_, newValue) => {
                      if (newValue && typeof newValue !== "string") {
                        setSelectedDrawing(newValue);
                        setLnSearchTerm(newValue.lnItemCode || "");
                        setDrawingInputValue(newValue.drawingNumber || "");
                        setValue("drawingNumber", newValue.drawingNumber);
                        setValue("nomenclature", newValue.nomenclature);
                        // setValue("lnItemDescription", newValue.nomenclature); // Removed to allow user input
                        setValue("unit", newValue.unitName || "");
                        setValue("location", newValue.location || "");

                        if (newValue.componentType) {
                          const type =
                            newValue.componentType.toUpperCase() === "SI"
                              ? "SI"
                              : "FIM";
                          setComponentType(type as "FIM" | "SI");
                        }

                        if (
                          newValue.parentDrawingNumbers &&
                          newValue.parentDrawingNumbers.length > 0
                        ) {
                          setValue("partNo", newValue.parentDrawingNumbers[0]);
                        } else {
                          setValue("partNo", "");
                        }
                      } else {
                        setSelectedDrawing(null);
                        setLnSearchTerm("");
                        setDrawingInputValue("");
                        setValue("drawingNumber", "");
                        setValue("nomenclature", "");
                        // setValue("lnItemDescription", ""); // Removed to allow user input
                        setValue("unit", "");
                        setValue("location", "");
                      }
                    }}
                    renderOption={(props, option) => {
                      const { key, ...optionProps } = props;
                      return (
                        <li {...optionProps} key={key}>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              py: 0.5,
                              width: "100%",
                            }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight="500"
                              sx={{
                                fontSize: "0.85rem",
                                color: "text.primary",
                              }}
                            >
                              Drawing: {option.drawingNumber}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: "0.72rem" }}
                            >
                              {option.nomenclature} | Type:{" "}
                              {option.componentType}
                            </Typography>
                          </Box>
                        </li>
                      );
                    }}
                    renderGroup={(params) => (
                      <li key={params.key}>
                        <Typography
                          variant="subtitle2"
                          fontWeight="800"
                          sx={{
                            px: 2,
                            py: 0.5,
                            backgroundColor: "grey.200",
                            color: "primary.main",
                            fontSize: "0.95rem",
                            letterSpacing: "0.5px",
                          }}
                        >
                          LN CODE: {params.group}
                        </Typography>
                        <ul style={{ padding: 0, margin: 0 }}>
                          {params.children}
                        </ul>
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
                              {isLnSearchLoading || isLnSearchFetching ? (
                                <CircularProgress color="inherit" size={16} />
                              ) : null}
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
                    render={({ field: { onChange } }) => (
                      <Autocomplete
                        options={drawingNumbers.filter(
                          (d: DrawingNumber) =>
                            !selectedDrawing?.lnItemCode ||
                            d.lnItemCode === selectedDrawing.lnItemCode,
                        )}
                        getOptionLabel={(option) =>
                          typeof option === "string"
                            ? option
                            : option.drawingNumber || ""
                        }
                        freeSolo={true}
                        value={selectedDrawing}
                        inputValue={drawingInputValue}
                        filterOptions={(options, { inputValue }) => {
                          if (!inputValue) return options.slice(0, 100);

                          const searchLower = inputValue.toLowerCase();
                          const filtered = options.filter(
                            (option) =>
                              typeof option !== "string" &&
                              (option.drawingNumber
                                ?.toLowerCase()
                                .includes(searchLower) ||
                                option.lnItemCode
                                  ?.toLowerCase()
                                  .includes(searchLower) ||
                                option.nomenclature
                                  ?.toLowerCase()
                                  .includes(searchLower)),
                          );

                          // Sort by relevance
                          filtered.sort((a, b) => {
                            if (typeof a === "string" || typeof b === "string")
                              return 0;

                            const aDwg = a.drawingNumber?.toLowerCase() || "";
                            const bDwg = b.drawingNumber?.toLowerCase() || "";

                            // Exact match
                            if (aDwg === searchLower) return -1;
                            if (bDwg === searchLower) return 1;

                            // Starts with
                            const aStarts = aDwg.startsWith(searchLower);
                            const bStarts = bDwg.startsWith(searchLower);
                            if (aStarts && !bStarts) return -1;
                            if (!aStarts && bStarts) return 1;

                            return aDwg.localeCompare(bDwg);
                          });

                          return filtered.slice(0, 100);
                        }}
                        onChange={(_, newValue) => {
                          if (newValue && typeof newValue !== "string") {
                            setSelectedDrawing(newValue);
                            setDrawingInputValue(newValue.drawingNumber || "");
                            setLnSearchTerm(newValue.lnItemCode || "");
                            onChange(newValue.drawingNumber);

                            // Update forms fields
                            setValue("nomenclature", newValue.nomenclature);
                            setValue(
                              "lnItemDescription",
                              newValue.nomenclature,
                            );
                            setValue("unit", newValue.unitName || "");
                            setValue("location", newValue.location || "");
                            if (
                              newValue.parentDrawingNumbers &&
                              newValue.parentDrawingNumbers.length > 0
                            ) {
                              setValue(
                                "partNo",
                                newValue.parentDrawingNumbers[0],
                              );
                            } else {
                              setValue("partNo", "");
                            }

                            if (newValue.componentType) {
                              const type =
                                newValue.componentType.toUpperCase() === "SI"
                                  ? "SI"
                                  : "FIM";
                              setComponentType(type as "FIM" | "SI");
                            }
                          } else {
                            // If string (freeSolo) or null
                            onChange(newValue || "");
                            if (typeof newValue !== "string") {
                              setSelectedDrawing(null);
                              setDrawingInputValue("");
                              setLnSearchTerm("");
                            }
                          }
                        }}
                        onInputChange={(_, newValue) => {
                          setDrawingInputValue(newValue);
                          onChange(newValue);
                          debouncedDrawingSearch(newValue);
                        }}
                        size="small"
                        renderOption={(props, option) => {
                          const { key, ...optionProps } = props;
                          return (
                            <li {...optionProps} key={key}>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  py: 0.5,
                                }}
                              >
                                <Typography variant="body2" fontWeight="bold">
                                  {typeof option === "string"
                                    ? option
                                    : option.drawingNumber}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  LN:{" "}
                                  {typeof option === "string"
                                    ? ""
                                    : option.lnItemCode}{" "}
                                  |{" "}
                                  {typeof option === "string"
                                    ? ""
                                    : option.nomenclature}{" "}
                                  |{" "}
                                  {typeof option === "string"
                                    ? ""
                                    : option.componentType}
                                </Typography>
                              </Box>
                            </li>
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="RM Drawing Number *"
                            placeholder="Type to search..."
                            error={!!errors.drawingNumber}
                            helperText={errors.drawingNumber?.message}
                          />
                        )}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="nomenclature"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="LN Item Description"
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Row 2: Production Series, Available For, Component Type - Common fields */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="productionSeries"
                    control={control}
                    render={({ field }) => (
                      <FormControl
                        fullWidth
                        error={!!errors.productionSeries}
                        size="small"
                      >
                        <InputLabel id="production-series-label">
                          Production Series *
                        </InputLabel>
                        <Select
                          labelId="production-series-label"
                          {...field}
                          label="Production Series"
                          error={!!errors.productionSeries}
                        >
                          {productionSeriesData.map(
                            (series: ProductionSeries) => (
                              <MenuItem
                                key={series.id}
                                value={series.productionSeries}
                              >
                                {series.productionSeries}
                              </MenuItem>
                            ),
                          )}
                        </Select>
                        {errors.productionSeries && (
                          <FormHelperText>
                            {errors.productionSeries.message}
                          </FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    label="Available For"
                    value={selectedDrawing?.availableFor || ""}
                    fullWidth
                    size="small"
                    InputProps={{ readOnly: true }}
                    sx={{ bgcolor: "grey.50" }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    label="Component Type"
                    value={selectedDrawing?.componentType || ""}
                    fullWidth
                    size="small"
                    InputProps={{ readOnly: true }}
                    sx={{ bgcolor: "grey.50" }}
                  />
                </Grid>
              </Grid>

              {/* Row 3: FAN/MAN Number, FAN/MAN Serial Number */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {fieldVisibility.fanManNumber && (
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="fanManNumber"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="FAN/MAN Number"
                          fullWidth
                          size="small"
                        />
                      )}
                    />
                  </Grid>
                )}

                {fieldVisibility.fanManSerialNumber && (
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="fanManSerialNumber"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="FAN/MAN Serial Number"
                          fullWidth
                          size="small"
                        />
                      )}
                    />
                  </Grid>
                )}
                {componentType === "FIM" && (
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="location"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Location"
                          fullWidth
                          size="small"
                          InputProps={{
                            readOnly: true,
                            style: { backgroundColor: "#f5f5f5" },
                          }}
                          InputLabelProps={{
                            shrink: true,
                          }}
                        />
                      )}
                    />
                  </Grid>
                )}
              </Grid>
              {/* Row 4: Project, PO Number */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="projectNumber"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Project"
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="purchaseOrderNumber"
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
                {componentType === "SI" && (
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="location"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Location"
                          fullWidth
                          size="small"
                          InputProps={{
                            readOnly: true,
                            style: { backgroundColor: "#f5f5f5" },
                          }}
                          InputLabelProps={{
                            shrink: true,
                          }}
                        />
                      )}
                    />
                  </Grid>
                )}
              </Grid>

              {/* Row 5: Shape, Customer Item Code */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="shapes"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <Autocomplete
                        value={
                          shapesData.find(
                            (s: Shape) => s.id.toString() === value,
                          ) || null
                        }
                        onChange={(_, newValue) => {
                          onChange(newValue ? newValue.id.toString() : "");
                        }}
                        options={shapesData}
                        getOptionLabel={(option) => option.materialName || ""}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Shape"
                            size="small"
                            fullWidth
                            placeholder="Select Shape"
                            error={!!errors.shapes}
                          />
                        )}
                        size="small"
                      />
                    )}
                  />
                </Grid>

                {fieldVisibility.customerItemCode && (
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="customerItemCode"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Customer Item Code"
                          fullWidth
                          size="small"
                          error={!!errors.customerItemCode}
                          helperText={errors.customerItemCode?.message}
                        />
                      )}
                    />
                  </Grid>
                )}
              </Grid>

              {/* Row 6: Part Number, Total Quantity, Unit */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {fieldVisibility.partNo && (
                  <Grid item xs={4} md={4}>
                    <Controller
                      name="partNo"
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <Autocomplete
                          value={value || ""}
                          onChange={(_, newValue) => onChange(newValue || "")}
                          options={selectedDrawing?.parentDrawingNumbers || []}
                          freeSolo
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Part Number (Assembly)"
                              size="small"
                              fullWidth
                              error={!!errors.partNo}
                              helperText={
                                errors.partNo?.message ||
                                (selectedDrawing?.parentDrawingNumbers &&
                                  selectedDrawing.parentDrawingNumbers.length > 0
                                  ? `Used in ${selectedDrawing.parentDrawingNumbers
                                    .length
                                  } assembl${selectedDrawing.parentDrawingNumbers
                                    .length === 1
                                    ? "y"
                                    : "ies"
                                  }`
                                  : undefined)
                              }
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <>
                                    {selectedDrawing?.parentDrawingNumbers &&
                                      selectedDrawing.parentDrawingNumbers
                                        .length > 1 && (
                                        <Chip
                                          label={`+${selectedDrawing.parentDrawingNumbers
                                              .length - 1
                                            } more`}
                                          size="small"
                                          color="info"
                                          sx={{ mr: 0.5, height: 20 }}
                                        />
                                      )}
                                    {params.InputProps.endAdornment}
                                  </>
                                ),
                              }}
                            />
                          )}
                          size="small"
                        />
                      )}
                    />
                  </Grid>
                )}

                <Grid item xs={12} md={4}>
                  <Controller
                    name="qty"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Total Quantity *"
                        type="number"
                        fullWidth
                        size="small"
                        error={!!errors.qty}
                        helperText={
                          errors.qty?.message ||
                          "Quantity is derived from the sum of quantities in the table matrix."
                        }
                        InputProps={{
                          readOnly: true,
                        }}
                        sx={{ bgcolor: "grey.50" }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="unit"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <Autocomplete
                        options={unitsData.map((u: Unit) => u.unitName)}
                        freeSolo={true}
                        forcePopupIcon={true}
                        value={value}
                        onChange={(_, newValue) => onChange(newValue || "")}
                        onInputChange={(_, newValue) => onChange(newValue)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Unit"
                            size="small"
                            error={!!errors.unit}
                            helperText={errors.unit?.message}
                          />
                        )}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Row 7: Material, IR Number, MSN Number */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="material"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Material Specification"
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="irNumber"
                    control={control}
                    rules={{ required: "IR Number is required" }}
                    render={({ field: { onChange, value } }) => (
                      <Autocomplete
                        size="small"
                        options={irNumbers}
                        getOptionLabel={(option) => {
                          if (typeof option === "string") return option;
                          return option.irNumber || "";
                        }}
                        value={irNumbers.find((ir: any) => ir.irNumber === value) || null}
                        onChange={(_, newValue) => {
                          if (newValue) {
                            setSelectedIRNumber(newValue);
                            onChange(newValue.irNumber);
                            if (newValue.purchaseOrderNumber) {
                              setValue("purchaseOrderNumber", newValue.purchaseOrderNumber);
                            }
                            if (newValue.projectNumber) {
                              setValue("projectNumber", newValue.projectNumber);
                            }
                          } else {
                            setSelectedIRNumber(null);
                            onChange("");
                          }
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
                            label="IR Number *"
                            placeholder="Search IR Number..."
                            error={!!errors.irNumber}
                            helperText={errors.irNumber?.message}
                          />
                        )}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="msnNumber"
                    control={control}
                    rules={{ required: "MSN Number is required" }}
                    render={({ field: { onChange, value } }) => (
                      <Autocomplete
                        size="small"
                        options={msnNumbers}
                        getOptionLabel={(option) => {
                          if (typeof option === "string") return option;
                          return option.msnNumber || "NA";
                        }}
                        value={msnNumbers.find((msn: any) => msn.id?.toString() === value?.toString()) || null}
                        onChange={(_, newValue) => {
                          if (newValue) {
                            setSelectedMSNNumber(newValue);
                            onChange(newValue.id);
                            if (newValue.purchaseOrderNumber) {
                              setValue("purchaseOrderNumber", newValue.purchaseOrderNumber);
                            }
                            if (newValue.projectNumber) {
                              setValue("projectNumber", newValue.projectNumber);
                            }
                          } else {
                            setSelectedMSNNumber(null);
                            onChange("");
                          }
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
                                <Typography variant="body2">{option.msnNumber || "NA"}</Typography>
                                {option.msnNumber !== "NA" && (
                                  <Typography variant="caption" color="text.secondary">
                                    {option.drawingNumber || ""} | IDs: {option.idNumberRange || ""}
                                  </Typography>
                                )}
                              </Box>
                            </li>
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="MSN Number *"
                            placeholder="Search MSN Number..."
                            error={!!errors.msnNumber}
                            helperText={errors.msnNumber?.message}
                          />
                        )}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Row 8: MFG Date, Expiry Date */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={dateColumnMd}>
                  <Controller
                    name="mfgDate"
                    control={control}
                    render={({ field }) => (
                      <Box>
                        <DatePicker
                          {...field}
                          value={field.value}
                          onChange={(newValue) => {
                            field.onChange(newValue);
                            if (newValue) {
                              setNoMfgDate(false);
                            }
                          }}
                          label="MFG Date"
                          disabled={noMfgDate}
                          maxDate={new Date()}
                          slotProps={{
                            textField: {
                              size: "small",
                              fullWidth: true,
                              error: !!errors.mfgDate,
                              helperText: errors.mfgDate?.message,
                            },
                          }}
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={noMfgDate}
                              onChange={(event) => {
                                const checked = event.target.checked;
                                setNoMfgDate(checked);
                                if (checked) {
                                  field.onChange(null);
                                }
                              }}
                            />
                          }
                          label="No MFG Date"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={dateColumnMd}>
                  <Controller
                    name="expireDate"
                    control={control}
                    render={({ field }) => (
                      <Box>
                        <DatePicker
                          {...field}
                          value={field.value}
                          onChange={(newValue) => {
                            field.onChange(newValue);
                            if (newValue) {
                              setNoExpiryDate(false);
                            }
                          }}
                          label="Expiry Date"
                          disabled={noExpiryDate}
                          slotProps={{
                            textField: {
                              size: "small",
                              fullWidth: true,
                              placeholder: "None",
                              error: !!errors.expireDate,
                              helperText: errors.expireDate?.message,
                            },
                          }}
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={noExpiryDate}
                              onChange={(event) => {
                                const checked = event.target.checked;
                                setNoExpiryDate(checked);
                                if (checked) {
                                  field.onChange(null);
                                }
                              }}
                            />
                          }
                          label="No Expiry Date"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    )}
                  />
                </Grid>

                {fieldVisibility.gfnNo && (
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="gfnNo"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="GFN No"
                          fullWidth
                          size="small"
                        />
                      )}
                    />
                  </Grid>
                )}
              </Grid>

              {/* new Table */}
              <Grid container spacing={1} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 1, color: "primary.main" }}
                  >
                    {/* table */}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-end",
                      width: "80%",
                      mx: "auto",
                      gap: 1.5,
                    }}
                  >
                    <TableContainer
                      component={Paper}
                      variant="outlined"
                      sx={{
                        flexGrow: 1,
                        maxHeight: "500px",
                        overflowY: "auto",
                        overflowX: "auto",
                        position: "relative",
                      }}
                    >
                    <Table
                      size="small"
                      sx={{
                        "& .MuiTableCell-root": {
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          textAlign: "center",
                          px: 1,
                        },
                        "& thead th": {
                          fontWeight: 600,
                          backgroundColor: "grey.100",
                          height: 40,
                          fontSize: "0.875rem",
                          whiteSpace: "nowrap",
                        },
                      }}
                    >
                      <TableHead>
                        <TableRow>
                          <TableCell>
                            <b>Sr.No</b>
                          </TableCell>
                          <TableCell>
                            <b>ID No</b>
                          </TableCell>
                          <TableCell>
                            <b>Quantity</b>
                          </TableCell>
                          <TableCell>
                            <b>Size</b>
                          </TableCell>
                          <TableCell>
                            <b>MRIR</b>
                          </TableCell>
                          <TableCell>
                            <b>HEAT / LOT / BATCH No</b>
                          </TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {QrTableRows.map((row, index) => (
                          <TableRow key={row.srNo}>
                            <TableCell>{row.srNo}</TableCell>

                            {/* ID No */}
                            <TableCell>
                              <TextField
                                value={row.idNo}
                                size="small"
                                fullWidth
                                sx={{
                                  "& .MuiInputBase-root": {
                                    height: 32,
                                  },
                                  "& input": {
                                    fontSize: "0.875rem",
                                    padding: "4px 8px",
                                    textAlign: "center",
                                  },
                                }}
                                onChange={(e) =>
                                  handleQrTableChange(
                                    index,
                                    "idNo",
                                    e.target.value,
                                  )
                                }
                                onKeyDown={(e) =>
                                  handleEnterKey(e, index, false)
                                }
                              />
                            </TableCell>

                             {/* Quantity */}
                             <TableCell>
                              <TextField
                                value={row.quantity}
                                type="number"
                                size="small"
                                fullWidth
                                inputProps={{ min: 0, step: "any" }}
                                sx={{
                                  "& .MuiInputBase-root": {
                                    height: 32,
                                  },
                                  "& input": {
                                    fontSize: "0.875rem",
                                    padding: "4px 8px",
                                    textAlign: "center",
                                  },
                                }}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) =>
                                  handleQrTableChange(
                                    index,
                                    "quantity",
                                    e.target.value
                                  )
                                }
                                onKeyDown={(e) =>
                                  handleEnterKey(e, index, false)
                                }
                              />
                            </TableCell>

                            {/* Size */}
                            <TableCell>
                              <TextField
                                value={row.size}
                                size="small"
                                fullWidth
                                inputProps={{
                                  autoComplete: "off",
                                }}
                                sx={{
                                  "& .MuiInputBase-root": {
                                    height: 32,
                                  },
                                  "& input": {
                                    fontSize: "0.875rem",
                                    padding: "4px 8px",
                                    textAlign: "center",
                                  },
                                }}
                                onChange={(e) =>
                                  handleQrTableChange(
                                    index,
                                    "size",
                                    e.target.value,
                                  )
                                }
                                onKeyDown={(e) =>
                                  handleEnterKey(e, index, false)
                                }
                              />
                            </TableCell>

                            {/* MIRIR */}
                            <TableCell>
                              <TextField
                                value={row.mirir}
                                size="small"
                                fullWidth
                                sx={{
                                  "& .MuiInputBase-root": {
                                    height: 32,
                                  },
                                  "& input": {
                                    fontSize: "0.875rem",
                                    padding: "4px 8px",
                                    textAlign: "center",
                                  },
                                }}
                                onChange={(e) =>
                                  handleQrTableChange(
                                    index,
                                    "mirir",
                                    e.target.value,
                                  )
                                }
                                onKeyDown={(e) =>
                                  handleEnterKey(e, index, false)
                                }
                              />
                            </TableCell>

                            {/* Heat / Lot / Batch */}
                            <TableCell>
                              <TextField
                                value={row.heatLotBatchNo}
                                size="small"
                                fullWidth
                                sx={{
                                  "& .MuiInputBase-root": {
                                    height: 32,
                                  },
                                  "& input": {
                                    fontSize: "0.875rem",
                                    padding: "4px 8px",
                                    textAlign: "center",
                                  },
                                }}
                                onChange={(e) =>
                                  handleQrTableChange(
                                    index,
                                    "heatLotBatchNo",
                                    e.target.value,
                                  )
                                }
                                onKeyDown={(e) =>
                                  handleEnterKey(e, index, true)
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Tooltip title="Add Row" arrow>
                    <IconButton
                      onClick={addNewQrRow}
                      sx={{
                        backgroundColor: "#A8005A",
                        color: "#fff",
                        width: 36,
                        height: 36,
                        mb: 0.5,
                        boxShadow: "0px 4px 10px rgba(168, 0, 90, 0.3)",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          backgroundColor: "#800044",
                          transform: "scale(1.1)",
                          boxShadow: "0px 6px 14px rgba(168, 0, 90, 0.4)",
                        },
                        "&:active": {
                          transform: "scale(0.95)",
                        },
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </Box>

                  {/* Total Quantity Display */}
                  <Box
                    sx={{
                      mt: 2,
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Total Quantity:
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, color: "primary.main" }}
                    >
                      {QrTableRows.reduce(
                        (sum, row) =>
                          sum +
                          (typeof row.quantity === "number"
                            ? row.quantity
                            : typeof row.quantity === "string"
                              ? parseFloat(row.quantity) || 0
                              : 0),
                        0,
                      )}
                    </Typography>
                  </Box>

                  {/* Duplicate ID Warning */}
                  {(() => {
                    const idNos = QrTableRows.map((row) =>
                      row.idNo.trim(),
                    ).filter((id) => id !== "");
                    const duplicates = idNos.filter(
                      (id, index) => idNos.indexOf(id) !== index,
                    );
                    if (duplicates.length > 0) {
                      return (
                        <Alert severity="error" sx={{ mt: 2 }}>
                          Duplicate ID Numbers found:{" "}
                          {[...new Set(duplicates)].join(", ")}
                        </Alert>
                      );
                    }
                    return null;
                  })()}
                </Grid>
              </Grid>

              {/* Row 9: Disposition */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={12}>
                  <Controller
                    name="desposition"
                    control={control}
                    render={({ field }) => (
                      <FormControl
                        fullWidth
                        size="small"
                        error={!!errors.desposition}
                      >
                        <InputLabel>Disposition</InputLabel>
                        <Select {...field} label="Disposition">
                          {dispositionOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.desposition && (
                          <FormHelperText>
                            {errors.desposition.message}
                          </FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>
              </Grid>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 2,
                  pt: 2,
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleReset}
                  startIcon={<RefreshIcon />}
                  sx={{ minWidth: 120, py: 1.5, height: 40 }}
                >
                  Reset
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  size="medium"
                  disabled={loading}
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <QrCodeIcon />
                    )
                  }
                  sx={{ minWidth: 200, py: 1.5, height: 40 }}
                >
                  {loading ? "Generating..." : "Generate QR Code"}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>

        {/* Generated QR Codes */}
        {qrcodeList.length > 0 && (
          <Card elevation={2} sx={{ width: "100%", maxWidth: "100%" }}>
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
                  Generated QR Codes ({qrcodeList.length})
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                >
                  <Checkbox
                    checked={
                      selectedBarcodes.length === qrcodeList.length &&
                      qrcodeList.length > 0
                    }
                    indeterminate={
                      selectedBarcodes.length > 0 &&
                      selectedBarcodes.length < qrcodeList.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    Select All
                  </Typography>
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

              <TableContainer
                component={Paper}
                variant="outlined"
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={
                            selectedBarcodes.length === qrcodeList.length &&
                            qrcodeList.length > 0
                          }
                          indeterminate={
                            selectedBarcodes.length > 0 &&
                            selectedBarcodes.length < qrcodeList.length
                          }
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                      </TableCell>
                      <TableCell align="center">SR Number</TableCell>
                      <TableCell align="center">QR Code</TableCell>
                      <TableCell align="center">ID</TableCell>
                      <TableCell align="center">Quantity</TableCell>
                      <TableCell align="center">Serial Qty</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {qrcodeList
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage,
                      )
                      .map((item, index) => {
                        const qrCodeKey =
                          item.qrCodeNumber || item.serialNumber || "";
                        const summaryInfo = serialSummaryMap.get(qrCodeKey);
                        const srDisplay =
                          summaryInfo?.srNumber ??
                          item.srNo ??
                          page * rowsPerPage + index + 1;
                        const serialQuantityDisplay =
                          summaryInfo?.serialNumberOfQuantity ??
                          item.serialNumberOfQuantity ??
                          "-";
                        const summaryIdDisplay =
                          summaryInfo?.id ?? item.idNumber ?? "-";

                        return (
                          <TableRow
                            key={
                              item.qrCodeNumber || item.serialNumber || item.id
                            }
                            hover
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={selectedBarcodes.includes(
                                  item.qrCodeNumber || item.serialNumber,
                                )}
                                onChange={(e) =>
                                  handleSelectBarcode(
                                    item.qrCodeNumber || item.serialNumber,
                                    e.target.checked,
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell align="center">{srDisplay}</TableCell>
                            <TableCell align="center">
                              <Typography
                                variant="body2"
                                sx={{ fontFamily: "monospace" }}
                              >
                                {item.qrCodeNumber || item.serialNumber}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              {summaryIdDisplay}
                            </TableCell>
                            <TableCell align="center">
                              {item.quantity || "-"}
                            </TableCell>
                            <TableCell align="center">
                              {serialQuantityDisplay}
                            </TableCell>
                            <TableCell align="center">
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
                                          item.qrCodeNumber ||
                                          item.serialNumber,
                                        ),
                                      )
                                    }
                                  >
                                    <GetAppIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={qrcodeList.length}
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
      </Box>

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
              {/* 1. RM Item Code */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  size="small"
                  options={allDrawingNumbers || []}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    return option.lnItemCode || "";
                  }}
                  value={bulkSelectedDrawing}
                  onChange={(_, newValue) => {
                    handleBulkDrawingSelect(newValue);
                  }}
                  filterOptions={(options, { inputValue }) => {
                    if (!inputValue) return options.slice(0, 100);
                    const searchLower = inputValue.toLowerCase();
                    return options.filter((option) =>
                      option.lnItemCode?.toLowerCase().includes(searchLower) ||
                      option.nomenclature?.toLowerCase().includes(searchLower)
                    ).slice(0, 100);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="RM Item Code"
                      placeholder="Search RM Item Code..."
                      fullWidth
                    />
                  )}
                />
              </Grid>

              {/* 2. RM Drawing Number */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  size="small"
                  options={allDrawingNumbers || []}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    return option.drawingNumber || "";
                  }}
                  value={bulkSelectedDrawing}
                  onChange={(_, newValue) => {
                    handleBulkDrawingSelect(newValue);
                  }}
                  filterOptions={(options, { inputValue }) => {
                    if (!inputValue) return options.slice(0, 100);
                    const searchLower = inputValue.toLowerCase();
                    return options.filter((option) =>
                      option.drawingNumber?.toLowerCase().includes(searchLower) ||
                      option.nomenclature?.toLowerCase().includes(searchLower)
                    ).slice(0, 100);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="RM Drawing Number"
                      placeholder="Search Drawing Number..."
                      fullWidth
                    />
                  )}
                />
              </Grid>

              {/* 3. Production Series */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  size="small"
                  options={productionSeriesData || []}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    return option.productionSeries || "";
                  }}
                  value={bulkSelectedProductionSeries}
                  onChange={(_, newValue) => {
                    setBulkSelectedProductionSeries(newValue);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Production Series"
                      placeholder="Search Production Series..."
                      fullWidth
                    />
                  )}
                />
              </Grid>

              {/* 4. Unit */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  size="small"
                  options={unitsData || []}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    return option.unitName || "";
                  }}
                  value={bulkSelectedUnit}
                  onChange={(_, newValue) => {
                    setBulkSelectedUnit(newValue);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Unit"
                      placeholder="Search Unit..."
                      fullWidth
                    />
                  )}
                />
              </Grid>

              {/* 5. Project Number */}
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

              {/* 6. Location */}
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

              {/* 7. FAN/MAN number */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="FAN/MAN number"
                  value={bulkFanManNumber}
                  onChange={(e) => setBulkFanManNumber(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="Enter FAN/MAN number"
                />
              </Grid>

              {/* 8. FAN/MAN serial Number */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="FAN/MAN serial Number"
                  value={bulkFanManSerialNumber}
                  onChange={(e) => setBulkFanManSerialNumber(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="Enter FAN/MAN serial Number"
                />
              </Grid>

              {/* 9. IR Number */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  size="small"
                  options={irNumbers}
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
                      label="IR Number"
                      placeholder="Search IR Number..."
                      fullWidth
                    />
                  )}
                />
              </Grid>

              {/* 10. MSN Number */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  size="small"
                  options={msnNumbers}
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
                      label="MSN Number"
                      placeholder="Search MSN Number..."
                      fullWidth
                    />
                  )}
                />
              </Grid>

              {/* 11. Quantity */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Quantity"
                  type="number"
                  inputProps={{ step: "any" }}
                  value={bulkQuantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBulkQuantity(val);
                  }}
                  onFocus={(e) => e.target.select()}
                  fullWidth
                  size="small"
                  placeholder="Enter Quantity"
                />
              </Grid>

              {/* 12. Size */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Size"
                  value={bulkSize}
                  onChange={(e) => setBulkSize(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="Enter Size"
                  inputProps={{
                    autoComplete: "off",
                  }}
                />
              </Grid>

              {/* 13. MRIR */}
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

              {/* 14. HEAT / LOT / BATCH No */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="HEAT / LOT / BATCH No"
                  value={bulkHeatLot}
                  onChange={(e) => setBulkHeatLot(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="Enter HEAT / LOT / BATCH No"
                />
              </Grid>

              {/* 15. ID Number */}
              {selectedBarcodes.length === 1 && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="ID Number"
                    value={bulkIdNumber}
                    onChange={(e) => setBulkIdNumber(e.target.value)}
                    fullWidth
                    size="small"
                    placeholder="Enter ID Number"
                  />
                </Grid>
              )}
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
    </LocalizationProvider>
  );
};

export default NewBarcodeGeneration;
