import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Autocomplete,
  IconButton,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import type { RootState, AppDispatch } from "../../store/store";
import {
  updateIRNumber,
  updateMSNNumber,
  clearError as clearIrmsnError,
} from "../../store/slices/irmsnSlice";
import api from "../../services/api";
import {
  useAllDrawingNumbers,
  useIRStages,
  useMSNStages,
} from "../../hooks/useMasterData";
import {
  usePONumbers,
  type ProductionOrderMaster,
} from "../../hooks/usePONumbers";
import { useDebounce } from "../../hooks/useDebounce";

interface EditIRMSNFormData {
  id: number;
  irNumber?: string;
  msnNumber?: string;
  drawingNumberId: number | null;
  drawingNumberIdName?: string | null;
  productionSeriesName: string | null;
  stage: string;
  stageId?: number;
  productionOrderNumber: string | null;
  nomenclatureId: number | null;
  componentTypeId: number | null;
  quantity: number;
  remark: string | null;
  projectNumber: string;
  supplier: string | null;
  drawingNumber?: string;
  lnItemCode?: string;
  nomenclature?: string;
  componentType?: string | null;
  idNumberRange?: string | null;
  operationNumber?: string | null;
}

export default function EditIRMSN() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const initialData = location.state || {};
  const isIR = type === "IR";

  const { loading: isSubmitting, error: apiError } = useSelector(
    (state: RootState) => state.irmsn
  );

  // Master Data Hooks
  const { data: allDrawingNumbers = [], isLoading: isDrgLoading } =
    useAllDrawingNumbers();
  const { data: irStages = [] } = useIRStages();
  const { data: msnStages = [] } = useMSNStages();

  const [poSearchText, setPOSearchText] = useState("");
  const debouncedPOSearch = useDebounce(poSearchText, 500);
  const { data: poNumbers = [] } = usePONumbers(debouncedPOSearch);

  const stages = isIR ? irStages : msnStages;

  // Form setup
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditIRMSNFormData>({
    defaultValues: {
      ...initialData,
      stage: initialData.stage || "",
      remark: initialData.remark || "FOUND OK",
    },
  });

  const [selectedDrawing, setSelectedDrawing] = useState<any>(null);
  const [selectedStage, setSelectedStage] = useState<any>(null);
  const [selectedPO, setSelectedPO] = useState<any>(null);

  // Initialize selections from data
  useEffect(() => {
    if (initialData) {
      console.log("EditIRMSN initialData:", initialData);

      const getVal = (key: string) =>
        initialData[key] ||
        initialData[key.charAt(0).toUpperCase() + key.slice(1)];

      // 1. Set Drawing
      const drawingId = getVal("drawingNumberId");
      const drawingName =
        getVal("drawingNumber") || getVal("drawingNumberIdName");

      if (allDrawingNumbers.length > 0) {
        let match = null;

        if (drawingId) {
          match = allDrawingNumbers.find((d) => d.id == drawingId);
        }

        if (!match && drawingName) {
          match = allDrawingNumbers.find(
            (d) => d.drawingNumber === drawingName
          );
        }

        if (match) {
          console.log("Found matching drawing:", match);
          setSelectedDrawing(match);
          setValue("drawingNumberId", match.id);
          setValue("lnItemCode", match.lnItemCode ?? "");
          setValue("nomenclature", match.nomenclature ?? "");
          setValue("componentType", match.componentType ?? "");
        } else {
          console.warn("No matching drawing found for:", {
            drawingId,
            drawingName,
          });
        }
      }

      // 2. Set Stage
      const stageName = getVal("stage");
      if (stageName && stages.length > 0) {
        const match = stages.find((s: { stage: any }) => s.stage === stageName);
        if (match) {
          setSelectedStage(match);
          setValue("stage", match.stage);
        }
      }

      // 3. Set PO Number
      const poNum = getVal("productionOrderNumber") || getVal("poNumber");
      if (poNum) {
        const poMatch = poNumbers.find(
          (p) => p.productionOrderNumber === poNum
        );
        if (poMatch) {
          setSelectedPO(poMatch);
        } else {
          setSelectedPO({
            productionOrderNumber: poNum,
          });
        }
        setValue("productionOrderNumber", poNum);
      }

      // 4. Set other fields explicitly
      const qty = getVal("quantity");
      if (qty !== undefined) setValue("quantity", qty);

      const sup = getVal("supplier");
      if (sup) setValue("supplier", sup);

      const rem = getVal("remark");
      if (rem) setValue("remark", rem);

      const idRange = getVal("idNumberRange");
      if (idRange) setValue("idNumberRange", idRange);

      const opNum = getVal("operationNumber");
      if (opNum) setValue("operationNumber", opNum);
    }
  }, [initialData, allDrawingNumbers, stages, poNumbers, setValue]);

  // Fetch full details if supplier or other key fields are missing from initialData
  useEffect(() => {
    const fetchDetails = async () => {
      const hasSupplier =
        initialData && (initialData.supplier || initialData.Supplier);

      if (!hasSupplier && id) {
        try {
          console.log(`Fetching details for ${type} ${id} to find supplier...`);
          const response = await api.get(`/api/IRMSN/Search`, {
            params: { documentType: isIR ? "IR" : "MSN", searchTerm: id },
          });

          if (response.data && Array.isArray(response.data)) {
            const match = response.data.find(
              (item: any) => (isIR ? item.irNumber : item.msnNumber) === id
            );

            if (match && match.supplier) {
              console.log("Found supplier from API:", match.supplier);
              setValue("supplier", match.supplier);
            }

            if (match && !initialData?.remark && match.remark) {
              setValue("remark", match.remark);
            }
          }
        } catch (error) {
          console.error("Error fetching details:", error);
        }
      }
    };

    fetchDetails();
  }, [id, isIR, initialData, setValue, type]);

  // Watch for ID Range changes to auto-calc quantity
  const idNumberRangeValue = watch("idNumberRange");

  useEffect(() => {
    if (idNumberRangeValue) {
      const calculateQuantityFromRange = (range: string): number => {
        const ids: number[] = [];
        const parts = range
          .split(",")
          .map((part) => part.trim())
          .filter((part) => part !== "");

        for (const part of parts) {
          if (part.includes("-")) {
            const [start, end] = part.split("-").map(Number);
            if (
              !isNaN(start) &&
              !isNaN(end) &&
              end >= start &&
              end - start < 100000
            ) {
              for (let i = start; i <= end; i++) {
                ids.push(i);
              }
            }
          } else {
            const num = Number(part);
            if (!isNaN(num)) {
              ids.push(num);
            }
          }
        }

        return new Set(ids.filter((id) => !isNaN(id))).size;
      };

      const qty = calculateQuantityFromRange(idNumberRangeValue);
      if (qty > 0) {
        setValue("quantity", qty);
      }
    }
  }, [idNumberRangeValue, setValue]);

  const onSubmit = async (data: EditIRMSNFormData) => {
    try {
      const payload = {
        ...data,
        [isIR ? "irNumber" : "msnNumber"]: id,
        stageId: selectedStage?.id,
        productionOrderNumber: data.productionOrderNumber,
        drawingNumberId: selectedDrawing?.id,
        drawingNumberIdName: selectedDrawing?.drawingNumber || null,
        drawingNumber: selectedDrawing?.drawingNumber || null,
        nomenclatureId: selectedDrawing?.nomenclatureId,
        componentTypeId: selectedDrawing?.componentTypeId,
        operationNumber: data.operationNumber,
      };

      if (isIR) {
        await dispatch(updateIRNumber(payload)).unwrap();
      } else {
        await dispatch(updateMSNNumber(payload)).unwrap();
      }

      navigate("/irmsn/view");
    } catch (err) {
      console.error("Failed to update:", err);
    }
  };

  const readOnlyStyle = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "grey.50",
      borderRadius: "6px",
      fontSize: "0.8rem",
      height: 34,
    },
  };

  const inputStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "6px",
      fontSize: "0.8rem",
      height: 34,
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
        backgroundColor: "background.default",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Header Section */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <IconButton
          onClick={() => navigate(-1)}
          size="small"
          sx={{
            backgroundColor: "background.paper",
            border: "1px solid",
            borderColor: "grey.300",
            color: "text.secondary",
            "&:hover": { backgroundColor: "grey.50", borderColor: "grey.400" },
          }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: "primary.main",
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
          }}
        >
          Edit {isIR ? "IR" : "MSN"} Number: {id}
        </Typography>
      </Stack>

      {/* Error Alert */}
      {apiError && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: "6px" }}
          onClose={() => dispatch(clearIrmsnError())}
        >
          {apiError}
        </Alert>
      )}

      {/* Main Content Card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          borderRadius: "10px",
          border: "1px solid",
          borderColor: "grey.200",
          backgroundColor: "background.paper",
          flexGrow: 1,
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2.5}>
            {/* Row 1: Document Number (Readonly) and Project Number */}
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label={`${isIR ? "IR" : "MSN"} Number`}
                value={id}
                fullWidth
                disabled
                size="small"
                sx={readOnlyStyle}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="projectNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Project Number"
                    disabled
                    fullWidth
                    size="small"
                    sx={readOnlyStyle}
                  />
                )}
              />
            </Grid>

            {/* Row 2: Drawing Number Autocomplete & LN Item Code */}
            <Grid item xs={12} sm={6} md={4}>
              <Autocomplete
                size="small"
                options={allDrawingNumbers}
                getOptionLabel={(option: any) => option.drawingNumber || ""}
                value={selectedDrawing}
                loading={isDrgLoading}
                onChange={(_, newValue) => {
                  setSelectedDrawing(newValue);
                  if (newValue) {
                    setValue("drawingNumberId", newValue.id);
                    setValue("drawingNumberIdName", newValue.drawingNumber || "");
                    setValue("drawingNumber", newValue.drawingNumber || "");
                    setValue("lnItemCode", newValue.lnItemCode ?? "");
                    setValue("nomenclature", newValue.nomenclature ?? "");
                    setValue("componentType", newValue.componentType ?? "");
                  } else {
                    setValue("drawingNumberId", null);
                    setValue("drawingNumberIdName", null);
                    setValue("drawingNumber", "");
                    setValue("lnItemCode", "");
                    setValue("nomenclature", "");
                    setValue("componentType", "");
                  }
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Drawing Number" fullWidth sx={inputStyle} />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="lnItemCode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="LN Item Code"
                    fullWidth
                    size="small"
                    disabled
                    sx={readOnlyStyle}
                  />
                )}
              />
            </Grid>

            {/* Row 3: Nomenclature and Component Type */}
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="nomenclature"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nomenclature"
                    fullWidth
                    size="small"
                    disabled
                    InputLabelProps={{ shrink: true }}
                    sx={readOnlyStyle}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="componentType"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Component Type"
                    fullWidth
                    size="small"
                    disabled
                    InputLabelProps={{ shrink: true }}
                    sx={readOnlyStyle}
                  />
                )}
              />
            </Grid>

            {/* Row 4: PO Number Autocomplete and Quantity */}
            <Grid item xs={12} sm={6} md={4}>
              <Autocomplete
                size="small"
                options={poNumbers}
                getOptionLabel={(option: any) =>
                  option.productionOrderNumber || ""
                }
                onInputChange={(_, value) => setPOSearchText(value)}
                value={selectedPO}
                onChange={(_, newValue: ProductionOrderMaster | null) => {
                  setSelectedPO(newValue);
                  if (newValue) {
                    setValue(
                      "productionOrderNumber",
                      newValue.productionOrderNumber
                    );
                    if (newValue.lnItemCodeId) {
                      const match = allDrawingNumbers.find(
                        (d) => d.lnItemCodeId === newValue.lnItemCodeId
                      );
                      if (match) {
                        setSelectedDrawing(match);
                        setValue("drawingNumberId", match.id);
                        setValue("drawingNumberIdName", match.drawingNumber || "");
                        setValue("drawingNumber", match.drawingNumber || "");
                        setValue("lnItemCode", match.lnItemCode ?? undefined);
                        setValue("nomenclature", match.nomenclature);
                        setValue("componentType", match.componentType);
                      }
                    }
                  } else {
                    setValue("productionOrderNumber", null);
                  }
                }}
                renderInput={(params) => (
                  <TextField {...params} label="PO Number" fullWidth sx={inputStyle} />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="quantity"
                control={control}
                rules={{
                  required: "Quantity is required",
                  min: { value: 1, message: "Quantity must be at least 1" },
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
                    sx={inputStyle}
                  />
                )}
              />
            </Grid>

            {/* Row 5: Stage Autocomplete */}
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="stage"
                control={control}
                rules={{ required: "Stage is required" }}
                render={({ field, fieldState: { error } }) => (
                  <Autocomplete
                    size="small"
                    options={stages}
                    getOptionLabel={(option: any) =>
                      typeof option === "string" ? option : option.stage || ""
                    }
                    value={selectedStage}
                    onChange={(_, newValue) => {
                      setSelectedStage(newValue);
                      field.onChange(newValue?.stage || "");
                    }}
                    onBlur={field.onBlur}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Stage *"
                        fullWidth
                        error={!!error}
                        helperText={error?.message}
                        inputRef={field.ref}
                        sx={inputStyle}
                      />
                    )}
                  />
                )}
              />
            </Grid>

            {/* Row 6: ID Range and Operation No */}
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="idNumberRange"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="ID Number Range"
                    fullWidth
                    size="small"
                    sx={inputStyle}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="operationNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Operation Number"
                    fullWidth
                    size="small"
                    sx={inputStyle}
                  />
                )}
              />
            </Grid>

            {/* Row 7: Remark */}
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="remark"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Remark"
                    fullWidth
                    size="small"
                    multiline
                    rows={1}
                    sx={inputStyle}
                  />
                )}
              />
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate(-1)}
                  disabled={isSubmitting}
                  sx={{
                    borderColor: "grey.300",
                    color: "text.secondary",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    borderRadius: "6px",
                    px: 2,
                    py: 0.5,
                    height: 34,
                    textTransform: "none",
                    "&:hover": { borderColor: "grey.400", backgroundColor: "grey.50" },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  size="small"
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <SaveIcon sx={{ fontSize: 16 }} />
                    )
                  }
                  disabled={isSubmitting}
                  sx={{
                    backgroundColor: "primary.main",
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    borderRadius: "6px",
                    px: 2.5,
                    py: 0.5,
                    height: 34,
                    textTransform: "none",
                    boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
                    "&:hover": { backgroundColor: "primary.dark" },
                  }}
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}
