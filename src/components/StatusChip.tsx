import React from "react";
import { Box } from "@mui/material";

export interface StatusChipProps {
  status: string | number | undefined | null;
  label?: string;
  size?: "small" | "medium";
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, label, size = "small" }) => {
  const statusStr = String(label || status || "Pending").trim();
  const normStatus = statusStr.toLowerCase();

  let bg = "#F2F4F7";
  let color = "#344054";

  if (
    normStatus.includes("completed") ||
    normStatus.includes("verified") ||
    normStatus.includes("active") ||
    normStatus.includes("success") ||
    normStatus === "3"
  ) {
    bg = "#ECFDF5";
    color = "#027A48";
  } else if (
    normStatus.includes("partial") ||
    normStatus.includes("progress") ||
    normStatus === "2"
  ) {
    bg = "#FFFBEB";
    color = "#B54708";
  } else if (
    normStatus.includes("pending") ||
    normStatus === "1"
  ) {
    bg = "#FEF2F2";
    color = "#B42318";
  } else if (
    normStatus.includes("rejected") ||
    normStatus.includes("disabled") ||
    normStatus.includes("failed") ||
    normStatus.includes("cancel") ||
    normStatus.includes("scrap")
  ) {
    bg = "#FEF2F2";
    color = "#B42318";
  } else if (
    normStatus.includes("updated") ||
    normStatus.includes("issued") ||
    normStatus === "4"
  ) {
    bg = "#F4EBFF";
    color = "#6D2A8F";
  }

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        px: 1.25,
        py: 0.2,
        height: size === "small" ? 22 : 24,
        borderRadius: "14px",
        bgcolor: bg,
        color: color,
        fontWeight: 600,
        fontSize: "0.75rem",
        whiteSpace: "nowrap",
        userSelect: "none",
      }}
    >
      <span>{statusStr}</span>
    </Box>
  );
};
