import React from "react";
import { Box, Typography, Chip, Button, Stack } from "@mui/material";

export interface FilterChipItem {
  id: string;
  label: string;
  onRemove: () => void;
}

interface ActiveFilterChipsProps {
  chips: FilterChipItem[];
  onClearAll: () => void;
  totalResults: number;
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  chips,
  onClearAll,
  totalResults,
}) => {
  if (chips.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          py: 0.15,
          px: 0.5,
          mb: 0.25,
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: "#667085", fontSize: "0.8rem", fontWeight: 500 }}
        >
          {totalResults.toLocaleString()} results
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        gap: 1,
        py: 0.5,
        px: 0.5,
        mb: 0.25,
      }}
    >
      <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
        {chips.map((chip) => (
          <Chip
            key={chip.id}
            label={chip.label}
            onDelete={chip.onRemove}
            size="small"
            sx={{
              backgroundColor: "#F2F4F7",
              color: "#344054",
              fontWeight: 600,
              fontSize: "0.8rem",
              borderRadius: "16px",
              border: "1px solid #E9EAEB",
              "& .MuiChip-deleteIcon": {
                color: "#667085",
                fontSize: 14,
                "&:hover": { color: "#344054" },
              },
            }}
          />
        ))}

        <Button
          variant="text"
          size="small"
          onClick={onClearAll}
          sx={{
            color: "primary.main",
            fontWeight: 600,
            fontSize: "0.8rem",
            textTransform: "none",
            p: 0,
            minWidth: "auto",
            "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
          }}
        >
          Clear all
        </Button>
      </Stack>

      <Typography
        variant="body2"
        sx={{ color: "#667085", fontSize: "0.85rem", fontWeight: 500 }}
      >
        {totalResults.toLocaleString()} results
      </Typography>
    </Box>
  );
};
