import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
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
    (state: RootState) => state.irmsn,
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

      // Helper to safely get property case-insensitively
      const getVal = (key: string) =>
        initialData[key] ||
        initialData[key.charAt(0).toUpperCase() + key.slice(1)];

      // 1. Set Drawing
      const drawingId = getVal("drawingNumberId");
      const drawingName =
        getVal("drawingNumber") || getVal("drawingNumberIdName");

      if (allDrawingNumbers.length > 0) {
        let match = null;

        // Try match by ID first
        if (drawingId) {
          match = allDrawingNumbers.find((d) => d.id == drawingId);
        }

        // Fallback to match by name if no ID match (or no ID)
        if (!match && drawingName) {
          match = allDrawingNumbers.find(
            (d) => d.drawingNumber === drawingName,
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
        // If PO number exists in initial data, set it for display
        // If the PO list isn't loaded yet, we can at least show the value
        const poMatch = poNumbers.find(
          (p) => p.productionOrderNumber === poNum,
        );
        if (poMatch) {
          setSelectedPO(poMatch);
        } else {
          // Create a temporary object for display if not in list
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
      // Check if we need to fetch.
      // If we don't have initialData or it's missing supplier, we try to fetch.
      // We check case-insensitive supplier similar to getVal
      const hasSupplier =
        initialData && (initialData.supplier || initialData.Supplier);

      if (!hasSupplier && id) {
        try {
          console.log(`Fetching details for ${type} ${id} to find supplier...`);
          const response = await api.get(`/api/IRMSN/Search`, {
            params: { documentType: isIR ? "IR" : "MSN", searchTerm: id },
          });

          if (response.data && Array.isArray(response.data)) {
            // Find exact match
            const match = response.data.find(
              (item: any) => (isIR ? item.irNumber : item.msnNumber) === id,
            );

            if (match && match.supplier) {
              console.log("Found supplier from API:", match.supplier);
              setValue("supplier", match.supplier);
            }

            // We could establish other missing fields here if needed
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
            // Protect against massive loops if user types large numbers
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

        // Remove duplicates and return the count
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

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="h4"
          sx={{
            fontWeight: "600",
            color: "primary.main",
            fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.5rem" },
          }}
        >
          Edit {isIR ? "IR" : "MSN"} Number: {id}
        </Typography>
      </Stack>

      {apiError && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => dispatch(clearIrmsnError())}
        >
          {apiError}
        </Alert>
      )}

      <Card elevation={3} sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* Row 1: Document Number (Readonly) and Project Number */}
              <Grid item xs={12} md={6}>
                <TextField
                  label={`${isIR ? "IR" : "MSN"} Number`}
                  value={id}
                  fullWidth
                  disabled
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
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
                      sx={{ bgcolor: "#f5f5f5" }}
                    />
                  )}
                />
              </Grid>

              {/* Row 2: Drawing Number Autocomplete */}
              <Grid item xs={12} md={6}>
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
                    <TextField {...params} label="Drawing Number" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
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
                      sx={{ bgcolor: "#f5f5f5" }}
                    />
                  )}
                />
              </Grid>

              {/* Row 3: Nomenclature and Component Type */}
              <Grid item xs={12} md={6}>
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
                      sx={{ bgcolor: "#f5f5f5" }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
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
                      sx={{ bgcolor: "#f5f5f5" }}
                    />
                  )}
                />
              </Grid>

              {/* Row 4: PO Number Autocomplete and Quantity */}
              <Grid item xs={12} md={6}>
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
                        newValue.productionOrderNumber,
                      );
                      // Cascading logic
                      if (newValue.lnItemCodeId) {
                        const match = allDrawingNumbers.find(
                          (d) => d.lnItemCodeId === newValue.lnItemCodeId,
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
                    <TextField {...params} label="PO Number" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
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
                    />
                  )}
                />
              </Grid>

              {/* Row 5: Stage Autocomplete */}
              <Grid item xs={12} md={6}>
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
                        />
                      )}
                    />
                  )}
                />
              </Grid>

              {/* Row 6: ID Range and Operation No */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="idNumberRange"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="ID Number Range"
                      fullWidth
                      size="small"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="operationNumber"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Operation Number"
                      fullWidth
                      size="small"
                    />
                  )}
                />
              </Grid>

              {/* Row 7: Remark */}
              <Grid item xs={12} md={6}>
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
                    />
                  )}
                />
              </Grid>

              {/* Action Buttons */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => navigate(-1)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={
                      isSubmitting ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <SaveIcon />
                      )
                    }
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Updating..." : "Update Record"}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
