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
} from "@mui/material";
import type { GridItem } from "./types";

interface RejectDialogProps {
  open: boolean;
  selectedRow: GridItem | null;
  rejectRemarks: string;
  duplicateRemarks: string;
  isLoading: boolean;
  onRejectRemarksChange: (value: string) => void;
  onDuplicateRemarksChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

const RejectDialog: React.FC<RejectDialogProps> = ({
  open,
  selectedRow,
  rejectRemarks,
  duplicateRemarks,
  isLoading,
  onRejectRemarksChange,
  onDuplicateRemarksChange,
  onConfirm,
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
        Reject Component
        {selectedRow && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Drawing Number: {selectedRow.drawingNumber} |
            Nomenclature: {selectedRow.nomenclature}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            This action will split the component into two rows:
            <ul style={{ marginTop: 8, marginBottom: 8 }}>
              <li>One rejected row (grayed out and Red color)</li>
              <li>One duplicate row (new row for replacement)</li>
            </ul>
          </Typography>
          <TextField
            label="Remarks for Rejected Row *"
            variant="outlined"
            size="small"
            fullWidth
            multiline
            rows={3}
            value={rejectRemarks}
            onChange={(e) => onRejectRemarksChange(e.target.value)}
            placeholder="Enter remarks for the rejected component"
            required
          />
          <TextField
            label="Remarks for Duplicate Row *"
            variant="outlined"
            size="small"
            fullWidth
            multiline
            rows={3}
            value={duplicateRemarks}
            onChange={(e) => onDuplicateRemarksChange(e.target.value)}
            placeholder="Enter remarks for the duplicate/replacement component"
            required
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={
            !rejectRemarks.trim() ||
            !duplicateRemarks.trim() ||
            isLoading
          }
        >
          Reject Component
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RejectDialog;
