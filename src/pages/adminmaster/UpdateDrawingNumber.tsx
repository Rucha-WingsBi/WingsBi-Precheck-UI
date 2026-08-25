import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
  IconButton,
  Autocomplete,
} from "@mui/material";
import { Save as SaveIcon, Refresh as RefreshIcon, ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import type { RootState } from "../../store/store";
import type { DrawingNumber } from "../../types";
import { useUnits, useAllDrawingNumbers, useProductionSeries } from "../../hooks/useMasterData";
import { useDebounce } from "../../hooks/useDebounce";
import api from "../../services/api";

const normalizeComponentType = (type?: string | null) => {
  if (!type) return "";
  const upper = type.toUpperCase().trim();
  if (upper === "BATCH" || upper === "ID" || upper === "FIM" || upper === "SI") {
    return upper;
  }
  return type;
};

interface UpdateDrawingNumberFormData {
  drawingNumberId: number;
  drawingNumber: string;
  lnItemCode: string;
  lnItemNomenclature: string;
  nomenclature: string;
  rackLocation: string;
  componentType: string;
  documentType: string;
  unitName: string;
  assemblyNumber: string;
  assemblyItemCode: string;
  productionSeries: string;
}

export default function UpdateDrawingNumber() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const editRow = location.state as DrawingNumber | null;
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");

  const { data: units = [] } = useUnits();
  const { data: allDrawings = [] } = useAllDrawingNumbers();
  const { data: productionSeriesList = [] } = useProductionSeries();
  const user = useSelector((state: RootState) => state.auth.user);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<UpdateDrawingNumberFormData>({
    defaultValues: {
      drawingNumberId: 0,
      drawingNumber: "",
      lnItemCode: "",
      lnItemNomenclature: "",
      nomenclature: "",
      rackLocation: "",
      componentType: "",
      documentType: "",
      unitName: "",
      assemblyNumber: "",
      assemblyItemCode: "",
      productionSeries: "",
    },
  });

  // Get lists of unique options for Autocomplete components
  const drawingOptions = useMemo(() => {
    const seen = new Set<string>();
    return allDrawings.filter((d) => {
      if (!d.drawingNumber) return false;
      const key = d.drawingNumber.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [allDrawings]);

  const lnOptions = useMemo(() => {
    const seen = new Set<string>();
    return allDrawings.filter((d) => {
      if (!d.lnItemCode) return false;
      const key = d.lnItemCode.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [allDrawings]);

  // Debounced search states and logic
  const [drawingSearch, setDrawingSearch] = useState("");
  const debouncedDrawingSearch = useDebounce(drawingSearch, 300);

  const [lnSearch, setLnSearch] = useState("");
  const debouncedLnSearch = useDebounce(lnSearch, 300);

  const [assemblySearch, setAssemblySearch] = useState("");
  const debouncedAssemblySearch = useDebounce(assemblySearch, 300);

  const [assemblyItemSearch, setAssemblyItemSearch] = useState("");
  const debouncedAssemblyItemSearch = useDebounce(assemblyItemSearch, 300);

  const filteredDrawingOptions = useMemo(() => {
    const query = debouncedDrawingSearch.toLowerCase().trim();
    if (!query) return drawingOptions.slice(0, 100);
    return drawingOptions
      .filter((d) =>
        (d.drawingNumber && d.drawingNumber.toLowerCase().includes(query)) ||
        (d.lnItemCode && d.lnItemCode.toLowerCase().includes(query))
      )
      .slice(0, 100);
  }, [drawingOptions, debouncedDrawingSearch]);

  const filteredLnOptions = useMemo(() => {
    const query = debouncedLnSearch.toLowerCase().trim();
    if (!query) return lnOptions.slice(0, 100);
    return lnOptions
      .filter((d) =>
        (d.drawingNumber && d.drawingNumber.toLowerCase().includes(query)) ||
        (d.lnItemCode && d.lnItemCode.toLowerCase().includes(query))
      )
      .slice(0, 100);
  }, [lnOptions, debouncedLnSearch]);

  const filteredAssemblyOptions = useMemo(() => {
    const query = debouncedAssemblySearch.toLowerCase().trim();
    if (!query) return drawingOptions.slice(0, 100);
    return drawingOptions
      .filter((d) =>
        (d.drawingNumber && d.drawingNumber.toLowerCase().includes(query)) ||
        (d.lnItemCode && d.lnItemCode.toLowerCase().includes(query))
      )
      .slice(0, 100);
  }, [drawingOptions, debouncedAssemblySearch]);

  const filteredAssemblyItemOptions = useMemo(() => {
    const query = debouncedAssemblyItemSearch.toLowerCase().trim();
    if (!query) return lnOptions.slice(0, 100);
    return lnOptions
      .filter((d) =>
        (d.drawingNumber && d.drawingNumber.toLowerCase().includes(query)) ||
        (d.lnItemCode && d.lnItemCode.toLowerCase().includes(query))
      )
      .slice(0, 100);
  }, [lnOptions, debouncedAssemblyItemSearch]);

  // Pre-fill fields if in edit mode
  useEffect(() => {
    if (editRow) {
      setValue("drawingNumberId", editRow.id || 0);
      setValue("drawingNumber", editRow.drawingNumber || "");
      setValue("lnItemCode", editRow.lnItemCode || "");
      setValue("lnItemNomenclature", editRow.nomenclature || "");
      setValue("nomenclature", editRow.nomenclature || "");
      setValue("rackLocation", editRow.location || "");
      setValue("componentType", normalizeComponentType(editRow.componentType));
      setValue("documentType", editRow.availableFor || "");
      setValue("unitName", editRow.unitName || "");
      setValue("assemblyNumber", editRow.assemblyNumber || "");
      setValue("productionSeries", (editRow.availableSeries && editRow.availableSeries[0]) || "");

      if (editRow.assemblyNumber) {
        const match = allDrawings.find(
          (d) => d.drawingNumber?.toLowerCase() === editRow.assemblyNumber?.toLowerCase()
        );
        setValue("assemblyItemCode", match?.lnItemCode || "");
      }
    } else if (isEditMode && id) {
      const fetchDrawing = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/api/Common/GetDrawingNumberById/${id}`);
          if (response.data) {
            const d = response.data;
            setValue("drawingNumberId", d.id || 0);
            setValue("drawingNumber", d.drawingNumber || "");
            setValue("lnItemCode", d.lnItemCode || "");
            setValue("lnItemNomenclature", d.nomenclature || "");
            setValue("nomenclature", d.nomenclature || "");
            setValue("rackLocation", d.location || "");
            setValue("componentType", normalizeComponentType(d.componentType));
            setValue("documentType", d.availableFor || "");
            setValue("unitName", d.unitName || "");
            setValue("assemblyNumber", d.assemblyNumber || "");
            setValue("productionSeries", (d.availableSeries && d.availableSeries[0]) || "");

            if (d.assemblyNumber && allDrawings.length > 0) {
              const match = allDrawings.find(
                (dwg) => dwg.drawingNumber?.toLowerCase() === d.assemblyNumber?.toLowerCase()
              );
              setValue("assemblyItemCode", match?.lnItemCode || "");
            }
          }
        } catch (err: any) {
          console.error("Error fetching drawing mapping:", err);
          setError("Failed to fetch drawing mappings");
        } finally {
          setLoading(false);
        }
      };
      fetchDrawing();
    }
  }, [editRow, id, isEditMode, setValue, allDrawings]);

  // Handle auto-fill when Drawing Number changes
  const handleDrawingNumberChange = (newValue: DrawingNumber | null) => {
    if (newValue) {
      setValue("drawingNumberId", newValue.id || 0);
      setValue("drawingNumber", newValue.drawingNumber || "");
      setValue("lnItemCode", newValue.lnItemCode || "");
      setValue("nomenclature", newValue.nomenclature || "");
      setValue("rackLocation", newValue.location || "");
      setValue("componentType", normalizeComponentType(newValue.componentType));
      setValue("unitName", newValue.unitName || "");
    } else {
      setValue("drawingNumberId", 0);
      setValue("drawingNumber", "");
      setValue("lnItemCode", "");
      setValue("nomenclature", "");
      setValue("rackLocation", "");
      setValue("componentType", "");
      setValue("unitName", "");
    }
  };

  // Handle auto-fill when Assembly Number changes
  const handleAssemblyNumberChange = (newValue: DrawingNumber | null) => {
    if (newValue) {
      setValue("assemblyNumber", newValue.drawingNumber || "");
      setValue("assemblyItemCode", newValue.lnItemCode || "");
    } else {
      setValue("assemblyNumber", "");
      setValue("assemblyItemCode", "");
    }
  };

  const onSubmit = async (data: UpdateDrawingNumberFormData) => {
    setError(null);
    setSuccessMessage("");
    setLoading(true);
    try {
      const rawPayload = {
        id: isEditMode && id ? Number(id) : 0,
        drawingNumberId: Number(data.drawingNumberId) || Number(id) || 0,
        drawingNumber: data.drawingNumber || "",
        lnItemCode: data.lnItemCode || "",
        lnItemNomenclature: data.lnItemNomenclature || "",
        nomenclature: data.nomenclature || "",
        rackLocation: data.rackLocation || "",
        componentType: data.componentType || "",
        documentType: data.documentType || "",
        unitName: data.unitName || "",
        assemblyNumber: data.assemblyNumber || "",
        assemblyItemCode: data.assemblyItemCode || "",
        ParentDrawingNumber: data.assemblyNumber || "",
        productionSeries: data.productionSeries || "",
        createdBy: user?.id ? parseInt(user.id) : 0,
        userId: user?.id ? parseInt(user.id) : 0,
        ModifiedDate: new Date().toISOString(),
        availableSeriesId: editRow?.availableSeriesId || [],
      };

      const payload = Object.fromEntries(
        Object.entries(rawPayload).filter(([_, v]) => v !== "" && v !== null && v !== undefined)
      );

      await api.post("/api/DrawingNumber/InsertDrawingMappings", payload);
      queryClient.invalidateQueries({ queryKey: ["drawingNumbers"] });
      queryClient.invalidateQueries({ queryKey: ["allDrawingNumbers"] });

      setSuccessMessage(
        isEditMode
          ? "Drawing mappings updated successfully!"
          : "Drawing mappings saved successfully!"
      );

      setTimeout(() => {
        navigate("/components/assembly");
      }, 1500);
    } catch (err: any) {
      console.error("Error saving drawing mapping:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to save drawing mapping");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (editRow) {
      let resolvedAssemblyItemCode = "";
      if (editRow.assemblyNumber) {
        const match = allDrawings.find(
          (d) => d.drawingNumber?.toLowerCase() === editRow.assemblyNumber?.toLowerCase()
        );
        resolvedAssemblyItemCode = match?.lnItemCode || "";
      }

      reset({
        drawingNumberId: editRow.id || 0,
        drawingNumber: editRow.drawingNumber || "",
        lnItemCode: editRow.lnItemCode || "",
        lnItemNomenclature: editRow.nomenclature || "",
        nomenclature: editRow.nomenclature || "",
        rackLocation: editRow.location || "",
        componentType: normalizeComponentType(editRow.componentType),
        documentType: editRow.availableFor || "",
        unitName: editRow.unitName || "",
        assemblyNumber: editRow.assemblyNumber || "",
        assemblyItemCode: resolvedAssemblyItemCode,
        productionSeries: (editRow.availableSeries && editRow.availableSeries[0]) || "",
      });
    } else {
      reset();
    }
    setError(null);
    setSuccessMessage("");
  };

  // Watch fields to sync selection
  const watchedDrawingNumber = watch("drawingNumber");
  const watchedLnItemCode = watch("lnItemCode");
  const watchedAssemblyNumber = watch("assemblyNumber");
  const watchedAssemblyItemCode = watch("assemblyItemCode");

  const selectedDrawingObj = useMemo(() => {
    return allDrawings.find((d) => d.drawingNumber === watchedDrawingNumber) || null;
  }, [allDrawings, watchedDrawingNumber]);

  const selectedLnObj = useMemo(() => {
    return allDrawings.find((d) => d.lnItemCode === watchedLnItemCode) || null;
  }, [allDrawings, watchedLnItemCode]);

  const selectedAssemblyObj = useMemo(() => {
    return allDrawings.find((d) => d.drawingNumber === watchedAssemblyNumber) || null;
  }, [allDrawings, watchedAssemblyNumber]);

  const selectedAssemblyItemObj = useMemo(() => {
    return allDrawings.find((d) => d.lnItemCode === watchedAssemblyItemCode) || null;
  }, [allDrawings, watchedAssemblyItemCode]);

  return (
    <Box sx={{ p: 3, maxWidth: "100%", mx: "auto" }}>
      {/* Back button and title */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 1 }}>
        <IconButton
          onClick={() => navigate("/components/assembly")}
          sx={{ color: "#A8005A" }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#A8005A" }}>
          {isEditMode ? "Update Drawing Number" : "Add Drawing Number"}
        </Typography>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card elevation={2}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {loading && !isEditMode ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={3}>
                {/* Drawing Number Dropdown */}
                <Grid item xs={12} md={4}>
                  <Controller
                    name="drawingNumber"
                    control={control}
                    rules={{ required: "Drawing Number is required" }}
                    render={({ field }) => (
                      <Autocomplete
                        {...field}
                        options={filteredDrawingOptions}
                        getOptionLabel={(option) => {
                          if (typeof option === "string") return option;
                          return option.drawingNumber || "";
                        }}
                        value={selectedDrawingObj}
                        onInputChange={(_, newInputValue) => {
                          setDrawingSearch(newInputValue);
                        }}
                        onChange={(_, newValue) => {
                          handleDrawingNumberChange(newValue);
                          field.onChange(newValue ? newValue.drawingNumber : "");
                        }}
                        isOptionEqualToValue={(option, value) => option.drawingNumber === value?.drawingNumber}
                        filterOptions={(x) => x}
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
                            label="Drawing Number *"
                            fullWidth
                            size="small"
                            error={!!errors.drawingNumber}
                            helperText={errors.drawingNumber?.message}
                          />
                        )}
                      />
                    )}
                  />
                </Grid>

                {/* LN Item Code Dropdown */}
                <Grid item xs={12} md={4}>
                  <Controller
                    name="lnItemCode"
                    control={control}
                    rules={{ required: "LN Item Code is required" }}
                    render={({ field }) => (
                      <Autocomplete
                        {...field}
                        options={filteredLnOptions}
                        getOptionLabel={(option) => {
                          if (typeof option === "string") return option;
                          return option.lnItemCode || "";
                        }}
                        value={selectedLnObj}
                        onInputChange={(_, newInputValue) => {
                          setLnSearch(newInputValue);
                        }}
                        onChange={(_, newValue) => {
                          handleDrawingNumberChange(newValue);
                          field.onChange(newValue ? newValue.lnItemCode : "");
                        }}
                        isOptionEqualToValue={(option, value) => option.lnItemCode === value?.lnItemCode}
                        filterOptions={(x) => x}
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
                            label="LN Item Code *"
                            fullWidth
                            size="small"
                            error={!!errors.lnItemCode}
                            helperText={errors.lnItemCode?.message}
                          />
                        )}
                      />
                    )}
                  />
                </Grid>

                {/* Nomenclature */}
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
                      />
                    )}
                  />
                </Grid>

                {/* Component Type Dropdown */}
                <Grid item xs={12} md={4}>
                  <Controller
                    name="componentType"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth size="small">
                        <InputLabel>Component Type</InputLabel>
                        <Select {...field} label="Component Type">
                          <MenuItem value=""><em>None</em></MenuItem>
                          <MenuItem value="ID">ID</MenuItem>
                          <MenuItem value="BATCH">BATCH</MenuItem>
                          <MenuItem value="FIM">FIM</MenuItem>
                          <MenuItem value="SI">SI</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                {/* Assembly Number Dropdown */}
                <Grid item xs={12} md={4}>
                  <Controller
                    name="assemblyNumber"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        {...field}
                        options={filteredAssemblyOptions}
                        getOptionLabel={(option) => {
                          if (typeof option === "string") return option;
                          return option.drawingNumber || "";
                        }}
                        value={selectedAssemblyObj}
                        onInputChange={(_, newInputValue) => {
                          setAssemblySearch(newInputValue);
                        }}
                        onChange={(_, newValue) => {
                          handleAssemblyNumberChange(newValue);
                          field.onChange(newValue ? newValue.drawingNumber : "");
                        }}
                        isOptionEqualToValue={(option, value) => option.drawingNumber === value?.drawingNumber}
                        filterOptions={(x) => x}
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
                          />
                        )}
                      />
                    )}
                  />
                </Grid>

                {/* Assembly Item Code Dropdown */}
                <Grid item xs={12} md={4}>
                  <Controller
                    name="assemblyItemCode"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        {...field}
                        options={filteredAssemblyItemOptions}
                        getOptionLabel={(option) => {
                          if (typeof option === "string") return option;
                          return option.lnItemCode || "";
                        }}
                        value={selectedAssemblyItemObj}
                        onInputChange={(_, newInputValue) => {
                          setAssemblyItemSearch(newInputValue);
                        }}
                        onChange={(_, newValue) => {
                          handleAssemblyNumberChange(newValue);
                          field.onChange(newValue ? newValue.lnItemCode : "");
                        }}
                        isOptionEqualToValue={(option, value) => option.lnItemCode === value?.lnItemCode}
                        filterOptions={(x) => x}
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
                          />
                        )}
                      />
                    )}
                  />
                </Grid>

                {/* Production Series Dropdown */}
                <Grid item xs={12} md={4}>
                  <Controller
                    name="productionSeries"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        options={productionSeriesList}
                        getOptionLabel={(option) => {
                          if (typeof option === "string") return option;
                          return option.productionSeries || "";
                        }}
                        value={productionSeriesList.find((series) => series.productionSeries === field.value) || null}
                        onChange={(_, newValue) => {
                          field.onChange(newValue ? newValue.productionSeries : "");
                        }}
                        isOptionEqualToValue={(option, value) => option.productionSeries === value?.productionSeries}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Production Series"
                            fullWidth
                            size="small"
                          />
                        )}
                      />
                    )}
                  />
                </Grid>

                {/* Unit Name Dropdown */}
                <Grid item xs={12} md={4}>
                  <Controller
                    name="unitName"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth size="small">
                        <InputLabel>Unit Name</InputLabel>
                        <Select {...field} label="Unit Name">
                          <MenuItem value=""><em>None</em></MenuItem>
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

                {/* Rack Location */}
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

                {/* Document Type Dropdown */}
                <Grid item xs={12} md={4}>
                  <Controller
                    name="documentType"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth size="small">
                        <InputLabel>Document Type</InputLabel>
                        <Select {...field} label="Document Type">
                          <MenuItem value=""><em>None</em></MenuItem>
                          <MenuItem value="IR">IR</MenuItem>
                          <MenuItem value="MSN">MSN</MenuItem>
                          <MenuItem value="Both">Both</MenuItem>
                        </Select>
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
                  pt: 3,
                  mt: 3,
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleReset}
                  startIcon={<RefreshIcon />}
                  sx={{ minWidth: 120, height: 40 }}
                >
                  Reset
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  sx={{ minWidth: 120, height: 40, bgcolor: "#A8005A", "&:hover": { bgcolor: "#800045" } }}
                >
                  {loading ? "Saving..." : "Save"}
                </Button>
              </Box>
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
