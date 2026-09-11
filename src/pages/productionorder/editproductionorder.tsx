import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  IconButton,
  Stack,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { useNavigate, useParams, useLocation, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store/store";
import {
  updateProductionOrder,
  resetUploadState,
} from "../../store/slices/ProductionOrderSlice";
import {
  useProductionSeries,
} from "../../hooks/useMasterData";
import { usePONumbers } from "../../hooks/usePONumbers";
import api from "../../services/api";

interface EditProductionOrderFormData {
  id: number;
  productionOrderNumber: string;
  projectCode?: string;
  projectDescription?: string;
  itemCode?: string;
  itemDescription?: string;
  productionSeries?: string;
  prodSeriesId?: number;
  startIdNumber?: number;
  quantity?: number;
  mrirNumber?: string;
  min?: string;
  precheckStatus?: number;
  snagSheetNo?: string;
  buildNumber?: string;
}

export default function EditProductionOrder() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const {
    loading,
    error: apiError,
  } = useSelector((state: RootState) => state.productionOrder);

  const rawInitialData = (location.state || {}) as any;
  const initialData: EditProductionOrderFormData = useMemo(
    () => ({
      ...rawInitialData,
      id: rawInitialData.id || Number(id) || 0,
      projectCode:
        rawInitialData.projectCode || rawInitialData.projectNumber || "",
      itemCode: rawInitialData.itemCode || rawInitialData.lnItemCode || "",
      startIdNumber:
        rawInitialData.startIdNumber !== undefined
          ? Number(rawInitialData.startIdNumber)
          : 0,
      precheckStatus: rawInitialData.precheckStatus,
      snagSheetNo: rawInitialData.snagSheetNo || "",
      buildNumber: rawInitialData.buildNumber || "",
    }),
    [rawInitialData, id],
  );

  // Master Data Hooks
  const { data: productionSeriesList = [] } = useProductionSeries();
  const { data: poNumbersList = [] } = usePONumbers();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success",
  );

  // Selected Objects State
  const [selectedProductionSeries, setSelectedProductionSeries] =
    useState<any>(null);
  const [selectedPO, setSelectedPO] = useState<any>(null);

  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProductionOrderFormData>({
    defaultValues: initialData,
  });

  // Reset state on mount
  useEffect(() => {
    dispatch(resetUploadState());
  }, [dispatch]);

  // Fetch fresh data from API on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.post("/api/ProductionOrder/GetAll", {});
        const allOrders = response.data?.data || (Array.isArray(response.data) ? response.data : []);
        const currentOrder = allOrders.find((po: any) => po.id === Number(id));

        if (currentOrder) {
          const mappedData: EditProductionOrderFormData = {
            ...currentOrder,
            id: currentOrder.id,
            productionOrderNumber: currentOrder.productionOrderNumber,
            projectCode: currentOrder.projectCode || currentOrder.projectNumber || "",
            projectDescription: currentOrder.projectDescription,
            itemCode: currentOrder.itemCode || currentOrder.lnItemCode || "",
            itemDescription: currentOrder.itemDescription,
            prodSeriesId: currentOrder.prodSeriesId,
            productionSeries: currentOrder.productionSeries,
            startIdNumber: currentOrder.startIdNumber !== undefined ? Number(currentOrder.startIdNumber) : 0,
            quantity: currentOrder.quantity,
            mrirNumber: currentOrder.mrirNumber || currentOrder.mrirnumber || "",
            min: currentOrder.min || currentOrder.min || "",
            precheckStatus: currentOrder.precheckStatus,
            snagSheetNo: currentOrder.snagSheetNo || "",
            buildNumber: currentOrder.buildNumber || "",
          };
          reset(mappedData);
        }
      } catch (err) {
        console.error("Failed to fetch production order details:", err);
      }
    };

    fetchData();
  }, [id, reset]);

  // Initialize selected objects from initialData (only once when data is available)
  useEffect(() => {
    if (
      initialData.prodSeriesId &&
      productionSeriesList.length > 0 &&
      !selectedProductionSeries
    ) {
      const match = productionSeriesList.find(
        (ps) => ps.id === initialData.prodSeriesId,
      );
      if (match) setSelectedProductionSeries(match);
      else if (initialData.productionSeries) {
        setSelectedProductionSeries({
          id: initialData.prodSeriesId,
          productionSeries: initialData.productionSeries,
        });
      }
    }

    if (
      initialData.productionOrderNumber &&
      poNumbersList.length > 0 &&
      !selectedPO
    ) {
      const match = poNumbersList.find(
        (po) => po.productionOrderNumber === initialData.productionOrderNumber,
      );
      if (match) setSelectedPO(match);
      else {
        setSelectedPO({
          productionOrderNumber: initialData.productionOrderNumber,
        });
      }
    }
  }, [
    initialData,
    productionSeriesList,
    poNumbersList,
    selectedProductionSeries,
    selectedPO,
  ]);

  const onSubmit = async (data: EditProductionOrderFormData) => {
    try {
      const payload = {
        id: Number(id),
        productionOrderNumber: data.productionOrderNumber,
        itemCode: data.itemCode,
        itemDescription: data.itemDescription,
        projectCode: data.projectCode,
        projectDescription: data.projectDescription,
        prodSeriesId: selectedProductionSeries?.id,
        startIdNumber: data.startIdNumber ? Number(data.startIdNumber) : 0,
        quantity: data.quantity ? Number(data.quantity) : 0,
        mrirNumber: data.mrirNumber,
        min: data.min,
        snagSheetNo: data.snagSheetNo,
        buildNumber: data.buildNumber,
      };

      await dispatch(updateProductionOrder(payload)).unwrap();

      setSnackbarMessage("Production Order updated successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      setTimeout(() => {
        const fromPath = searchParams.get("from") || (location.state as any)?.from || "/production-order";
        navigate(fromPath, {
          state: { view: "history", reload: true },
        });
      }, 1500);
    } catch (err: any) {
      setSnackbarMessage(err || "Failed to update production order");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleBack = () => {
    const fromPath = searchParams.get("from") || (location.state as any)?.from;
    if (fromPath) {
      navigate(fromPath);
    } else {
      navigate(-1);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ py: 1.5, px: { xs: 1.5, sm: 2.5 }, bgcolor: 'background.paper', minHeight: '100vh' }}>
      {/* Header Section */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <IconButton
          onClick={handleBack}
          sx={{
            color: "primary.main",
            p: 0.5,
            "&:hover": { backgroundColor: "grey.100" },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: "primary.main",
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
          }}
        >
          Edit Production Order: {initialData.productionOrderNumber || id}
        </Typography>
      </Stack>

      {apiError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "8px" }} onClose={() => dispatch(resetUploadState())}>
          {apiError}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: "1px solid",
          borderColor: "neutral.border",
          backgroundColor: "background.paper",
          p: { xs: 2.5, sm: 3.5 },
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2.5}>
            {/* Row 1: PO Number, LN Item Code, Item Description */}
            <Grid item xs={12} md={4}>
              <Controller
                name="productionOrderNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="PO Number"
                    fullWidth
                    size="small"
                    disabled
                    sx={{
                      "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "#344054", fontWeight: 600 },
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="itemCode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Item Code"
                    fullWidth
                    size="small"
                    InputProps={{ readOnly: true }}
                    sx={{
                      "& .MuiInputBase-input": { color: "#344054", fontWeight: 600 },
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="itemDescription"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Item Description"
                    fullWidth
                    size="small"
                    InputProps={{ readOnly: true }}
                    sx={{
                      "& .MuiInputBase-input": { color: "#344054" },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Row 2: Project Code, Project Description, Prod Series */}
            <Grid item xs={12} md={4}>
              <Controller
                name="projectCode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Project Code"
                    fullWidth
                    size="small"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="projectDescription"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Project Description"
                    fullWidth
                    size="small"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Prod Series"
                fullWidth
                size="small"
                value={selectedProductionSeries?.productionSeries || ""}
                InputProps={{ readOnly: true }}
                sx={{
                  "& .MuiInputBase-input": { color: "#344054", fontWeight: 600 },
                }}
              />
            </Grid>

            {/* Row 3: Start ID Number, Quantity, MRIR Number */}
            <Grid item xs={12} md={4}>
              <Controller
                name="startIdNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Start ID Number"
                    type="number"
                    fullWidth
                    size="small"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="quantity"
                control={control}
                rules={{ required: "Quantity is required", min: 1 }}
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
            <Grid item xs={12} md={4}>
              <Controller
                name="mrirNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="MRIR Number"
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>

            {/* Row 4: Min Number, Snag Sheet Number, Build Number */}
            <Grid item xs={12} md={4}>
              <Controller
                name="min"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Min Number"
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="snagSheetNo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Snag Sheet Number"
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
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
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 3, pt: 2.5, borderTop: "1px solid", borderColor: "neutral.border" }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleBack}
              disabled={loading}
              sx={{
                height: 34,
                minWidth: 100,
                borderRadius: "6px",
                borderColor: "grey.300",
                color: "text.secondary",
                fontWeight: 600,
                fontSize: "0.8rem",
                textTransform: "none",
                "&:hover": { borderColor: "grey.400", backgroundColor: "neutral.hoverBg" },
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="small"
              startIcon={
                loading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <SaveIcon fontSize="small" />
                )
              }
              disabled={loading}
              sx={{
                height: 34,
                minWidth: 120,
                borderRadius: "6px",
                backgroundColor: "primary.main",
                color: "primary.contrastText",
                fontWeight: 600,
                fontSize: "0.8rem",
                textTransform: "none",
                boxShadow: "0 1px 2px rgba(16, 24, 40, 0.05)",
                "&:hover": { backgroundColor: "primary.dark" },
              }}
            >
              {loading ? "Updating..." : "Update Order"}
            </Button>
          </Stack>
        </form>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={snackbarSeverity === "error" ? null : 4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: "100%", borderRadius: "8px" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
