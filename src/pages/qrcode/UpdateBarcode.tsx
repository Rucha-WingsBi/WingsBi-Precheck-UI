import React, { useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  IconButton,
  Autocomplete,
  Snackbar,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store/store";
import { updateQRCodeDetails } from "../../store/slices/qrcodeSlice";
import {
  useProductionSeries,
  useAllDrawingNumbers,
  useMSNNumbers,
  useComponentTypes,
  useIRNumbers,
  useShapes,
  useUnits,
} from "../../hooks/useMasterData";
import {
  usePONumbers,
  usePODetails,
  type ProductionOrderMaster,
} from "../../hooks/usePONumbers";
import { useDebounce } from "../../hooks/useDebounce";

import debounce from "lodash/debounce";

interface BarcodeDetailsFormData {
  qrCodeNumber?: string;
  productionSeries?: string;
  lnItemCode?: string;
  drawingNumber?: string;
  nomenclature?: string;
  componentType?: string;
  consumedInDrawing?: string;
  idNumber?: string;
  qrCodeStatus?: string;
  irNumber?: string;
  msnNumber?: string;
  mrirNumber?: string;
  quantity?: number | string;
  productionOrderNumber?: string;
  purchaseOrderNumber?: string;
  desposition?: string;
  remarks?: string;
  users?: string;
  createdDate?: string;
  productionSeriesId?: number;
  drawingNumberId?: number;
  nomenclatureId?: number;
  componentTypeId?: number;
  irNumberId?: number;
  msnNumberId?: number;
  shapeId?: number | null;
  unitId?: number | null;
  size?: string;
  heatLotBatch?: string;
}

const UpdateBarcode: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.qrcode);
  const user = useSelector((state: RootState) => state.auth.user);

  const initialData = (location.state || {}) as BarcodeDetailsFormData;
  console.log("initialData", initialData);

  const [formData, setFormData] =
    React.useState<BarcodeDetailsFormData>(() => {
      const data = { ...initialData };
      if (!data.heatLotBatch) {
        data.heatLotBatch =
          (initialData as any).heatLotBatch ||
          (initialData as any).heatLotNumber ||
          (initialData as any).heatLotBatchNo ||
          (initialData as any).htLotNo ||
          "";
      }
      if (!data.shapeId) {
        const shapeVal = (initialData as any).shape || (initialData as any).shapes;
        if (shapeVal) {
          data.shapeId = Number(shapeVal) || null;
        }
      }
      return data;
    });
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState("");
  const [snackbarSeverity, setSnackbarSeverity] = React.useState<
    "success" | "error"
  >("success");

  // Master Data Hooks
  const { data: productionSeriesList = [] } = useProductionSeries();
  const { data: allDrawingNumbers = [], isLoading: isLnSearchLoading } =
    useAllDrawingNumbers();
  const [poSearchText, setPOSearchText] = React.useState("");
  const debouncedPOSearch = useDebounce(poSearchText, 500);
  const { data: poNumbers = [] } = usePONumbers(debouncedPOSearch);
  const { data: shapesList = [] } = useShapes();
  const { data: unitsList = [] } = useUnits();

  // Fetch PO details if productionOrderNumber exists in initial data
  const { data: initialPODetails } = usePODetails(
    initialData.productionOrderNumber,
  );
  const { data: componentTypes = [], isLoading: componentTypesLoading } =
    useComponentTypes();

  // MSN Number search state
  const [msnSearchText, setMsnSearchText] = React.useState("");
  const debouncedMSNSearch = React.useMemo(
    () =>
      debounce((searchValue: string) => {
        setMsnSearchText(searchValue);
      }, 300),
    [],
  );
  const { data: msnNumbers = [], isLoading: msnLoading } =
    useMSNNumbers(msnSearchText);

  // IR Number search state
  const [irSearchText, setIrSearchText] = React.useState("");
  const debouncedIRSearch = React.useMemo(
    () =>
      debounce((searchValue: string) => {
        setIrSearchText(searchValue);
      }, 300),
    [],
  );
  const { data: irNumbers = [], isLoading: irLoading } =
    useIRNumbers(irSearchText);

  // Selected Objects State
  const [selectedProductionSeries, setSelectedProductionSeries] =
    React.useState<any>(null);
  const [selectedDrawing, setSelectedDrawing] = React.useState<any>(null);
  const [selectedPO, setSelectedPO] =
    React.useState<ProductionOrderMaster | null>(null);
  const [selectedMSNNumber, setSelectedMSNNumber] = React.useState<any>(null);
  const [selectedIRNumber, setSelectedIRNumber] = React.useState<any>(null);
  const [selectedComponentType, setSelectedComponentType] =
    React.useState<string>("");
  const [selectedShape, setSelectedShape] = React.useState<any>(null);
  const [selectedUnit, setSelectedUnit] = React.useState<any>(null);

  // Initialize selected objects from initialData
  useEffect(() => {
    if (initialData.productionSeriesId && productionSeriesList.length > 0) {
      const match = productionSeriesList.find(
        (ps) => ps.id === initialData.productionSeriesId,
      );
      if (match) setSelectedProductionSeries(match);
      else if (initialData.productionSeries) {
        setSelectedProductionSeries({
          id: initialData.productionSeriesId,
          productionSeries: initialData.productionSeries,
        });
      }
    }

    if (initialData.drawingNumberId && allDrawingNumbers.length > 0) {
      const match = allDrawingNumbers.find(
        (d) => d.id === initialData.drawingNumberId,
      );
      if (match) setSelectedDrawing(match);
      else if (initialData.drawingNumber) {
        setSelectedDrawing({
          id: initialData.drawingNumberId,
          drawingNumber: initialData.drawingNumber,
          lnItemCode: initialData.lnItemCode,
          nomenclature: initialData.nomenclature,
          componentType: initialData.componentType,
          componentTypeId: initialData.componentTypeId,
          nomenclatureId: initialData.nomenclatureId,
        });
      }
    }
  }, [initialData, productionSeriesList, allDrawingNumbers]);

  // Initialize PO from initialPODetails
  useEffect(() => {
    if (initialPODetails && !selectedPO) {
      setSelectedPO(initialPODetails);
    }
  }, [initialPODetails, selectedPO]);

  // Initialize MSN Number from initialData
  useEffect(() => {
    if (initialData.msnNumber && msnNumbers.length > 0 && !selectedMSNNumber) {
      const matchingMSN = msnNumbers.find(
        (msn: any) => msn.msnNumber === initialData.msnNumber,
      );
      if (matchingMSN) {
        setSelectedMSNNumber(matchingMSN);
      }
    }
  }, [initialData.msnNumber, msnNumbers, selectedMSNNumber]);

  // Initialize IR Number from initialData
  useEffect(() => {
    if (initialData.irNumber && irNumbers.length > 0 && !selectedIRNumber) {
      const matchingIR = irNumbers.find(
        (ir: any) => ir.irNumber === initialData.irNumber,
      );
      if (matchingIR) {
        setSelectedIRNumber(matchingIR);
      }
    } else if (initialData.irNumber && !selectedIRNumber) {
      setSelectedIRNumber({
        id: initialData.irNumberId || 0,
        irNumber: initialData.irNumber,
      });
    }
  }, [initialData.irNumber, irNumbers, selectedIRNumber]);

  // Initialize Component Type from initialData
  useEffect(() => {
    if (
      initialData.componentType &&
      componentTypes.length > 0 &&
      !selectedComponentType
    ) {
      setSelectedComponentType(initialData.componentType);

      const matchedType = componentTypes.find(
        (type: any) => (type.componentType || type.name || type) === initialData.componentType
      );
      if (matchedType?.id) {
        setFormData((prev) => {
          if (prev.componentTypeId === matchedType.id) return prev;
          return {
            ...prev,
            componentTypeId: matchedType.id,
          };
        });
      }
    }
  }, [initialData, componentTypes, selectedComponentType]);

  // Initialize Selected Shape from initialData
  useEffect(() => {
    if (shapesList.length > 0 && !selectedShape) {
      const shapeVal = initialData.shapeId || (initialData as any).shape || (initialData as any).shapes;
      if (shapeVal) {
        // Try to match by ID
        let match = shapesList.find(
          (s) =>
            s.id === Number(shapeVal) ||
            s.id.toString() === shapeVal.toString()
        );
        
        // If not matched by ID, try to match by materialName (string case-insensitive)
        if (!match && typeof shapeVal === "string") {
          match = shapesList.find(
            (s) => s.materialName?.toLowerCase() === shapeVal.toLowerCase()
          );
        }

        if (match) {
          setSelectedShape(match);
          setFormData((prev) => {
            if (prev.shapeId === match.id) return prev;
            return {
              ...prev,
              shapeId: match.id,
            };
          });
        } else if (typeof shapeVal === "string") {
          setSelectedShape(shapeVal);
        }
      }
    }
  }, [initialData.shapeId, initialData, shapesList, selectedShape]);

  // Initialize Selected Unit from initialData
  useEffect(() => {
    if (unitsList.length > 0 && !selectedUnit) {
      if (initialData.unitId) {
        const match = unitsList.find((u) => u.id === initialData.unitId);
        if (match) setSelectedUnit(match);
      } else if (initialData.unitId === undefined && (initialData as any).unitName) {
        const match = unitsList.find((u) => u.unitName === (initialData as any).unitName);
        if (match) setSelectedUnit(match);
      }
    }
  }, [initialData.unitId, initialData, unitsList, selectedUnit]);

  // If user refreshes the page and state is lost, redirect back to view page
  useEffect(() => {
    if (!location.state && !formData.qrCodeNumber) {
      navigate("/qrcode/view");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCancel = () => {
    const returnFilters = (location.state as any)?.returnFilters;
    navigate("/qrcode/view", { state: { returnFilters } });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.qrCodeNumber) {
      setSnackbarMessage("QR Code Number is required");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    try {
      // Prepare payload matching API structure, only sending updated fields
      const updatePayload: any = {
        qrCodeNumber: formData.qrCodeNumber,
        modifiedBy: user?.id ? Number(user.id) : 0,
      };

      const newDrawingNumberId = selectedDrawing?.id || formData.drawingNumberId || 0;
      const initialDrawingNumberId = initialData.drawingNumberId || 0;
      if (newDrawingNumberId !== initialDrawingNumberId) {
        updatePayload.drawingNumberId = newDrawingNumberId;
      }

      const newProductionSeriesId = selectedProductionSeries?.id || formData.productionSeriesId || 0;
      const initialProductionSeriesId = initialData.productionSeriesId || 0;
      if (newProductionSeriesId !== initialProductionSeriesId) {
        updatePayload.productionSeriesId = newProductionSeriesId;
      }

      const newNomenclatureId = selectedDrawing?.nomenclatureId || formData.nomenclatureId || 0;
      const initialNomenclatureId = initialData.nomenclatureId || 0;
      if (newNomenclatureId !== initialNomenclatureId) {
        updatePayload.nomenclatureId = newNomenclatureId;
      }

      const newComponentTypeId = formData.componentTypeId || selectedDrawing?.componentTypeId || 0;
      const initialComponentTypeId = initialData.componentTypeId || 0;
      if (newComponentTypeId !== initialComponentTypeId) {
        updatePayload.componentTypeId = newComponentTypeId;
      }

      const newIdNumber = formData.idNumber || "";
      const initialIdNumber = initialData.idNumber || "";
      if (newIdNumber !== initialIdNumber) {
        updatePayload.idNumber = newIdNumber;
      }

      const newIrNumberId = selectedIRNumber?.id === "NA"
        ? 0
        : Number(selectedIRNumber?.id) || formData.irNumberId || 0;
      const initialIrNumberId = initialData.irNumberId || 0;
      if (newIrNumberId !== initialIrNumberId) {
        updatePayload.irNumberId = newIrNumberId;
      }

      const newMsnNumberId = selectedMSNNumber?.id || formData.msnNumberId || 0;
      const initialMsnNumberId = initialData.msnNumberId || 0;
      if (newMsnNumberId !== initialMsnNumberId) {
        updatePayload.msnNumberId = newMsnNumberId;
      }

      const newQuantity = formData.quantity ? Number(formData.quantity) : 0;
      const initialQuantity = initialData.quantity ? Number(initialData.quantity) : 0;
      if (newQuantity !== initialQuantity) {
        updatePayload.quantity = newQuantity;
      }

      const newDesposition = formData.desposition || "";
      const initialDesposition = initialData.desposition || "";
      if (newDesposition !== initialDesposition) {
        updatePayload.desposition = newDesposition;
      }

      const newMrirNumber = formData.mrirNumber || "";
      const initialMrirNumber = initialData.mrirNumber || "";
      if (newMrirNumber !== initialMrirNumber) {
        updatePayload.mrirNumber = newMrirNumber;
      }

      const newProductionOrderNumber = formData.productionOrderNumber || "";
      const initialProductionOrderNumber = initialData.productionOrderNumber || "";
      if (newProductionOrderNumber !== initialProductionOrderNumber) {
        updatePayload.productionOrderNumber = newProductionOrderNumber;
      }

      const newPurchaseOrderNumber = formData.purchaseOrderNumber || "";
      const initialPurchaseOrderNumber = initialData.purchaseOrderNumber || "";
      if (newPurchaseOrderNumber !== initialPurchaseOrderNumber) {
        updatePayload.purchaseOrderNumber = newPurchaseOrderNumber;
      }

      const newRemarks = formData.remarks || "";
      const initialRemarks = initialData.remarks || "";
      if (newRemarks !== initialRemarks) {
        updatePayload.remarks = newRemarks;
      }

      const newShapeId = selectedShape?.id || formData.shapeId || null;
      const initialShapeId =
        initialData.shapeId ||
        Number((initialData as any).shape) ||
        Number((initialData as any).shapes) ||
        null;
      if (newShapeId !== initialShapeId) {
        updatePayload.shapeId = newShapeId;
      }

      const newUnitId = selectedUnit?.id || formData.unitId || null;
      const initialUnitId = initialData.unitId || null;
      if (newUnitId !== initialUnitId) {
        updatePayload.unitId = newUnitId;
      }

      const newSize = formData.size || "";
      const initialSize = initialData.size || "";
      if (newSize !== initialSize) {
        updatePayload.size = newSize;
      }

      const newHeatLotBatch = formData.heatLotBatch || "";
      const initialHeatLotBatch =
        initialData.heatLotBatch ||
        (initialData as any).heatLotNumber ||
        (initialData as any).heatLotBatchNo ||
        (initialData as any).htLotNo ||
        "";
      if (newHeatLotBatch !== initialHeatLotBatch) {
        updatePayload.heatLotBatch = newHeatLotBatch;
      }

      await dispatch(updateQRCodeDetails(updatePayload)).unwrap();

      setSnackbarMessage("QR Code updated successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      // Navigate back to view page after 1.5 seconds
      const returnFilters = (location.state as any)?.returnFilters;
      setTimeout(() => {
        navigate("/qrcode/view", { state: { returnFilters } });
      }, 1500);
    } catch (err: any) {
      setSnackbarMessage(err || "Failed to update QR code");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleBack = () => {
    const returnFilters = (location.state as any)?.returnFilters;
    if (returnFilters) {
      navigate("/qrcode/view", { state: { returnFilters } });
    } else {
      navigate(-1);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: "100%", mx: "auto" }}>
      <Card elevation={2}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <IconButton
              onClick={handleBack}
              sx={{
                color: "primary.main",
                mr: 1,
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography
              variant="h6"
              sx={{ color: "primary.main", fontWeight: 600 }}
            >
              {id ? "Update QR Code" : "QR Code Details"}
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="QRCode ID"
                  name="qrCodeNumber"
                  value={formData.qrCodeNumber || ""}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  disabled
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Autocomplete
                  size="small"
                  options={productionSeriesList}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    return option.productionSeries || "";
                  }}
                  value={selectedProductionSeries}
                  onChange={(_, newValue) => {
                    setSelectedProductionSeries(newValue);
                    setFormData((prev) => ({
                      ...prev,
                      productionSeries: newValue?.productionSeries,
                    }));
                  }}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value?.id
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Prod Series" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Autocomplete
                  size="small"
                  options={allDrawingNumbers}
                  groupBy={(option: any) => option.lnItemCode || "No LN Code"}
                  getOptionLabel={(option: any) => {
                    if (typeof option === "string") return option;
                    return option.lnItemCode || "";
                  }}
                  value={selectedDrawing}
                  loading={isLnSearchLoading}
                  freeSolo={false}
                  onChange={(_: any, value: any) => {
                    setSelectedDrawing(value);
                    setSelectedComponentType(value?.componentType || "");
                    setFormData((prev) => ({
                      ...prev,
                      lnItemCode: value?.lnItemCode,
                      drawingNumber: value?.drawingNumber,
                      nomenclature: value?.nomenclature,
                      componentType: value?.componentType,
                      drawingNumberId: value?.id,
                      nomenclatureId: value?.nomenclatureId,
                      componentTypeId: value?.componentTypeId,
                    }));
                  }}
                  filterOptions={(options, { inputValue }) => {
                    if (!inputValue) return options.slice(0, 100);
                    const searchLower = inputValue.toLowerCase();
                    const filtered = options.filter(
                      (option: any) =>
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
                  renderOption={(props: any, option: any) => {
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
                            sx={{ fontSize: "0.85rem", color: "text.primary" }}
                          >
                            Drawing: {option.drawingNumber}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: "0.72rem" }}
                          >
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
                  renderInput={(params: any) => (
                    <TextField
                      {...params}
                      label="LN Item Code"
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
            </Grid>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={4}>
                <Autocomplete
                  size="small"
                  options={allDrawingNumbers}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    return option.drawingNumber || "";
                  }}
                  value={selectedDrawing}
                  onChange={(_: any, value: any) => {
                    setSelectedDrawing(value);
                    setSelectedComponentType(value?.componentType || "");
                    setFormData((prev) => ({
                      ...prev,
                      lnItemCode: value?.lnItemCode,
                      drawingNumber: value?.drawingNumber,
                      nomenclature: value?.nomenclature,
                      componentType: value?.componentType,
                      drawingNumberId: value?.id,
                      nomenclatureId: value?.nomenclatureId,
                      componentTypeId: value?.componentTypeId,
                    }));
                  }}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value?.id
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Drawing Number" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Nomenclature"
                  name="nomenclature"
                  value={formData.nomenclature || ""}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                // disabled
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Component Type</InputLabel>
                  <Select
                    value={
                      selectedComponentType || formData.componentType || ""
                    }
                    label="Component Type"
                    onChange={(e) => {
                      const value = e.target.value as string;
                      setSelectedComponentType(value);
                      const matchedType = componentTypes.find(
                        (type: any) => (type.componentType || type.name || type) === value
                      );
                      setFormData((prev) => ({
                        ...prev,
                        componentType: value,
                        componentTypeId: matchedType?.id || prev.componentTypeId,
                      }));
                    }}
                    disabled={componentTypesLoading}
                  >
                    {componentTypes.map((type: any) => (
                      <MenuItem
                        key={type.id || type.componentType}
                        value={type.componentType || type.name || type}
                      >
                        {type.componentType || type.name || type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Consumed In Drawing"
                  name="consumedInDrawing"
                  value={formData.consumedInDrawing || ""}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="ID Number"
                  name="idNumber"
                  value={formData.idNumber || ""}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Status"
                  name="qrCodeStatus"
                  value={formData.qrCodeStatus || ""}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={4}>
                <Autocomplete
                  options={irNumbers}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    return option.irNumber || "";
                  }}
                  value={selectedIRNumber}
                  loading={irLoading}
                  size="small"
                  onInputChange={(_, value) => {
                    if (value.length >= 3) {
                      debouncedIRSearch(value);
                    } else if (value.length === 0) {
                      debouncedIRSearch("");
                    }
                  }}
                  onChange={(_, value) => {
                    setSelectedIRNumber(value);
                    setFormData((prev) => ({
                      ...prev,
                      irNumber: value?.irNumber || "",
                      irNumberId: value?.id === "NA" ? 0 : Number(value?.id) || 0,
                    }));
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  renderOption={(props, option) => {
                    const { key, ...optionProps } = props;
                    return (
                      <li {...optionProps} key={key}>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            py: 1,
                          }}
                        >
                          <Typography variant="body1">
                            {option.irNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            DWG: {option.drawingNumber || "N/A"}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="IR Number"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {irLoading ? (
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
                <Autocomplete
                  options={msnNumbers}
                  getOptionLabel={(option) => option.msnNumber}
                  value={selectedMSNNumber}
                  loading={msnLoading}
                  size="small"
                  onInputChange={(_, value) => {
                    if (value.length >= 3) {
                      debouncedMSNSearch(value);
                    }
                  }}
                  onChange={(_, value) => {
                    setSelectedMSNNumber(value);
                    setFormData((prev) => ({
                      ...prev,
                      msnNumber: value?.msnNumber || "",
                      msnNumberId: value?.id || undefined,
                    }));
                  }}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          py: 1,
                        }}
                      >
                        <Typography variant="body1">
                          {option.msnNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          IDs: {option.idNumberRange} | Series:{" "}
                          {option.productionSeriesName}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <Box>
                      <TextField
                        {...params}
                        label="MSN Number"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {msnLoading ? (
                                <CircularProgress color="inherit" size={16} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                      {selectedMSNNumber?.idNumberRange && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: "block",
                            mt: 0.5,
                            px: 1,
                          }}
                        >
                          IDs: {selectedMSNNumber.idNumberRange}
                        </Typography>
                      )}
                    </Box>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="MRIR Number"
                  name="mrirNumber"
                  value={formData.mrirNumber || ""}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity ?? ""}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Autocomplete
                  size="small"
                  options={poNumbers || []}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    return option.productionOrderNumber || "";
                  }}
                  filterOptions={(options, { inputValue }) => {
                    if (!inputValue) return options.slice(0, 100);
                    const searchLower = inputValue.toLowerCase();
                    const filtered = options.filter((option) => {
                      return (
                        option.productionOrderNumber?.toLowerCase().includes(searchLower) ||
                        option.lnItemCode?.toLowerCase().includes(searchLower) ||
                        option.drawingNumber?.toLowerCase().includes(searchLower)
                      );
                    });
                    return filtered.slice(0, 100);
                  }}
                  value={selectedPO}
                  onInputChange={(_, value) => setPOSearchText(value)}
                  onChange={(_, newValue) => {
                    if (newValue && typeof newValue !== "string") {
                      setSelectedPO(newValue);
                      setFormData((prev) => ({
                        ...prev,
                        productionOrderNumber: newValue.productionOrderNumber,
                      }));

                      // Auto-select Production Series
                      if (newValue.prodSeriesId && newValue.productionSeries) {
                        const matchingSeries = productionSeriesList.find(
                          (ps) => ps.id === newValue.prodSeriesId,
                        );
                        if (matchingSeries) {
                          setSelectedProductionSeries(matchingSeries);
                        } else {
                          setSelectedProductionSeries({
                            id: newValue.prodSeriesId,
                            productionSeries: newValue.productionSeries,
                          });
                        }
                      }

                      // Auto-select LN Item Code
                      if (newValue.lnItemCodeId) {
                        const matchingDrawing = allDrawingNumbers.find(
                          (d) => d.lnItemCodeId === newValue.lnItemCodeId,
                        );
                        if (matchingDrawing) {
                          setSelectedDrawing(matchingDrawing);
                          setSelectedComponentType(matchingDrawing.componentType || "");
                          setFormData((prev) => ({
                            ...prev,
                            lnItemCode: matchingDrawing.lnItemCode || undefined,
                            drawingNumber:
                              matchingDrawing.drawingNumber || undefined,
                            nomenclature:
                              matchingDrawing.nomenclature || undefined,
                            componentType:
                              matchingDrawing.componentType || undefined,
                            drawingNumberId: matchingDrawing.id,
                            nomenclatureId: matchingDrawing.nomenclatureId,
                            componentTypeId: matchingDrawing.componentTypeId,
                          }));
                        }
                      }
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
                    <TextField {...params} label="PO Number" size="small" />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Autocomplete
                  size="small"
                  options={unitsList}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    return option.unitName || "";
                  }}
                  value={selectedUnit}
                  onChange={(_, newValue) => {
                    setSelectedUnit(newValue);
                    setFormData((prev) => ({
                      ...prev,
                      unitId: newValue?.id || null,
                    }));
                  }}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value?.id
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Unit" fullWidth />
                  )}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={4}>
                <Autocomplete
                  freeSolo
                  size="small"
                  options={shapesList}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    return option.materialName || "";
                  }}
                  value={selectedShape}
                  onInputChange={(_, newInputValue) => {
                    const match = shapesList.find(
                      (s) =>
                        s.materialName?.toLowerCase() ===
                        newInputValue.toLowerCase(),
                    );
                    if (match) {
                      setSelectedShape(match);
                      setFormData((prev) => ({
                        ...prev,
                        shapeId: match.id,
                      }));
                    } else {
                      setSelectedShape(newInputValue);
                      setFormData((prev) => ({
                        ...prev,
                        shapeId: null,
                      }));
                    }
                  }}
                  onChange={(_, newValue) => {
                    if (typeof newValue === "string") {
                      const match = shapesList.find(
                        (s) =>
                          s.materialName?.toLowerCase() ===
                          newValue.toLowerCase(),
                      );
                      setSelectedShape(match || newValue);
                      setFormData((prev) => ({
                        ...prev,
                        shapeId: match?.id || null,
                      }));
                    } else {
                      setSelectedShape(newValue);
                      setFormData((prev) => ({
                        ...prev,
                        shapeId: newValue?.id || null,
                      }));
                    }
                  }}
                  isOptionEqualToValue={(option, value) => {
                    if (
                      typeof option === "string" ||
                      typeof value === "string"
                    ) {
                      return option === value;
                    }
                    return option.id === value?.id;
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Shape" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Size"
                  name="size"
                  value={formData.size || ""}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="HEAT / LOT / BATCH NO"
                  name="heatLotBatch"
                  value={formData.heatLotBatch || ""}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={8}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <FormLabel
                    component="legend"
                    sx={{ mr: 2, fontSize: "0.875rem" }}
                  >
                    Disposition *:
                  </FormLabel>
                  <RadioGroup
                    row
                    name="desposition"
                    value={formData.desposition || ""}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        desposition: e.target.value,
                      }));
                    }}
                  >
                    <FormControlLabel
                      value="Accepted"
                      control={<Radio size="small" />}
                      label="Accepted"
                    />
                    <FormControlLabel
                      value="Rejected"
                      control={<Radio size="small" />}
                      label="Rejected"
                    />
                    <FormControlLabel
                      value="Used for QT"
                      control={<Radio size="small" />}
                      label="Used for QT"
                    />
                  </RadioGroup>
                </Box>
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Username"
                  name="users"
                  value={formData.users || ""}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Created Date"
                  name="createdDate"
                  value={formData.createdDate || ""}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  disabled
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
                size="medium"
                onClick={handleCancel}
                sx={{ minWidth: 120, py: 1.5, height: 40 }}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="contained"
                size="medium"
                disabled={loading}
                sx={{ minWidth: 200, py: 1.5, height: 40 }}
              >
                {loading ? "Updating..." : "Update"}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={snackbarSeverity === "error" ? null : 4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UpdateBarcode;
