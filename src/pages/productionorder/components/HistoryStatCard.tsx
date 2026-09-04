import React from "react";
import { Box, Typography, Paper } from "@mui/material";

interface HistoryStatCardProps {
  title: string;
  count: number;
  indicatorColor: string;
  subtext: string;
  isActive?: boolean;
  onClick?: () => void;
}

export const HistoryStatCard: React.FC<HistoryStatCardProps> = ({
  title,
  count,
  indicatorColor,
  subtext,
  isActive = false,
  onClick,
}) => {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        flex: 1,
        minWidth: { xs: "100%", sm: "200px", md: "0" },
        py: { xs: 1, sm: 1.25 },
        px: { xs: 2, sm: 2.25 },
        borderRadius: "10px",
        border: isActive ? "2px solid #7F56D9" : "1px solid #E9EAEB",
        backgroundColor: "#ffffff",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease-in-out",
        boxShadow: isActive ? "0px 2px 4px rgba(105, 65, 198, 0.1)" : "none",
        "&:hover": onClick
          ? {
              borderColor: isActive ? "#7F56D9" : "#D0D5DD",
              boxShadow: "0px 2px 4px rgba(16, 24, 40, 0.05)",
            }
          : {},
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.25 }}>
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: "2px",
            backgroundColor: indicatorColor,
          }}
        />
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: "#475467",
            fontSize: "0.8rem",
          }}
        >
          {title}
        </Typography>
      </Box>

      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          color: "#101828",
          fontSize: { xs: "1.25rem", sm: "1.4rem" },
          lineHeight: 1.15,
          mb: 0.25,
        }}
      >
        {count.toLocaleString()}
      </Typography>

      <Typography
        variant="caption"
        sx={{
          color: "#667085",
          fontSize: "0.725rem",
          fontWeight: 500,
        }}
      >
        {subtext}
      </Typography>
    </Paper>
  );
};
