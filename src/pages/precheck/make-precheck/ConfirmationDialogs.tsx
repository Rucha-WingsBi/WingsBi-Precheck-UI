import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Typography,
  IconButton,
  Box,
} from "@mui/material";
import {
  PhotoCamera as PhotoCameraIcon,
} from "@mui/icons-material";

// ── Batch Warning Dialog ──
interface BatchWarningDialogProps {
  open: boolean;
  onClose: () => void;
}

export const BatchWarningDialog: React.FC<BatchWarningDialogProps> = ({
  open,
  onClose,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        Warning
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Previous QR code is not scanned, scan that QR code first
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          color="primary"
          variant="contained"
          autoFocus
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Reload/Reset Confirmation Dialog ──
interface ReloadConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ReloadConfirmationDialog: React.FC<ReloadConfirmationDialogProps> = ({
  open,
  onClose,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 1,
          width: "300px",
        },
      }}
    >
      <DialogTitle sx={{ fontSize: "1rem", p: 1 }}>
        Unsubmitted Changes
      </DialogTitle>

      <DialogContent sx={{ p: 1 }}>
        <DialogContentText sx={{ fontSize: "0.85rem" }}>
          Please submit remaining precheck.
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ p: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          size="small"
          sx={{
            px: 1.5,
            py: 0.3,
            fontSize: "0.75rem",
            minWidth: "auto",
          }}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Camera Permission Dialog ──
interface CameraPermissionDialogProps {
  open: boolean;
  onClose: () => void;
  onAllow: () => void;
}

export const CameraPermissionDialog: React.FC<CameraPermissionDialogProps> = ({
  open,
  onClose,
  onAllow,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, p: 1 },
      }}
    >
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}
      >
        <PhotoCameraIcon color="primary" />
        <Typography variant="h6" fontWeight="600">
          Camera Access
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ pb: 2 }}>
        <DialogContentText
          sx={{ color: "text.primary", fontSize: "0.95rem" }}
        >
          To scan QR codes, we need your permission to access the camera.
          Would you like to allow access?
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={{ borderRadius: 2, textTransform: "none", px: 3 }}
        >
          Deny
        </Button>
        <Button
          onClick={onAllow}
          color="primary"
          variant="contained"
          autoFocus
          sx={{ borderRadius: 2, textTransform: "none", px: 3, boxShadow: 2 }}
        >
          Allow
        </Button>
      </DialogActions>
    </Dialog>
  );
};
