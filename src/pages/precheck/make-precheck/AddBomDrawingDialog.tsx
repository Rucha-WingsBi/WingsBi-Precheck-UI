import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Autocomplete,
  CircularProgress,
  Alert,
  Typography,
} from "@mui/material";
import api from "../../../services/api";

interface AddBomDrawingDialogProps {
  open: boolean;
  onClose: () => void;
  assemblyItemCode: string;
  assemblyDrawingNumber: string;
  onSuccess: (message?: string) => void;
}

const AddBomDrawingDialog: React.FC<AddBomDrawingDialogProps> = ({
  open,
  onClose,
  assemblyItemCode,
  assemblyDrawingNumber,
  onSuccess,
}) => {
  const [drawings, setDrawings] = React.useState<any[]>([]);
  const [loadingDrawings, setLoadingDrawings] = React.useState(false);
  const [selectedDrawing, setSelectedDrawing] = React.useState<any>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setError(null);
      setSelectedDrawing(null);
      setDrawings([]);

      if (!assemblyDrawingNumber) {
        return;
      }

      setLoadingDrawings(true);
      api
        .post("/api/Common/GetAllAssemblyDrawingMappings", {
          drawingNumber: assemblyDrawingNumber,
          lnItemCode: assemblyItemCode,
        })
        .then((res) => {
          const data = Array.isArray(res.data) ? res.data : [];
          const mapped = data.map((item: any) => ({
            drawingNumber: item.childDrawingNumber || item.drawingNumber || "",
            lnItemCode: item.childLnItemCode || item.lnItemCode || "",
            componentType: item.componentType || item.childComponentType || "",
          }));
          setDrawings(mapped);
        })
        .catch((err) => {
          console.error("Error fetching assembly drawing mappings:", err);
          setError("Failed to fetch drawing numbers.");
          setDrawings([]);
        })
        .finally(() => {
          setLoadingDrawings(false);
        });
    }
  }, [open, assemblyItemCode, assemblyDrawingNumber]);

  const handleSave = () => {
    if (!selectedDrawing) return;

    const childLnItemCode = selectedDrawing.lnItemCode || "";
    const componentType = selectedDrawing.componentType || "";
    setSaving(true);
    setError(null);

    api
      .post("/api/Precheck/addPrecheckComponent", {
        assemblyLnItemCode: assemblyItemCode,
        childLnItemCode,
        componentType,
      })
      .then((res) => {
        const msg = res.data?.message || "Component processed successfully.";
        onSuccess(msg);
        onClose();
      })
      .catch((err) => {
        console.error("Error saving BOM drawing:", err);
        const errMsg =
          err.response?.data?.message ||
          err.message ||
          "Failed to save BOM drawing.";
        setError(errMsg);
      })
      .finally(() => {
        setSaving(false);
      });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      disableEnforceFocus
    >
      <DialogTitle>Add Drawing Number</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1.5 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <TextField
            label="Assembly LN Item Code"
            value={assemblyItemCode}
            disabled
            fullWidth
            size="small"
            variant="outlined"
          />
          <Autocomplete
            openOnFocus
            options={drawings}
            getOptionLabel={(option) => {
              if (typeof option === "string") return option;
              return option.drawingNumber || "";
            }}
            isOptionEqualToValue={(option, value) =>
              (option.drawingNumber === value?.drawingNumber) &&
              (option.lnItemCode === value?.lnItemCode)
            }
            loading={loadingDrawings}
            value={selectedDrawing}
            onChange={(_, newValue) => setSelectedDrawing(newValue)}
            renderOption={(props, option) => {
              const { key, ...optionProps } = props;
              return (
                <li {...optionProps} key={key}>
                  <Box sx={{ display: "flex", flexDirection: "column", py: 0.5 }}>
                    <Typography variant="body2" fontWeight="500">
                      {option.drawingNumber || ""}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.lnItemCode || ""}
                    </Typography>
                  </Box>
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Drawing Number *"
                variant="outlined"
                size="small"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingDrawings ? (
                        <CircularProgress color="inherit" size={16} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary" size="small" disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          color="primary"
          size="small"
          variant="contained"
          disabled={!selectedDrawing || saving}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddBomDrawingDialog;
