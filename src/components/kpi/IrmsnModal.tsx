import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  Grid,
  Paper,
  IconButton,
} from "@mui/material";
import {
  Close as CloseIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  VerifiedUser as VerifiedIcon,
  ReportProblem as WarningIcon,
  SwapHoriz as SwapIcon,
  QrCode2 as QrCodeIcon,
  Verified as ShieldCheckIcon,
} from "@mui/icons-material";
import type { IrMsnDocumentDetails } from "../../types/kpiDashboard";

interface IrmsnModalProps {
  open: boolean;
  onClose: () => void;
  document: IrMsnDocumentDetails | null;
}

export const IrmsnModal: React.FC<IrmsnModalProps> = ({ open, onClose, document }) => {
  if (!document) return null;

  const isRejected = document.outcome === "Rejected";
  const isSwapped = document.outcome === "Swapped";
  const isPending = document.outcome === "Pending";
  const isInProgress = document.outcome === "In Progress";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      {/* Header Banner */}
      <DialogTitle
        sx={{
          background: isRejected
            ? "linear-gradient(135deg, #1e1e2d 0%, #3a0d14 100%)"
            : isSwapped
            ? "linear-gradient(135deg, #1e1e2d 0%, #3a2500 100%)"
            : isPending
            ? "linear-gradient(135deg, #1e1e2d 0%, #431407 100%)"
            : isInProgress
            ? "linear-gradient(135deg, #1e1e2d 0%, #0c4a6e 100%)"
            : "linear-gradient(135deg, #1e1e2d 0%, #0d2818 100%)",
          color: "#fff",
          p: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              bgcolor: isRejected
                ? "#f44336"
                : isSwapped
                ? "#ff9800"
                : isPending
                ? "#ea580c"
                : isInProgress
                ? "#0284c7"
                : "#4caf50",
              color: "#fff",
              p: 1,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isRejected ? <WarningIcon /> : isSwapped ? <SwapIcon /> : <VerifiedIcon />}
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", letterSpacing: 1, textTransform: "uppercase" }}>
              Digital Traceability Artifact
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {document.docType === "IR" ? "Inspection Record (IR) " : "Material Serial Record (MSN) "} #{document.docNumber}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "#fff" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: "#fafafa" }}>
        {/* Compliance Ribbon */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            bgcolor: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ShieldCheckIcon sx={{ color: "primary.main" }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
              AS9100 / IATF 16949 / ISO 13485 Verified Precheck Record
            </Typography>
          </Box>
          <Chip label={`Industry: ${document.industry || "Automotive/EV"}`} size="small" variant="outlined" color="primary" />
        </Paper>

        <Grid container spacing={2}>
          {/* Item Identification Block */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 2.5, bgcolor: "#fff", border: "1px solid #e0e0e0", borderRadius: 2, height: "100%" }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 700, mb: 1.5 }}>
                Component Identification
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <QrCodeIcon color="action" />
                <Typography variant="body1" sx={{ fontFamily: "monospace", fontWeight: 700, color: "primary.main" }}>
                  {document.qrId}
                </Typography>
                <Chip label={document.componentType} size="small" color="secondary" />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {document.partDescription}
              </Typography>
              {document.drawingNumber && (
                <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main", display: "block" }}>
                  Drawing Number: {document.drawingNumber}
                </Typography>
              )}
              {document.lnItemCode && (
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#6D2A8F", display: "block" }}>
                  LN Item Code: {document.lnItemCode}
                </Typography>
              )}
              {document.nomenclature && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Nomenclature: {document.nomenclature}
                </Typography>
              )}
              {document.batchLotNumber && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Batch / Lot ID: {document.batchLotNumber}
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Context & PO Info */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 2.5, bgcolor: "#fff", border: "1px solid #e0e0e0", borderRadius: 2, height: "100%" }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 700, mb: 1.5 }}>
                Production Order & Assembly
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {document.poNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Assembly: {document.assemblyName}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="caption" color="text.secondary" display="block">
                Inspection Timestamp: {document.timestamp}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Inspected By: {document.inspectorName} ({document.inspectorRole})
              </Typography>
            </Paper>
          </Grid>

          {/* Outcome Details & Rejection / Swap Details */}
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                bgcolor: isRejected
                  ? "#fff5f5"
                  : isSwapped
                  ? "#fffbe6"
                  : isPending
                  ? "#fff7ed"
                  : isInProgress
                  ? "#f0f9ff"
                  : "#f6ffed",
                border: `1px solid ${
                  isRejected
                    ? "#ffccc7"
                    : isSwapped
                    ? "#ffe58f"
                    : isPending
                    ? "#ffedd5"
                    : isInProgress
                    ? "#bae6fd"
                    : "#b7eb8f"
                }`,
                borderRadius: 2,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: isRejected
                    ? "#cf1322"
                    : isSwapped
                    ? "#d46b08"
                    : isPending
                    ? "#c2410c"
                    : isInProgress
                    ? "#0369a1"
                    : "#389e0d",
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                Verification Outcome: {document.outcome}
              </Typography>

              {isRejected && (
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#cf1322" }}>
                    Rejection Root Cause: {document.rejectionReason}
                  </Typography>
                </Box>
              )}

              {isSwapped && (
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#d46b08" }}>
                    Component Transfer: {document.sourcePo || document.poNumber} &rarr; {document.targetPo || "PO-2026-EV09"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
                    Inter-Order Authorization: Approved by {document.inspectorName}. Live inventory reconciliation updated.
                  </Typography>
                </Box>
              )}

              {isPending && (
                <Typography variant="body2" sx={{ color: "#c2410c", fontWeight: 600 }}>
                  Precheck queue pending. Component awaiting physical QR scan & QC verification.
                </Typography>
              )}

              {isInProgress && (
                <Typography variant="body2" sx={{ color: "#0369a1", fontWeight: 600 }}>
                  Active verification in progress. Live BOM comparison undergoing dimensional check.
                </Typography>
              )}

              {!isRejected && !isSwapped && !isPending && !isInProgress && (
                <Typography variant="body2" sx={{ color: "#389e0d" }}>
                  Component matched 100% against live BOM specification. Assembly issue authorization granted.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, bgcolor: "#fff", borderTop: "1px solid #e0e0e0", justifyContent: "space-between" }}>
        <Typography variant="caption" color="text.secondary">
          Security Hash: SHA256-8F92A0149C
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()} size="small">
            Print Document
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={() => {
              alert(`Simulated PDF download for document ${document.docNumber}`);
            }}
            size="small"
          >
            Download Digital Artifact
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};
