import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  Typography,
  Box,
  Grid,
  Chip,
  CircularProgress,
} from "@mui/material";
import { Download as DownloadIcon } from "@mui/icons-material";
import { ALL_BARCODE_EXPORT_COLUMNS } from "./constants";

interface ExportColumnDialogProps {
  open: boolean;
  onClose: () => void;
  isDownloading: boolean;
  onConfirmExport: (selectedColumns: string[], exportMode: "all" | "custom") => void;
}

const ExportColumnDialog = ({
  open,
  onClose,
  isDownloading,
  onConfirmExport,
}: ExportColumnDialogProps) => {
  const [exportMode, setExportMode] = useState<"all" | "custom">("all");
  const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>(
    ALL_BARCODE_EXPORT_COLUMNS.map((c) => c.key),
  );

  const handleToggleColumn = (key: string) => {
    setSelectedExportColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleToggleSelectAllColumns = () => {
    if (selectedExportColumns.length === ALL_BARCODE_EXPORT_COLUMNS.length) {
      setSelectedExportColumns([]);
    } else {
      setSelectedExportColumns(ALL_BARCODE_EXPORT_COLUMNS.map((c) => c.key));
    }
  };

  const handleConfirm = () => {
    onConfirmExport(selectedExportColumns, exportMode);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: "12px", p: 1 }
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        Export QR Code Data
      </DialogTitle>
      <DialogContent>
        <FormControl component="fieldset" fullWidth sx={{ mt: 1 }}>
          <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1, color: "text.primary" }}>
            Export Option
          </FormLabel>
          <RadioGroup
            value={exportMode}
            onChange={(e) => setExportMode(e.target.value as "all" | "custom")}
            sx={{ mb: 2 }}
          >
            <FormControlLabel
              value="all"
              control={<Radio size="small" />}
              label={<Typography variant="body2">Export All Columns ({ALL_BARCODE_EXPORT_COLUMNS.length})</Typography>}
            />
            <FormControlLabel
              value="custom"
              control={<Radio size="small" />}
              label={<Typography variant="body2">Select Custom Columns</Typography>}
            />
          </RadioGroup>

          {exportMode === "custom" && (
            <Box
              sx={{
                p: 2,
                borderRadius: "12px",
                bgcolor: "#f8fafc",
                border: "1px solid #e2e8f0",
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5} pb={1} borderBottom="1px solid #e2e8f0">
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedExportColumns.length === ALL_BARCODE_EXPORT_COLUMNS.length}
                      indeterminate={
                        selectedExportColumns.length > 0 &&
                        selectedExportColumns.length < ALL_BARCODE_EXPORT_COLUMNS.length
                      }
                      onChange={handleToggleSelectAllColumns}
                      sx={{ color: "primary.main", "&.Mui-checked": { color: "primary.main" } }}
                    />
                  }
                  label={
                    <Typography variant="body2" fontWeight="700">
                      {selectedExportColumns.length === ALL_BARCODE_EXPORT_COLUMNS.length ? "Deselect All" : "Select All Columns"}
                    </Typography>
                  }
                />
                <Chip
                  label={`${selectedExportColumns.length} / ${ALL_BARCODE_EXPORT_COLUMNS.length} selected`}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: "primary.main", color: "primary.main" }}
                />
              </Box>

              <Grid container spacing={1}>
                {ALL_BARCODE_EXPORT_COLUMNS.map((col) => (
                  <Grid item xs={6} sm={4} key={col.key}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={selectedExportColumns.includes(col.key)}
                          onChange={() => handleToggleColumn(col.key)}
                          sx={{ color: "primary.main", "&.Mui-checked": { color: "primary.main" } }}
                        />
                      }
                      label={<Typography variant="body2" sx={{ fontSize: "0.85rem" }}>{col.label}</Typography>}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          color="inherit"
          variant="outlined"
          size="small"
          disabled={isDownloading}
          sx={{ minWidth: 100, borderRadius: "8px" }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          color="primary"
          variant="contained"
          size="small"
          disabled={isDownloading || (exportMode === "custom" && selectedExportColumns.length === 0)}
          startIcon={isDownloading ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
          sx={{ minWidth: 100, borderRadius: "8px" }}
        >
          {isDownloading ? "Exporting..." : "Export"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportColumnDialog;
