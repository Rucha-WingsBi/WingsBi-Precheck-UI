import { Box, Typography } from "@mui/material";

interface StepHeaderProps {
  number: number | string;
  title: string;
  subtitle?: string;
}

const StepHeader = ({ number, title, subtitle }: StepHeaderProps) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
    <Box
      sx={{
        width: 26,
        height: 26,
        borderRadius: "50%",
        backgroundColor: "rgba(107, 40, 138, 0.1)",
        color: "primary.main",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: "0.85rem",
        flexShrink: 0,
      }}
    >
      {number}
    </Box>
    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, flexWrap: "wrap" }}>
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 700, color: "#111827", fontSize: "1rem" }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          variant="body2"
          sx={{ color: "#6B7280", fontSize: "0.85rem", fontWeight: 400 }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  </Box>
);

export default StepHeader;
