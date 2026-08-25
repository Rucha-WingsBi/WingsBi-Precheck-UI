import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Autocomplete,
  TablePagination,
  Card,
  CardContent,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  OpenInNew as OpenInNewIcon,
  RestartAlt as ResetIcon,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import type { RootState, AppDispatch } from "../../store/store";
import {
  getAvailableComponentsForBOM,
  getProductionOrderDetails,
  clearPrecheckData,
} from "../../store/slices/precheckSlice";
import {
  useProductionSeries,
  useAllDrawingNumbers,
} from "../../hooks/useMasterData";
import { usePONumbers } from "../../hooks/usePONumbers";
import type { ProductionOrderMaster } from "../../hooks/usePONumbers";
import { useDebounce } from "../../hooks/useDebounce";

interface BOMItem {
  sr: number;
  lnitemcode: string;
  drawingNumber: string;
  qty: number;
  availableQuantity: number;
  totalQuantity: number;
  id: number;
  totalQrQty: number;
  unit: string;
}

interface QRCodeItem {
  qrCodeNumber: string;
  id: string;
  qty: number;
  status: string;
  location: string;
  expiry: string;
  mfg: string;
  remainingQuantity: number;
  fanManNo?: string;
  remarks?: string;
}

interface FormData {
  productionOrder: string;
  drawingNumber: any;
  productionSeries: any;
  startIdNumber: number | null;
  quantity: number | null;
}

const schema = yup.object().shape({
  productionOrder: yup.string().required("Production Order is required"),
  drawingNumber: yup.object().nullable().required("Drawing Number is required"),
  productionSeries: yup
    .object()
    .nullable()
    .required("Production Series is required"),
  startIdNumber: yup
    .number()
    .nullable()
    .min(1, "Start ID must be at least 1")
    .required("Start ID is required"),
  quantity: yup
    .number()
    .nullable()
    .min(1, "Quantity must be at least 1")
    .required("Quantity is required"),
});

const formatQuantity = (qty: any) => {
  if (qty === undefined || qty === null || qty === '') return '0';
  const num = Number(qty);
  if (isNaN(num)) return String(qty);
  const match = String(qty).match(/^-?\d+(?:\.\d{0,4})?/);
  return match ? match[0] : String(qty);
};

const ViewOrder: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState = location.state as any;
  const poFromState = navigationState?.productionOrderNumber;

  // Redux state
  const { availableComponents } = useSelector(
    (state: RootState) => state.precheck,
  );

  // TanStack Query Hooks
  const { data: productionSeries = [] } = useProductionSeries();
  const { data: allDrawingNumbers = [], isLoading: isDrawingsLoading } = useAllDrawingNumbers();

  // Local state
  const [error, setError] = useState("");
  const [qrCodeLoading, setQrCodeLoading] = useState(false);
  const [bomData, setBomData] = useState<BOMItem[]>([]);
  const [qrCodeData, setQrCodeData] = useState<QRCodeItem[]>([]);
  const [selectedBomRow, setSelectedBomRow] = useState<number | null>(null);
  const [qrPage, setQrPage] = useState(0);
  const [qrRowsPerPage, setQrRowsPerPage] = useState(10);
  const [pageLoading, setPageLoading] = useState(false);
  const [poSearchText, setPOSearchText] = useState("");
  const debouncedPOSearchText = useDebounce(poSearchText, 500);
  const { data: poNumbers = [] } = usePONumbers(debouncedPOSearchText);
  const [selectedPO, setSelectedPO] = useState<ProductionOrderMaster | null>(
    null,
  );
  const [openBomDialog, setOpenBomDialog] = useState(false);

  // Form setup
  const {
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      productionOrder: "",
      drawingNumber: null,
      productionSeries: null,
      startIdNumber: null,
      quantity: null,
    },
  });

  const watchFormValues = watch();

  const isResetEnabled = !!(
    selectedPO ||
    watchFormValues.productionOrder ||
    watchFormValues.drawingNumber ||
    watchFormValues.productionSeries ||
    watchFormValues.startIdNumber ||
    watchFormValues.quantity ||
    bomData.length > 0 ||
    qrCodeData.length > 0
  );

  // Fetch PO Details helper
  const handleFetchDetails = async (poNumber: string) => {
    setPageLoading(true);
    setError("");
    try {
      const result = await dispatch(
        getProductionOrderDetails(poNumber),
      ).unwrap();

      if (result && result.master) {
        const master = result.master;

        // Pre-fill form
        setValue("productionOrder", master.productionOrderNumber);
        setValue("startIdNumber", master.startIdNumber || 1);
        setValue("quantity", master.quantity || 1);

        // Set objects for Autocomplete
        if (master.prodSeriesId) {
          setValue("productionSeries", {
            id: master.prodSeriesId,
            productionSeries: master.productionSeries,
          });
        }

        if (master.drawingNumberId) {
          const drawingObj = {
            id: master.drawingNumberId,
            drawingNumber: master.drawingNumber,
            nomenclature: master.nomenclature,
            componentType: master.componentType,
            lnItemCode: master.lnItemCode,
          };
          setValue("drawingNumber", drawingObj);
        }

        // Update selectedPO for the Autocomplete field visibility
        setSelectedPO({
          id: master.id,
          productionOrderNumber: master.productionOrderNumber,
          projectNumber: master.projectNumber || "",
          lnItemCode: master.lnItemCode || "",
          drawingNumber: master.drawingNumber || "",
          nomenclature: master.nomenclature || "",
          prodSeriesId: master.prodSeriesId,
        });

        // Set BOM data
        if (result.bomItems && Array.isArray(result.bomItems)) {
          const mappedBomData = result.bomItems.map(
            (item: any, index: number) => ({
              sr: index + 1,
              lnitemcode: item.lnitemcode || "",
              drawingNumber: item.drawingNumber || "",
              qty: item.quantity || 0,
              availableQuantity: item.availableQuantity || 0,
              totalQuantity: item.totalQuantity || 0,
              totalQrQty: item.totalQrQty || 0,
              id: item.drawingNumberId || 0,
              unit: item.unitName || item.unit || "",
            }),
          );
          setBomData(mappedBomData);
        }
      }
    } catch (err: any) {
      setError(err || "Failed to fetch production order details");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (navigationState) {
      // 1. Initial Fetch if PO Number is present
      if (poFromState) {
        handleFetchDetails(poFromState);
      }

      // 2. Prefill other fields if not already filled by handleFetchDetails
      // (Note: handleFetchDetails might overwrite these if API returns data, which is desired)
      if (navigationState.productionOrderNumber)
        setValue("productionOrder", navigationState.productionOrderNumber);
      if (navigationState.startIdNumber)
        setValue("startIdNumber", navigationState.startIdNumber);
      if (navigationState.quantity)
        setValue("quantity", navigationState.quantity);

      // 3. Match and set Production Series (client-side match if needed)
      if (navigationState.productionSeries && productionSeries.length > 0) {
        const match = productionSeries.find(
          (ps: any) =>
            ps.productionSeries === navigationState.productionSeries ||
            ps.id === navigationState.prodSeriesId,
        );
        if (match) {
          setValue("productionSeries", match);
        }
      }

      // 4. Match and set Drawing Number (client-side match if needed)
      if (
        (navigationState.drawingNumber || navigationState.lnItemCode) &&
        allDrawingNumbers.length > 0
      ) {
        const match = allDrawingNumbers.find((d: any) => {
          if (
            navigationState.drawingNumberId &&
            d.id === navigationState.drawingNumberId
          )
            return true;
          if (
            navigationState.drawingNumber &&
            d.drawingNumber === navigationState.drawingNumber
          )
            return true;
          if (
            navigationState.lnItemCode &&
            d.lnItemCode === navigationState.lnItemCode
          )
            return true;
          return false;
        });
        if (match) {
          setValue("drawingNumber", match);
        }
      }
    }
  }, [
    navigationState,
    poFromState,
    productionSeries,
    allDrawingNumbers,
    dispatch,
    setValue,
  ]);

  // Update QR code data when available components change
  useEffect(() => {
    if (availableComponents && Array.isArray(availableComponents)) {
      const mappedQrData: QRCodeItem[] = availableComponents.map((item: any) => ({
        qrCodeNumber: item.qrCodeNumber || item.qrCode || "",
        id: item.id || item.idNumber || "",
        qty: item.quantity || item.qty || 0,
        status: item.status || "Available",
        location: item.location || item.storeLocation || "",
        expiry: item.expiryDate || item.expiry || "",
        mfg: item.manufacturingDate || item.mfg || "",
        remainingQuantity: item.remainingQuantity || 0,
        fanManNo: item.fanManNo || "-",
        remarks: item.remarks || "-",
      }));
      setQrCodeData(mappedQrData);
    }
  }, [availableComponents]);

  const handleBomRowDoubleClick = async (bomItem: BOMItem, index: number) => {
    const formData = watch();

    if (!formData.productionSeries?.id) {
      setError("Production Series not found");
      return;
    }

    setSelectedBomRow(index);
    setQrCodeLoading(true);
    setError("");

    try {
      const requestData = {
        prodSeriesId: Number(formData.productionSeries.id),
        drawingNumberId: Number(bomItem.id),
        quantity: bomItem.qty || 1,
      };

      await dispatch(getAvailableComponentsForBOM(requestData)).unwrap();
    } catch (err: any) {
      setError(err || "Failed to fetch available components");
      setQrCodeData([]);
    } finally {
      setQrCodeLoading(false);
    }
  };

  const handleQrChangePage = (_event: unknown, newPage: number) => {
    setQrPage(newPage);
  };

  const handleQrChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setQrRowsPerPage(parseInt(event.target.value, 10));
    setQrPage(0);
  };

  const handleReset = () => {
    reset({
      productionOrder: "",
      drawingNumber: null,
      productionSeries: null,
      startIdNumber: null,
      quantity: null,
    });
    setSelectedPO(null);
    setBomData([]);
    setQrCodeData([]);
    setSelectedBomRow(null);
    setQrPage(0);
    setPOSearchText("");
    setError("");
    dispatch(clearPrecheckData());
    navigate(location.pathname, { replace: true, state: null });
  };

  const paginatedQrResults = useMemo(() => {
    const startIndex = qrPage * qrRowsPerPage;
    const endIndex = startIndex + qrRowsPerPage;
    return qrCodeData.slice(startIndex, endIndex);
  }, [qrCodeData, qrPage, qrRowsPerPage]);

  const renderBomTable = (isExpanded: boolean = false) => (
    <TableContainer sx={{ maxHeight: isExpanded ? "60vh" : { xs: 400, sm: 550 } }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, backgroundColor: "grey.200", py: 1.5 }}>
              Sr
            </TableCell>
            <TableCell sx={{ fontWeight: 600, backgroundColor: "grey.200", py: 1.5 }}>
              LN Item Code
            </TableCell>
            <TableCell sx={{ fontWeight: 600, backgroundColor: "grey.200", py: 1.5 }}>
              Drawing Number
            </TableCell>
            <TableCell sx={{ fontWeight: 600, backgroundColor: "grey.200", py: 1.5 }}>
              Unit
            </TableCell>
            <TableCell sx={{ fontWeight: 600, backgroundColor: "grey.200", py: 1.5, width: 70 }} align="center">
              Qty per <br /> Assembly
            </TableCell>
            <TableCell sx={{ fontWeight: 600, backgroundColor: "grey.200", py: 1.5, width: 75 }} align="center">
              Total <br />Qty req.
            </TableCell>
            <TableCell sx={{ fontWeight: 600, backgroundColor: "grey.200", py: 1.5, width: 80 }} align="center">
              Total <br />QR Qty
            </TableCell>
            <TableCell sx={{ fontWeight: 600, backgroundColor: "grey.200", py: 1.5, width: 80 }} align="center">
              Available <br />Qty in Store
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bomData.map((item, index) => (
            <TableRow
              key={item.sr}
              hover
              onDoubleClick={() => handleBomRowDoubleClick(item, index)}
              sx={{
                cursor: "pointer",
                backgroundColor:
                  selectedBomRow === index ? "#e3f2fd" : "inherit",
              }}
            >
              <TableCell>{item.sr}</TableCell>
              <TableCell>{item.lnitemcode}</TableCell>
              <TableCell>{item.drawingNumber}</TableCell>
              <TableCell>{item.unit}</TableCell>
              <TableCell align="center">{item.qty}</TableCell>
              <TableCell align="center">{item.totalQuantity}</TableCell>
              <TableCell align="center">{item.availableQuantity}</TableCell>
              <TableCell align="center">{item.totalQrQty}</TableCell>
            </TableRow>
          ))}
          {bomData.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 2 }}>
                No BOM data available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (pageLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Order Details...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
      <Card elevation={2} sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 1.5, md: 2 }, "&:last-child": { pb: { xs: 1.5, md: 2 } } }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <IconButton onClick={() => navigate(-1)} size="small">
              <ArrowBackIcon />
            </IconButton>
            <Typography
              variant="h4"
              sx={{
                color: "primary.main",
                fontWeight: 600,
                fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.5rem" },
              }}
            >
              View Production Order{poFromState ? ` - ${poFromState}` : ""}
            </Typography>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mb: 0 }}>
            <Grid item xs={12} sm={6} md={2}>
              <Autocomplete
                size="small"
                options={poNumbers || []}
                getOptionLabel={(option) => {
                  if (typeof option === "string") return option;
                  return option.productionOrderNumber || "";
                }}
                value={selectedPO}
                onInputChange={(_, value) => setPOSearchText(value)}
                onChange={(_, newValue) => {
                  if (newValue && typeof newValue !== "string") {
                    setSelectedPO(newValue);
                    handleFetchDetails(newValue.productionOrderNumber);
                  } else {
                    setSelectedPO(null);
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
                          fontWeight="600"
                          color="primary"
                        >
                          PO: {option.productionOrderNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.lnItemCode && `LN: ${option.lnItemCode}`}
                          {option.drawingNumber &&
                            ` | Drawing: ${option.drawingNumber}`}
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="PO Number"
                    variant="outlined"
                    error={!!errors.productionOrder}
                    helperText={
                      errors.productionOrder?.message
                        ? String(errors.productionOrder.message)
                        : ""
                    }
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Controller
                name="drawingNumber"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    size="small"
                    options={allDrawingNumbers}
                    loading={isDrawingsLoading}
                    noOptionsText={
                      isDrawingsLoading
                        ? "Loading drawing numbers..."
                        : "No drawing numbers found"
                    }
                    groupBy={(option) => option.lnItemCode || "No LN Code"}
                    getOptionLabel={(option) => {
                      if (typeof option === "string") return option;
                      return option.drawingNumber || "";
                    }}
                    value={field.value || null}
                    onChange={(_, value) => field.onChange(value)}
                    isOptionEqualToValue={(option, value) =>
                      option.id === (value?.id || "")
                    }
                    filterOptions={(options, { inputValue }) => {
                      if (!inputValue) return options.slice(0, 100);
                      const searchLower = inputValue.toLowerCase();
                      return options
                        .filter(
                          (option) =>
                            option.drawingNumber
                              ?.toLowerCase()
                              .includes(searchLower) ||
                            option.lnItemCode
                              ?.toLowerCase()
                              .includes(searchLower) ||
                            option.nomenclature
                              ?.toLowerCase()
                              .includes(searchLower),
                        )
                        .slice(0, 100);
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
                        fullWidth
                        label="Drawing Number *"
                        placeholder="Search by Drawing, LN, or Name..."
                        error={!!errors.drawingNumber}
                        helperText={
                          errors.drawingNumber?.message
                            ? String(errors.drawingNumber.message)
                            : ""
                        }
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {isDrawingsLoading ? (
                                <CircularProgress color="inherit" size={20} />
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

            <Grid item xs={12} sm={4} md={2}>
              <Controller
                name="productionSeries"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    size="small"
                    options={productionSeries}
                    getOptionLabel={(option) => {
                      if (typeof option === "string") return option;
                      return option.productionSeries || "";
                    }}
                    onChange={(_, value) => field.onChange(value)}
                    isOptionEqualToValue={(option, value) =>
                      option.id === (value?.id || "")
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        label="Prod Series"
                        error={!!errors.productionSeries}
                        helperText={
                          errors.productionSeries?.message
                            ? String(errors.productionSeries.message)
                            : ""
                        }
                      />
                    )}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4} md={1.5}>
              <Controller
                name="startIdNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ""}
                    fullWidth
                    size="small"
                    label="Start ID"
                    variant="outlined"
                    type="number"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4} md={1.5}>
              <Controller
                name="quantity"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ""}
                    fullWidth
                    size="small"
                    label="Quantity"
                    variant="outlined"
                    type="number"
                  />
                )}
              />
            </Grid>

            <Grid item xs="auto" sm="auto" md="auto">
              <Button
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<ResetIcon />}
                onClick={handleReset}
                disabled={!isResetEnabled}
                sx={{
                  height: 40,
                  textTransform: "none",
                  fontWeight: 600,
                  px: 2.5,
                }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Card elevation={2}>
            <CardContent sx={{ p: { xs: 1.5, md: 2 }, "&:last-child": { pb: { xs: 1.5, md: 2 } } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                  height: 32, // Match height for alignment
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{ color: "primary.main", fontWeight: 600 }}
                  >
                    BOM Details
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ alignSelf: "flex-end", mb: 0.5 }}
                  >
                    (Double-click rows for components)
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => setOpenBomDialog(true)}
                  size="small"
                  title="Expand"
                >
                  <OpenInNewIcon />
                </IconButton>
              </Box>

              {renderBomTable()}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card elevation={2}>
            <CardContent sx={{ p: { xs: 1.5, md: 2 }, "&:last-child": { pb: { xs: 1.5, md: 2 } } }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 1,
                  height: 32,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: "primary.main", fontWeight: 600 }}
                >
                  Available QR Codes{" "}
                  {qrCodeData.length > 0 ? `(${qrCodeData.length})` : ""}
                </Typography>
                {qrCodeLoading && <CircularProgress size={20} sx={{ ml: 2 }} />}
              </Box>
              <TableContainer>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{ fontWeight: 600, backgroundColor: "grey.200", py: 1.5 }}
                      >
                        QR Code Number
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 600, backgroundColor: "grey.200", py: 1.5 }}
                      >
                        ID
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 600, backgroundColor: "grey.200", py: 1.5 }}
                      >
                        Qty
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 600, backgroundColor: "grey.200", py: 1.5 }}
                      >
                        Status
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 600, backgroundColor: "grey.200", py: 1.5 }}
                      >
                        Location
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 600, backgroundColor: "grey.200", py: 1.5 }}
                      >
                        FAN/MAN No.
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 600, backgroundColor: "grey.200", py: 1.5 }}
                      >
                        Remarks
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {qrCodeLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 2 }}>
                          <CircularProgress size={24} />
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {paginatedQrResults.map((item, index) => (
                          <TableRow key={index} hover>
                            <TableCell>{item.qrCodeNumber}</TableCell>
                            <TableCell>{item.id}</TableCell>
                            <TableCell>{formatQuantity(item.remainingQuantity)}</TableCell>
                            <TableCell>{item.status}</TableCell>
                            <TableCell>{item.location}</TableCell>
                            <TableCell>{item.fanManNo || "-"}</TableCell>
                            <TableCell>{item.remarks || "-"}</TableCell>
                          </TableRow>
                        ))}
                        {qrCodeData.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              align="center"
                              sx={{ py: 2 }}
                            >
                              No components found
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={qrCodeData.length}
                page={qrPage}
                onPageChange={handleQrChangePage}
                rowsPerPage={qrRowsPerPage}
                onRowsPerPageChange={handleQrChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Expanded BOM Table Dialog */}
      <Dialog
        open={openBomDialog}
        onClose={() => setOpenBomDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">BOM Details</Typography>
          <IconButton onClick={() => setOpenBomDialog(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>{renderBomTable(true)}</DialogContent>
      </Dialog>
    </Box>
  );
};

export default ViewOrder;
