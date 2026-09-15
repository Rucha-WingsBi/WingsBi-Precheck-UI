import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  Autocomplete,
  CircularProgress,
} from "@mui/material";

interface BulkUpdateDialogProps {
  open: boolean;
  onClose: () => void;
  selectedCount: number;
  bulkLoading: boolean;
  onSubmit: () => void;
  // Production Series
  productionSeries: any[];
  bulkSelectedProductionSeries: any;
  onProductionSeriesChange: (value: any) => void;
  // Available For
  bulkAvailableFor: string;
  onAvailableForChange: (value: string) => void;
  // Project
  bulkProject: string;
  onProjectChange: (value: string) => void;
  // Location
  bulkRackLocationId: number | "";
  onRackLocationChange: (value: number | "") => void;
  // Unit
  units: any[];
  bulkSelectedUnit: any;
  onUnitChange: (value: any) => void;
  // MRIR
  bulkMrir: string;
  onMrirChange: (value: string) => void;
  // IR
  bulkIrNumbers: any[];
  bulkSelectedIR: any;
  onIRChange: (value: any) => void;
  // MSN
  bulkMsnNumbers: any[];
  bulkSelectedMSN: any;
  onMSNChange: (value: any) => void;
}

const BulkUpdateDialog = ({
  open,
  onClose,
  selectedCount,
  bulkLoading,
  onSubmit,
  productionSeries,
  bulkSelectedProductionSeries,
  onProductionSeriesChange,
  bulkAvailableFor,
  onAvailableForChange,
  bulkProject,
  onProjectChange,
  bulkRackLocationId,
  onRackLocationChange,
  units,
  bulkSelectedUnit,
  onUnitChange,
  bulkMrir,
  onMrirChange,
  bulkIrNumbers,
  bulkSelectedIR,
  onIRChange,
  bulkMsnNumbers,
  bulkSelectedMSN,
  onMSNChange,
}: BulkUpdateDialogProps) => {
  const [openProdSeries, setOpenProdSeries] = useState(false);
  const [openUnit, setOpenUnit] = useState(false);
  const [openIR, setOpenIR] = useState(false);
  const [openMSN, setOpenMSN] = useState(false);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 600, color: "primary.main" }}>
        Update QR Codes ({selectedCount} Selected)
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            {/* Row 1: Prod Series & Available For */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                size="small"
                open={openProdSeries}
                onOpen={() => setOpenProdSeries(true)}
                onClose={() => setOpenProdSeries(false)}
                openOnFocus={true}
                selectOnFocus={true}
                forcePopupIcon={true}
                options={productionSeries || []}
                getOptionLabel={(option) => {
                  if (typeof option === "string") return option;
                  return option.productionSeries || "";
                }}
                value={bulkSelectedProductionSeries}
                onChange={(_, newValue) => {
                  setOpenProdSeries(false);
                  onProductionSeriesChange(newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Prod Series"
                    fullWidth
                    onClick={() => setOpenProdSeries(true)}
                    onFocus={(e) => {
                      setOpenProdSeries(true);
                      (e.target as HTMLInputElement)?.select?.();
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Available For"
                value={bulkAvailableFor}
                onChange={(e) => onAvailableForChange(e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>

            {/* Row 2: Project Number & Location */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Project Number"
                value={bulkProject}
                onChange={(e) => onProjectChange(e.target.value)}
                fullWidth
                size="small"
                placeholder="Enter Project Number"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Location"
                type="number"
                value={bulkRackLocationId}
                onChange={(e) => {
                  const val = e.target.value;
                  onRackLocationChange(val === "" ? "" : Number(val));
                }}
                fullWidth
                size="small"
                placeholder="Enter Location ID"
              />
            </Grid>

            {/* Row 3: Unit & MRIR */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                size="small"
                open={openUnit}
                onOpen={() => setOpenUnit(true)}
                onClose={() => setOpenUnit(false)}
                openOnFocus={true}
                selectOnFocus={true}
                forcePopupIcon={true}
                options={units || []}
                getOptionLabel={(option) => {
                  if (typeof option === "string") return option;
                  return option.unitName || "";
                }}
                value={bulkSelectedUnit}
                onChange={(_, newValue) => {
                  setOpenUnit(false);
                  onUnitChange(newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Unit"
                    fullWidth
                    onClick={() => setOpenUnit(true)}
                    onFocus={(e) => {
                      setOpenUnit(true);
                      (e.target as HTMLInputElement)?.select?.();
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="MRIR"
                value={bulkMrir}
                onChange={(e) => onMrirChange(e.target.value)}
                fullWidth
                size="small"
                placeholder="Enter MRIR"
              />
            </Grid>

            {/* Row 4: IR & MSN */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                size="small"
                open={openIR}
                onOpen={() => setOpenIR(true)}
                onClose={() => setOpenIR(false)}
                openOnFocus={true}
                selectOnFocus={true}
                forcePopupIcon={true}
                options={bulkIrNumbers}
                getOptionLabel={(option) => {
                  if (typeof option === "string") return option;
                  return option.irNumber || "";
                }}
                value={bulkSelectedIR}
                onChange={(_, newValue) => {
                  setOpenIR(false);
                  onIRChange(newValue);
                }}
                filterOptions={(options, { inputValue }) => {
                  if (!inputValue) return options;
                  const searchLower = inputValue.toLowerCase();
                  const currentIr = (bulkSelectedIR?.irNumber || "").toLowerCase();
                  if (searchLower === currentIr) return options;
                  return options.filter((option) =>
                    option.irNumber?.toLowerCase().includes(searchLower) ||
                    option.drawingNumber?.toLowerCase().includes(searchLower) ||
                    option.idNumberRange?.toLowerCase().includes(searchLower)
                  );
                }}
                renderOption={(props, option) => {
                  const { key, ...optionProps } = props;
                  return (
                    <li {...optionProps} key={key}>
                      <Box sx={{ display: "flex", flexDirection: "column", py: 0.5, width: "100%" }}>
                        <Typography variant="body2">{option.irNumber}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.drawingNumber || ""} | IDs: {option.idNumberRange || ""}
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="IR"
                    placeholder="Search IR..."
                    fullWidth
                    onClick={() => setOpenIR(true)}
                    onFocus={(e) => {
                      setOpenIR(true);
                      (e.target as HTMLInputElement)?.select?.();
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                size="small"
                open={openMSN}
                onOpen={() => setOpenMSN(true)}
                onClose={() => setOpenMSN(false)}
                openOnFocus={true}
                selectOnFocus={true}
                forcePopupIcon={true}
                options={bulkMsnNumbers}
                getOptionLabel={(option) => {
                  if (typeof option === "string") return option;
                  return option.msnNumber || "";
                }}
                value={bulkSelectedMSN}
                onChange={(_, newValue) => {
                  setOpenMSN(false);
                  onMSNChange(newValue);
                }}
                filterOptions={(options, { inputValue }) => {
                  if (!inputValue) return options;
                  const searchLower = inputValue.toLowerCase();
                  const currentMsn = (bulkSelectedMSN?.msnNumber || "").toLowerCase();
                  if (searchLower === currentMsn) return options;
                  return options.filter((option) =>
                    option.msnNumber?.toLowerCase().includes(searchLower) ||
                    option.drawingNumber?.toLowerCase().includes(searchLower) ||
                    option.idNumberRange?.toLowerCase().includes(searchLower)
                  );
                }}
                renderOption={(props, option) => {
                  const { key, ...optionProps } = props;
                  return (
                    <li {...optionProps} key={key}>
                      <Box sx={{ display: "flex", flexDirection: "column", py: 0.5, width: "100%" }}>
                        <Typography variant="body2">{option.msnNumber}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.drawingNumber || ""} | IDs: {option.idNumberRange || ""}
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="MSN"
                    placeholder="Search MSN..."
                    fullWidth
                    onClick={() => setOpenMSN(true)}
                    onFocus={(e) => {
                      setOpenMSN(true);
                      (e.target as HTMLInputElement)?.select?.();
                    }}
                  />
                )}
              />
            </Grid>

          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          color="inherit"
          variant="outlined"
          size="small"
          disabled={bulkLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          color="primary"
          variant="contained"
          size="small"
          disabled={bulkLoading}
          startIcon={bulkLoading && <CircularProgress size={20} color="inherit" />}
        >
          {bulkLoading ? "Updating..." : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkUpdateDialog;
