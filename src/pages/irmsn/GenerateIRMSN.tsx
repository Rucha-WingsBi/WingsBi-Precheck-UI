import { useState, useEffect, useMemo, useRef } from "react";
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
  Autocomplete,
  IconButton,
  Tooltip,
  Stack,
  FormHelperText,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Snackbar,
} from "@mui/material";
import {
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Check as CheckIcon,
  ArrowBack as ArrowBackIcon,
  FileDownload as DownloadIcon,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import type { RootState, AppDispatch } from "../../store/store";
import type { DrawingNumber, FormData as BaseFormData } from "../../types";
import {
  useDocumentTypes,
  useProductionSeries,
  useAllDrawingNumbers,
} from "../../hooks/useMasterData";
import {
  usePONumbers,
  type ProductionOrderMaster,
} from "../../hooks/usePONumbers";
import debounce from "lodash/debounce";
import api from "../../services/api";
import {
  generateIRMSN,
  clearError as clearIrmsnError,
} from "../../store/slices/irmsnSlice";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "../../hooks/useDebounce";

// Local form type allowing empty documentType during initial load
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

const FALLBACK_DOCUMENT_TYPES = [
  { id: 1, documentType: "IR" as const },
  { id: 2, documentType: "MSN" as const },
];

const FALLBACK_PRODUCTION_SERIES: any[] = [];

export default function GenerateIRMSN() {
  const dispatch = useDispatch<AppDispatch>();
  const [localLoading, setLocalLoading] = useState(false);
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
  const navigate = useNavigate();

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Update selectors
  const { loading: isLoading, error: irmsnError } = useSelector(
    (state: RootState) => state.irmsn,
  );
  // TanStack Query Hooks
  const { data: documentTypesFetched = [] } = useDocumentTypes();
  const { data: productionSeriesFetched = [] } = useProductionSeries();
  const { data: allDrawingNumbers = [], isLoading: isDrawingsLoading } =
    useAllDrawingNumbers();

  const documentTypes = useMemo(() => {
    if (Array.isArray(documentTypesFetched) && documentTypesFetched.length > 0)
      return documentTypesFetched;
    return FALLBACK_DOCUMENT_TYPES;
  }, [documentTypesFetched]);

  const productionSeries = useMemo(() => {
    if (Array.isArray(productionSeriesFetched)) return productionSeriesFetched;
    return FALLBACK_PRODUCTION_SERIES;
  }, [productionSeriesFetched]);

  const currentAuthUser = useSelector((state: RootState) => state.auth.user);

  const isQCOrAdmin = useMemo(() => {
    const role = currentAuthUser?.role?.toLowerCase() || "";
    return role === "qc" || role === "admin";
  }, [currentAuthUser]);

  // Local state - separated by tab
  const [poSearchText, setPOSearchText] = useState("");
  const debouncedPOSearchText = useDebounce(poSearchText, 500);
  const { data: poNumbers = [], isLoading: poLoading } =
    usePONumbers(debouncedPOSearchText);
  const [selectedPO, setSelectedPO] = useState<ProductionOrderMaster | null>(
    null,
  );

  const [selectedDrawingManufacturing, setSelectedDrawingManufacturing] =
    useState<DrawingNumber | null>(null);
  const [selectedDrawingPurchase, setSelectedDrawingPurchase] =
    useState<DrawingNumber | null>(null);
  const [searchResultsManufacturing, setSearchResultsManufacturing] = useState<
    DrawingNumber[]
  >([]);
  const [searchResultsPurchase, setSearchResultsPurchase] = useState<
    DrawingNumber[]
  >([]);
  const [generatedNumberManufacturing, setGeneratedNumberManufacturing] =
    useState<string>("");
  const [generatedNumberPurchase, setGeneratedNumberPurchase] =
    useState<string>("");
  const [stages, setStages] = useState<Array<{ id: number; stage: string }>>(
    [],
  );
  const [, setSearchTerm] = useState("");
  const [stagesLoading, setStagesLoading] = useState(false);

  // new buttons
  const [formMode, setFormMode] = useState<
    "ManufacturingItem" | "PurchaseItem"
  >("ManufacturingItem");
  const ManufacturingItemDefaults: LocalFormData = {
    documentType: "",
    quantity: "",
    stage: "",
    drawingNumber: "",
    productionSeries: "",
    nomenclature: "",
    idRange: "",
    projectNumber: "",
    poNumber: "",
    supplier: "",
    remark: "FOUND OK",
    itemDescription: "",
    lnItemCode: "",
    department: "",
    departmentId: undefined,
    operationNumber: "",
    buildNumber: "",
  };
  const PurchaseItemDefaults: LocalFormData = {
    documentType: "",
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
    remark: "FOUND OK",
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

  // Computed values based on current tab
  const selectedDrawing =
    formMode === "ManufacturingItem"
      ? selectedDrawingManufacturing
      : selectedDrawingPurchase;
  const setSelectedDrawing =
    formMode === "ManufacturingItem"
      ? setSelectedDrawingManufacturing
      : setSelectedDrawingPurchase;
  const searchResults =
    formMode === "ManufacturingItem"
      ? searchResultsManufacturing
      : searchResultsPurchase;
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

    const endpoints = [
      "/api/reports/DownloadMSNMemo",
    ];

    let success = false;
    let lastError: any = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`Attempting to download memo from: ${endpoint} with params:`, downloadParams);
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
          console.log(`Successfully downloaded memo from: ${endpoint}`);
          break;
        }
      } catch (error: any) {
        console.warn(`Failed endpoint ${endpoint}:`, error);
        lastError = error;
      }
    }

    if (!success) {
      console.error("All memo download endpoints failed:", lastError);
      setSnackbar({
        open: true,
        message: "Failed to download MSN memo. The report might not be available or the server endpoint could not be reached.",
        severity: "error",
      });
    }

    setDownloadingMemo(false);
  };
  // Master data handled by hooks



  // Update current user when auth state changes
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

  // Debounced search function with tab-specific state
  const debouncedSearch = useMemo(
    () =>
      debounce(async (search: string) => {
        if (search.length < 3) {
          // Clear the correct tab's search results
          if (formMode === "ManufacturingItem") {
            setSearchResultsManufacturing([]);
          } else {
            setSearchResultsPurchase([]);
          }
          return;
        }
        setLocalLoading(true);
        try {
          const response = await api.get("/api/Common/GetAllDrawingNumber", {
            params: {
              ComponentType: "",
              search,
              pageSize: 10, // Limit results for better performance
            },
          });
          // Store in the correct tab's state
          if (formMode === "ManufacturingItem") {
            setSearchResultsManufacturing(response.data);
          } else {
            setSearchResultsPurchase(response.data);
          }
        } catch (error) {
          console.error("Error fetching drawing numbers:", error);
          if (formMode === "ManufacturingItem") {
            setSearchResultsManufacturing([]);
          } else {
            setSearchResultsPurchase([]);
          }
        } finally {
          setLocalLoading(false);
        }
      }, 300), // Reduced debounce time for better responsiveness
    [formMode],
  );

  // Calculate quantity from ID range
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
    return new Set(ids.filter((id) => !isNaN(id))).size;
  };


  const documentType = watch("documentType");

  // Fetch stages dynamically when document type changes
  useEffect(() => {
    const fetchStages = async () => {
      if (!documentType) {
        setStages([]);
        return;
      }

      setStagesLoading(true);
      try {
        let fetchedStages: any[] = [];

        if (formMode === "PurchaseItem") {
          // For Purchase Items, we need stages from both if necessary,
          // because "RM Incoming" is typically only in IR stages but may be needed for MSN.
          const [irRes, msnRes] = await Promise.all([
            api.get("/api/Common/GetIRStages"),
            api.get("/api/Common/GetMSNStages"),
          ]);

          const combined = [
            ...(Array.isArray(irRes.data) ? irRes.data : []),
            ...(Array.isArray(msnRes.data) ? msnRes.data : []),
          ];

          // Deduplicate by stage name
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

        // Client-side filtering based on form mode
        let filteredStages = fetchedStages;
        if (formMode === "PurchaseItem") {
          // Show ONLY "RM Incoming" and "Other" for Purchase items
          filteredStages = fetchedStages.filter(
            (s: any) => s.stage === "RM Incoming" || s.stage === "Other",
          );
        } else if (formMode === "ManufacturingItem") {
          // Hide "RM Incoming" and "Other" for Manufacturing items
          filteredStages = fetchedStages.filter(
            (s: any) => s.stage !== "RM Incoming" && s.stage !== "Other",
          );
        }

        setStages(filteredStages);

        // Reset stage selection when document type changes
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

  // Watch for ID range changes
  const idRange = watch("idRange");
  useEffect(() => {
    if (idRange) {
      if (/^(\d+(-\d+)?)(,\s*\d+(-\d+)?)*$/.test(idRange)) {
        const quantity = calculateQuantityFromRange(idRange);
        setValue("quantity", quantity);
      } else if (idRange.trim() !== "") {
        // If it's not a numeric range, default to 1 if quantity is empty/0
        const currentQty = getValues("quantity");
        if (!currentQty || currentQty === 0) {
          setValue("quantity", 1);
        }
      }
    }
  }, [idRange, setValue, formMode, getValues]);

  const onSubmit = async (data: LocalFormData) => {
    try {
      // Build clean payload based on form mode
      const basePayload = {
        // Common fields
        documentType: data.documentType, // CRITICAL: Required for endpoint selection
        prodSeriesId: data.ProdSeriesId || 0,
        idNumberRange: data.idRange || "",
        quantity: data.quantity || 0,
        stageId: data.stageId || undefined,
        projectNumber: data.projectNumber || "",
        supplier: data.supplier || "",
        remark: data.remark || "",
        // User context (auto-populated by controller but we send anyway)
        createdBy:
          currentAuthUser?.id || currentAuthUser?.userid
            ? Number(currentAuthUser.id || currentAuthUser.userid)
            : undefined,
        departmentId: data.departmentId,
        departmentName: data.department || "",
        operationNumber: data.operationNumber || "",
        buildNumber: data.buildNumber || "",
      };

      // Add mode-specific fields
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

      console.log("Generation payload with user context:", userEnhancedData);
      const result = await dispatch(generateIRMSN(userEnhancedData)).unwrap();

      // Store generated number in tab-specific state
      if (result && (result.irNumber || result.msnNumber)) {
        const generatedNumberValue = result.irNumber || result.msnNumber;

        // Store in the correct tab's state
        if (formMode === "ManufacturingItem") {
          setGeneratedNumberManufacturing(generatedNumberValue);
        } else {
          setGeneratedNumberPurchase(generatedNumberValue);
        }

        console.log("Successfully generated number:", result);

        // Test if the newly generated number can be found in search
        const documentTypeValue = result.irNumber ? "IR" : "MSN";

        console.log(
          `Testing search for newly generated ${documentTypeValue} number:`,
          generatedNumberValue,
        );

        // Add a delay then test search
        setTimeout(async () => {
          try {
            const searchEndpoint =
              documentTypeValue === "IR"
                ? "/api/reports/GetAllIRNumber"
                : "/api/reports/GetAllMSNNumber";

            const searchResponse = await api.get(searchEndpoint, {
              params: {
                query: generatedNumberValue,
                userId:
                  currentAuthUser?.id || currentAuthUser?.userid
                    ? Number(currentAuthUser.id || currentAuthUser.userid)
                    : undefined,
                departmentId: data.departmentId,
              },
            });

            console.log(
              `Search test result for ${generatedNumberValue}:`,
              searchResponse.data,
            );

            if (searchResponse.data && searchResponse.data.length > 0) {
              console.log("✅ Newly generated number is searchable!");
              // Show success message to user
              const successMsg = `${documentTypeValue} number ${generatedNumberValue} has been generated and is now searchable!`;
              console.log(successMsg);
            } else {
              console.log(
                "❌ Newly generated number not found in search - there may be a timing or parameter issue",
              );
              console.log(
                "💡 Note: It may take a few moments for the database to sync. Try refreshing the Search/Update page.",
              );
            }
          } catch (error) {
            console.error(
              "❌ Error testing search for newly generated number:",
              error,
            );
          }
        }, 2000); // 2 second delay to allow database commit
      }
    } catch (error) {
      console.error("Error generating number:", error);
    }
  };

  const handleCopy = async () => {
    if (!generatedNumber) return;

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(generatedNumber);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }

      // Fallback method for older browsers or non-secure contexts
      const textArea = document.createElement("textarea");
      textArea.value = generatedNumber;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error("Copy command failed");
      }
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      // Show user-friendly error message
      alert(
        `Failed to copy automatically. Please manually copy: ${generatedNumber}`,
      );
    }
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

    // Reset form to mode-specific default values
    reset(resetValues);
    savedValuesRef.current[formMode] = resetValues;

    // Clear tab-specific state only
    if (formMode === "ManufacturingItem") {
      setGeneratedNumberManufacturing("");
      setSearchResultsManufacturing([]);
      setSelectedDrawingManufacturing(null);
    } else {
      setGeneratedNumberPurchase("");
      setSearchResultsPurchase([]);
      setSelectedDrawingPurchase(null);
    }

    // Clear PO Number selection and search text
    setSelectedPO(null);
    setPOSearchText("");

    setSearchTerm("");
    setCopied(false);
  };

  const handlePOCommit = async (inputValue: string) => {
    const trimmedInput = inputValue?.trim();
    if (!trimmedInput) return;

    // Guard: If current selected PO already matches input, don't re-process
    // This prevents redundant work when both onKeyDown (Enter/Tab) and onBlur fire
    if (
      selectedPO &&
      selectedPO.productionOrderNumber?.toLowerCase() ===
      trimmedInput.toLowerCase()
    ) {
      return;
    }

    // First try to find in already loaded poNumbers list
    let match = poNumbers.find(
      (po) =>
        po.productionOrderNumber?.toLowerCase() === trimmedInput.toLowerCase(),
    );

    // If not found in current list, try fetching directly from API
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

  const renderActionButtons = () => (
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
        size="medium"
        onClick={handleReset}
        startIcon={<RefreshIcon />}
        sx={{ minWidth: 100, height: 32 }}
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
            <CircularProgress size={20} color="inherit" />
          ) : (
            <AddIcon />
          )
        }
        sx={{ minWidth: 160, height: 32 }}
      >
        {isLoading ? "Generating..." : "Generate IR/MSN"}
      </Button>
    </Box>
  );

  return (
    <Box
      sx={{
        p: { xs: 1, sm: 2, md: 1 },
        maxWidth: "100%",
        mx: "auto",
      }}
    >
      <Box
        sx={{
          mb: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="h3" gutterBottom sx={{ color: "primary.main" }}>
          <IconButton
            onClick={() => navigate(-1)}
            sx={{ color: "primary.main" }}
          >
            <ArrowBackIcon />
          </IconButton>
          Generate IR/MSN Number
        </Typography>

        <ToggleButtonGroup
          value={formMode}
          exclusive
          onChange={(
            _,
            newValue: "ManufacturingItem" | "PurchaseItem" | null,
          ) => {
            if (newValue !== null) {
              const currentDept = getValues("department");
              const currentDeptId = getValues("departmentId");

              savedValuesRef.current[formMode] = getValues();
              setFormMode(newValue);

              const nextValues = {
                ...savedValuesRef.current[newValue],
                department: currentDept,
                departmentId: currentDeptId,
              };

              reset(nextValues);
              savedValuesRef.current[newValue] = nextValues;
            }
          }}
          size="small"
          color="primary"
          sx={{
            gap: 1.5,
            "& .MuiToggleButton-root": {
              minWidth: 120,
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 1.5,
              borderColor: "divider",
              "&.Mui-selected": {
                color: "#A8005A",
                backgroundColor: "rgba(168, 0, 90, 0.12)",
                borderColor: "#A8005A",
                boxShadow: "0 2px 6px rgba(168, 0, 90, 0.25)",
              },
              "&.Mui-selected:hover": {
                backgroundColor: "rgba(168, 0, 90, 0.16)",
              },
            },
          }}
        >
          <ToggleButton value="ManufacturingItem">
            Manufacturing Item
          </ToggleButton>
          <ToggleButton value="PurchaseItem">Purchase Item</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Error Message */}
      {irmsnError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => dispatch(clearIrmsnError())}
        >
          {irmsnError}
        </Alert>
      )}

      {/* Main Form */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            {formMode === "ManufacturingItem" && (
              <>
                {/* Row 1: PO Number, LN ItmCode, Drawing Number */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={4}>
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
                          ListboxProps={{
                            sx: {
                              maxHeight: 420, // increase dropdown height
                            },
                          }}
                          getOptionLabel={(option) => {
                            if (typeof option === "string") return option;
                            return option.productionOrderNumber || "";
                          }}
                          value={selectedPO}
                          loading={poLoading}
                          onInputChange={(_, inputValue) => {
                            setPOSearchText(inputValue);
                          }}
                          onChange={(_, newValue) => {
                            if (newValue && typeof newValue !== "string") {
                              setSelectedPO(newValue);
                              // Update form PO number field
                              onChange(newValue.productionOrderNumber || "");

                              // Map related fields from PO master
                              setValue(
                                "projectNumber",
                                newValue.projectNumber || "",
                              );
                              setValue(
                                "productionSeries",
                                newValue.productionSeries || "",
                              );
                              if (newValue.prodSeriesId) {
                                setValue("ProdSeriesId", newValue.prodSeriesId);
                              }
                              setValue("buildNumber", newValue.buildNumber || "");

                              // Map drawing and related master data
                              if (newValue.drawingNumber) {
                                const drawingFromPO: Partial<DrawingNumber> = {
                                  id: newValue.drawingNumberId,
                                  drawingNumber: newValue.drawingNumber,
                                  lnItemCode: newValue.lnItemCode,
                                  nomenclature: newValue.nomenclature,
                                  componentType: newValue.componentType,
                                };

                                setSelectedDrawingManufacturing(
                                  drawingFromPO as DrawingNumber,
                                );
                                setValue(
                                  "drawingNumber",
                                  newValue.drawingNumber || "",
                                );
                                setValue(
                                  "nomenclature",
                                  newValue.nomenclature || "",
                                );
                                setValue(
                                  "lnItemCode",
                                  newValue.lnItemCode || "",
                                );
                              }

                              // Map quantity from PO
                              // if (newValue.quantity !== undefined && newValue.quantity !== null) {
                              //   setValue("quantity", newValue.quantity);
                              // }

                              // Map ID Nos (idRange) from startIdNumber
                              // if (newValue.startIdNumber !== undefined && newValue.startIdNumber !== null) {
                              //   setValue("idRange", newValue.startIdNumber.toString());
                              // }
                            } else {
                              setSelectedPO(null);
                              onChange("");
                              setValue("buildNumber", "");
                            }
                          }}
                          isOptionEqualToValue={(option, val) =>
                            option.productionOrderNumber ===
                            (typeof val === "string"
                              ? val
                              : val?.productionOrderNumber)
                          }
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
                                    fontWeight="600"
                                    color="primary"
                                  >
                                    PO: {option.productionOrderNumber}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {option.lnItemCode &&
                                      `LN: ${option.lnItemCode}`}
                                    {option.drawingNumber &&
                                      ` | Drawing: ${option.drawingNumber}`}
                                    {option.nomenclature &&
                                      ` | Nomenclature: ${option.nomenclature}`}
                                    {option.componentType &&
                                      ` | Component Type: ${option.componentType}`}
                                  </Typography>
                                </Box>
                              </li>
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
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === "Tab") {
                                  const inputValue = (
                                    e.target as HTMLInputElement
                                  ).value;
                                  handlePOCommit(inputValue);
                                }
                              }}
                              onBlur={(e) => {
                                handlePOCommit(e.target.value);
                              }}
                            />
                          )}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      name="lnItemCode"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="LN ItmCode"
                          fullWidth
                          size="small"
                          InputProps={{ readOnly: true }}
                          InputLabelProps={{ shrink: true }}
                          sx={{ bgcolor: "grey.50" }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      name="drawingNumber"
                      control={control}
                      rules={{ required: "Drawing number is required" }}
                      render={({ field: { onChange, ...field } }) => (
                        <Autocomplete
                          {...field}
                          autoHighlight
                          autoSelect
                          options={allDrawingNumbers}
                          loading={isDrawingsLoading}
                          noOptionsText={
                            isDrawingsLoading
                              ? "Loading drawing numbers..."
                              : "No drawing numbers found"
                          }
                          filterOptions={(options, { inputValue }) => {
                            if (!inputValue) return options.slice(0, 100);
                            const searchLower = inputValue.toLowerCase();
                            return options
                              .filter(
                                (option: any) =>
                                  option.drawingNumber
                                    ?.toLowerCase()
                                    .includes(searchLower) ||
                                  option.lnItemCode
                                    ?.toLowerCase()
                                    .includes(searchLower) ||
                                  option.nomenclature
                                    ?.toLowerCase()
                                    .includes(searchLower)
                              )
                              .slice(0, 100);
                          }}
                          getOptionLabel={(option) => {
                            if (typeof option === "string") return option;
                            return option?.drawingNumber || "";
                          }}
                          value={selectedDrawing}
                          size="small"
                          onChange={(_, value) => {
                            setSelectedDrawing(value);
                            onChange(value ? value.drawingNumber : "");
                            if (value) {
                              setValue(
                                "nomenclature",
                                value.nomenclature || "",
                              );
                              setValue("lnItemCode", value.lnItemCode || "");
                              setValue("projectNumber", value.project || "");
                              // Set hidden form fields like C# version does
                              setValue("DrawingNumberId", value.id);
                              setValue("NomenclatureId", value.nomenclatureId);
                              setValue(
                                "ComponentTypeId",
                                value.componentTypeId,
                              );
                            } else {
                              setValue("nomenclature", "");
                              setValue("lnItemCode", "");
                              setValue("projectNumber", "");
                            }
                          }}
                          isOptionEqualToValue={(option, value) =>
                            option.drawingNumber ===
                            (typeof value === "string"
                              ? value
                              : value?.drawingNumber) ||
                            option.id ===
                            (typeof value === "string"
                              ? value
                              : value?.id)
                          }
                          renderOption={(props, option) => {
                            const { key, ...optionProps } = props;
                            return (
                              <li {...optionProps} key={key || option.id}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    py: 1,
                                  }}
                                >
                                  <Typography variant="body1">
                                    {option.drawingNumber}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {option.nomenclature} | {option.componentType}
                                  </Typography>
                                </Box>
                              </li>
                            );
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Drawing Number *"
                              error={!!errors.drawingNumber}
                              helperText={errors.drawingNumber?.message}
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <>
                                    {isDrawingsLoading ? (
                                      <CircularProgress
                                        color="inherit"
                                        size={16}
                                      />
                                    ) : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                ),
                              }}
                            />
                          )}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                {/* Row 2: Document Type, Nomenclature, Project Number */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={4}>
                    <Controller
                      key="man-documentType"
                      name="documentType"
                      control={control}
                      rules={{ required: "Document type is required" }}
                      render={({ field }) => (
                        <FormControl
                          fullWidth
                          error={!!errors.documentType}
                          size="small"
                        >
                          <InputLabel id="man-doc-type-label">Document Type *</InputLabel>
                          <Select
                            {...field}
                            labelId="man-doc-type-label"
                            label="Document Type *"
                            value={field.value || ""}
                          >
                            {Array.isArray(documentTypes) &&
                              documentTypes.map((type) => (
                                <MenuItem
                                  key={type.id}
                                  value={type.documentType}
                                >
                                  {type.documentType}
                                </MenuItem>
                              ))}
                          </Select>
                          {errors.documentType && (
                            <FormHelperText>
                              {errors.documentType.message}
                            </FormHelperText>
                          )}
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      key="man-nomenclature"
                      name="nomenclature"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Nomenclature"
                          fullWidth
                          size="small"
                          InputProps={{ readOnly: true }}
                          InputLabelProps={{ shrink: true }}
                          sx={{ bgcolor: "grey.50" }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      key="man-projectNumber"
                      name="projectNumber"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Project Number"
                          fullWidth
                          size="small"
                          InputProps={{ readOnly: true }}
                          InputLabelProps={{ shrink: true }}
                          sx={{ bgcolor: "grey.50" }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                {/* Row 3: Production Series, ID Nos, Quantity */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={4}>
                    <Controller
                      key="man-productionSeries"
                      name="productionSeries"
                      control={control}
                      rules={{ required: "Production series is required" }}
                      render={({ field: { onChange, value } }) => (
                        <Autocomplete
                          value={
                            Array.isArray(productionSeries)
                              ? productionSeries.find(
                                (s) => s.productionSeries === value,
                              ) || null
                              : null
                          }
                          onChange={(_, newValue) => {
                            onChange(newValue?.productionSeries || "");
                            setValue("ProdSeriesId", newValue?.id);
                          }}
                          options={
                            Array.isArray(productionSeries)
                              ? productionSeries
                              : []
                          }
                          getOptionLabel={(option) =>
                            option.productionSeries || ""
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Production Series"
                              size="small"
                              error={!!errors.productionSeries}
                              helperText={errors.productionSeries?.message}
                              InputLabelProps={{ shrink: true }}
                            />
                          )}
                          size="small"
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      key="man-idRange"
                      name="idRange"
                      control={control}
                      rules={{
                        required: "ID Nos is required",
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="ID Nos *"
                          fullWidth
                          size="small"
                          placeholder="e.g., 1,2,3-5"
                          error={!!errors.idRange}
                          helperText={errors.idRange?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      key="man-quantity"
                      name="quantity"
                      control={control}
                      rules={{
                        required: "Quantity is required",
                        min: {
                          value: 1,
                          message: "Quantity must be at least 1",
                        },
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Quantity *"
                          type="number"
                          fullWidth
                          size="small"
                          error={!!errors.quantity}
                          helperText={errors.quantity?.message}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                {/* Row 4: Stage, Remark, Generated By */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="stage"
                      control={control}
                      rules={{ required: "Stage is required" }}
                      render={({ field, fieldState: { error } }) => (
                        <FormControl
                          fullWidth
                          size="small"
                          disabled={stagesLoading}
                          error={!!error}
                        >
                          <InputLabel id="stage-label">Stage *</InputLabel>
                          <Select
                            {...field}
                            labelId="stage-label"
                            label="Stage *"
                            onChange={(e) => {
                              field.onChange(e);
                              const selectedStage = stages.find(
                                (s) => s.stage === e.target.value,
                              );
                              if (selectedStage) {
                                setValue("stageId", selectedStage.id);
                              }
                            }}
                          >
                            {stagesLoading ? (
                              <MenuItem disabled>Loading stages...</MenuItem>
                            ) : (
                              Array.isArray(stages) &&
                              stages.map((stageObj) => (
                                <MenuItem
                                  key={stageObj.id}
                                  value={stageObj.stage}
                                >
                                  {stageObj.stage}
                                </MenuItem>
                              ))
                            )}
                          </Select>
                          {error && (
                            <FormHelperText>{error.message}</FormHelperText>
                          )}
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      name="remark"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Remark"
                          fullWidth
                          size="small"
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Generated By"
                      value={currentUser}
                      fullWidth
                      size="small"
                      InputProps={{ readOnly: true }}
                      InputLabelProps={{ shrink: true }}
                      sx={{ bgcolor: "grey.50" }}
                    />
                  </Grid>
                </Grid>

                {/* Row 5: Operation Number, Build No & Department */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="operationNumber"
                      control={control}
                      rules={{ required: "Operation number is required" }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Operation Number *"
                          fullWidth
                          size="small"
                          error={!!errors.operationNumber}
                          helperText={errors.operationNumber?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="buildNumber"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Build Number"
                          fullWidth
                          size="small"
                          InputProps={{ readOnly: true }}
                          InputLabelProps={{ shrink: true }}
                          sx={{ bgcolor: "grey.50" }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="department"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Department"
                          fullWidth
                          size="small"
                          InputProps={{ readOnly: true }}
                          InputLabelProps={{ shrink: true }}
                          sx={{ bgcolor: "grey.50" }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                {/* Generated IR/MSN Number Display */}
                {generatedNumber && (
                  <Box
                    sx={{
                      mb: 3,
                      p: 2,
                      backgroundColor: generatedNumber.startsWith("IR")
                        ? "success.50"
                        : "info.50",
                      border: "1px solid",
                      borderColor: generatedNumber.startsWith("IR")
                        ? "success.200"
                        : "info.200",
                      borderRadius: 1,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          color: generatedNumber.startsWith("IR")
                            ? "success.main"
                            : "info.main",
                        }}
                      >
                        Generated{" "}
                        {generatedNumber.startsWith("IR") ? "IR" : "MSN"}{" "}
                        Number:
                      </Typography>
                      <Box
                        sx={{
                          flex: 1,
                          p: 1.5,
                          backgroundColor: "white",
                          border: "2px solid",
                          borderColor: generatedNumber.startsWith("IR")
                            ? "success.main"
                            : "info.main",
                          borderRadius: 1,
                          fontFamily: "monospace",
                          fontSize: "1rem",
                          fontWeight: "bold",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          color: generatedNumber.startsWith("IR")
                            ? "success.dark"
                            : "info.dark",
                        }}
                      >
                        <span>{generatedNumber}</span>
                        <Tooltip title={copied ? "Copied!" : "Copy"}>
                          <IconButton
                            onClick={handleCopy}
                            size="small"
                            sx={{
                              color: copied
                                ? "success.main"
                                : generatedNumber.startsWith("IR")
                                  ? "success.main"
                                  : "info.main",
                            }}
                          >
                            {copied ? <CheckIcon /> : <CopyIcon />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Stack>

                    {generatedNumber.startsWith("MSN") && isQCOrAdmin && (
                      <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={handleDownloadMemo}
                          disabled={downloadingMemo}
                          startIcon={
                            downloadingMemo ? (
                              <CircularProgress size={16} color="inherit" />
                            ) : (
                              <DownloadIcon />
                            )
                          }
                          sx={{
                            backgroundColor: "#A8005A",
                            "&:hover": {
                              backgroundColor: "#800044",
                            },
                          }}
                        >
                          {downloadingMemo ? "Downloading Memo..." : "Download Memo"}
                        </Button>
                      </Box>
                    )}

                    {/* Help text for user */}
                    <Typography
                      variant="caption"
                      sx={{
                        mt: 1,
                        display: "block",
                        color: "text.secondary",
                        fontStyle: "italic",
                      }}
                    >
                      💡 Your number has been generated! It should now be
                      searchable in the Search/Update page. If you don't see it
                      immediately, wait a moment and try again.
                    </Typography>
                  </Box>
                )}

                {/* Action Buttons */}
                {renderActionButtons()}
              </>
            )}

            {formMode === "PurchaseItem" && (
              <>
                {/* Row 1 Drawing Number Item Description LM Item Code*/}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="drawingNumber"
                      control={control}
                      rules={{ required: "Drawing number is required" }}
                      render={({ field: { onChange, ...field } }) => (
                        <Autocomplete
                          {...field}
                          autoHighlight
                          autoSelect
                          options={allDrawingNumbers}
                          loading={isDrawingsLoading}
                          noOptionsText={
                            isDrawingsLoading
                              ? "Loading drawing numbers..."
                              : "No drawing numbers found"
                          }
                          filterOptions={(options, { inputValue }) => {
                            if (!inputValue) return options.slice(0, 100);
                            const searchLower = inputValue.toLowerCase();
                            return options
                              .filter(
                                (option: any) =>
                                  option.drawingNumber
                                    ?.toLowerCase()
                                    .includes(searchLower) ||
                                  option.lnItemCode
                                    ?.toLowerCase()
                                    .includes(searchLower) ||
                                  option.nomenclature
                                    ?.toLowerCase()
                                    .includes(searchLower)
                              )
                              .slice(0, 100);
                          }}
                          getOptionLabel={(option) => {
                            if (typeof option === "string") return option;
                            return option?.drawingNumber || "";
                          }}
                          value={selectedDrawing}
                          size="small"
                          onChange={(_, value) => {
                            setSelectedDrawing(value);
                            onChange(value ? value.drawingNumber : "");
                            if (value) {
                              // Set hidden form fields for Purchase Item
                              setValue("DrawingNumberId", value.id);
                              // Auto-populate Item Description and LN Item Code
                              setValue(
                                "itemDescription",
                                value.nomenclature || "",
                              );
                              setValue("lnItemCode", value.lnItemCode || "");
                            }
                          }}
                          isOptionEqualToValue={(option, value) =>
                            option.drawingNumber ===
                            (typeof value === "string"
                              ? value
                              : value?.drawingNumber) ||
                            option.id ===
                            (typeof value === "string"
                              ? value
                              : value?.id)
                          }
                          renderOption={(props, option) => {
                            const { key, ...optionProps } = props;
                            return (
                              <li {...optionProps} key={key || option.id}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    py: 1,
                                  }}
                                >
                                  <Typography variant="body1">
                                    {option.drawingNumber}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {option.nomenclature} | {option.componentType}
                                  </Typography>
                                </Box>
                              </li>
                            );
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Drawing Number *"
                              error={!!errors.drawingNumber}
                              helperText={errors.drawingNumber?.message}
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <>
                                    {isDrawingsLoading ? (
                                      <CircularProgress
                                        color="inherit"
                                        size={16}
                                      />
                                    ) : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                ),
                              }}
                            />
                          )}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      name="itemDescription"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Item Description"
                          fullWidth
                          size="small"
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      name="lnItemCode"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="LN Item Code"
                          fullWidth
                          size="small"
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                {/* Row 2 Document Type Project Purchase Order No*/}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={4}>
                    <Controller
                      key="pur-documentType"
                      name="documentType"
                      control={control}
                      rules={{ required: "Document type is required" }}
                      render={({ field }) => (
                        <FormControl
                          fullWidth
                          error={!!errors.documentType}
                          size="small"
                        >
                          <InputLabel id="pur-doc-type-label">Document Type *</InputLabel>
                          <Select
                            {...field}
                            labelId="pur-doc-type-label"
                            label="Document Type *"
                            value={field.value || ""}
                          >
                            {Array.isArray(documentTypes) &&
                              documentTypes.map((type) => (
                                <MenuItem
                                  key={type.id}
                                  value={type.documentType}
                                >
                                  {type.documentType}
                                </MenuItem>
                              ))}
                          </Select>
                          {errors.documentType && (
                            <FormHelperText>
                              {errors.documentType.message}
                            </FormHelperText>
                          )}
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      key="pur-projectNumber"
                      name="projectNumber"
                      control={control}
                      rules={{ required: "Project  is required" }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Project *"
                          fullWidth
                          size="small"
                          error={!!errors.projectNumber}
                          helperText={errors.projectNumber?.message}
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
                          label="Purchase Order No"
                          fullWidth
                          size="small"
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                {/* Row 3 Production Series ID No / MAN No Quantity */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={4}>
                    <Controller
                      key="pur-productionSeries"
                      name="productionSeries"
                      control={control}
                      rules={{ required: "Production series is required" }}
                      render={({ field: { onChange, value } }) => (
                        <Autocomplete
                          value={
                            Array.isArray(productionSeries)
                              ? productionSeries.find(
                                (s) => s.productionSeries === value,
                              ) || null
                              : null
                          }
                          onChange={(_, newValue) => {
                            onChange(newValue?.productionSeries || "");
                            setValue("ProdSeriesId", newValue?.id);
                          }}
                          options={
                            Array.isArray(productionSeries)
                              ? productionSeries
                              : []
                          }
                          getOptionLabel={(option) =>
                            option.productionSeries || ""
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Production Series *"
                              size="small"
                              error={!!errors.productionSeries}
                              helperText={errors.productionSeries?.message}
                              InputLabelProps={{ shrink: true }}
                            />
                          )}
                          size="small"
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      key="pur-idRange"
                      name="idRange"
                      control={control}
                      rules={{
                        required: "ID Nos/MAN No is required",
                        validate: () => true
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="ID Nos/MAN No *"
                          fullWidth
                          size="small"
                          error={!!errors.idRange}
                          helperText={errors.idRange?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      key="pur-quantity"
                      name="quantity"
                      control={control}
                      rules={{
                        required: "Quantity is required",
                        min: {
                          value: 1,
                          message: "Quantity must be at least 1",
                        },
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Quantity *"
                          type="number"
                          fullWidth
                          size="small"
                          inputProps={{ min: 0 }}
                          error={!!errors.quantity}
                          helperText={errors.quantity?.message}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                {/* Row 4 Stage Remark Generated By */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={4}>
                    <Controller
                      key="pur-stage"
                      name="stage"
                      control={control}
                      rules={{ required: "Stage is required" }}
                      render={({ field, fieldState: { error } }) => (
                        <FormControl
                          fullWidth
                          size="small"
                          error={!!error}
                          disabled={stagesLoading}
                        >
                          <InputLabel id="stage-label" shrink>
                            Stage *
                          </InputLabel>

                          <Select
                            {...field}
                            labelId="stage-label"
                            label="Stage *"
                            onChange={(e) => {
                              field.onChange(e);

                              const selectedStage = stages.find(
                                (s) => s.stage === e.target.value,
                              );

                              if (selectedStage) {
                                setValue("stageId", selectedStage.id);
                              }
                            }}
                          >
                            {stagesLoading ? (
                              <MenuItem disabled>Loading stages...</MenuItem>
                            ) : (
                              Array.isArray(stages) &&
                              stages.map((stageObj) => (
                                <MenuItem
                                  key={stageObj.id}
                                  value={stageObj.stage}
                                >
                                  {stageObj.stage}
                                </MenuItem>
                              ))
                            )}
                          </Select>

                          {error && (
                            <FormHelperText>{error.message}</FormHelperText>
                          )}
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      name="remark"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Remark"
                          fullWidth
                          size="small"
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Generated By"
                      value={currentUser}
                      fullWidth
                      size="small"
                      InputProps={{ readOnly: true }}
                      sx={{ bgcolor: "grey.50" }}
                    />
                  </Grid>
                </Grid>

                {/* Generated IR/MSN Number Display */}
                {generatedNumber && (
                  <Box
                    sx={{
                      mb: 3,
                      p: 2,
                      backgroundColor: generatedNumber.startsWith("IR")
                        ? "success.50"
                        : "info.50",
                      border: "1px solid",
                      borderColor: generatedNumber.startsWith("IR")
                        ? "success.200"
                        : "info.200",
                      borderRadius: 1,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          color: generatedNumber.startsWith("IR")
                            ? "success.main"
                            : "info.main",
                        }}
                      >
                        Generated{" "}
                        {generatedNumber.startsWith("IR") ? "IR" : "MSN"}{" "}
                        Number:
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          bgcolor: "white",
                          p: 1,
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <span>{generatedNumber}</span>
                        <Tooltip title={copied ? "Copied!" : "Copy"}>
                          <IconButton
                            onClick={handleCopy}
                            size="small"
                            sx={{
                              color: copied
                                ? "success.main"
                                : generatedNumber.startsWith("IR")
                                  ? "success.main"
                                  : "info.main",
                            }}
                          >
                            {copied ? <CheckIcon /> : <CopyIcon />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Stack>

                    {generatedNumber.startsWith("MSN") && isQCOrAdmin && (
                      <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={handleDownloadMemo}
                          disabled={downloadingMemo}
                          startIcon={
                            downloadingMemo ? (
                              <CircularProgress size={16} color="inherit" />
                            ) : (
                              <DownloadIcon />
                            )
                          }
                          sx={{
                            backgroundColor: "#A8005A",
                            "&:hover": {
                              backgroundColor: "#800044",
                            },
                          }}
                        >
                          {downloadingMemo ? "Downloading Memo..." : "Download Memo"}
                        </Button>
                      </Box>
                    )}

                    {/* Help text for user */}
                    <Typography
                      variant="caption"
                      sx={{
                        mt: 1,
                        display: "block",
                        color: "text.secondary",
                        fontStyle: "italic",
                      }}
                    >
                      💡 Your number has been generated! It should now be
                      searchable in the Search/Update page. If you don't see it
                      immediately, wait a moment and try again.
                    </Typography>
                  </Box>
                )}

                {/* Action Buttons */}
                {renderActionButtons()}
              </>
            )}
          </form>
        </CardContent>
      </Card>
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
