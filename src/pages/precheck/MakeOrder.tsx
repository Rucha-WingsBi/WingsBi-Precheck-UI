import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
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
} from "@mui/material";
import {
  ShoppingCart as ShoppingCartIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import debounce from "lodash.debounce";
import type { RootState, AppDispatch } from "../../store/store";
import {
  makePrecheckOrder,
  getAvailableComponentsForBOM,
} from "../../store/slices/precheckSlice";
import { useProductionSeries, useLnItemCodeSearch, useAllDrawingNumbers } from "../../hooks/useMasterData";

interface BOMItem {
  sr: number;
  drawingNumber: string;
  nomenclature: string;
  qty: number;
  availableQuantity: number;
  totalQuantity: number;
  id: number; // ID of the specific BOM item's drawing number
}

interface QRCodeItem {
  qrCodeNumber: string;
  id: string;
  qty: number;
  status: string;
  location: string;
  expiry: string;
  mfg: string;
}

interface FormData {
  productionOrder: string;
  drawingNumber: any;
  productionSeries: any;
  startIdNumber: number;
  quantity: number;
}

// Validation schema
const schema = yup.object().shape({
  productionOrder: yup.string().required("Production Order is required"),
  drawingNumber: yup.object().nullable().required("Drawing Number is required"),
  productionSeries: yup
    .object()
    .nullable()
    .required("Production Series is required"),
  startIdNumber: yup
    .number()
    .min(1, "Start ID must be at least 1")
    .required("Start ID is required"),
  quantity: yup
    .number()
    .min(1, "Quantity must be at least 1")
    .required("Quantity is required"),
});

const MakeOrder: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Format date function
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  // Redux state
  const { isLoading, availableComponents } = useSelector(
    (state: RootState) => state.precheck
  );
  const { user } = useSelector((state: RootState) => state.auth);

  // TanStack Query Hooks
  const [debouncedLnSearch, setDebouncedLnSearch] = useState("");
  const { data: productionSeries = [], isLoading: prodSeriesLoading } = useProductionSeries();
  const { data: allDrawingNumbers = [], isLoading: isDrawingsLoading } = useAllDrawingNumbers();
  const { isLoading: isLnSearchLoading } = useLnItemCodeSearch(debouncedLnSearch);


  // Local state
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [qrCodeLoading, setQrCodeLoading] = useState(false);
  const [bomData, setBomData] = useState<BOMItem[]>([]);
  const [qrCodeData, setQrCodeData] = useState<QRCodeItem[]>([]);
  const [selectedBomRow, setSelectedBomRow] = useState<number | null>(null);

  // Pagination state for QR codes table
  const [qrPage, setQrPage] = useState(0);
  const [qrRowsPerPage, setQrRowsPerPage] = useState(10);

  // Form setup
  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      productionOrder: "",
      drawingNumber: null,
      productionSeries: null,
      startIdNumber: 1,
      quantity: 1,
    },
  });

  const watchDrawingNumber = watch("drawingNumber");

  // Debounced search functions
  const updateDebouncedLnSearch = useMemo(
    () => debounce((value: string) => setDebouncedLnSearch(value), 300),
    []
  );

  // Master data handled by hooks

  // Clear BOM data when drawing number changes (will be populated after API call)
  useEffect(() => {
    setBomData([]);
  }, [watchDrawingNumber]);

  // Update QR code data when available components change
  useEffect(() => {
    if (availableComponents && Array.isArray(availableComponents)) {
      const mappedQrData = availableComponents.map(
        (item: any, _index: number) => ({
          qrCodeNumber: item.qrCodeNumber || item.qrCode || "",
          id: item.id || item.idNumber || "",
          qty: item.quantity || item.qty || 0,
          status: item.status || "Available",
          location: item.location || item.storeLocation || "",
          expiry: item.expiryDate || item.expiry || "",
          mfg: item.manufacturingDate || item.mfg || "",
        })
      );
      setQrCodeData(mappedQrData);
    }
  }, [availableComponents]);

  const onSubmit = async (data: FormData) => {
    setError("");
    setSuccessMessage("");

    try {
      // Generate IDs array based on start ID and quantity
      const ids = Array.from(
        { length: data.quantity },
        (_, i) => data.startIdNumber + i
      );

      const orderData = {
        productionOrderNumber: data.productionOrder,
        productionSeriesId: Number(data.productionSeries?.id) || 0,
        drawingNumberId: Number(data.drawingNumber?.id) || 0,
        createdBy: Number(user?.id) || 0,
        ids: ids,
        lnItemCode: data.drawingNumber?.lnItemCode,
      };

      const result = await dispatch(makePrecheckOrder(orderData)).unwrap();

      // Populate BOM table with API response data
      if (result && Array.isArray(result)) {
        const mappedBomData = result.map((item: any, index: number) => ({
          sr: index + 1,
          drawingNumber: item.drawingNumber || "",
          nomenclature: item.nomenclature || "",
          qty: item.quantity || 0,
          availableQuantity: item.availableQuantity || 0,
          totalQuantity: item.totalQuantity || 0,
          id: item.drawingNumberId || item.drawingId || item.id || 0, // Use drawing number ID from make order response
        }));
        setBomData(mappedBomData);
      }

      // Note: QR Code data would come from a separate API call if needed
      // For now, keeping it empty until we know the QR code data source

      setSuccessMessage("Order created successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err: any) {
      setError(err || "Failed to create order. Please try again.");
    }
  };

  const handleReset = () => {
    reset();
    setError("");
    setSuccessMessage("");
    setBomData([]);
    setQrCodeData([]);
    setSelectedBomRow(null);
    setQrPage(0);
  };

  const handleBomRowDoubleClick = async (bomItem: BOMItem, index: number) => {
    const formData = watch();

    if (!formData.productionSeries?.id || !formData.drawingNumber?.id) {
      setError("Please select Production Series and Drawing Number first");
      return;
    }

    // Set selected row for visual feedback
    setSelectedBomRow(index);
    setQrCodeLoading(true);
    setError("");

    try {
      const requestData = {
        prodSeriesId: Number(formData.productionSeries.id),
        drawingNumberId: Number(bomItem.id), // Use the BOM item's drawing number ID
        quantity: bomItem.qty || 1,
      };

      console.log("Making API call with:", requestData);
      console.log("Selected BOM item:", bomItem);

      const result = await dispatch(
        getAvailableComponentsForBOM(requestData)
      ).unwrap();

      console.log("API Response:", result);

      // The result will be automatically handled by the useEffect when availableComponents changes
      if (!result || (Array.isArray(result) && result.length === 0)) {
        setError("No available components found for this BOM item");
      }
    } catch (err: any) {
      console.error("API Error:", err);
      setError(err || "Failed to fetch available components");
      setQrCodeData([]);
    } finally {
      setQrCodeLoading(false);
    }
  };

  // Pagination handlers for QR codes table
  const handleQrChangePage = (_event: unknown, newPage: number) => {
    setQrPage(newPage);
  };

  const handleQrChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setQrRowsPerPage(parseInt(event.target.value, 10));
    setQrPage(0);
  };

  // Paginated QR code results
  const paginatedQrResults = useMemo(() => {
    const startIndex = qrPage * qrRowsPerPage;
    const endIndex = startIndex + qrRowsPerPage;
    return qrCodeData.slice(startIndex, endIndex);
  }, [qrCodeData, qrPage, qrRowsPerPage]);

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: "100%", mx: "auto" }}>
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 2 } }}>
          {/* Page Title */}
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              color: "primary.main",
              fontWeight: 600,
              mb: 3,
            }}
          >
            Make Order
          </Typography>

          {/* Success/Error Messages */}
          {successMessage && (
            <Alert
              severity="success"
              sx={{ mb: 2 }}
              onClose={() => setSuccessMessage("")}
            >
              {successMessage}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {/* Form Fields */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={1.6}>
              <Controller
                name="productionOrder"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    size="small"
                    label="PO Number *"
                    variant="outlined"
                    error={!!errors.productionOrder}
                    helperText={errors.productionOrder?.message || ""}
                  />
                )}
              />
            </Grid>

            {/* LN Item Code Field */}
            <Grid item xs={12} sm={6} md={2.8}>
              <Autocomplete
                size="small"
                options={allDrawingNumbers}
                groupBy={(option: any) => option.lnItemCode || "No LN Code"}
                getOptionLabel={(option: any) => {
                  if (typeof option === "string") return option;
                  return option.lnItemCode || "";
                }}
                value={watch("drawingNumber")}
                loading={isDrawingsLoading || isLnSearchLoading}
                noOptionsText={
                  isDrawingsLoading
                    ? "Loading drawing numbers..."
                    : "No drawing numbers found"
                }
                freeSolo={false}
                onInputChange={(_, value) => {

                  updateDebouncedLnSearch(value);
                }}
                onChange={(_, value) => {
                  if (value) {
                    const drawingNumberField = watch("drawingNumber");
                    if (!drawingNumberField || drawingNumberField.id !== value.id) {
                      setValue("drawingNumber", value);
                    }
                  }
                }}
                filterOptions={(options, { inputValue }) => {
                  if (!inputValue) return options.slice(0, 100);
                  const searchLower = inputValue.toLowerCase();
                  const filtered = options.filter((option: any) =>
                    option.lnItemCode?.toLowerCase().includes(searchLower) ||
                    option.drawingNumber?.toLowerCase().includes(searchLower) ||
                    option.nomenclature?.toLowerCase().includes(searchLower)
                  );
                  return filtered.slice(0, 100);
                }}
                renderOption={(props, option: any) => {
                  const { key, ...optionProps } = props;
                  return (
                    <li {...optionProps} key={key}>
                      <Box sx={{ display: "flex", flexDirection: "column", py: 0.5, width: "100%" }}>
                        <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.85rem', color: 'text.primary' }}>
                          Drawing: {option.drawingNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                          {option.nomenclature} | Type: {option.componentType}
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
                        backgroundColor: 'grey.200',
                        color: 'primary.main',
                        fontSize: '0.95rem',
                        letterSpacing: '0.5px'
                      }}
                    >
                      LN CODE: {params.group}
                    </Typography>
                    <ul style={{ padding: 0, margin: 0 }}>{params.children}</ul>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="LN Item Code"
                    placeholder="Type to search..."
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isLnSearchLoading ? (
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

            <Grid item xs={12} sm={6} md={3.4}>
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
                      return options.filter((option) =>
                        option.drawingNumber?.toLowerCase().includes(searchLower) ||
                        option.lnItemCode?.toLowerCase().includes(searchLower) ||
                        option.nomenclature?.toLowerCase().includes(searchLower)
                      ).slice(0, 100);
                    }}
                    renderOption={(props, option) => {
                      const { key, ...optionProps } = props;
                      return (
                        <li {...optionProps} key={key}>
                          <Box sx={{ display: "flex", flexDirection: "column", py: 0.5, width: "100%" }}>
                            <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.85rem', color: 'text.primary' }}>
                              Drawing: {option.drawingNumber}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                              {option.nomenclature} | Type: {option.componentType}
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
                            backgroundColor: 'grey.200',
                            color: 'primary.main',
                            fontSize: '0.95rem',
                            letterSpacing: '0.5px'
                          }}
                        >
                          LN CODE: {params.group}
                        </Typography>
                        <ul style={{ padding: 0, margin: 0 }}>{params.children}</ul>
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        label="RM Item Code *"
                        placeholder="Search by Drawing, LN, or Name..."
                        error={!!errors.drawingNumber}
                        helperText={String(errors.drawingNumber?.message || "")}
                      />
                    )}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4} md={1.5}>
              <Box sx={{ maxWidth: 150 }}>
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
                      loading={false} // Hook handles loading
                      onInputChange={(_, _value) => {
                        // Production series usually doesn't need search as it's small
                      }}
                      onChange={(_, value) => {
                        field.onChange(value);
                      }}
                      isOptionEqualToValue={(option, value) =>
                        option.id === (value?.id || "")
                      }
                      renderOption={(props, option) => (
                        <li {...props}>
                          <Typography variant="body1">
                            {option.productionSeries}
                          </Typography>
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          label="Prod Series *"
                          error={!!errors.productionSeries}
                          helperText={String(
                            errors.productionSeries?.message || ""
                          )}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {prodSeriesLoading ? (
                                  <CircularProgress color="inherit" size={16} />
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
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={1.2}>
              <Controller
                name="startIdNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    size="small"
                    label="Start ID Number"
                    variant="outlined"
                    type="number"
                    error={!!errors.startIdNumber}
                    helperText={errors.startIdNumber?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={1.2}>
              <Controller
                name="quantity"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    size="small"
                    label="Quantity *"
                    variant="outlined"
                    type="number"
                    error={!!errors.quantity}
                    helperText={errors.quantity?.message}
                  />
                )}
              />
            </Grid>
          </Grid>

          {/* Action Buttons */}
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
              variant="outlined"
              color="error"
              size="small"
              onClick={handleReset}
              startIcon={<RefreshIcon />}
              sx={{ minWidth: 100, height: 32 }}
            >
              Reset
            </Button>

            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={handleSubmit(onSubmit)}
              disabled={isLoading}
              startIcon={
                isLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <ShoppingCartIcon />
                )
              }
              sx={{ minWidth: 140, height: 32 }}
            >
              {isLoading ? "Processing..." : "Make Order"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Tables Section */}
      <Grid container spacing={3}>
        {/* BOM Table */}
        <Grid item xs={12} md={5.2}>
          <Card elevation={2}>
            <CardContent sx={{ p: { xs: 1, md: 2 } }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: "primary.main", fontWeight: 600, mb: 1 }}
              >
                BOM Details
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 0.5 }}
              >
                Double-click on any row to load available components
              </Typography>
              <TableContainer sx={{ maxHeight: { xs: 300, sm: 450, md: 500, lg: 550 } }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "grey.50", py: 1 }}>
                        Sr
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "grey.50", py: 1 }}>
                        Drawing Number
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "grey.50", py: 1 }}>
                        Available Qty
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "grey.50", py: 1 }}>
                        Total Qty
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "grey.50", py: 1 }}>
                        Qty
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
                          backgroundColor: selectedBomRow === index ? "#e3f2fd" : "inherit",
                          "&:hover": {
                            backgroundColor: selectedBomRow === index ? "#bbdefb" : "#f5f5f5",
                          },
                        }}
                      >
                        <TableCell sx={{ py: 1 }}>{item.sr}</TableCell>
                        <TableCell sx={{ py: 1 }}>{item.drawingNumber}</TableCell>
                        <TableCell sx={{ py: 1 }}>{item.availableQuantity}</TableCell>
                        <TableCell sx={{ py: 1 }}>{item.totalQuantity}</TableCell>
                        <TableCell sx={{ py: 1 }}>{item.qty}</TableCell>
                      </TableRow>
                    ))}
                    {bomData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 2, color: "text.secondary" }}>
                          No BOM data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* QR Codes Table */}
        <Grid item xs={12} md={6.8}>
          <Card elevation={2}>
            <CardContent sx={{ p: { xs: 1, md: 2 } }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
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
                      <TableCell sx={{ fontWeight: 600, bgcolor: "grey.50", py: 1 }}>
                        QR Code Number
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "grey.50", py: 1 }}>
                        ID
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "grey.50", py: 1 }}>
                        Qty
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "grey.50", py: 1 }}>
                        Status
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "grey.50", py: 1 }}>
                        Location
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "grey.50", py: 1 }}>
                        Expiry
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "grey.50", py: 1 }}>
                        Mfg
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {qrCodeLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 2 }}>
                          <CircularProgress size={24} />
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Loading available components...
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {paginatedQrResults.map((item, index) => (
                          <TableRow key={index} hover>
                            <TableCell sx={{ py: 1 }}>{item.qrCodeNumber}</TableCell>
                            <TableCell sx={{ py: 1 }}>{item.id}</TableCell>
                            <TableCell sx={{ py: 1 }}>{item.qty}</TableCell>
                            <TableCell sx={{ py: 1 }}>{item.status}</TableCell>
                            <TableCell sx={{ py: 1 }}>{item.location}</TableCell>
                            <TableCell sx={{ py: 1 }}>{formatDate(item.expiry)}</TableCell>
                            <TableCell sx={{ py: 1 }}>{formatDate(item.mfg)}</TableCell>
                          </TableRow>
                        ))}
                        {qrCodeData.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 2, color: "text.secondary" }}>
                              Double-click on a BOM row to load QR codes
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination for QR Codes */}
              {qrCodeData.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={qrCodeData.length}
                  rowsPerPage={qrRowsPerPage}
                  page={qrPage}
                  onPageChange={handleQrChangePage}
                  onRowsPerPageChange={handleQrChangeRowsPerPage}
                  sx={{
                    borderTop: "1px solid #e0e0e0",
                    "& .MuiTablePagination-toolbar": {
                      minHeight: 40,
                    },
                    "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                      fontSize: "0.8rem",
                    },
                  }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MakeOrder;
