import React, { useMemo } from "react";
import {
  Box,
  TextField,
  Button,
  FormControl,
  Autocomplete,
  CircularProgress,
  Typography,
  Paper,
} from "@mui/material";
import {
  Check as CheckIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import type { ProductionOrderMaster } from "../../../hooks/usePONumbers";

interface PrecheckFormControlsProps {
  // PO Number
  selectedPO: ProductionOrderMaster | null;
  poNumbers: ProductionOrderMaster[];
  poLoading: boolean;
  onPOSearchChange: (inputValue: string) => void;
  onPOChange: (value: ProductionOrderMaster | null) => void;

  // LN Item Code / Drawing Number
  selectedDrawing: any;
  allDrawingNumbers: any[];
  drawingNumbersData: any[];
  drawingLoading: boolean;
  isLnSearchLoading: boolean;
  onLnSearchChange: (value: string) => void;
  onDrawingSearchChange: (value: string) => void;
  onDrawingChange: (value: any) => void;

  // Production Series
  selectedProductionSeries: any;
  productionSeriesData: any[];
  prodSeriesLoading: boolean;
  onProdSeriesSearchChange: () => void;
  onProdSeriesChange: (value: any) => void;

  // ID Number
  idNumber: string;
  idOptions: string[];
  onIdNumberChange: (value: string) => void;
  onIdInputChange: (value: string) => void;

  // Apply and Clear actions
  onApply?: () => void;
  onClear?: () => void;
  onReset: () => void;
  isApplyEnabled?: boolean;

  // Alert callback for validation
  showAlertMessage: (message: string, severity: "success" | "error" | "info" | "warning") => void;

  // PO details for validation
  selectedPOEndIdNumber?: number;
  selectedPOStartIdNumber?: number;
  selectedPOQuantity?: number;

  // Remaining Precheck and Export props (optional)
  filterRemainingOnly?: boolean;
  onToggleFilter?: () => void;
  onExport?: () => void;
  isSubmitEnabled?: boolean;
  isSidebarOpen?: boolean;
}

const PrecheckFormControls: React.FC<PrecheckFormControlsProps> = ({
  selectedPO,
  poNumbers,
  poLoading,
  onPOSearchChange,
  onPOChange,
  selectedDrawing,
  allDrawingNumbers,
  drawingNumbersData,
  drawingLoading,
  isLnSearchLoading,
  onLnSearchChange,
  onDrawingSearchChange,
  onDrawingChange,
  selectedProductionSeries,
  productionSeriesData,
  prodSeriesLoading,
  onProdSeriesSearchChange,
  onProdSeriesChange,
  idNumber,
  idOptions,
  onIdNumberChange,
  onIdInputChange,
  onApply,
  onClear,
  onReset,
  isApplyEnabled = true,
  showAlertMessage,
  selectedPOEndIdNumber,
  selectedPOStartIdNumber,
  selectedPOQuantity,
  isSubmitEnabled,
  filterRemainingOnly,
  onToggleFilter,
  onExport,
  isSidebarOpen = false,
}) => {
  // Memoized sliced options for high performance dropdown rendering with current selection included
  const poOptions = useMemo(() => {
    const base = Array.isArray(poNumbers) ? poNumbers.slice(0, 100) : [];
    if (
      selectedPO &&
      !base.some(
        (opt) => opt.productionOrderNumber === selectedPO.productionOrderNumber
      )
    ) {
      return [selectedPO, ...base];
    }
    return base;
  }, [poNumbers, selectedPO]);

  const lnOptions = useMemo(() => {
    const base = Array.isArray(allDrawingNumbers) ? allDrawingNumbers.slice(0, 150) : [];
    if (
      selectedDrawing &&
      !base.some(
        (opt) =>
          (opt.id && selectedDrawing.id && opt.id === selectedDrawing.id) ||
          (opt.drawingNumber && selectedDrawing.drawingNumber && opt.drawingNumber.trim().toLowerCase() === selectedDrawing.drawingNumber.trim().toLowerCase()) ||
          (opt.lnItemCode && selectedDrawing.lnItemCode && opt.lnItemCode.trim().toLowerCase() === selectedDrawing.lnItemCode.trim().toLowerCase())
      )
    ) {
      return [selectedDrawing, ...base];
    }
    return base;
  }, [allDrawingNumbers, selectedDrawing]);

  const drawingOptions = useMemo(() => {
    const base = Array.isArray(drawingNumbersData) ? drawingNumbersData.slice(0, 100) : [];
    if (
      selectedDrawing &&
      !base.some(
        (opt) =>
          (opt.id && selectedDrawing.id && opt.id === selectedDrawing.id) ||
          (opt.drawingNumber && selectedDrawing.drawingNumber && opt.drawingNumber.trim().toLowerCase() === selectedDrawing.drawingNumber.trim().toLowerCase())
      )
    ) {
      return [selectedDrawing, ...base];
    }
    return base;
  }, [drawingNumbersData, selectedDrawing]);

  const prodSeriesOptions = useMemo(() => {
    const base = Array.isArray(productionSeriesData) ? productionSeriesData.slice(0, 100) : [];
    if (
      selectedProductionSeries &&
      !base.some(
        (opt) =>
          (opt.id && selectedProductionSeries.id && opt.id === selectedProductionSeries.id) ||
          (opt.productionSeries && selectedProductionSeries.productionSeries && String(opt.productionSeries).trim().toLowerCase() === String(selectedProductionSeries.productionSeries).trim().toLowerCase())
      )
    ) {
      return [selectedProductionSeries, ...base];
    }
    return base;
  }, [productionSeriesData, selectedProductionSeries]);

  const slicedIdOptions = useMemo(() => {
    const base = Array.isArray(idOptions) ? idOptions.slice(0, 200) : [];
    if (idNumber && !base.includes(idNumber)) {
      return [idNumber, ...base];
    }
    return base;
  }, [idOptions, idNumber]);

  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        alignItems: "center",
        p: 1.5,
        mb: 1.5,
        borderRadius: "12px",
        border: "1px solid #EAECF0",
        backgroundColor: "#FFFFFF",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        gap: 1.5,
        flexWrap: { xs: "wrap", lg: "nowrap" },
        width: "100%",
      }}
    >
      {/* PO Number Field */}
      <FormControl
        sx={{
          flex: { xs: "1 1 100%", sm: "1 1 160px", lg: 1.2 },
          minWidth: { xs: "100%", sm: 140 },
        }}
        size="small"
      >
        <Autocomplete
          size="small"
          options={poOptions}
          getOptionLabel={(option) => {
            if (typeof option === "string") return option;
            return option.productionOrderNumber || "";
          }}
          value={selectedPO}
          loading={poLoading}
          onInputChange={(_, inputValue) => {
            onPOSearchChange(inputValue);
          }}
          onChange={(_, newValue) => {
            if (newValue && typeof newValue !== "string") {
              onPOChange(newValue);
            } else {
              onPOChange(null);
            }
          }}
          isOptionEqualToValue={(option, val) =>
            option.productionOrderNumber ===
            (typeof val === "string" ? val : val?.productionOrderNumber)
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
          ListboxProps={{
            style: { maxHeight: "300px" },
          }}
          renderInput={(params) => (
            <TextField {...params} label="PO Number" fullWidth size="small" />
          )}
        />
      </FormControl>

      {/* LN Item Code Field */}
      <FormControl
        sx={{
          flex: { xs: "1 1 100%", sm: "1 1 180px", lg: 1.4 },
          minWidth: { xs: "100%", sm: 160 },
        }}
        size="small"
      >
        <Autocomplete
          size="small"
          options={lnOptions}
          groupBy={(option: any) => option.lnItemCode || "No LN Code"}
          getOptionLabel={(option: any) => {
            if (typeof option === "string") return option;
            return option.lnItemCode || "";
          }}
          value={selectedDrawing}
          loading={isLnSearchLoading}
          freeSolo={false}
          onInputChange={(_, value) => {
            onLnSearchChange(value);
          }}
          onChange={(_: any, value: any) => {
            if (value) {
              onDrawingChange(value);
            } else {
              onDrawingChange(null);
            }
          }}
          filterOptions={(options, { inputValue }) => {
            if (!inputValue) return options.slice(0, 100);
            const searchLower = inputValue.toLowerCase();
            const filtered = options.filter(
              (option: any) =>
                option.lnItemCode?.toLowerCase().includes(searchLower) ||
                option.drawingNumber?.toLowerCase().includes(searchLower) ||
                option.nomenclature?.toLowerCase().includes(searchLower),
            );
            return filtered.slice(0, 100);
          }}
          isOptionEqualToValue={(option, value) => {
            if (!value) return false;
            if (option.id && value.id) return option.id === value.id;
            if (option.drawingNumber && value.drawingNumber) {
              return option.drawingNumber.trim().toLowerCase() === value.drawingNumber.trim().toLowerCase();
            }
            if (option.lnItemCode && value.lnItemCode) {
              return option.lnItemCode.trim().toLowerCase() === value.lnItemCode.trim().toLowerCase();
            }
            return false;
          }}
          renderOption={(props, option: any) => {
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
              <ul style={{ padding: 0, margin: 0 }}>{params.children}</ul>
            </li>
          )}
          ListboxProps={{
            style: { maxHeight: "300px" },
          }}
          renderInput={(params) => (
            <TextField
              {...params}
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
      </FormControl>

      {/* Drawing Number Field */}
      <FormControl
        sx={{
          flex: { xs: "1 1 100%", sm: "1 1 180px", lg: 1.4 },
          minWidth: { xs: "100%", sm: 160 },
        }}
        size="small"
      >
        <Autocomplete
          size="small"
          options={drawingOptions}
          getOptionLabel={(option) =>
            typeof option === "string" ? option : option.drawingNumber || ""
          }
          value={selectedDrawing}
          loading={drawingLoading}
          onInputChange={(_, newValue) => {
            if (newValue.length >= 3) {
              onDrawingSearchChange(newValue);
            } else if (newValue.length === 0) {
              onDrawingSearchChange("");
            }
          }}
          onChange={(_: any, value: any) => {
            onDrawingChange(value);
          }}
          isOptionEqualToValue={(option, value) => {
            if (!value) return false;
            if (option.id && value.id) return option.id === value.id;
            if (option.drawingNumber && value.drawingNumber) {
              return option.drawingNumber.trim().toLowerCase() === value.drawingNumber.trim().toLowerCase();
            }
            if (option.lnItemCode && value.lnItemCode) {
              return option.lnItemCode.trim().toLowerCase() === value.lnItemCode.trim().toLowerCase();
            }
            return false;
          }}
          renderOption={(props: any, option: any) => (
            <li {...props}>
              <Box sx={{ display: "flex", flexDirection: "column", py: 0.5 }}>
                <Typography variant="body2">
                  {option.drawingNumber}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.nomenclature || ""} | {option.componentType || ""}
                </Typography>
              </Box>
            </li>
          )}
          ListboxProps={{
            style: { maxHeight: "300px" },
          }}
          renderInput={(params: any) => (
            <TextField
              {...params}
              label="Drawing Number *"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {drawingLoading ? (
                      <CircularProgress color="inherit" size={16} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      </FormControl>

      {/* Production Series Field */}
      <FormControl
        sx={{
          flex: { xs: "1 1 100%", sm: "1 1 110px", lg: 0.9 },
          minWidth: { xs: "100%", sm: 95 },
        }}
        size="small"
      >
        <Autocomplete
          size="small"
          options={prodSeriesOptions}
          getOptionLabel={(option) => {
            if (typeof option === "string") return option;
            return option.productionSeries || "";
          }}
          value={selectedProductionSeries}
          loading={prodSeriesLoading}
          onInputChange={(_, value) => {
            if (value.length >= 1) {
              onProdSeriesSearchChange();
            }
          }}
          onChange={(_, value) => {
            onProdSeriesChange(value);
          }}
          isOptionEqualToValue={(option, value) => {
            if (!value) return false;
            if (option.id && value.id) return option.id === value.id;
            if (option.productionSeries && value.productionSeries) {
              return String(option.productionSeries).trim().toLowerCase() === String(value.productionSeries).trim().toLowerCase();
            }
            return false;
          }}
          renderOption={(props, option) => (
            <li {...props}>
              <Typography variant="body2">
                {option.productionSeries}
              </Typography>
            </li>
          )}
          ListboxProps={{
            style: { maxHeight: "300px" },
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Prod Series *"
              InputLabelProps={{
                ...params.InputLabelProps,
                shrink: true,
              }}
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
      </FormControl>

      {/* ID Number Field */}
      <FormControl
        sx={{
          flex: { xs: "1 1 100%", sm: "1 1 120px", lg: 0.9 },
          minWidth: { xs: "100%", sm: 100 },
        }}
        size="small"
      >
        <Autocomplete
          size="small"
          freeSolo
          disableClearable
          forcePopupIcon={true}
          options={slicedIdOptions}
          value={idNumber}
          onChange={(_, newValue) => {
            const val = typeof newValue === "string" ? newValue : (newValue ? String(newValue) : "");
            onIdNumberChange(val);
          }}
          onInputChange={(_, newInputValue) => {
            onIdInputChange(newInputValue);
          }}
          ListboxProps={{
            style: { maxHeight: "300px" },
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="ID Number *"
              variant="outlined"
              InputLabelProps={{
                ...params.InputLabelProps,
                shrink: true,
              }}
            />
          )}
        />
      </FormControl>

      {/* Apply Button */}
      <Button
        variant="contained"
        color="primary"
        sx={{
          height: 40,
          minWidth: 90,
          px: 2,
          fontWeight: 600,
          borderRadius: "8px",
          textTransform: "none",
        }}
        size="small"
        onClick={onApply || onReset}
        disabled={!isApplyEnabled}
        startIcon={<CheckIcon />}
      >
        Apply
      </Button>

      {/* Clear Button */}
      <Button
        variant="outlined"
        sx={{
          height: 40,
          minWidth: 90,
          px: 2,
          fontWeight: 600,
          borderRadius: "8px",
          textTransform: "none",
        }}
        size="small"
        onClick={onClear || onReset}
        startIcon={<ClearIcon />}
      >
        Clear
      </Button>
    </Paper>
  );
};

export default React.memo(PrecheckFormControls);
