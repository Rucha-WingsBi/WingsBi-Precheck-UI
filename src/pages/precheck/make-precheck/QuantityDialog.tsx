import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  Button,
  Typography,
} from "@mui/material";
import type { QuantityDialogProps } from "./types";

const QuantityDialog: React.FC<QuantityDialogProps> = ({
  open,
  maxQuantity,
  defaultQuantity,
  onClose,
  onConfirm,
  qrCodeNumber,
}) => {
  const [quantity, setQuantity] = useState<number | string>(defaultQuantity);
  const [error, setError] = useState<string>("");

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setQuantity(defaultQuantity);
      setError("");
    }
  }, [open, defaultQuantity]);
  const validateInput = (value: string) => {
    if (value === "") {
      setError("");
      setQuantity("");
      return;
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setError("Please enter a valid number");
      return;
    }
    if (numValue < 0) {
      setError("Quantity must be greater than 0");
      return;
    }
    if (numValue > maxQuantity) {
      setError(`Quantity cannot exceed ${maxQuantity}`);
      return;
    }
    setError("");
    setQuantity(value);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    validateInput(value);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    validateInput(pastedText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow numbers, decimal point, backspace, delete, and arrow keys
    if (
      !/^\d$/.test(e.key) &&
      e.key !== "." &&
      !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(
        e.key,
      ) &&
      !(e.ctrlKey && e.key === "a")
    ) {
      e.preventDefault();
    }
  };

  const handleConfirm = () => {
    const finalQty = Number(quantity);
    if (
      !error &&
      quantity !== "" &&
      !isNaN(finalQty) &&
      finalQty >= 0 &&
      finalQty <= maxQuantity
    ) {
      onConfirm(finalQty);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: "100%",
          maxWidth: 400,
          p: 2,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" component="div">
          Enter Quantity
        </Typography>
      </DialogTitle>
      <DialogContent>
        {qrCodeNumber && (
          <Typography
            variant="body2"
            color="primary"
            sx={{ mb: 1, fontWeight: "bold" }}
          >
            {/* QR Code: {qrCodeNumber} */}
          </Typography>
        )}
        <DialogContentText sx={{ mb: 2 }}>

        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          label="Quantity"
          type="text"
          fullWidth
          value={quantity}
          onChange={handleQuantityChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          error={!!error}
          helperText={error}
          inputProps={{
            inputMode: "decimal",
            pattern: "[0-9]*\\.?[0-9]*",
            min: 0,
            max: maxQuantity,
            style: { fontSize: "1rem" },
          }}
          SelectProps={{
            native: true,
          }}
          variant="outlined"
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: error ? "error.main" : "grey.400",
              },
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ minWidth: 100 }}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={
            !!error ||
            quantity === "" ||
            Number(quantity) < 0 ||
            Number(quantity) > maxQuantity
          }
          variant="contained"
          sx={{ minWidth: 100 }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuantityDialog;
