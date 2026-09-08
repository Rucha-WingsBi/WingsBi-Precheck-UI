import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
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
  CircularProgress,
  Autocomplete,
  InputAdornment,
  debounce,
  IconButton,
} from "@mui/material";

import { Save as SaveIcon, Refresh as RefreshIcon, ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useForm, Controller } from "react-hook-form";
import { useParams } from "react-router-dom";
import type { RootState, AppDispatch } from "../../store/store";
import type { DrawingNumber } from "../../types";
import {
  insertDrawingMappings,
  clearError,
} from "../../store/slices/qrcodeSlice";
import { useDrawingNumbers, useUnits } from "../../hooks/useMasterData";

// Create typed versions of the hooks
const useAppDispatch: () => AppDispatch = useDispatch;

interface InsertMappingsFormData {
  ParentDrawingNumbers: string;
  drawingNumber: string;
  lnItemCode: string;
  nomenclature: string;
  rackLocation?: string;
  componentType: string;
  documentType: string;
  unitName: string;
  componentCode: string;
  availableFor: string;
  assemblyNumber?: string;
  assemblyItemCode?: string;
  quantity?: number | string;
  findNo?: string;
  hasExpiry: string;
  createdDate?: string;
  modifiedDate?: string;
  isActive: boolean;
  unitId?: string;
  documentTypeId?: string;
}

export default function InsertMappings() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const queryClient = useQueryClient();

  // location.state might be passed directly as editRow or inside an object containing fromView
  const state = location.state as any;
  const editRow = (state && (state.id || state.editRow)) ? (state.editRow || state) : null;
  const fromView = Boolean(state?.fromView);

  // Redux state
  const { loading, error } = useSelector((state: RootState) => state.qrcode);
  // Master Data Hooks
  const { data: units = [] } = useUnits();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: drawingNumbers = [], isLoading: loadingDrawings } =
    useDrawingNumbers("", searchQuery);
  const user = useSelector((state: RootState) => state.auth.user);

  // Local state
  const [selectedDrawing, setSelectedDrawing] = useState<DrawingNumber | null>(
    null
  );

  // Manual fetch for edit mode if state is missing
  const { data: allDrawings = [] } = useDrawingNumbers("", "");

  const [selectedAssemblyDrawing, setSelectedAssemblyDrawing] = useState<DrawingNumber | null>(
    null
  );
  const [assemblySearchQuery, setAssemblySearchQuery] = useState("");
  const { data: assemblyDrawingNumbers = [], isLoading: loadingAssemblyDrawings } =
    useDrawingNumbers("", assemblySearchQuery);

  const debouncedAssemblySearch = useMemo(
    () =>
      debounce((search: string) => {
        setAssemblySearchQuery(search);
      }, 300),
    []
  );

  // Effect to find drawing if in edit mode and no state passed (e.g. refresh)
  useEffect(() => {
    if (isEditMode && !editRow && allDrawings.length > 0 && id) {
      const found = allDrawings.find((d) => d.id === Number(id));
      if (found) {
        setSelectedDrawing(found);
        // Trigger form fill
        handleDrawingNumberChange(found);
      }
    }
  }, [isEditMode, editRow, allDrawings, id]);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role === "Admin";

  // Form
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<InsertMappingsFormData>({
    defaultValues: {
      drawingNumber: "",
      lnItemCode: "",
      nomenclature: "",
      rackLocation: "",
      componentType: "",
      documentType: "",
      unitName: "",
      componentCode: "",
      availableFor: "",
      assemblyNumber: "",
      assemblyItemCode: "",
      hasExpiry: "",
      quantity: "",
      findNo: "",
      createdDate: !isEditMode ? new Date().toISOString() : "",
      modifiedDate: "",
    },
  });

  const handleAssemblyNumberChange = (newValue: DrawingNumber | null) => {
    setSelectedAssemblyDrawing(newValue);
    if (newValue) {
      setValue("assemblyNumber", newValue.drawingNumber || "");
      setValue("assemblyItemCode", newValue.lnItemCode || "");
    } else {
      setValue("assemblyNumber", "");
      setValue("assemblyItemCode", "");
    }
  };

  useEffect(() => {
    if (editRow) {
      setSelectedDrawing(editRow);
      handleDrawingNumberChange(editRow);
      return;
    } else if (!isEditMode) {
      setValue("createdDate", new Date().toISOString());
    }
  }, [editRow, isEditMode, setValue]);

  // Helper to fill form (extracted from useEffect)
  const fillForm = (drawing: DrawingNumber) => {
    setValue("drawingNumber", drawing.drawingNumber || "NA");
    setValue("lnItemCode", drawing.lnItemCode || "NA");
    setValue("nomenclature", drawing.nomenclature || "NA");
    setValue("rackLocation", drawing.location || "NA");
    const normComponentType = (drawing.componentType || "").toUpperCase();
    const validComponentTypes = ["ID", "BATCH", "FIM", "SI"];
    setValue("componentType", validComponentTypes.includes(normComponentType) ? normComponentType : "");
    setValue("componentCode", drawing.componentCode || "NA");
    setValue("availableFor", drawing.availableFor || "NA");
    const topParentDrawing = drawing.parentDrawingNumbers && drawing.parentDrawingNumbers.length > 0
      ? drawing.parentDrawingNumbers[drawing.parentDrawingNumbers.length - 1]
      : "";
    setValue("assemblyNumber", topParentDrawing || "NA");
    if (topParentDrawing) {
      const match = allDrawings.find(
        (d) => d.drawingNumber?.toLowerCase() === topParentDrawing.toLowerCase()
      );
      setSelectedAssemblyDrawing(match || null);
      setValue("assemblyItemCode", match?.lnItemCode || "NA");
    } else {
      setSelectedAssemblyDrawing(null);
      setValue("assemblyItemCode", "NA");
    }
    setValue("hasExpiry", drawing.isExpiry ? "Yes" : "No");
    setValue("quantity", drawing.qty ?? 0);
    setValue("findNo", drawing.findNo || "");
    setValue("createdDate", drawing.createdDate || "");
    setValue("modifiedDate", drawing.modifiedDate || "");
    setValue("unitName", drawing.unitName || "");
  };

  // Debounced search function for drawing numbers with local state
  const debouncedDrawingSearch = useMemo(
    () =>
      debounce((search: string) => {
        setSearchQuery(search);
      }, 300),
    []
  );

  // Handle drawing number selection
  const handleDrawingNumberChange = (drawing: DrawingNumber | null) => {
    setSelectedDrawing(drawing);

    if (drawing) {
      // Pre-fill fields if they exist
      setValue("lnItemCode", drawing.lnItemCode || "");
      setValue("nomenclature", drawing.nomenclature || "");
      setValue("rackLocation", drawing.location || "");
      const normComponentType = (drawing.componentType || "").toUpperCase();
      const validComponentTypes = ["ID", "BATCH", "FIM", "SI"];
      setValue("componentType", validComponentTypes.includes(normComponentType) ? normComponentType : "");
      setValue("unitName", drawing.unitName || "");
      setValue("componentCode", drawing.componentCode || "");
      setValue("availableFor", drawing.availableFor || "");
      const topParentDrawing = drawing.parentDrawingNumbers && drawing.parentDrawingNumbers.length > 0
        ? drawing.parentDrawingNumbers[drawing.parentDrawingNumbers.length - 1]
        : "";
      setValue("assemblyNumber", topParentDrawing || "");
      if (topParentDrawing) {
        const match = allDrawings.find(
          (d) => d.drawingNumber?.toLowerCase() === topParentDrawing.toLowerCase()
        );
        setSelectedAssemblyDrawing(match || null);
        setValue("assemblyItemCode", match?.lnItemCode || "");
      } else {
        setSelectedAssemblyDrawing(null);
        setValue("assemblyItemCode", "");
      }
      setValue("hasExpiry", drawing.isExpiry ? "Yes" : "No");
      setValue("quantity", drawing.qty ?? 0);
      setValue("findNo", drawing.findNo || "");
      setValue("createdDate", drawing.createdDate || "");
      setValue("createdDate", drawing.createdDate || "");
      setValue("modifiedDate", drawing.modifiedDate || "");

      // If in edit mode, ensure we set everything needed
      fillForm(drawing);

      // Check if all fields are already filled (read-only mode)
      const hasAllFields = Boolean(
        drawing.lnItemCode &&
        drawing.nomenclature &&
        drawing.location &&
        drawing.componentType &&
        drawing.unitName
      );

      setIsReadOnly(hasAllFields && !isAdmin);
    } else {
      // Clear all fields
      reset();
      setIsReadOnly(false);
    }
  };

  // Form submission
  const onSubmit = async (data: InsertMappingsFormData) => {
    if (isEditMode && !selectedDrawing) {
      setSuccessMessage("");
      return;
    }

    try {
      let payload: any = {
        id: isEditMode && id ? Number(id) : 0,
        drawingNumberId: selectedDrawing?.id || 0,
        userId: user?.id ? parseInt(user.id) : 0,
        ModifiedDate: new Date().toISOString(),
      };

      if (!isEditMode) {
        payload = {
          ...payload,
          drawingNumber: data.drawingNumber || "",
          lnItemCode: data.lnItemCode || "",
          lnItemNomenclature: "",
          nomenclature: data.nomenclature || "",
          rackLocation: data.rackLocation || "",
          componentType: data.componentType || "",
          documentType: data.documentType || "",
          unitName: data.unitName || "",
          componentCode: data.componentCode || "",
          availableFor: data.availableFor || "",
          assemblyNumber: data.assemblyNumber || "",
          assemblyItemCode: data.assemblyItemCode || "",
          hasExpiry: data.hasExpiry || "",
          quantity: data.quantity ? Number(data.quantity) : 0,
          findNo: data.findNo || "",
          createdDate: data.createdDate || "",
          modifiedDate: data.modifiedDate || "",
          ParentDrawingNumber: data.assemblyNumber || "",
        };
      } else {
        const original = editRow || selectedDrawing || {};

        payload.availableSeriesId = original.availableSeriesId || [];

        if (data.drawingNumber !== (original.drawingNumber || "NA")) {
          payload.drawingNumber = data.drawingNumber || "";
        }
        if (data.lnItemCode !== (original.lnItemCode || "NA")) {
          payload.lnItemCode = data.lnItemCode || "";
        }
        if (data.nomenclature !== (original.nomenclature || "NA")) {
          payload.nomenclature = data.nomenclature || "";
        }
        if (data.rackLocation !== (original.location || "NA")) {
          payload.rackLocation = data.rackLocation || "";
        }
        if (data.componentType !== (original.componentType || "")) {
          payload.componentType = data.componentType || "";
        }
        if (data.documentType !== (original.documentType || "")) {
          payload.documentType = data.documentType || "";
        }
        if (data.unitName !== (original.unitName || "")) {
          payload.unitName = data.unitName || "";
        }
        if (data.componentCode !== (original.componentCode || "NA")) {
          payload.componentCode = data.componentCode || "";
        }
        if (data.availableFor !== (original.availableFor || "NA")) {
          payload.availableFor = data.availableFor || "";
        }

        const origAssembly = original.parentDrawingNumbers && original.parentDrawingNumbers.length > 0
          ? original.parentDrawingNumbers[original.parentDrawingNumbers.length - 1]
          : "NA";
        if (data.assemblyNumber !== origAssembly) {
          payload.assemblyNumber = data.assemblyNumber || "";
          payload.ParentDrawingNumber = data.assemblyNumber || "";
        }

        let origAssemblyItemCode = "NA";
        if (origAssembly && origAssembly !== "NA") {
          const match = allDrawings.find(
            (d) => d.drawingNumber?.toLowerCase() === origAssembly.toLowerCase()
          );
          origAssemblyItemCode = match?.lnItemCode || "NA";
        }
        if (data.assemblyItemCode !== origAssemblyItemCode) {
          payload.assemblyItemCode = data.assemblyItemCode || "";
        }

        const origExpiry = original.isExpiry ? "Yes" : "No";
        if (data.hasExpiry !== origExpiry) {
          payload.hasExpiry = data.hasExpiry || "";
        }

        const origQty = original.qty ?? 0;
        const formQty = data.quantity ? Number(data.quantity) : 0;
        if (formQty !== origQty) {
          payload.quantity = formQty;
        }

        if (data.findNo !== (original.findNo || "")) {
          payload.findNo = data.findNo || "";
        }

        if (data.createdDate !== (original.createdDate || "")) {
          payload.createdDate = data.createdDate || "";
        }
        if (data.modifiedDate !== (original.modifiedDate || "")) {
          payload.modifiedDate = data.modifiedDate || "";
        }
      }

      await dispatch(insertDrawingMappings(payload)).unwrap();
      await queryClient.invalidateQueries({ queryKey: ["drawingNumbers"] });
      await queryClient.invalidateQueries({ queryKey: ["allDrawingNumbers"] });
      await queryClient.refetchQueries({ queryKey: ["allDrawingNumbers"] });
      setSuccessMessage(
        isEditMode
          ? "Drawing mappings updated successfully!"
          : "Drawing mappings saved successfully!"
      );

      // Delay navigation back
      setTimeout(() => {
        navigate("/components");
      }, 1500);
    } catch (error: any) {
      console.error("Error saving/updating drawing mappings:", error);
    }
  };

  // Handle reset
  const handleReset = () => {
    reset({
      drawingNumber: "",
      lnItemCode: "",
      nomenclature: "",
      rackLocation: "",
      componentType: "",
      documentType: "",
      unitName: "",
      componentCode: "",
      availableFor: "",
      assemblyNumber: "",
      assemblyItemCode: "",
      quantity: "",
      findNo: "",
      hasExpiry: "",
      createdDate: !isEditMode ? new Date().toISOString() : "",
      modifiedDate: "",
    });
    setSelectedDrawing(null);
    setSelectedAssemblyDrawing(null);
    setIsReadOnly(false);
    setSuccessMessage("");
    dispatch(clearError());
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          maxWidth: "100%",
          mx: "auto",
        }}
      >
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

        {error && error.type === "simple_error" && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            onClose={() => dispatch(clearError())}
          >
            {error.message}
          </Alert>
        )}


        {/* Main Form */}
        <Card elevation={2} sx={{ mb: 3 }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 1 }}>
              {fromView && (
                <IconButton
                  onClick={() => navigate("/components")}
                  sx={{ color: "primary.main", p: 0 }}
                >
                  <ArrowBackIcon />
                </IconButton>
              )}
              <Typography
                variant="h6"
                sx={{ color: "primary.main", fontWeight: 600 }}
              >
                {isEditMode ? "Update Component" : "Add Component"}
              </Typography>
            </Box>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Ln item code , Drawing Number, Nomenclature*/}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  {!isEditMode ? (
                    <Controller
                      name="lnItemCode"
                      control={control}
                      rules={{ required: "LN Item Code is required" }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="LN Item Code *"
                          fullWidth
                          size="small"
                          error={!!errors.lnItemCode}
                          helperText={errors.lnItemCode?.message}
                        />
                      )}
                    />
                  ) : (
                    <Controller
                      name="lnItemCode"
                      control={control}
                      render={({ field }) => (
                        <Autocomplete
                          {...field}
                          options={drawingNumbers || []}
                          getOptionLabel={(option) =>
                            typeof option === "string"
                              ? option
                              : option.lnItemCode || ""
                          }
                          isOptionEqualToValue={(option: any, value: any) =>
                            option.id === value?.id
                          }
                          value={selectedDrawing}
                          loading={loading || loadingDrawings}
                          size="small"
                          onInputChange={(_, value) => {
                            if (value.length >= 3) {
                              debouncedDrawingSearch(value);
                            } else if (value.length === 0) {
                              debouncedDrawingSearch("");
                            }
                          }}
                          onChange={(_, newValue) => {
                            if (newValue && typeof newValue !== "string") {
                              handleDrawingNumberChange(newValue);
                            } else {
                              handleDrawingNumberChange(null);
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
                                  }}
                                >
                                  <Typography variant="body2" fontWeight="bold">
                                    {typeof option === "string"
                                      ? option
                                      : option.lnItemCode}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    DWG:{" "}
                                    {typeof option === "string"
                                      ? ""
                                      : option.drawingNumber}{" "}
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
                              label="LN Item Code *"
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <>
                                    {loading ? (
                                      <CircularProgress
                                        color="inherit"
                                        size={16}
                                      />
                                    ) : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                ),
                              }}
                              error={!!errors.lnItemCode}
                              helperText={errors.lnItemCode?.message}
                            />
                          )}
                        />
                      )}
                    />
                  )}
                </Grid>

                <Grid item xs={12} md={4}>
                  {!isEditMode ? (
                    <Controller
                      name="drawingNumber"
                      control={control}
                      rules={{ required: "Drawing Number is required" }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Drawing Number *"
                          fullWidth
                          size="small"
                          error={!!errors.drawingNumber}
                          helperText={errors.drawingNumber?.message}
                        />
                      )}
                    />
                  ) : (
                    <Controller
                      name="drawingNumber"
                      control={control}
                      rules={{ required: "Drawing Number is required" }}
                      render={({ field }) => (
                        <Autocomplete
                          fullWidth
                          size="small"
                          options={
                            drawingNumbers
                              ? drawingNumbers.filter(
                                (d) =>
                                  !selectedDrawing?.lnItemCode ||
                                  d.lnItemCode === selectedDrawing.lnItemCode
                              )
                              : []
                          }
                          loading={loading || loadingDrawings}
                          value={selectedDrawing}
                          getOptionLabel={(option: any) =>
                            typeof option === "string"
                              ? option
                              : option.drawingNumber || ""
                          }
                          isOptionEqualToValue={(option: any, value: any) =>
                            option.id === value?.id
                          }
                          onInputChange={(_, value) => {
                            if (value.length >= 3) {
                              debouncedDrawingSearch(value);
                            } else if (value.length === 0) {
                              debouncedDrawingSearch("");
                            }
                          }}
                          onChange={(_, value) => {
                            if (value && typeof value !== "string") {
                              handleDrawingNumberChange(value);
                              field.onChange(value.drawingNumber);
                            } else {
                              handleDrawingNumberChange(null);
                              field.onChange("");
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
                              label="Drawing Number *"
                              fullWidth
                              error={!!errors.drawingNumber}
                              helperText={errors.drawingNumber?.message || ""}
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <>
                                    {loading ||
                                      (loadingDrawings && (
                                        <CircularProgress
                                          color="inherit"
                                          size={16}
                                        />
                                      ))}
                                    {params.InputProps.endAdornment}
                                  </>
                                ),
                              }}
                            />
                          )}
                        />
                      )}
                    />
                  )}
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="nomenclature"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Nomenclature"
                        fullWidth
                        size="small"
                      //disabled={!selectedDrawing}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* component type, component code, available for */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="componentType"
                    control={control}
                    render={({ field }) => (
                      <FormControl
                        fullWidth
                        size="small"
                      //disabled={!selectedDrawing}
                      >
                        <InputLabel>Component Type</InputLabel>
                        <Select {...field} label="Component Type">
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          <MenuItem value="ID">ID</MenuItem>
                          <MenuItem value="BATCH">BATCH</MenuItem>
                          <MenuItem value="FIM">FIM</MenuItem>
                          <MenuItem value="SI">SI</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="componentCode"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Component Code"
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="availableFor"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Available For"
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Fields Row 3: Document Type, assembly number, assembly item code */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="documentType"
                    control={control}
                    render={({ field }) => (
                      <FormControl
                        fullWidth
                        size="small"
                      >
                        <InputLabel>Document Type</InputLabel>
                        <Select {...field} label="Document Type">
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          <MenuItem value="IR">IR</MenuItem>
                          <MenuItem value="MSN">MSN</MenuItem>
                          <MenuItem value="Both">Both</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="assemblyNumber"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        {...field}
                        options={assemblyDrawingNumbers || []}
                        getOptionLabel={(option) => {
                          if (typeof option === "string") return option;
                          return option.drawingNumber || "";
                        }}
                        value={selectedAssemblyDrawing}
                        loading={loadingAssemblyDrawings}
                        onInputChange={(_, newInputValue) => {
                          if (newInputValue.length >= 3) {
                            debouncedAssemblySearch(newInputValue);
                          } else if (newInputValue.length === 0) {
                            debouncedAssemblySearch("");
                          }
                        }}
                        onChange={(_, newValue) => {
                          if (newValue && typeof newValue !== "string") {
                            handleAssemblyNumberChange(newValue);
                            field.onChange(newValue.drawingNumber);
                          } else {
                            handleAssemblyNumberChange(null);
                            field.onChange("");
                          }
                        }}
                        isOptionEqualToValue={(option, value) => option.id === value?.id}
                        renderOption={(props, option) => {
                          const { key, ...optionProps } = props;
                          return (
                            <li {...optionProps} key={key}>
                              <Box sx={{ display: "flex", flexDirection: "column", py: 0.5 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {typeof option === "string" ? option : option.drawingNumber}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  LN: {typeof option === "string" ? "" : option.lnItemCode}
                                  {option.nomenclature ? ` | ${option.nomenclature}` : ""}
                                </Typography>
                              </Box>
                            </li>
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Assembly Number"
                            fullWidth
                            size="small"
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {loadingAssemblyDrawings ? (
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
                    name="assemblyItemCode"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        {...field}
                        options={assemblyDrawingNumbers || []}
                        getOptionLabel={(option) => {
                          if (typeof option === "string") return option;
                          return option.lnItemCode || "";
                        }}
                        value={selectedAssemblyDrawing}
                        loading={loadingAssemblyDrawings}
                        onInputChange={(_, newInputValue) => {
                          if (newInputValue.length >= 3) {
                            debouncedAssemblySearch(newInputValue);
                          } else if (newInputValue.length === 0) {
                            debouncedAssemblySearch("");
                          }
                        }}
                        onChange={(_, newValue) => {
                          if (newValue && typeof newValue !== "string") {
                            handleAssemblyNumberChange(newValue);
                            field.onChange(newValue.lnItemCode);
                          } else {
                            handleAssemblyNumberChange(null);
                            field.onChange("");
                          }
                        }}
                        isOptionEqualToValue={(option, value) => option.id === value?.id}
                        renderOption={(props, option) => {
                          const { key, ...optionProps } = props;
                          return (
                            <li {...optionProps} key={key}>
                              <Box sx={{ display: "flex", flexDirection: "column", py: 0.5 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {typeof option === "string" ? option : option.lnItemCode}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  DWG: {typeof option === "string" ? "" : option.drawingNumber}
                                  {option.nomenclature ? ` | ${option.nomenclature}` : ""}
                                </Typography>
                              </Box>
                            </li>
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Assembly Item Code"
                            fullWidth
                            size="small"
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {loadingAssemblyDrawings ? (
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

              {/* Fields Row 4: Rack Location, Unit, Has Expiry */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="rackLocation"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Rack Location"
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="unitName"
                    control={control}
                    render={({ field }) => (
                      <FormControl
                        fullWidth
                        size="small"
                      >
                        <InputLabel>Unit</InputLabel>
                        <Select {...field} label="Unit">
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {units.map((unit) => (
                            <MenuItem key={unit.id} value={unit.unitName}>
                              {unit.unitName}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="hasExpiry"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Has Expiry"
                        fullWidth
                        size="small"
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Fields Row 5: Quantity, Find No (Add mode only), Created Date, Modified Date (Edit mode only) */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {!isEditMode && (
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="quantity"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Quantity"
                          type="number"
                          fullWidth
                          size="small"
                        />
                      )}
                    />
                  </Grid>
                )}
                {!isEditMode && (
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="findNo"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Position No"
                          fullWidth
                          size="small"
                        />
                      )}
                    />
                  </Grid>
                )}
                <Grid item xs={12} md={4}>
                  <Controller
                    name="createdDate"
                    control={control}
                    render={({ field }) => (
                      <DateTimePicker
                        label="Created Date"
                        value={field.value ? new Date(field.value) : null}
                        onChange={(newValue) => {
                          if (newValue) {
                            const now = new Date();
                            const dateWithCurrentTime = new Date(newValue);
                            dateWithCurrentTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
                            field.onChange(dateWithCurrentTime.toISOString());
                          } else {
                            field.onChange("");
                          }
                        }}
                        slotProps={{
                          textField: { fullWidth: true, size: "small" },
                        }}
                      />
                    )}
                  />
                </Grid>
                {isEditMode && (
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="modifiedDate"
                      control={control}
                      render={({ field }) => (
                        <DateTimePicker
                          label="Modified Date"
                          value={field.value ? new Date(field.value) : null}
                          onChange={(newValue) => {
                            if (newValue) {
                              const now = new Date();
                              const dateWithCurrentTime = new Date(newValue);
                              dateWithCurrentTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
                              field.onChange(dateWithCurrentTime.toISOString());
                            } else {
                              field.onChange("");
                            }
                          }}
                          slotProps={{
                            textField: { fullWidth: true, size: "small" },
                          }}
                        />
                      )}
                    />
                  </Grid>
                )}
              </Grid>

              {/* Fields Row 6: Modified Date (Add mode only) */}
              {!isEditMode && (
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="modifiedDate"
                      control={control}
                      render={({ field }) => (
                        <DateTimePicker
                          label="Modified Date"
                          value={field.value ? new Date(field.value) : null}
                          onChange={(newValue) => {
                            if (newValue) {
                              const now = new Date();
                              const dateWithCurrentTime = new Date(newValue);
                              dateWithCurrentTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
                              field.onChange(dateWithCurrentTime.toISOString());
                            } else {
                              field.onChange("");
                            }
                          }}
                          slotProps={{
                            textField: { fullWidth: true, size: "small" },
                          }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              )}
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
                  type="button"
                  variant="outlined"
                  size="small"
                  onClick={handleReset}
                  startIcon={<RefreshIcon />}
                  sx={{ minWidth: 90, height: 32 }}
                >
                  Reset
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  size="small"
                  disabled={loading || (isEditMode && !selectedDrawing)}
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <SaveIcon />
                    )
                  }
                  sx={{ minWidth: 100, height: 32 }}
                >
                  {loading
                    ? "Saving..."
                    : isEditMode
                      ? "Update"
                      : "Save "}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
}
