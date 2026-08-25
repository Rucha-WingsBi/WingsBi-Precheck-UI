import React from "react";
import {
  Box,
  TextField,
  Button,
  FormControl,
  Autocomplete,
  CircularProgress,
  Typography,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  FileDownload as FileDownloadIcon,
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

  // Reset
  onReset: () => void;

  // Alert callback for validation
  showAlertMessage: (message: string, severity: "success" | "error" | "info" | "warning") => void;

  // PO details for validation
  selectedPOEndIdNumber?: number;
  selectedPOStartIdNumber?: number;
  selectedPOQuantity?: number;

  // Remaining Precheck and Export props
  filterRemainingOnly: boolean;
  onToggleFilter: () => void;
  onExport: () => void;
  isSubmitEnabled: boolean;
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
  onReset,
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
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        mb: 1,
        gap: isSidebarOpen ? 1 : 1.5,
        flexWrap: "wrap",
        width: "100%",
      }}
    >
      {/* PO Number Field */}
      <FormControl
        sx={{
          minWidth: { xs: "100%", sm: isSidebarOpen ? 130 : 180 },
          flex: { xs: "1 1 100%", sm: isSidebarOpen ? "1 1 150px" : "1 1 180px" },
        }}
        size="small"
      >
        <Autocomplete
          size="small"
          options={Array.isArray(poNumbers) ? poNumbers : []}
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
            style: { maxHeight: "420px" },
          }}
          renderInput={(params) => (
            <TextField {...params} label="PO Number" fullWidth size="small" />
          )}
        />
      </FormControl>

      {/* LN Item Code Field */}
      <FormControl
        sx={{
          minWidth: { xs: "100%", sm: isSidebarOpen ? 150 : 200 },
          flex: { xs: "1 1 100%", sm: isSidebarOpen ? "1 1 160px" : "1 1 200px" },
        }}
        size="small"
      >
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
          isOptionEqualToValue={(option, value) =>
            option.id === (value?.id || "")
          }
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
          minWidth: { xs: "100%", sm: isSidebarOpen ? 160 : 220 },
          flex: { xs: "1 1 100%", sm: isSidebarOpen ? "1 1 180px" : "1 1 220px" },
        }}
        size="small"
      >
        <Autocomplete
          size="small"
          options={drawingNumbersData}
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
          isOptionEqualToValue={(option, value) =>
            option.id === (value?.id || "")
          }
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
          minWidth: { xs: "100%", sm: isSidebarOpen ? 100 : 115 },
          flex: { xs: "1 1 100%", sm: isSidebarOpen ? "0 0 105px" : "0 0 120px" },
        }}
        size="small"
      >
        <Autocomplete
          size="small"
          options={productionSeriesData}
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
          isOptionEqualToValue={(option, value) =>
            option.id === (value?.id || "")
          }
          renderOption={(props, option) => (
            <li {...props}>
              <Typography variant="body2">
                {option.productionSeries}
              </Typography>
            </li>
          )}
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
          minWidth: { xs: "100%", sm: isSidebarOpen ? 110 : 125 },
          flex: { xs: "1 1 100%", sm: isSidebarOpen ? "0 0 115px" : "0 0 130px" },
        }}
        size="small"
      >
        <Autocomplete
          size="small"
          freeSolo
          disableClearable
          forcePopupIcon={true}
          options={idOptions}
          value={idNumber}
          onChange={(_, newValue) => {
            const val = typeof newValue === "string" ? newValue : (newValue ? String(newValue) : "");
            onIdNumberChange(val);
          }}
          onInputChange={(_, newInputValue) => {
            onIdInputChange(newInputValue);
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

      <Button
        variant="contained"
        color="error"
        sx={{
          minWidth: { xs: "100%", sm: 80 },
          height: 40,
          flex: { xs: "1 1 100%", sm: "0 0 auto" },
          px: isSidebarOpen ? 1.5 : 2,
        }}
        size="small"
        onClick={onReset}
        startIcon={<RefreshIcon />}
      >
        Reset
      </Button>

      <Button
        variant={filterRemainingOnly ? "contained" : "outlined"}
        color="info"
        sx={{
          minWidth: { xs: "100%", sm: isSidebarOpen ? 140 : 160 },
          height: 40,
          flex: { xs: "1 1 100%", sm: "0 0 auto" },
          transition: "all 0.3s ease",
          px: isSidebarOpen ? 1.5 : 2,
        }}
        size="small"
        disabled={!isSubmitEnabled}
        onClick={onToggleFilter}
      >
        {filterRemainingOnly ? "Show All " : "Remaining Precheck"}
      </Button>

      <Button
        variant="contained"
        color="info"
        sx={{
          minWidth: { xs: "100%", sm: isSidebarOpen ? 90 : 100 },
          height: 40,
          flex: { xs: "1 1 100%", sm: "0 0 auto" },
          px: isSidebarOpen ? 1.5 : 2,
        }}
        size="small"
        disabled={!isSubmitEnabled}
        onClick={onExport}
        startIcon={<FileDownloadIcon />}
      >
        Export
      </Button>
    </Box>
  );
};

export default PrecheckFormControls;
