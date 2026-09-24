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

  const drawingNumberValue = useMemo(() => {
    if (typeof selectedDrawing === "string") return selectedDrawing;
    return selectedDrawing?.drawingNumber || "";
  }, [selectedDrawing]);

  const lnItemCodeValue = useMemo(() => {
    if (typeof selectedDrawing === "string") return selectedDrawing;
    return selectedDrawing?.lnItemCode || selectedDrawing?.lnitemcode || "";
  }, [selectedDrawing]);

  const prodSeriesValue = useMemo(() => {
    if (typeof selectedProductionSeries === "string") return selectedProductionSeries;
    return selectedProductionSeries?.productionSeries || "";
  }, [selectedProductionSeries]);

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
        p: 2,
        mb: 0.75,
        borderRadius: "12px",
        border: "1px solid #EAECF0",
        backgroundColor: "#FFFFFF",
        boxShadow: "0 1px 3px rgba(20, 3, 3, 0.04)",
        gap: 1.5,
        flexWrap: { xs: "wrap", lg: "nowrap" },
        width: "100%",
      }}
    >
      {/* PO Number Field */}
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
                  {option.lnItemCode && `Item Code: ${option.lnItemCode}`}
                  {option.drawingNumber &&
                    ` | Part Number: ${option.drawingNumber}`}
                  {option.nomenclature &&
                    ` | Item Description: ${option.nomenclature}`}
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
        sx={{
          flex: { xs: "1 1 100%", sm: "1 1 160px", lg: 1.2 },
          minWidth: { xs: "100%", sm: 140 },
          "& .MuiOutlinedInput-root": {
            height: 38,
            backgroundColor: "#FFFFFF",
            borderRadius: "6px",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#D0D5DD" },
          },
          "& .MuiOutlinedInput-input": {
            fontSize: "0.82rem",
          },
        }}
        renderInput={(params) => (
          <TextField {...params} label="PO Number *" fullWidth size="small" />
        )}
      />

      {/* Drawing Number Field (Read-only, auto-populated on PO selection) */}
      <TextField
        size="small"
        label="Part Number"
        value={drawingNumberValue}
        placeholder="Auto-populated"
        variant="outlined"
        fullWidth
        InputProps={{
          readOnly: true,
          style: { backgroundColor: "#F9FAFB" },
        }}
        sx={{
          flex: { xs: "1 1 100%", sm: "1 1 160px", lg: 1.2 },
          minWidth: { xs: "100%", sm: 140 },
          "& .MuiOutlinedInput-root": {
            height: 38,
            borderRadius: "6px",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#D0D5DD" },
          },
          "& .MuiOutlinedInput-input": {
            fontSize: "0.82rem",
            color: "#344054",
            fontWeight: 500,
          },
        }}
      />

      {/* LN Item Code Field (Read-only, auto-populated on PO selection) */}
      <TextField
        size="small"
        label="Item Code"
        value={lnItemCodeValue}
        placeholder="Auto-populated"
        variant="outlined"
        fullWidth
        InputProps={{
          readOnly: true,
          style: { backgroundColor: "#F9FAFB" },
        }}
        sx={{
          flex: { xs: "1 1 100%", sm: "1 1 160px", lg: 1.2 },
          minWidth: { xs: "100%", sm: 140 },
          "& .MuiOutlinedInput-root": {
            height: 38,
            borderRadius: "6px",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#D0D5DD" },
          },
          "& .MuiOutlinedInput-input": {
            fontSize: "0.82rem",
            color: "#344054",
            fontWeight: 500,
          },
        }}
      />

      {/* Prod Series Field (Read-only, auto-populated on PO selection) */}
      <TextField
        size="small"
        label="Prod Series"
        value={prodSeriesValue}
        placeholder="Auto-populated"
        variant="outlined"
        fullWidth
        InputProps={{
          readOnly: true,
          style: { backgroundColor: "#F9FAFB" },
        }}
        sx={{
          flex: { xs: "1 1 100%", sm: "1 1 110px", lg: 0.9 },
          minWidth: { xs: "100%", sm: 95 },
          "& .MuiOutlinedInput-root": {
            height: 38,
            borderRadius: "6px",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#D0D5DD" },
          },
          "& .MuiOutlinedInput-input": {
            fontSize: "0.82rem",
            color: "#344054",
            fontWeight: 500,
          },
        }}
      />

      {/* ID Number Field */}
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
        sx={{
          flex: { xs: "1 1 100%", sm: "1 1 120px", lg: 0.9 },
          minWidth: { xs: "100%", sm: 100 },
          "& .MuiOutlinedInput-root": {
            height: 38,
            backgroundColor: "#FFFFFF",
            borderRadius: "6px",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#D0D5DD" },
          },
          "& .MuiOutlinedInput-input": {
            fontSize: "0.82rem",
          },
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="ID Number *"
            variant="outlined"
          />
        )}
      />

      {/* Apply Button */}
      <Button
        variant="contained"
        size="small"
        onClick={onApply || onReset}
        disabled={!isApplyEnabled}
        sx={{
          height: 38,
          minWidth: 65,
          px: 2,
          borderRadius: "6px",
          backgroundColor: "primary.main",
          color: "#FFFFFF",
          fontWeight: 600,
          fontSize: "0.82rem",
          textTransform: "none",
          boxShadow: "none",
          "&:hover": {
            backgroundColor: "primary.dark",
            boxShadow: "none",
          },
          "&.Mui-disabled": {
            backgroundColor: "#EAECF0",
            color: "#98A2B3",
          },
        }}
      >
        Apply
      </Button>

      {/* Clear Button */}
      <Button
        variant="outlined"
        size="small"
        onClick={onClear || onReset}
        sx={{
          height: 38,
          minWidth: 55,
          px: 1.5,
          borderRadius: "6px",
          borderColor: "#D0D5DD",
          backgroundColor: "#ffffff",
          color: "#667085",
          fontWeight: 600,
          fontSize: "0.82rem",
          textTransform: "none",
          boxShadow: "none",
          "&:hover": {
            borderColor: "#98A2B3",
            backgroundColor: "#F9FAFB",
            color: "#101828",
          },
        }}
      >
        Clear
      </Button>
    </Paper>
  );
};

export default React.memo(PrecheckFormControls);
