import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  FormControl,
  Autocomplete,
} from "@mui/material";
import type { GridItem } from "./types";

interface AddQrCodeDialogProps {
  open: boolean;
  selectedRow: GridItem | null;
  formData: {
    prodSeriesId: string;
    idNumber: string;
    qrCodeNumber: string;
  };
  qrCodeError: string;
  productionSeriesData: any[];
  prodSeriesLoading: boolean;
  onFormDataChange: (data: { prodSeriesId?: string; idNumber?: string; qrCodeNumber?: string }) => void;
  onQrCodeChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

const AddQrCodeDialog: React.FC<AddQrCodeDialogProps> = ({
  open,
  selectedRow,
  formData,
  qrCodeError,
  productionSeriesData,
  prodSeriesLoading,
  onFormDataChange,
  onQrCodeChange,
  onSubmit,
  onClose,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Add QR Code Details
        {selectedRow && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Drawing Number: {selectedRow.drawingNumber}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <FormControl fullWidth>
            <Autocomplete
              options={productionSeriesData}
              getOptionLabel={(option) =>
                typeof option === "string"
                  ? option
                  : option.productionSeries || ""
              }
              loading={prodSeriesLoading}
              value={
                productionSeriesData.find(
                  (ps) => ps.id?.toString() === formData.prodSeriesId,
                ) || null
              }
              onChange={(_, newValue) => {
                onFormDataChange({
                  prodSeriesId: newValue?.id?.toString() || "",
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Production Series *"
                  variant="outlined"
                  size="small"
                />
              )}
            />
          </FormControl>

          <TextField
            label="ID Number *"
            variant="outlined"
            size="small"
            fullWidth
            value={formData.idNumber}
            onChange={(e) =>
              onFormDataChange({ idNumber: e.target.value })
            }
          />

          <TextField
            label="QR Code Number *"
            variant="outlined"
            size="small"
            fullWidth
            value={formData.qrCodeNumber}
            onChange={(e) => onQrCodeChange(e.target.value)}
            placeholder="Scan or enter QR code (12 or 15 digits)"
            error={!!qrCodeError}
            helperText={qrCodeError || "Must be 12 or 15 digits"}
            inputProps={{
              maxLength: 15,
              inputMode: "numeric",
              pattern: "[0-9]*",
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          color="primary"
          variant="contained"
          disabled={
            !formData.prodSeriesId ||
            !formData.idNumber ||
            !formData.qrCodeNumber ||
            !!qrCodeError ||
            (formData.qrCodeNumber.length !== 12 &&
              formData.qrCodeNumber.length !== 15)
          }
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddQrCodeDialog;
