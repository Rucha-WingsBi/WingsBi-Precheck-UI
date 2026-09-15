import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { Warning as WarningIcon } from "@mui/icons-material";

interface ExistingQRCodesDialogProps {
  open: boolean;
  onClose: () => void;
  existingItems: any[];
}

const ExistingQRCodesDialog = ({
  open,
  onClose,
  existingItems,
}: ExistingQRCodesDialogProps) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <WarningIcon color="warning" />
        Existing QR Codes Found
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          The following IDs already have QR codes generated in the system.
          Please use the existing ones or check your ID range.
        </DialogContentText>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>ID Number</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>QR Code</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {existingItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.idNumber}</TableCell>
                  <TableCell sx={{ fontFamily: "monospace" }}>
                    {item.qrCodeNumber || item.serialNumber}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExistingQRCodesDialog;
