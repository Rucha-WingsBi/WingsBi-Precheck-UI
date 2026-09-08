import React from "react";
import {
  Paper,
  Box,
  Typography,
  Chip,
  Button,
  Divider,
  Stack,
} from "@mui/material";
import {
  OpenInNew as OpenInNewIcon,
  PlayArrow as PlayIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

interface NodeDetailsCardProps {
  selectedNode: any;
  childCount?: number;
}

export const NodeDetailsCard: React.FC<NodeDetailsCardProps> = ({
  selectedNode,
  childCount = 0,
}) => {
  const navigate = useNavigate();

  if (!selectedNode) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: "10px",
          border: "1px solid #EAECF0",
          backgroundColor: "#ffffff",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          minHeight: 320,
        }}
      >
        <Typography variant="body2" sx={{ color: "#667085", fontWeight: 500 }}>
          Select any item in the assembly tree to view its node details
        </Typography>
      </Paper>
    );
  }

  const level = selectedNode.level ?? 0;
  const drawingNo = selectedNode.drawingNumber || selectedNode.childDrawingNumber || "-";
  const nomenclature = selectedNode.nomenclature || "-";
  const parentDrawing = selectedNode.parentDrawingNumber || selectedNode.parentAssemblyNumber || "-";
  const lnCode = selectedNode.lnItemCode || "-";
  const qty = selectedNode.quantity ?? 1;
  const unit = selectedNode.unit || "Nos";
  const componentType =
    selectedNode.componentType ||
    selectedNode.itemType ||
    selectedNode.type ||
    selectedNode.component_Type ||
    selectedNode.drawingType ||
    (selectedNode.hasChildren ? "Assembly" : "Manufactured");

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.25,
        borderRadius: "10px",
        border: "1px solid #EAECF0",
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
        position: "sticky",
        top: 16,
      }}
    >
      {/* Level Tag & Header */}
      <Box>
        <Typography
          variant="caption"
          sx={{
            color: "#667085",
            fontSize: "0.725rem",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Selected node · level {level}
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: "#101828",
            fontSize: "1.05rem",
            mt: 0.25,
            wordBreak: "break-word",
          }}
        >
          {drawingNo}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "#475467", fontSize: "0.825rem" }}
        >
          {nomenclature}
        </Typography>
      </Box>

      <Divider sx={{ borderColor: "#F2F4F7" }} />

      {/* Key-Value Details */}
      <Stack spacing={0.75}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" sx={{ color: "#667085", fontSize: "0.8rem" }}>
            Parent
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "#101828", fontSize: "0.8rem" }}>
            {parentDrawing}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" sx={{ color: "#667085", fontSize: "0.8rem" }}>
            LN Item Code
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "#101828", fontSize: "0.8rem" }}>
            {lnCode}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" sx={{ color: "#667085", fontSize: "0.8rem" }}>
            Qty per assembly
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "#101828", fontSize: "0.8rem" }}>
            {qty} {unit}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" sx={{ color: "#667085", fontSize: "0.8rem" }}>
            Type
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "#101828", fontSize: "0.8rem" }}>
            {componentType}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" sx={{ color: "#667085", fontSize: "0.8rem" }}>
            Available in store
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "#101828", fontSize: "0.8rem" }}>
              Available
            </Typography>
            <Button
              size="small"
              variant="text"
              onClick={() => navigate("/precheck/available-store")}
              sx={{
                p: 0,
                minWidth: "auto",
                fontSize: "0.75rem",
                color: "primary.main",
                fontWeight: 600,
                textTransform: "none",
              }}
            >
              view
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" sx={{ color: "#667085", fontSize: "0.8rem" }}>
            Children
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "#101828", fontSize: "0.8rem" }}>
            {childCount} {childCount === 1 ? "component" : "components"}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" sx={{ color: "#667085", fontSize: "0.8rem" }}>
            Last precheck
          </Typography>
          <Chip
            label="Active / Verified"
            size="small"
            sx={{
              backgroundColor: "#ECFDF3",
              color: "#027A48",
              fontWeight: 600,
              fontSize: "0.725rem",
              height: 22,
            }}
          />
        </Box>
      </Stack>

      <Divider sx={{ borderColor: "#F2F4F7", my: 0.25 }} />

      {/* Action Buttons */}
      <Stack direction="row" spacing={0.75} sx={{ width: "100%" }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate("/components/view")}
          sx={{
            flex: "1.35 1 0%",
            minWidth: 0,
            borderColor: "#D0D5DD",
            color: "#344054",
            fontWeight: 600,
            fontSize: "0.725rem",
            borderRadius: "8px",
            py: 0.6,
            px: 0.4,
            whiteSpace: "nowrap",
            textTransform: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.65,
            "&:hover": { borderColor: "#98A2B3", backgroundColor: "#F9FAFB" },
          }}
        >
          <OpenInNewIcon sx={{ fontSize: 13, flexShrink: 0 }} />
          <span>Open in Components</span>
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() =>
            navigate("/precheck/make", {
              state: { drawingNumber: drawingNo },
            })
          }
          sx={{
            flex: "0.85 1 0%",
            minWidth: 0,
            borderColor: "primary.main",
            color: "primary.main",
            fontWeight: 600,
            fontSize: "0.725rem",
            borderRadius: "8px",
            py: 0.6,
            px: 0.25,
            whiteSpace: "nowrap",
            textTransform: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.65,
            "&:hover": { backgroundColor: "rgba(107, 40, 138, 0.04)" },
          }}
        >
          <PlayIcon sx={{ fontSize: 13, flexShrink: 0 }} />
          <span>Run Precheck</span>
        </Button>
      </Stack>
    </Paper>
  );
};
