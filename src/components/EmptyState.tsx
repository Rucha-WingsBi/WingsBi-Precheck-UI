import React from 'react';
import { Box, Typography, TableRow, TableCell } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface EmptyStateProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  height?: number | string;
  /** Pass colSpan when rendering inside a standard MUI <TableBody> */
  colSpan?: number;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No Matching Records found",
  subtitle,
  icon = <SearchIcon sx={{ fontSize: 26, color: "#667085" }} />,
  height = 260,
  colSpan,
}) => {
  const content = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        width: "100%",
        height: height,
        py: 2,
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          bgcolor: "#F2F4F7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 1.5,
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 700,
          color: "#101828",
          fontSize: "0.95rem",
          mb: subtitle ? 0.5 : 0,
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" sx={{ color: "#667085", fontSize: "0.825rem" }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );

  if (colSpan !== undefined) {
    return (
      <TableRow sx={{ height: typeof height === "number" ? `${height}px` : height }}>
        <TableCell colSpan={colSpan} align="center" sx={{ borderBottom: "none", py: 2 }}>
          {content}
        </TableCell>
      </TableRow>
    );
  }

  return content;
};

export default EmptyState;
