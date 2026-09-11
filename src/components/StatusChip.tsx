import React from "react";
import { Box } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

export interface StatusChipProps {
  status: string | number | undefined | null;
  label?: string;
  size?: "small" | "medium";
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, label, size = "small" }) => {
  const statusStr = String(label || status || "Pending").trim();
  const normStatus = statusStr.toLowerCase();

  let bg = "#EFF6FF";
  let color = "#1E40AF";
  let borderColor = "#BFDBFE";
  let IconComponent = RadioButtonUncheckedIcon;

  if (
    normStatus.includes("completed") ||
    normStatus.includes("verified") ||
    normStatus.includes("active") ||
    normStatus.includes("success") ||
    normStatus === "3"
  ) {
    bg = "#ECFDF5";
    color = "#047857";
    borderColor = "#A7F3D0";
    IconComponent = CheckIcon;
  } else if (normStatus.includes("partial") || normStatus === "2") {
    bg = "#FFFBEB";
    color = "#B45309";
    borderColor = "#FDE68A";
    IconComponent = AccessTimeIcon;
  } else if (normStatus.includes("qty short") || normStatus.includes("short") || normStatus.includes("warning")) {
    bg = "#FFFBE8";
    color = "#9A3412";
    borderColor = "#FED7AA";
    IconComponent = WarningAmberIcon;
  } else if (
    normStatus.includes("rejected") ||
    normStatus.includes("disabled") ||
    normStatus.includes("failed") ||
    normStatus.includes("cancel")
  ) {
    bg = "#FEF2F2";
    color = "#B91C1C";
    borderColor = "#FECACA";
    IconComponent = CloseIcon;
  }

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1,
        py: 0.25,
        height: size === "small" ? 22 : 24,
        borderRadius: "12px",
        bgcolor: bg,
        color: color,
        border: `1px solid ${borderColor}`,
        fontWeight: 600,
        fontSize: "0.725rem",
        whiteSpace: "nowrap",
        userSelect: "none",
      }}
    >
      <IconComponent sx={{ fontSize: "12px !important", color: color }} />
      <span>{statusStr}</span>
    </Box>
  );
};
