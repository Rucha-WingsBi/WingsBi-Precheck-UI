import React from "react";
import {
  Box,
  Card,
  Typography,
  TextField,
  Paper,
  Chip,
  Stack,
  Divider,
  Grid,
} from "@mui/material";
import { QrCode as QrCodeIcon } from "@mui/icons-material";
import type { DrawingNumber } from "../../../types";

interface LabelPreviewPanelProps {
  // Master data display
  selectedDrawing: DrawingNumber | null;
  componentType: string;
  formatComponentType: (type: string | undefined | null) => string;
  watchNomenclature: string;
  watchProjectNumber: string;
  watchBuildNumber: string;
  watchLocation: string;
  watchFanManNumber?: string;
  watchGfnNo?: string;
  watchMaterial?: string;
  // Label Preview state
  previewQrInput: string;
  onPreviewQrInputChange: (value: string) => void;
  fetchedPreviewItem: any | null;
  labelQrDataUrl: string;
  labelQrText: string;
  // Form watch values for label fallback
  watchDrawingNumber: string;
  watchDesposition: string;
  watchProductionSeries: string;
  watchUnit: string;
  watchQuantity: number;
  watchMrirNumber: string;
  watchMfgDate: any;
  watchExpiryDate: any;
  watchIdType: string;
  watchStartRange: number;
  watchEndRange: number;
  watchCustomIdRange: string;
  watchBatchId: string;
  noExpiryDate: boolean;
  userName: string;
}

const LabelPreviewPanel = ({
  selectedDrawing,
  componentType,
  formatComponentType,
  watchNomenclature,
  watchProjectNumber,
  watchBuildNumber,
  watchLocation,
  watchFanManNumber,
  watchGfnNo,
  watchMaterial,
  previewQrInput,
  onPreviewQrInputChange,
  fetchedPreviewItem,
  labelQrDataUrl,
  labelQrText,
  watchDrawingNumber,
  watchDesposition,
  watchProductionSeries,
  watchUnit,
  watchQuantity,
  watchMrirNumber,
  watchMfgDate,
  watchExpiryDate,
  watchIdType,
  watchStartRange,
  watchEndRange,
  watchCustomIdRange,
  watchBatchId,
  noExpiryDate,
  userName,
}: LabelPreviewPanelProps) => {
  const isIdOrBatch = componentType === "ID" || componentType === "BATCH" || componentType === "Batch";
  const isFIM = componentType === "FIM";
  const isSI = componentType === "SI" || componentType === "Purchase Item" || componentType === "PURCHASE ITEM";

  return (
    <Grid item xs={12} lg={3.5}>
      {/* 1. MASTER DATA QUICK DISPLAY PANEL */}
      <Card
        variant="outlined"
        sx={{
          borderRadius: "10px",
          borderColor: "#EAECF0",
          backgroundColor: "#FFFFFF",
          p: 2,
          mb: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#64748B",
            mb: 1.5,
            display: "block",
          }}
        >
          Master Data Details
        </Typography>

        <Stack spacing={1.25}>

          {/* Nomenclature */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              py: 0.5,
              borderBottom: "1px dashed #E2E8F0",
            }}
          >
            <Typography variant="caption" sx={{ color: "#64748B" }}>
              Nomenclature
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: "#0F172A",
                textAlign: "right",
                maxWidth: "60%",
              }}
            >
              {selectedDrawing?.nomenclature || watchNomenclature || "—"}
            </Typography>
          </Box>

          {/* Component Type */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              py: 0.5,
              borderBottom: "1px dashed #E2E8F0",
            }}
          >
            <Typography variant="caption" sx={{ color: "#64748B" }}>
              Component Type
            </Typography>
            <Chip
              label={formatComponentType(
                selectedDrawing?.componentType || componentType,
              )}
              size="small"
              sx={{
                height: 20,
                fontSize: "0.7rem",
                fontWeight: 700,
                backgroundColor: "#F1F5F9",
                color: "#475569",
              }}
            />
          </Box>

          {/* Available For */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="body2" sx={{ color: "#6B7280", fontSize: "0.825rem" }}>
              Available For
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: "#111827", fontSize: "0.825rem" }}
            >
              {selectedDrawing?.availableFor || "—"}
            </Typography>
          </Box>

          {/* Project No. — Shown only for ID/BATCH or when available */}
          {(isIdOrBatch || (watchProjectNumber && watchProjectNumber !== "—")) && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="body2" sx={{ color: "#6B7280", fontSize: "0.825rem" }}>
                Project No.
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#111827", fontSize: "0.825rem" }}
              >
                {watchProjectNumber || "—"}
              </Typography>
            </Box>
          )}

          {/* Build No. — Shown only for ID/BATCH or when available */}
          {(isIdOrBatch || (watchBuildNumber && watchBuildNumber !== "—")) && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="body2" sx={{ color: "#6B7280", fontSize: "0.825rem" }}>
                Build No.
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#111827", fontSize: "0.825rem" }}
              >
                {watchBuildNumber || "—"}
              </Typography>
            </Box>
          )}

          {/* FAN/MAN No. — FIM Specific */}
          {isFIM && !!watchFanManNumber && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="body2" sx={{ color: "#6B7280", fontSize: "0.825rem" }}>
                FAN/MAN No.
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#111827", fontSize: "0.825rem" }}
              >
                {watchFanManNumber}
              </Typography>
            </Box>
          )}

          {/* GFN No. — FIM Specific */}
          {isFIM && !!watchGfnNo && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="body2" sx={{ color: "#6B7280", fontSize: "0.825rem" }}>
                GFN No.
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#111827", fontSize: "0.825rem" }}
              >
                {watchGfnNo}
              </Typography>
            </Box>
          )}

          {/* Material Spec — Purchase Item (SI) Specific */}
          {isSI && !!watchMaterial && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="body2" sx={{ color: "#6B7280", fontSize: "0.825rem" }}>
                Material Spec
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#111827", fontSize: "0.825rem" }}
              >
                {watchMaterial}
              </Typography>
            </Box>
          )}

          {/* Location */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="body2" sx={{ color: "#6B7280", fontSize: "0.825rem" }}>
              Location
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: "#111827", fontSize: "0.825rem" }}
            >
              {watchLocation || selectedDrawing?.location || "—"}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 1.25, borderColor: "#EAECF0" }} />

        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, color: "#111827", fontSize: "0.95rem" }}
        >
          Label preview
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "#6B7280", display: "block", mb: 1, fontSize: "0.78rem" }}
        >
          Enter QR code number to see preview
        </Typography>
        <TextField
          size="small"
          fullWidth
          label="Enter QR Code Number"
          placeholder="Enter QR Code to preview..."
          value={previewQrInput}
          onChange={(e) => onPreviewQrInputChange(e.target.value)}
          sx={{ mb: 1.5 }}
        />

        {previewQrInput.trim() !== "" || fetchedPreviewItem !== null ? (
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: "10px",
              border: "1px solid #CBD5E1",
              backgroundColor: "#FFFFFF",
              boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
            }}
          >
            {/* Label Header Badge */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                pb: 1,
                mb: 1,
                borderBottom: "1px dashed #E2E8F0",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <QrCodeIcon sx={{ fontSize: 16, color: "primary.main" }} />
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, letterSpacing: "0.5px", color: "primary.main", fontSize: "0.75rem" }}
                >
                  QR CODE LABEL
                </Typography>
              </Box>
              <Chip
                label={
                  fetchedPreviewItem?.desposition ||
                  fetchedPreviewItem?.Desposition ||
                  fetchedPreviewItem?.disposition ||
                  fetchedPreviewItem?.Disposition ||
                  fetchedPreviewItem?.qrCodeStatus ||
                  fetchedPreviewItem?.QrCodeStatus ||
                  watchDesposition ||
                  "Accepted"
                }
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  backgroundColor:
                    (fetchedPreviewItem?.desposition || fetchedPreviewItem?.disposition || fetchedPreviewItem?.qrCodeStatus || watchDesposition) === "Rejected"
                      ? "#FEF2F2"
                      : (fetchedPreviewItem?.desposition || fetchedPreviewItem?.disposition || fetchedPreviewItem?.qrCodeStatus || watchDesposition) === "Used for QT"
                        ? "#F3E8FF"
                        : "#ECFDF5",
                  color:
                    (fetchedPreviewItem?.desposition || fetchedPreviewItem?.disposition || fetchedPreviewItem?.qrCodeStatus || watchDesposition) === "Rejected"
                      ? "#DC2626"
                      : (fetchedPreviewItem?.desposition || fetchedPreviewItem?.disposition || fetchedPreviewItem?.qrCodeStatus || watchDesposition) === "Used for QT"
                        ? "#7E22CE"
                        : "#047857",
                }}
              />
            </Box>

            {/* Label Body: QR Code & Details */}
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
              {/* QR Image Box */}
              <Box
                sx={{
                  width: 85,
                  height: 85,
                  borderRadius: "6px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#F8FAFC",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  p: 0.5,
                }}
              >
                {labelQrDataUrl ? (
                  <img
                    src={labelQrDataUrl}
                    alt="QR Code Preview"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                ) : (
                  <QrCodeIcon sx={{ fontSize: 44, color: "#94A3B8" }} />
                )}
              </Box>

              {/* Details Grid */}
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: "#0F172A",
                    fontSize: "0.85rem",
                    lineHeight: 1.2,
                    mb: 0.25,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {fetchedPreviewItem?.drawingNumber ||
                    fetchedPreviewItem?.DrawingNumber ||
                    fetchedPreviewItem?.drawingNo ||
                    fetchedPreviewItem?.DrawingNo ||
                    fetchedPreviewItem?.assemblyDrawingNo ||
                    fetchedPreviewItem?.AssemblyDrawingNo ||
                    watchDrawingNumber ||
                    selectedDrawing?.drawingNumber ||
                    "DRW-XXXX"}
                </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    color: "#475569",
                    display: "block",
                    fontSize: "0.725rem",
                    lineHeight: 1.2,
                    mb: 0.5,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {fetchedPreviewItem?.nomenclature ||
                    fetchedPreviewItem?.Nomenclature ||
                    fetchedPreviewItem?.drawingNomenclature ||
                    fetchedPreviewItem?.DrawingNomenclature ||
                    fetchedPreviewItem?.projectDescription ||
                    fetchedPreviewItem?.ProjectDescription ||
                    watchNomenclature ||
                    selectedDrawing?.nomenclature ||
                    "—"}
                </Typography>

                <Typography
                  variant="caption"
                  sx={{ color: "primary.main", display: "block", fontSize: "0.725rem", fontWeight: 700, lineHeight: 1.3 }}
                >
                  <strong>QR Code:</strong> {previewQrInput.trim() || fetchedPreviewItem?.qrCodeNumber || fetchedPreviewItem?.QrCodeNumber || fetchedPreviewItem?.serialNumber || fetchedPreviewItem?.SerialNumber || fetchedPreviewItem?.qrCode || fetchedPreviewItem?.QrCode || labelQrText}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#64748B", display: "block", fontSize: "0.725rem", lineHeight: 1.3 }}
                >
                  <strong>LN:</strong> {fetchedPreviewItem?.lnItemCode || fetchedPreviewItem?.LnItemCode || fetchedPreviewItem?.lnCode || fetchedPreviewItem?.LnCode || selectedDrawing?.lnItemCode || "—"}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#64748B", display: "block", fontSize: "0.725rem", lineHeight: 1.3 }}
                >
                  <strong>Series:</strong> {fetchedPreviewItem?.productionSeries || fetchedPreviewItem?.ProductionSeries || fetchedPreviewItem?.prodSeries || fetchedPreviewItem?.ProdSeries || fetchedPreviewItem?.series || fetchedPreviewItem?.Series || watchProductionSeries || "—"}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#64748B", display: "block", fontSize: "0.725rem", lineHeight: 1.3 }}
                >
                  <strong>ID Number:</strong>{" "}
                  {(fetchedPreviewItem?.idNumber !== undefined && fetchedPreviewItem?.idNumber !== null && fetchedPreviewItem?.idNumber !== "" ? String(fetchedPreviewItem.idNumber) : null) ||
                    (fetchedPreviewItem?.IdNumber !== undefined && fetchedPreviewItem?.IdNumber !== null && fetchedPreviewItem?.IdNumber !== "" ? String(fetchedPreviewItem.IdNumber) : null) ||
                    (fetchedPreviewItem?.idNo !== undefined && fetchedPreviewItem?.idNo !== null && fetchedPreviewItem?.idNo !== "" ? String(fetchedPreviewItem.idNo) : null) ||
                    (fetchedPreviewItem?.IdNo !== undefined && fetchedPreviewItem?.IdNo !== null && fetchedPreviewItem?.IdNo !== "" ? String(fetchedPreviewItem.IdNo) : null) ||
                    (fetchedPreviewItem?.idNumbers !== undefined && fetchedPreviewItem?.idNumbers !== null && fetchedPreviewItem?.idNumbers !== "" ? String(fetchedPreviewItem.idNumbers) : null) ||
                    (fetchedPreviewItem?.IdNumbers !== undefined && fetchedPreviewItem?.IdNumbers !== null && fetchedPreviewItem?.IdNumbers !== "" ? String(fetchedPreviewItem.IdNumbers) : null) ||
                    (fetchedPreviewItem?.id !== undefined && fetchedPreviewItem?.id !== null && fetchedPreviewItem?.id !== "" ? String(fetchedPreviewItem.id) : null) ||
                    (componentType === "ID"
                      ? watchIdType === "series"
                        ? `${watchStartRange || 0} - ${watchEndRange || 0}`
                        : watchCustomIdRange || "Custom ID"
                      : componentType === "BATCH"
                        ? watchBatchId || watchCustomIdRange || "BATCH-001"
                        : "1")}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#64748B", display: "block", fontSize: "0.725rem", lineHeight: 1.3 }}
                >
                  <strong>User Name:</strong> {fetchedPreviewItem?.users || fetchedPreviewItem?.Users || fetchedPreviewItem?.userName || fetchedPreviewItem?.UserName || fetchedPreviewItem?.createdByName || fetchedPreviewItem?.CreatedByName || (fetchedPreviewItem?.createdBy ? String(fetchedPreviewItem.createdBy) : null) || (fetchedPreviewItem?.CreatedBy ? String(fetchedPreviewItem.CreatedBy) : null) || userName || "—"}
                </Typography>
              </Box>
            </Box>

            {/* Label Footer */}
            <Box
              sx={{
                mt: 1,
                pt: 0.75,
                borderTop: "1px solid #F1F5F9",
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#64748B",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Qty: {fetchedPreviewItem?.quantity ?? fetchedPreviewItem?.Quantity ?? (watchQuantity || 1)} {fetchedPreviewItem?.unit || fetchedPreviewItem?.Unit || fetchedPreviewItem?.unitName || fetchedPreviewItem?.UnitName || watchUnit || "ECH"} {(fetchedPreviewItem?.mrirNumber || fetchedPreviewItem?.MrirNumber || fetchedPreviewItem?.mirir || fetchedPreviewItem?.Mirir || fetchedPreviewItem?.mrir || fetchedPreviewItem?.Mrir || watchMrirNumber) ? `| MRIR: ${fetchedPreviewItem?.mrirNumber || fetchedPreviewItem?.MrirNumber || fetchedPreviewItem?.mirir || fetchedPreviewItem?.Mirir || fetchedPreviewItem?.mrir || fetchedPreviewItem?.Mrir || watchMrirNumber}` : ""}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{ color: "#64748B", fontSize: "0.68rem", fontWeight: 600 }}
                >
                  <strong>MFG Date:</strong> {(fetchedPreviewItem?.manufacturingDate || fetchedPreviewItem?.ManufacturingDate || fetchedPreviewItem?.mfgDate || fetchedPreviewItem?.MfgDate || fetchedPreviewItem?.createdDate || fetchedPreviewItem?.CreatedDate) ? new Date(fetchedPreviewItem.manufacturingDate || fetchedPreviewItem.ManufacturingDate || fetchedPreviewItem.mfgDate || fetchedPreviewItem.MfgDate || fetchedPreviewItem.createdDate || fetchedPreviewItem.CreatedDate).toLocaleDateString("en-GB") : (watchMfgDate ? new Date(watchMfgDate).toLocaleDateString("en-GB") : "—")}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#64748B", fontSize: "0.68rem", fontWeight: 600 }}
                >
                  <strong>EXP Date:</strong> {(fetchedPreviewItem?.expiryDate || fetchedPreviewItem?.ExpiryDate || fetchedPreviewItem?.expDate || fetchedPreviewItem?.ExpDate) ? new Date(fetchedPreviewItem.expiryDate || fetchedPreviewItem.ExpiryDate || fetchedPreviewItem.expDate || fetchedPreviewItem.ExpDate).toLocaleDateString("en-GB") : (noExpiryDate ? "N/A" : (watchExpiryDate ? new Date(watchExpiryDate).toLocaleDateString("en-GB") : "—"))}
                </Typography>
              </Box>
            </Box>
          </Paper>
        ) : (
          <Box
            sx={{
              height: 160,
              borderRadius: "10px",
              border: "1px dashed #CBD5E1",
              background:
                "repeating-linear-gradient(45deg, #F8FAFC, #F8FAFC 12px, #F1F5F9 12px, #F1F5F9 24px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              sx={{
                fontFamily: "monospace",
                color: "#64748B",
                fontSize: "0.9rem",
                letterSpacing: "0.5px",
              }}
            >
              qr label preview
            </Typography>
          </Box>
        )}
      </Card>
    </Grid>
  );
};

export default React.memo(LabelPreviewPanel);
