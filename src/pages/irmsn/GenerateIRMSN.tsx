import { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm, Controller } from "react-hook-form";

import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete,
  IconButton,
  Tooltip,
  Stack,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  FileDownload as DownloadIcon,
} from "@mui/icons-material";

import type { RootState, AppDispatch } from "../../store/store";
import type { DrawingNumber, FormData as BaseFormData } from "../../types";
import {

  useAllDrawingNumbers,
} from "../../hooks/useMasterData";
import {
  usePONumbers,
  type ProductionOrderMaster,
} from "../../hooks/usePONumbers";
import { useDebounce } from "../../hooks/useDebounce";
import api from "../../services/api";
import {
  generateIRMSN,
  clearError as clearIrmsnError,
} from "../../store/slices/irmsnSlice";
import { format } from "date-fns";

type LocalFormData = Omit<BaseFormData, "documentType"> & {
  documentType: "" | "IR" | "MSN";
  quantity: number | "";
  ProdSeriesId?: number;
  DrawingNumberId?: number;
  ComponentTypeId?: number;
  NomenclatureId?: number;
  GeneratedBy?: string;
  stageId?: number;
  itemDescription?: string;
  lnItemCode?: string;
  purchaseOrderNumber?: string;
  operationNumber?: string;
  department?: string;
  departmentId?: number;
  buildNumber?: string;
};

export default function GenerateIRMSN() {
  const dispatch = useDispatch<AppDispatch>();
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>("N/A");
  const [downloadingMemo, setDownloadingMemo] = useState(false);
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

  const { loading: isLoading, error: irmsnError } = useSelector(
    (state: RootState) => state.irmsn
  );

  const currentAuthUser = useSelector((state: RootState) => state.auth.user);

  const isQCOrAdmin = useMemo(() => {
    const role = currentAuthUser?.role?.toLowerCase() || "";
    return role === "qc" || role === "admin";
  }, [currentAuthUser]);

  const [poSearchText, setPOSearchText] = useState("");
  const debouncedPOSearchText = useDebounce(poSearchText, 500);
  const { data: poNumbers = [], isLoading: poLoading } =
    usePONumbers(debouncedPOSearchText);
  const [selectedPO, setSelectedPO] = useState<ProductionOrderMaster | null>(
    null
  );

  const [selectedDrawingManufacturing, setSelectedDrawingManufacturing] =
    useState<DrawingNumber | null>(null);
  const [selectedDrawingPurchase, setSelectedDrawingPurchase] =
    useState<DrawingNumber | null>(null);
  const [, setSearchResultsManufacturing] = useState<DrawingNumber[]>([]);
  const [, setSearchResultsPurchase] = useState<DrawingNumber[]>([]);
  const [generatedNumberManufacturing, setGeneratedNumberManufacturing] =
    useState<string>("");
  const [generatedNumberPurchase, setGeneratedNumberPurchase] =
    useState<string>("");
  const [stages, setStages] = useState<Array<{ id: number; stage: string }>>(
    []
  );
  const [, setSearchTerm] = useState("");
  const [stagesLoading, setStagesLoading] = useState(false);

  const { data: allDrawingNumbers = [], isLoading: isDrawingsLoading } =
    useAllDrawingNumbers();

  const [formMode, setFormMode] = useState<
    "ManufacturingItem" | "PurchaseItem"
  >("ManufacturingItem");

  const ManufacturingItemDefaults: LocalFormData = {
    documentType: "IR",
    quantity: "",
    stage: "",
    drawingNumber: "",
    productionSeries: "",
    nomenclature: "",
    idRange: "",
    projectNumber: "",
    poNumber: "",
    supplier: "",
    remark: "",
    itemDescription: "",
    lnItemCode: "",
    department: "",
    departmentId: undefined,
    operationNumber: "",
    buildNumber: "",
  };

  const PurchaseItemDefaults: LocalFormData = {
    documentType: "IR",
    quantity: "",
    stage: "",
    drawingNumber: "",
    productionSeries: "",
    nomenclature: "",
    idRange: "",
    projectNumber: "",
    poNumber: "",
    purchaseOrderNumber: "",
    supplier: "",
    remark: "",
    itemDescription: "",
    lnItemCode: "",
    department: "",
    departmentId: undefined,
    operationNumber: "",
    buildNumber: "",
  };

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors },
  } = useForm<LocalFormData>({
    mode: "all",
    defaultValues: ManufacturingItemDefaults,
    shouldUnregister: true,
  });

  const savedValuesRef = useRef<{
    ManufacturingItem: LocalFormData;
    PurchaseItem: LocalFormData;
  }>({
    ManufacturingItem: ManufacturingItemDefaults,
    PurchaseItem: PurchaseItemDefaults,
  });

  const selectedDrawing =
    formMode === "ManufacturingItem"
      ? selectedDrawingManufacturing
      : selectedDrawingPurchase;

  const generatedNumber =
    formMode === "ManufacturingItem"
      ? generatedNumberManufacturing
      : generatedNumberPurchase;

  const handleDownloadMemo = async () => {
    if (!generatedNumber) return;
    setDownloadingMemo(true);

    const currentValues = getValues();
    const createdByVal = currentAuthUser?.id || currentAuthUser?.userid
      ? Number(currentAuthUser.id || currentAuthUser.userid)
      : undefined;

    const downloadParams = {
      msnNumber: generatedNumber,
      createdBy: createdByVal,
      userName: currentAuthUser?.username || '',
      departmentId: currentValues.departmentId,
      documentType: currentValues.documentType,
      drawingNumberId: selectedDrawing?.id || undefined,
      idNumberRange: currentValues.idRange || "",
      idRange: currentValues.idRange || "",
      isStandard: formMode === "PurchaseItem",
      lnItemCode: currentValues.lnItemCode || "",
      operationNumber: currentValues.operationNumber || "",
      buildNumber: currentValues.buildNumber || "",
      prodSeriesId: currentValues.ProdSeriesId || 0,
      productionOrderNumber: formMode === "ManufacturingItem" ? (currentValues.poNumber || "") : "",
      purchaseOrderNumber: formMode === "PurchaseItem" ? (currentValues.purchaseOrderNumber || "") : "",
      projectNumber: currentValues.projectNumber || "",
      quantity: currentValues.quantity || 0,
      remark: currentValues.remark || "",
      stageId: currentValues.stageId || undefined,
      supplier: currentValues.supplier || "",
    };

    const endpoints = ["/api/reports/DownloadMSNMemo"];
    let success = false;

    for (const endpoint of endpoints) {
      try {
        const response = await api.post(endpoint, downloadParams, {
          responseType: "blob",
        });

        if (response.data && response.data.size > 100) {
          const blob = new Blob([response.data], { type: "application/pdf" });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `MSN_Memo_${generatedNumber}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          success = true;
          break;
        }
      } catch (error: any) {
        console.error("Error downloading MSN memo:", error);
      }
    }

    if (!success) {
      setSnackbar({
        open: true,
        message: "Failed to download MSN memo. Please try again.",
        severity: "error",
      });
    }

    setDownloadingMemo(false);
  };

  useEffect(() => {
    if (currentAuthUser) {
      setCurrentUser(currentAuthUser.username || "N/A");
      setValue("department", currentAuthUser.department || "");
      setValue("departmentId", Number(currentAuthUser.deptid) || undefined);
    } else {
      setCurrentUser("N/A");
      setValue("department", "");
      setValue("departmentId", undefined);
    }
  }, [currentAuthUser, setValue]);

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

    return new Set(ids.filter((id) => !isNaN(id))).size;
  };

  const documentType = watch("documentType");

  useEffect(() => {
    const fetchStages = async () => {
      if (!documentType) {
        setStages([]);
        return;
      }

      setStagesLoading(true);
      try {
        let fetchedStages: Array<{ id: number; stage: string }> = [];

        if (formMode === "PurchaseItem") {
          const [irRes, msnRes] = await Promise.all([
            api.get("/api/Common/GetIRStages"),
            api.get("/api/Common/GetMSNStages"),
          ]);

          const combined = [
            ...(Array.isArray(irRes.data) ? irRes.data : []),
            ...(Array.isArray(msnRes.data) ? msnRes.data : []),
          ];

          const stageMap = new Map();
          combined.forEach((s) => {
            if (s && s.stage && !stageMap.has(s.stage)) {
              stageMap.set(s.stage, s);
            }
          });
          fetchedStages = Array.from(stageMap.values());
        } else {
          const endpoint =
            documentType === "IR"
              ? "/api/Common/GetIRStages"
              : "/api/Common/GetMSNStages";

          const response = await api.get(endpoint);
          fetchedStages = Array.isArray(response.data) ? response.data : [];
        }

        let filteredStages = fetchedStages;
        if (formMode === "PurchaseItem") {
          filteredStages = fetchedStages.filter(
            (s: any) => s.stage === "RM Incoming" || s.stage === "Other"
          );
        } else if (formMode === "ManufacturingItem") {
          filteredStages = fetchedStages.filter(
            (s: any) => s.stage !== "RM Incoming" && s.stage !== "Other"
          );
        }

        setStages(filteredStages);
        setValue("stage", "");
      } catch (error) {
        console.error("Error fetching stages:", error);
        setStages([]);
      } finally {
        setStagesLoading(false);
      }
    };

    fetchStages();
  }, [documentType, formMode, setValue]);

  const idRange = watch("idRange");
  useEffect(() => {
    if (idRange) {
      if (/^(\d+(-\d+)?)(,\s*\d+(-\d+)?)*$/.test(idRange)) {
        const quantity = calculateQuantityFromRange(idRange);
        setValue("quantity", quantity);
      } else if (idRange.trim() !== "") {
        const currentQty = getValues("quantity");
        if (!currentQty || currentQty === 0) {
          setValue("quantity", 1);
        }
      }
    }
  }, [idRange, setValue, formMode, getValues]);

  const onSubmit = async (data: LocalFormData) => {
    try {
      const basePayload = {
        documentType: data.documentType || "IR",
        prodSeriesId: data.ProdSeriesId || 0,
        idNumberRange: data.idRange || "",
        quantity: data.quantity || 0,
        stageId: data.stageId || undefined,
        projectNumber: data.projectNumber || "",
        supplier: data.supplier || "",
        remark: data.remark || "FOUND OK",
        createdBy:
          currentAuthUser?.id || currentAuthUser?.userid
            ? Number(currentAuthUser.id || currentAuthUser.userid)
            : undefined,
        departmentId: data.departmentId,
        departmentName: data.department || "",
        operationNumber: data.operationNumber || "",
        buildNumber: data.buildNumber || "",
      };

      const userEnhancedData =
        formMode === "PurchaseItem"
          ? {
            ...basePayload,
            isStandard: true,
            purchaseOrderNumber: data.purchaseOrderNumber || "",
            drawingNumberId: selectedDrawing?.id || undefined,
            nomenclatureId: selectedDrawing?.nomenclatureId || undefined,
            componentTypeId: selectedDrawing?.componentTypeId || undefined,
            itemDescription: data.itemDescription || "",
            lnItemCode: data.lnItemCode || "",
          }
          : {
            ...basePayload,
            isStandard: false,
            productionOrderNumber: data.poNumber || "",
            drawingNumberId: selectedDrawing?.id || undefined,
            nomenclatureId: selectedDrawing?.nomenclatureId || undefined,
            componentTypeId: selectedDrawing?.componentTypeId || undefined,
            lnItemCode: data.lnItemCode || "",
          };

      const result = await dispatch(generateIRMSN(userEnhancedData)).unwrap();

      if (result && (result.irNumber || result.msnNumber)) {
        const generatedNumberValue = result.irNumber || result.msnNumber;
        if (formMode === "ManufacturingItem") {
          setGeneratedNumberManufacturing(generatedNumberValue);
        } else {
          setGeneratedNumberPurchase(generatedNumberValue);
        }
      }
    } catch (error) {
      console.error("Error generating number:", error);
    }
  };

  const handleCopy = async () => {
    if (!generatedNumber) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(generatedNumber);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
      const textArea = document.createElement("textarea");
      textArea.value = generatedNumber;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      alert(`Manual copy: ${generatedNumber}`);
    }
  };

  const handleModeChange = (newMode: "ManufacturingItem" | "PurchaseItem") => {
    if (newMode === formMode) return;
    setFormMode(newMode);

    const currentDept = getValues("department");
    const currentDeptId = getValues("departmentId");
    const currentDocType = getValues("documentType") || "IR";

    const defaults =
      newMode === "ManufacturingItem"
        ? ManufacturingItemDefaults
        : PurchaseItemDefaults;

    const resetValues = {
      ...defaults,
      documentType: currentDocType,
      department: currentDept,
      departmentId: currentDeptId,
    };

    reset(resetValues);

    setSelectedPO(null);
    setSelectedDrawingManufacturing(null);
    setSelectedDrawingPurchase(null);
    setPOSearchText("");
    setSearchResultsManufacturing([]);
    setSearchResultsPurchase([]);
    setGeneratedNumberManufacturing("");
    setGeneratedNumberPurchase("");
    setCopied(false);
  };

  const handleReset = () => {
    const currentDept = getValues("department");
    const currentDeptId = getValues("departmentId");

    const defaults =
      formMode === "ManufacturingItem"
        ? ManufacturingItemDefaults
        : PurchaseItemDefaults;

    const resetValues = {
      ...defaults,
      department: currentDept,
      departmentId: currentDeptId,
    };

    reset(resetValues);
    savedValuesRef.current[formMode] = resetValues;

    if (formMode === "ManufacturingItem") {
      setGeneratedNumberManufacturing("");
      setSearchResultsManufacturing([]);
      setSelectedDrawingManufacturing(null);
    } else {
      setGeneratedNumberPurchase("");
      setSearchResultsPurchase([]);
      setSelectedDrawingPurchase(null);
    }

    setSelectedPO(null);
    setPOSearchText("");
    setSearchTerm("");
    setCopied(false);
  };

  const handlePOCommit = async (inputValue: string) => {
    const trimmedInput = inputValue?.trim();
    if (!trimmedInput) return;

    if (
      selectedPO &&
      selectedPO.productionOrderNumber?.toLowerCase() ===
      trimmedInput.toLowerCase()
    ) {
      return;
    }

    let match = poNumbers.find(
      (po) =>
        po.productionOrderNumber?.toLowerCase() === trimmedInput.toLowerCase()
    );

    if (!match) {
      try {
        const response = await api.get("/api/ProductionOrder/GetByPONumber", {
          params: { productionOrderNumber: trimmedInput },
        });
        if (response.data) {
          match = response.data;
        }
      } catch (error) {
        console.error("Error fetching PO details on commit:", error);
      }
    }

    if (match) {
      setSelectedPO(match);
      setValue("poNumber", match.productionOrderNumber || "");
      setValue("projectNumber", match.projectNumber || "");
      setValue("productionSeries", match.productionSeries || "");
      setValue("ProdSeriesId", match.prodSeriesId);
      setValue("buildNumber", match.buildNumber || "");

      if (match.drawingNumber) {
        const drawingFromPO: Partial<DrawingNumber> = {
          id: match.drawingNumberId,
          drawingNumber: match.drawingNumber,
          lnItemCode: match.lnItemCode,
          nomenclature: match.nomenclature,
          componentType: match.componentType,
        };

        setSelectedDrawingManufacturing(drawingFromPO as DrawingNumber);
        setValue("drawingNumber", match.drawingNumber || "");
        setValue("nomenclature", match.nomenclature || "");
        setValue("lnItemCode", match.lnItemCode || "");
      }
    }
  };

  const watchedProjectNumber = watch("projectNumber");
  const watchedProductionSeries = watch("productionSeries");
  const watchedDrawingNumber = watch("drawingNumber");
  const watchedLnItemCode = watch("lnItemCode");
  const watchedNomenclature = watch("nomenclature");
  const watchedQuantity = watch("quantity");
  const watchedIdRange = watch("idRange");
  const watchedBuildNumber = watch("buildNumber");
  const watchedPoNumber = watch("poNumber");
  const watchedStage = watch("stage");

  // Remaining required fields counter calculation
  const requiredFields =
    formMode === "ManufacturingItem"
      ? [
        !!documentType,
        !!watchedPoNumber,
        !!watchedIdRange,
        !!watchedStage,
      ]
      : [
        !!documentType,
        !!watch("drawingNumber"),
        !!watchedIdRange,
        !!watchedStage,
      ];
  const remainingRequired = requiredFields.filter((f) => !f).length;

  const readOnlyInputStyle = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#F9FAFB",
      borderRadius: "8px",
      fontSize: "0.875rem",
    },
    "& .MuiInputLabel-root": {
      backgroundColor: "#ffffff",
      px: 0.5,
      borderRadius: "4px",
      lineHeight: 1.1,
    },
  };

  const standardInputStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px",
      fontSize: "0.875rem",
    },
    "& .MuiInputLabel-root": {
      backgroundColor: "#ffffff",
      px: 0.5,
      borderRadius: "4px",
      lineHeight: 1.1,
    },
  };

  return (
    <Box
      sx={{
        py: { xs: 1, sm: 1.25 },
        px: { xs: 1.5, sm: 2 },
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#FAFAFA",
        width: "100%",
        boxSizing: "border-box",
        pb: 2,
      }}
    >
      {/* Header Section */}
      <Box sx={{ mb: 1 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: "primary.main",
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
          }}
        >
          New IR/MSN
        </Typography>
        <Typography variant="body2" sx={{ color: "#667085", mt: 0.15, fontSize: "0.825rem" }}>
          Inspection Report or Memo Stage Number on order line.
        </Typography>
      </Box>

      {/* Read-only Context Bar */}
      <Paper
        elevation={0}
        sx={{
          py: 0.75,
          px: 1.75,
          mb: 1.25,
          borderRadius: "8px",
          border: "1px solid #EAECF0",
          backgroundColor: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={3} flexWrap="wrap">
          <Typography variant="body2" sx={{ color: "#667085" }}>
            Generated by{" "}
            <Typography component="span" variant="body2" sx={{ color: "#101828", fontWeight: 700 }}>
              {currentUser}
            </Typography>
          </Typography>
          <Typography variant="body2" sx={{ color: "#667085" }}>
            Department{" "}
            <Typography component="span" variant="body2" sx={{ color: "#101828", fontWeight: 700 }}>
              {getValues("department") || currentAuthUser?.department || "SQC"}
            </Typography>
          </Typography>


          <Typography variant="body2" sx={{ color: "#667085" }}>
            Date{" "}
            <Typography component="span" variant="body2" sx={{ color: "#101828", fontWeight: 700 }}>
              {format(new Date(), "dd/MM/yyyy")}
            </Typography>
          </Typography>
        </Stack>


      </Paper>

      {/* Error Banner */}
      {irmsnError && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: "8px" }}
          onClose={() => dispatch(clearIrmsnError())}
        >
          {irmsnError}
        </Alert>
      )}

      {/* Generated Result Banner */}
      {generatedNumber && (
        <Paper
          elevation={0}
          sx={{
            mb: 2.5,
            p: 2,
            backgroundColor: generatedNumber.startsWith("IR") ? "#ECFDF3" : "#EFF8FF",
            border: "1px solid",
            borderColor: generatedNumber.startsWith("IR") ? "#ABE5C6" : "#B2DDFF",
            borderRadius: "10px",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
            <Typography
              variant="body1"
              sx={{
                fontWeight: 700,
                color: generatedNumber.startsWith("IR") ? "#027A48" : "#175CD3",
              }}
            >
              Generated {generatedNumber.startsWith("IR") ? "IR" : "MSN"} Number:
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "#ffffff",
                px: 2,
                py: 0.75,
                borderRadius: "8px",
                border: "1px solid",
                borderColor: generatedNumber.startsWith("IR") ? "#12B76A" : "#2E90FA",
                fontWeight: 700,
                fontSize: "1rem",
                color: generatedNumber.startsWith("IR") ? "#027A48" : "#175CD3",
              }}
            >
              <span>{generatedNumber}</span>
              <Tooltip title={copied ? "Copied!" : "Copy"}>
                <IconButton onClick={handleCopy} size="small" sx={{ color: "inherit", p: 0.25 }}>
                  {copied ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Box>

            {generatedNumber.startsWith("MSN") && isQCOrAdmin && (
              <Button
                variant="contained"
                size="small"
                onClick={handleDownloadMemo}
                disabled={downloadingMemo}
                startIcon={
                  downloadingMemo ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <DownloadIcon fontSize="small" />
                  )
                }
                sx={{
                  backgroundColor: "primary.main",
                  ml: "auto",
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": { backgroundColor: "primary.dark" },
                }}
              >
                {downloadingMemo ? "Downloading Memo..." : "Download Memo"}
              </Button>
            )}
          </Stack>
        </Paper>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Card 1: Item */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: 1.25,
            borderRadius: "10px",
            border: "1px solid #EAECF0",
            backgroundColor: "#ffffff",
          }}
        >
          {/* Card 1 Header: Title + Mode Radios */}
          <Box sx={{ mb: 1.25 }}>
            <Stack direction="row" alignItems="center" spacing={2.5} flexWrap="wrap" sx={{ mb: 0.25 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#101828", fontSize: "0.85rem" }}>
                Item
              </Typography>

              {/* Mode Switcher Radio Buttons (Right next to Item title) */}
              <RadioGroup
                row
                value={formMode}
                onChange={(e) => {
                  const newMode = e.target.value as "ManufacturingItem" | "PurchaseItem";
                  handleModeChange(newMode);
                }}
                sx={{ alignItems: "center" }}
              >
                <FormControlLabel
                  value="ManufacturingItem"
                  control={
                    <Radio
                      size="small"
                      sx={{
                        color: "primary.main",
                        "&.Mui-checked": { color: "primary.main" },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#344054", fontSize: "0.825rem" }}>
                      Manufacturing Item
                    </Typography>
                  }
                  sx={{ mr: 2 }}
                />
                <FormControlLabel
                  value="PurchaseItem"
                  control={
                    <Radio
                      size="small"
                      sx={{
                        color: "primary.main",
                        "&.Mui-checked": { color: "primary.main" },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#344054", fontSize: "0.825rem" }}>
                      Purchase Item
                    </Typography>
                  }
                />
              </RadioGroup>
            </Stack>

            <Typography variant="body2" sx={{ color: "#667085", fontSize: "0.8rem" }}>
              {formMode === "ManufacturingItem"
                ? "Pick the order line — drawing, item code, nomenclature, production series and project fill in automatically."
                : "Pick the drawing number — item description, LN item code, project, production series, operation and build no. fill in automatically."}
            </Typography>
          </Box>

          {/* Document Type Radio Buttons */}
          <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" sx={{ mb: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "#344054", whiteSpace: "nowrap" }}>
              Document type *
            </Typography>
            <Controller
              name="documentType"
              control={control}
              rules={{ required: "Document type is required" }}
              render={({ field }) => (
                <RadioGroup
                  row
                  value={field.value || "IR"}
                  onChange={(e) => field.onChange(e.target.value)}
                  sx={{ alignItems: "center" }}
                >
                  <FormControlLabel
                    value="IR"
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color: "primary.main",
                          "&.Mui-checked": { color: "primary.main" },
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#344054" }}>
                        IR — Inspection Report
                      </Typography>
                    }
                    sx={{ mr: 2.5 }}
                  />
                  <FormControlLabel
                    value="MSN"
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color: "primary.main",
                          "&.Mui-checked": { color: "primary.main" },
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#344054" }}>
                        MSN — Memo Stage Number
                      </Typography>
                    }
                  />
                </RadioGroup>
              )}
            />
          </Stack>

          {/* Form Controls Grid */}
          {formMode === "ManufacturingItem" ? (
            /* Manufacturing Item Fields */
            <Grid container spacing={1.5}>
              {/* Row 1: PO Number *, Drawing No. auto-filled, LN Item Code auto-filled */}
              <Grid item xs={12} sm={6} md={4}>
                <Controller
                  name="poNumber"
                  control={control}
                  rules={{ required: "PO number is required" }}
                  render={({ field: { onChange, ref } }) => (
                    <Autocomplete
                      size="small"
                      autoHighlight
                      autoSelect
                      options={Array.isArray(poNumbers) ? poNumbers : []}
                      getOptionLabel={(option) => {
                        if (typeof option === "string") return option;
                        return option.productionOrderNumber || "";
                      }}
                      value={selectedPO}
                      loading={poLoading}
                      onInputChange={(_, inputValue) => setPOSearchText(inputValue)}
                      onChange={(_, newValue) => {
                        if (newValue && typeof newValue !== "string") {
                          setSelectedPO(newValue);
                          onChange(newValue.productionOrderNumber || "");
                          setValue("projectNumber", newValue.projectNumber || "");
                          setValue("productionSeries", newValue.productionSeries || "");
                          if (newValue.prodSeriesId) {
                            setValue("ProdSeriesId", newValue.prodSeriesId);
                          }
                          setValue("buildNumber", newValue.buildNumber || "");

                          if (newValue.drawingNumber) {
                            const drawingFromPO: Partial<DrawingNumber> = {
                              id: newValue.drawingNumberId,
                              drawingNumber: newValue.drawingNumber,
                              lnItemCode: newValue.lnItemCode,
                              nomenclature: newValue.nomenclature,
                              componentType: newValue.componentType,
                            };

                            setSelectedDrawingManufacturing(drawingFromPO as DrawingNumber);
                            setValue("drawingNumber", newValue.drawingNumber || "");
                            setValue("nomenclature", newValue.nomenclature || "");
                            setValue("lnItemCode", newValue.lnItemCode || "");
                          }
                        } else {
                          setSelectedPO(null);
                          onChange("");
                          setValue("buildNumber", "");
                        }
                      }}
                      isOptionEqualToValue={(option, val) =>
                        option.productionOrderNumber ===
                        (typeof val === "string" ? val : val?.productionOrderNumber)
                      }
                      filterOptions={(options, { inputValue }) => {
                        if (!inputValue) return options.slice(0, 100);
                        const searchLower = inputValue.toLowerCase();
                        return options
                          .filter((option) => {
                            const po = (option.productionOrderNumber || "").toLowerCase();
                            const dwg = (option.drawingNumber || "").toLowerCase();
                            const ln = (option.lnItemCode || "").toLowerCase();
                            const nom = (option.nomenclature || "").toLowerCase();
                            const proj = (option.projectNumber || "").toLowerCase();
                            const series = (option.productionSeries || (option as any).productionSeriesName || "").toLowerCase();
                            return (
                              po.includes(searchLower) ||
                              dwg.includes(searchLower) ||
                              ln.includes(searchLower) ||
                              nom.includes(searchLower) ||
                              proj.includes(searchLower) ||
                              series.includes(searchLower)
                            );
                          })
                          .slice(0, 100);
                      }}
                      ListboxProps={{
                        sx: {
                          "& .MuiAutocomplete-option": {
                            alignItems: "flex-start !important",
                            textAlign: "left !important",
                          },
                        },
                      }}
                      renderOption={(props, option) => {
                        const { key, ...optionProps } = props;
                        const lnPart = option.lnItemCode ? `LN: ${option.lnItemCode}` : "";
                        const nomPart = option.nomenclature || "";
                        const subtitle1 = [lnPart, nomPart].filter(Boolean).join(" | ");
                        const projectPart = option.projectNumber || "";
                        const seriesPart = option.productionSeries || (option as any).productionSeriesName || "";
                        const compTypePart = option.componentType || "";
                        const subtitle2 = [projectPart, seriesPart, compTypePart].filter(Boolean).join(" | ");

                        return (
                          <Box
                            component="li"
                            key={key}
                            {...optionProps}
                            sx={{
                              py: 1,
                              px: 1.5,
                              display: "flex !important",
                              flexDirection: "column !important",
                              alignItems: "flex-start !important",
                              justifyContent: "flex-start !important",
                              textAlign: "left !important",
                              width: "100%",
                              borderBottom: "1px solid #F2F4F7",
                              "&:last-child": { borderBottom: "none" },
                              "&.Mui-focused, &:hover": { backgroundColor: "#F9FAFB" },
                              "&.Mui-selected": { backgroundColor: "#F2F4F7" },
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 700,
                                color: "#101828",
                                fontSize: "0.875rem",
                                lineHeight: 1.3,
                                textAlign: "left !important",
                                width: "100%",
                              }}
                            >
                              {typeof option === "string" ? option : option.productionOrderNumber || option.drawingNumber || ""}
                            </Typography>
                            {subtitle1 && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#667085",
                                  fontSize: "0.775rem",
                                  lineHeight: 1.35,
                                  mt: 0.25,
                                  textAlign: "left !important",
                                  width: "100%",
                                }}
                              >
                                {subtitle1}
                              </Typography>
                            )}
                            {subtitle2 && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#667085",
                                  fontSize: "0.775rem",
                                  lineHeight: 1.35,
                                  textAlign: "left !important",
                                  width: "100%",
                                }}
                              >
                                {subtitle2}
                              </Typography>
                            )}
                          </Box>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="PO Number *"
                          fullWidth
                          size="small"
                          error={!!errors.poNumber}
                          helperText={errors.poNumber?.message}
                          inputRef={ref}
                          sx={standardInputStyle}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === "Tab") {
                              const inputValue = (e.target as HTMLInputElement).value;
                              handlePOCommit(inputValue);
                            }
                          }}
                          onBlur={(e) => handlePOCommit(e.target.value)}
                        />
                      )}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Drawing No."
                  value={watchedDrawingNumber || ""}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  InputLabelProps={{ shrink: true }}
                  sx={readOnlyInputStyle}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="LN Item Code"
                  value={watchedLnItemCode || ""}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  InputLabelProps={{ shrink: true }}
                  sx={readOnlyInputStyle}
                />
              </Grid>

              {/* Row 2: Nomenclature, Production Series & Project No. */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Nomenclature"
                  value={watchedNomenclature || ""}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  InputLabelProps={{ shrink: true }}
                  sx={readOnlyInputStyle}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Production Series"
                  value={watchedProductionSeries || ""}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  InputLabelProps={{ shrink: true }}
                  sx={readOnlyInputStyle}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Project No."
                  value={watchedProjectNumber || ""}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  InputLabelProps={{ shrink: true }}
                  sx={readOnlyInputStyle}
                />
              </Grid>
            </Grid>
          ) : (
            /* Purchase Item Fields (Matching Screenshot) */
            <Grid container spacing={1.5}>
              {/* Row 1: Drawing Number *, Item Description, LN Item Code */}
              <Grid item xs={12} sm={6} md={4}>
                <Controller
                  name="drawingNumber"
                  control={control}
                  rules={{ required: "Drawing number is required" }}
                  render={({ field: { onChange }, fieldState: { error } }) => (
                    <Autocomplete
                      size="small"
                      options={Array.isArray(allDrawingNumbers) ? allDrawingNumbers : []}
                      loading={isDrawingsLoading}
                      getOptionLabel={(option) =>
                        typeof option === "string" ? option : option?.drawingNumber || ""
                      }
                      value={selectedDrawingPurchase}
                      onChange={(_, newValue) => {
                        if (newValue && typeof newValue !== "string") {
                          setSelectedDrawingPurchase(newValue);
                          onChange(newValue.drawingNumber || "");

                          const itemDesc = (newValue as any).itemDescription || newValue.nomenclature || "";
                          setValue("itemDescription", itemDesc);
                          setValue("nomenclature", itemDesc);
                          setValue("lnItemCode", newValue.lnItemCode || "");
                          setValue("projectNumber", newValue.project || (newValue as any).projectNumber || "");

                          const seriesName = (newValue as any).productionSeries || (newValue as any).productionSeriesName || (newValue.availableSeries && newValue.availableSeries.length > 0 ? newValue.availableSeries[0] : "");
                          const seriesId = (newValue as any).prodSeriesId || (newValue as any).productionSeriesId || (newValue.availableSeriesId && newValue.availableSeriesId.length > 0 ? newValue.availableSeriesId[0] : undefined);
                          setValue("productionSeries", seriesName);
                          if (seriesId) {
                            setValue("ProdSeriesId", seriesId);
                          }
                          setValue("operationNumber", (newValue as any).operationNumber || (newValue as any).operation || "");
                          setValue("buildNumber", (newValue as any).buildNumber || "");
                        } else {
                          setSelectedDrawingPurchase(null);
                          onChange("");
                          setValue("itemDescription", "");
                          setValue("nomenclature", "");
                          setValue("lnItemCode", "");
                          setValue("projectNumber", "");
                          setValue("productionSeries", "");
                          setValue("ProdSeriesId", undefined);
                          setValue("operationNumber", "");
                          setValue("buildNumber", "");
                        }
                      }}
                      filterOptions={(options, { inputValue }) => {
                        if (!inputValue) return options.slice(0, 100);
                        const searchLower = inputValue.toLowerCase();
                        return options
                          .filter((option) => {
                            const dwg = (option.drawingNumber || "").toLowerCase();
                            const ln = (option.lnItemCode || "").toLowerCase();
                            const nom = (option.nomenclature || "").toLowerCase();
                            const proj = (option.project || (option as any).projectNumber || "").toLowerCase();
                            const series = ((option as any).productionSeries || (option as any).productionSeriesName || (option.availableSeries ? option.availableSeries.join(" ") : "")).toLowerCase();
                            return (
                              dwg.includes(searchLower) ||
                              ln.includes(searchLower) ||
                              nom.includes(searchLower) ||
                              proj.includes(searchLower) ||
                              series.includes(searchLower)
                            );
                          })
                          .slice(0, 100);
                      }}
                      ListboxProps={{
                        sx: {
                          "& .MuiAutocomplete-option": {
                            alignItems: "flex-start !important",
                            textAlign: "left !important",
                          },
                        },
                      }}
                      renderOption={(props, option) => {
                        const { key, ...optionProps } = props;
                        const lnPart = option.lnItemCode ? `LN: ${option.lnItemCode}` : "";
                        const nomPart = option.nomenclature || "";
                        const subtitle1 = [lnPart, nomPart].filter(Boolean).join(" | ");
                        const projectPart = option.project || (option as any).projectNumber || "";
                        const seriesPart = (option as any).productionSeries || (option as any).productionSeriesName || (option.availableSeries && option.availableSeries.length > 0 ? option.availableSeries.join(", ") : "");
                        const compTypePart = option.componentType || "";
                        const subtitle2 = [projectPart, seriesPart, compTypePart].filter(Boolean).join(" | ");

                        return (
                          <Box
                            component="li"
                            key={key}
                            {...optionProps}
                            sx={{
                              py: 1,
                              px: 1.5,
                              display: "flex !important",
                              flexDirection: "column !important",
                              alignItems: "flex-start !important",
                              justifyContent: "flex-start !important",
                              textAlign: "left !important",
                              width: "100%",
                              borderBottom: "1px solid #F2F4F7",
                              "&:last-child": { borderBottom: "none" },
                              "&.Mui-focused, &:hover": { backgroundColor: "#F9FAFB" },
                              "&.Mui-selected": { backgroundColor: "#F2F4F7" },
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 700,
                                color: "#101828",
                                fontSize: "0.875rem",
                                lineHeight: 1.3,
                                textAlign: "left !important",
                                width: "100%",
                              }}
                            >
                              {typeof option === "string" ? option : option.drawingNumber || ""}
                            </Typography>
                            {subtitle1 && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#667085",
                                  fontSize: "0.775rem",
                                  lineHeight: 1.35,
                                  mt: 0.25,
                                  textAlign: "left !important",
                                  width: "100%",
                                }}
                              >
                                {subtitle1}
                              </Typography>
                            )}
                            {subtitle2 && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#667085",
                                  fontSize: "0.775rem",
                                  lineHeight: 1.35,
                                  textAlign: "left !important",
                                  width: "100%",
                                }}
                              >
                                {subtitle2}
                              </Typography>
                            )}
                          </Box>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Drawing Number *"
                          error={!!error}
                          helperText={error?.message}
                          sx={standardInputStyle}
                        />
                      )}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Item Description"
                  value={watch("itemDescription") || watchedNomenclature || ""}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  InputLabelProps={{ shrink: true }}
                  sx={readOnlyInputStyle}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="LN Item Code"
                  value={watchedLnItemCode || ""}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  InputLabelProps={{ shrink: true }}
                  sx={readOnlyInputStyle}
                />
              </Grid>

              {/* Row 2: Project, Purchase Order No, Production Series */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Project"
                  value={watchedProjectNumber || ""}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  InputLabelProps={{ shrink: true }}
                  sx={readOnlyInputStyle}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Controller
                  name="purchaseOrderNumber"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Purchase Order No"
                      fullWidth
                      size="small"
                      sx={standardInputStyle}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Production Series"
                  value={watchedProductionSeries || ""}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true }}
                  InputLabelProps={{ shrink: true }}
                  sx={readOnlyInputStyle}
                />
              </Grid>
            </Grid>
          )}
        </Paper>

        {/* Card 2: Quantities & IDs */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: 1.25,
            borderRadius: "10px",
            border: "1px solid #EAECF0",
            backgroundColor: "#ffffff",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#101828", fontSize: "0.8rem", mb: 1 }}>
            Quantities & IDs
          </Typography>

          <Grid container spacing={1.5}>
            {/* Row 1: ID Number(s) *, Quantity, Build No. auto-filled */}
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="idRange"
                control={control}
                rules={{ required: "ID Number(s) is required" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="ID Number(s) *"
                    placeholder="e.g. 1,2,3 or 1-5"
                    fullWidth
                    size="small"
                    error={!!errors.idRange}
                    helperText={errors.idRange?.message || "Comma-separated or a range (e.g. 1,2,3 or 1-5)"}
                    sx={standardInputStyle}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="quantity"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Quantity"
                    placeholder="e.g. 2"
                    type="number"
                    fullWidth
                    size="small"
                    error={!!errors.quantity}
                    sx={standardInputStyle}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Build No."
                value={watchedBuildNumber || ""}
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
                sx={readOnlyInputStyle}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Card 3: Inspection */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: 1.25,
            borderRadius: "10px",
            border: "1px solid #EAECF0",
            backgroundColor: "#ffffff",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#101828", fontSize: "0.8rem", mb: 1 }}>
            Inspection
          </Typography>

          <Grid container spacing={1.5}>
            {/* Row 1: Stage *, Operation, Inspected by · auto-filled */}
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="stage"
                control={control}
                rules={{ required: "Stage is required" }}
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Autocomplete
                    size="small"
                    options={Array.isArray(stages) ? stages : []}
                    loading={stagesLoading}
                    getOptionLabel={(option) =>
                      typeof option === "string" ? option : option?.stage || ""
                    }
                    value={
                      Array.isArray(stages)
                        ? stages.find((s) => s.stage === value) || null
                        : null
                    }
                    onChange={(_, newValue) => {
                      if (newValue && typeof newValue !== "string") {
                        onChange(newValue.stage);
                        setValue("stageId", newValue.id);
                      } else {
                        onChange("");
                        setValue("stageId", undefined);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Stage *"
                        error={!!error}
                        helperText={error?.message}
                        sx={standardInputStyle}
                      />
                    )}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Operation"
                value={watch("operationNumber") || ""}
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
                sx={readOnlyInputStyle}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Inspected by "
                value={currentUser || ""}
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
                sx={readOnlyInputStyle}
              />
            </Grid>

            {/* Row 2: Remark */}
            <Grid item xs={12}>
              <Controller
                name="remark"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Remark"
                    placeholder="Default: Found OK — leave blank to apply"
                    fullWidth
                    size="small"
                    multiline
                    rows={2}

                    sx={standardInputStyle}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Sticky Bottom Action Bar */}
        <Paper
          elevation={0}
          sx={{
            position: "sticky",
            bottom: 8,
            zIndex: 100,
            mt: 1.5,
            py: 1,
            px: { xs: 2, sm: 2.5 },
            borderRadius: "10px",
            border: "1px solid #EAECF0",
            backgroundColor: "#ffffff",
            boxShadow: "0px 4px 16px rgba(16, 24, 40, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="body2" sx={{ color: "#667085", fontWeight: 500 }}>
            {remainingRequired > 0
              ? `${remainingRequired} required ${remainingRequired === 1 ? "field" : "fields"} remaining`
              : "All required fields completed"}
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
              disabled={isLoading}
              startIcon={
                isLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <CheckIcon sx={{ fontSize: 18 }} />
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
              {isLoading ? "Generating..." : `Generate ${documentType || "IR"}`}
            </Button>
          </Stack>
        </Paper>
      </form>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
