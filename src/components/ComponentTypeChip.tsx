import React from "react";
import { Box } from "@mui/material";

export interface ComponentTypeChipProps {
  type: string | undefined | null;
}

export const ComponentTypeChip: React.FC<ComponentTypeChipProps> = ({ type }) => {
  const typeStr = String(type || "N/A").trim().toUpperCase();

  let bg = "#F8FAFC";
  let color = "#475467";
  let borderColor = "#CBD5E1";

  if (typeStr === "BATCH") {
    bg = "#F3E8F8";
    color = "#6D2A8F";
    borderColor = "#E9D5FF";
  } else if (typeStr === "ID") {
    bg = "#F1F5F9";
    color = "#334155";
    borderColor = "#E2E8F0";
  }

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        px: 1,
        py: 0.15,
        height: 22,
        borderRadius: "4px",
        bgcolor: bg,
        color: color,
        border: `1px solid ${borderColor}`,
        fontWeight: 700,
        fontSize: "0.725rem",
        whiteSpace: "nowrap",
        userSelect: "none",
      }}
    >
      {typeStr}
    </Box>
  );
};
