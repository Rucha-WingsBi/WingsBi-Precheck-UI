import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Autocomplete,
  Alert,
  CircularProgress,
} from "@mui/material";
import type { GridItem } from "./types";

interface AddMaterialRequisitionDialogProps {
  open: boolean;
  selectedRow: GridItem | null;
  selectedPO: any;
  selectedProductionSeries: any;
  allDrawingNumbers: any[];
  poNumbersData: any[];
  productionSeriesData: any[];
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
}

const REASON_OPTIONS = [
  "Rejected",
  "Rework",
  "Misplaced",
  "Raw Material Defect",
];

const textFieldStyle = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    fontSize: "0.85rem",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#D0D5DD",
    },
    "&:hover fieldset": {
      borderColor: "#6D2A8F",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#6D2A8F",
      borderWidth: "1.5px",
    },
  },
  "& .MuiInputLabel-root": {
    fontSize: "0.85rem",
    color: "#667085",
    "&.Mui-focused": {
      color: "#6D2A8F",
    },
  },
  "& .MuiOutlinedInput-input": {
    fontSize: "0.85rem",
    color: "#344054",
  },
};

const AddMaterialRequisitionDialog: React.FC<AddMaterialRequisitionDialogProps> = ({
  open,
  selectedRow,
  selectedPO,
  selectedProductionSeries,
  allDrawingNumbers,
  poNumbersData,
  productionSeriesData,
  onClose,
  onSubmit,
}) => {
  const [selectedRejectedDrawing, setSelectedRejectedDrawing] = useState<any>(null);
  const [rejectedItemDescription, setRejectedItemDescription] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [rejectedIdNumber, setRejectedIdNumber] = useState("");

  const [selectedAssemblyPO, setSelectedAssemblyPO] = useState<any>(null);
  const [assemblyItemCode, setAssemblyItemCode] = useState("");
  const [selectedAssemblyPartNumber, setSelectedAssemblyPartNumber] = useState<any>(null);
  const [selectedAssemblyProdSeries, setSelectedAssemblyProdSeries] = useState<any>(null);

  const [assemblyIdNumber, setAssemblyIdNumber] = useState("");
  const [reasonForRejection, setReasonForRejection] = useState("");
  const [remarks, setRemarks] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && selectedRow) {
      setError("");

      // 1. Rejected part Part Number
      const foundRejectedDwg =
        allDrawingNumbers.find(
          (d: any) =>
            (selectedRow.drawingNumberId && d.id === selectedRow.drawingNumberId) ||
            (d.drawingNumber &&
              selectedRow.drawingNumber &&
              String(d.drawingNumber).trim().toLowerCase() === String(selectedRow.drawingNumber).trim().toLowerCase())
        ) ||
        (selectedRow.drawingNumber
          ? {
            id: selectedRow.drawingNumberId || 0,
            drawingNumber: selectedRow.drawingNumber,
            lnItemCode: selectedRow.lnItemCode || "",
          }
          : null);
      setSelectedRejectedDrawing(foundRejectedDwg);

      // 2. Rejected part Item Description
      setRejectedItemDescription(selectedRow.nomenclature || selectedRow.itemDescription || "");

      // 3. Quantity
      setQuantity(selectedRow.scannedQuantity || selectedRow.quantity || 1);

      // 4. Rejected Part ID Number
      setRejectedIdNumber(selectedRow.idNumber || "");

      // 5. Assembly PO Number
      const foundPO =
        poNumbersData.find(
          (po: any) =>
            typeof po !== "string" &&
            selectedPO?.productionOrderNumber &&
            po.productionOrderNumber === selectedPO.productionOrderNumber
        ) || selectedPO;
      setSelectedAssemblyPO(foundPO || null);

      // 6. Assembly Item Code
      setAssemblyItemCode(
        selectedPO?.lnItemCode || selectedPO?.lnitemcode || selectedRow.assemblyLnItemCode || ""
      );

      // 7. Assembly Part Number
      const foundAssemblyDwg =
        allDrawingNumbers.find(
          (d: any) =>
            (selectedPO?.drawingNumberId && d.id === selectedPO.drawingNumberId) ||
            (selectedPO?.drawingNumber &&
              d.drawingNumber &&
              String(d.drawingNumber).trim().toLowerCase() === String(selectedPO.drawingNumber).trim().toLowerCase())
        ) ||
        (selectedPO?.drawingNumber
          ? { id: selectedPO?.drawingNumberId || 0, drawingNumber: selectedPO.drawingNumber }
          : null);
      setSelectedAssemblyPartNumber(foundAssemblyDwg);

      // 8. Assembly Production Series
      const foundProdSeries =
        productionSeriesData.find(
          (ps: any) =>
            (selectedProductionSeries?.id && ps.id === selectedProductionSeries.id) ||
            (selectedPO?.prodSeriesId && ps.id === selectedPO.prodSeriesId) ||
            (selectedPO?.productionSeries && ps.productionSeries === selectedPO.productionSeries)
        ) || selectedProductionSeries;
      setSelectedAssemblyProdSeries(foundProdSeries || null);

      // 9. Assembly ID Number
      setAssemblyIdNumber(
        selectedPO?.startIdNumber !== undefined && selectedPO?.startIdNumber !== null
          ? String(selectedPO.startIdNumber)
          : selectedRow.idNumber !== undefined && selectedRow.idNumber !== null
          ? String(selectedRow.idNumber)
          : ""
      );

      // 10. Reason for Rejection & 11. Remarks
      setReasonForRejection("");
      setRemarks("");
    }
  }, [open, selectedRow]);

  const handleCreate = async () => {
    setError("");
    const rejDwgId =
      selectedRejectedDrawing?.id ||
      selectedRejectedDrawing?.drawingNumberId ||
      selectedRow?.drawingNumberId ||
      0;
    const asmDwgId =
      selectedAssemblyPartNumber?.id ||
      selectedAssemblyPO?.drawingNumberId ||
      0;
    const prodSeriesId =
      selectedAssemblyProdSeries?.id ||
      selectedAssemblyPO?.prodSeriesId ||
      0;

    if (!rejDwgId) {
      setError("Please select Rejected part Part Number.");
      return;
    }
    if (!rejectedIdNumber && selectedRow?.componentType?.toUpperCase() === "ID") {
      setError("Please enter Rejected Part ID Number.");
      return;
    }

    try {
      setIsSubmitting(true);
      const poNumberStr = String(
        selectedAssemblyPO?.productionOrderNumber ||
        selectedPO?.productionOrderNumber ||
        ""
      );

      const payload = {
        assemblyDrawingNumberId: asmDwgId,
        idNumber: String(assemblyIdNumber || selectedAssemblyPO?.startIdNumber || selectedPO?.startIdNumber || selectedRow?.idNumber || "1"),
        lnitemcode: String(assemblyItemCode || selectedAssemblyPO?.lnItemCode || selectedPO?.lnItemCode || ""),
        nomenclature: String(rejectedItemDescription || selectedRow?.nomenclature || ""),
        prodSeriesId: prodSeriesId,
        productionOrderNumber: poNumberStr,
        quantity: Number(quantity || 1),
        reasonForRejection: String(reasonForRejection || ""),
        rejectedDrawingNumberId: rejDwgId,
        rejectedIdNumber: String(rejectedIdNumber || selectedRow?.idNumber || ""),
        remarks: String(remarks || ""),
        status: "Pending-Planner",
      };

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setError(err?.message || err || "Failed to create material requisition");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "12px",
          p: 0.5,
        },
      }}
    >
      <DialogTitle sx={{ color: "#6D2A8F", fontWeight: 700, fontSize: "1.15rem", pb: 1, pt: 2, px: 3 }}>
        Add New Material Requisition
      </DialogTitle>
      <DialogContent sx={{ maxHeight: "70vh", overflowY: "auto", py: 1, px: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: "8px" }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        <Grid container spacing={2} sx={{ pt: 1 }}>
          {/* 1. Rejected part Part Number * */}
          <Grid item xs={12}>
            <Autocomplete
              size="small"
              options={allDrawingNumbers}
              getOptionLabel={(option) =>
                typeof option === "string"
                  ? option
                  : `${option.drawingNumber || ""} ${option.lnItemCode ? `- ${option.lnItemCode}` : ""}`
              }
              value={selectedRejectedDrawing}
              onChange={(_, newValue) => {
                setSelectedRejectedDrawing(newValue);
                if (newValue && typeof newValue !== "string") {
                  if (newValue.nomenclature || newValue.itemDescription) {
                    setRejectedItemDescription(newValue.nomenclature || newValue.itemDescription || "");
                  }
                }
              }}
              isOptionEqualToValue={(option, value) =>
                option?.id === value?.id || option?.drawingNumber === value?.drawingNumber
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Rejected part Part Number *"
                  fullWidth
                  size="small"
                  sx={textFieldStyle}
                />
              )}
            />
          </Grid>

          {/* 2. Rejected part Item Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Rejected part Item Description"
              value={rejectedItemDescription}
              onChange={(e) => setRejectedItemDescription(e.target.value)}
              sx={textFieldStyle}
            />
          </Grid>

          {/* 3. Quantity */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              sx={textFieldStyle}
            />
          </Grid>

          {/* 4. Rejected Part ID Number * */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Rejected Part ID Number *"
              value={rejectedIdNumber}
              onChange={(e) => setRejectedIdNumber(e.target.value)}
              sx={textFieldStyle}
            />
          </Grid>

          {/* 5. Assembly PO Number * */}
          <Grid item xs={12}>
            <Autocomplete
              size="small"
              options={poNumbersData}
              getOptionLabel={(option) =>
                typeof option === "string" ? option : option.productionOrderNumber || ""
              }
              value={selectedAssemblyPO}
              onChange={(_, newValue) => {
                setSelectedAssemblyPO(newValue);
                if (newValue && typeof newValue !== "string") {
                  setAssemblyItemCode(newValue.lnItemCode || newValue.lnitemcode || "");
                  if (newValue.drawingNumber) {
                    const foundDwg = allDrawingNumbers.find(
                      (d) => d.id === newValue.drawingNumberId || d.drawingNumber === newValue.drawingNumber
                    );
                    if (foundDwg) setSelectedAssemblyPartNumber(foundDwg);
                  }
                  if (newValue.prodSeriesId) {
                    const foundPs = productionSeriesData.find((ps) => ps.id === newValue.prodSeriesId);
                    if (foundPs) setSelectedAssemblyProdSeries(foundPs);
                  }
                  if (newValue.startIdNumber !== undefined && newValue.startIdNumber !== null) {
                    setAssemblyIdNumber(String(newValue.startIdNumber));
                  }
                }
              }}
              isOptionEqualToValue={(option, value) =>
                option?.productionOrderNumber === value?.productionOrderNumber
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assembly PO Number *"
                  fullWidth
                  size="small"
                  sx={textFieldStyle}
                />
              )}
            />
          </Grid>

          {/* 6. Assembly Item Code */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Assembly Item Code"
              value={assemblyItemCode}
              onChange={(e) => setAssemblyItemCode(e.target.value)}
              sx={textFieldStyle}
            />
          </Grid>

          {/* 7. Assembly Part Number */}
          <Grid item xs={12}>
            <Autocomplete
              size="small"
              options={allDrawingNumbers}
              getOptionLabel={(option) =>
                typeof option === "string" ? option : option.drawingNumber || ""
              }
              value={selectedAssemblyPartNumber}
              onChange={(_, newValue) => setSelectedAssemblyPartNumber(newValue)}
              isOptionEqualToValue={(option, value) =>
                option?.id === value?.id || option?.drawingNumber === value?.drawingNumber
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assembly Part Number"
                  fullWidth
                  size="small"
                  sx={textFieldStyle}
                />
              )}
            />
          </Grid>

          {/* 8. Assembly Production Series * */}
          <Grid item xs={12}>
            <Autocomplete
              size="small"
              options={productionSeriesData}
              getOptionLabel={(option) => (typeof option === "string" ? option : option.productionSeries || "")}
              value={selectedAssemblyProdSeries}
              onChange={(_, newValue) => setSelectedAssemblyProdSeries(newValue)}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assembly Production Series *"
                  fullWidth
                  size="small"
                  sx={textFieldStyle}
                />
              )}
            />
          </Grid>

          {/* 9. Assembly ID Number * */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Assembly ID Number *"
              value={assemblyIdNumber}
              onChange={(e) => setAssemblyIdNumber(e.target.value)}
              sx={textFieldStyle}
            />
          </Grid>

          {/* 10. Reason for Rejection */}
          <Grid item xs={12}>
            <Autocomplete
              size="small"
              options={REASON_OPTIONS}
              value={reasonForRejection || null}
              onChange={(_, newValue) => setReasonForRejection(newValue || "")}
              isOptionEqualToValue={(option, value) => option === value}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Reason for Rejection"
                  fullWidth
                  size="small"
                  sx={textFieldStyle}
                />
              )}
            />
          </Grid>

          {/* 11. Remarks */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              sx={textFieldStyle}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 1.5, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={isSubmitting}
          sx={{
            borderRadius: "8px",
            px: 3,
            height: 38,
            borderColor: "#D0D5DD",
            color: "#344054",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.85rem",
            "&:hover": { borderColor: "#98A2B3", backgroundColor: "#F9FAFB" },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{
            borderRadius: "8px",
            px: 3,
            height: 38,
            backgroundColor: "#6D2A8F",
            color: "#ffffff",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.85rem",
            boxShadow: "none",
            "&:hover": { backgroundColor: "#571F73", boxShadow: "none" },
          }}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddMaterialRequisitionDialog;
