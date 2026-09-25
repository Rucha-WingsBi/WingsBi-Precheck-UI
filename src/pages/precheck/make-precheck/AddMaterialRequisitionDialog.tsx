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
    }
  }, [open, selectedRow, selectedPO, selectedProductionSeries, allDrawingNumbers, poNumbersData, productionSeriesData]);

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
      const payload = {
        rejectedDrawingNumberId: rejDwgId,
        prodSeriesId: prodSeriesId,
        idNumber: String(rejectedIdNumber || selectedRow?.idNumber || ""),
        remarks: `Rejected from Make Precheck: ${selectedRow?.drawingNumber || ""}`,
        quantity: Number(quantity || 1),
        nomenclature: String(rejectedItemDescription || selectedRow?.nomenclature || ""),
        assemblyDrawingNumberId: asmDwgId,
        lnitemcode: String(assemblyItemCode || selectedAssemblyPO?.lnItemCode || ""),
        reasonForRejection: `Rejected component ${selectedRow?.drawingNumber || ""}`,
        rejectedIdNumber: String(rejectedIdNumber || selectedRow?.idNumber || ""),
        status: "Pending",
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
          borderRadius: "16px",
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ color: "#7E22CE", fontWeight: 700, fontSize: "1.25rem", pb: 1, pt: 2.5, px: 3 }}>
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
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
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
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
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
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
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
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
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
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
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
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
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
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
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
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                />
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={isSubmitting}
          sx={{
            borderRadius: "10px",
            px: 3,
            height: 38,
            borderColor: "#D0D5DD",
            color: "#344054",
            textTransform: "none",
            fontWeight: 600,
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
            borderRadius: "10px",
            px: 3,
            height: 38,
            backgroundColor: "#7E22CE",
            color: "#ffffff",
            textTransform: "none",
            fontWeight: 600,
            "&:hover": { backgroundColor: "#6B21A8" },
          }}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddMaterialRequisitionDialog;
