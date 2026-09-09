import React from "react";
import {
  Box,
  Typography,
  Stack,
  Select,
  MenuItem,
  IconButton,
} from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";

export interface CustomPaginationProps {
  page: number; 
  pageSize: number;
  totalCount: number;
  pageSizeOptions?: number[];
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
  disabled?: boolean;
}

export const CustomPagination: React.FC<CustomPaginationProps> = ({
  page,
  pageSize,
  totalCount,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  disabled = false,
}) => {
  const startRow = totalCount > 0 ? page * pageSize + 1 : 0;
  const endRow = Math.min((page + 1) * pageSize, totalCount);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        p: 0.75,
        px: 2,
        borderTop: "1px solid #EAECF0",
        backgroundColor: "#ffffff",
        flexWrap: "wrap",
        gap: 1,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="body2" sx={{ color: "#475467", fontSize: "0.775rem", fontWeight: 500 }}>
          Rows per page
        </Typography>
        <Select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          size="small"
          disabled={disabled}
          sx={{
            height: 26,
            fontSize: "0.725rem",
            borderRadius: "6px",
            "& .MuiSelect-select": { py: 0.15, px: 0.85, pr: "20px !important", fontSize: "0.725rem" },
            "& .MuiSelect-icon": { fontSize: 16 },
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#D0D5DD" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#98A2B3" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "primary.main" },
          }}
        >
          {pageSizeOptions.map((opt) => (
            <MenuItem key={opt} value={opt} sx={{ fontSize: "0.725rem" }}>
              {opt}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Typography variant="body2" sx={{ color: "#475467", fontSize: "0.775rem", fontWeight: 500 }}>
          {totalCount > 0
            ? `${startRow.toLocaleString()}–${endRow.toLocaleString()} of ${totalCount.toLocaleString()}`
            : "0–0 of 0"}
        </Typography>
        <Stack direction="row" spacing={0.5}>
          <IconButton
            size="small"
            disabled={page === 0 || disabled}
            onClick={() => onPageChange(Math.max(0, page - 1))}
            sx={{
              width: 26,
              height: 26,
              p: 0,
              color: "#344054",
              borderRadius: "6px",
              "&:hover": { backgroundColor: "#F2F4F7" },
              "&.Mui-disabled": { color: "#D0D5DD" },
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <IconButton
            size="small"
            disabled={(page + 1) * pageSize >= totalCount || disabled}
            onClick={() => onPageChange(page + 1)}
            sx={{
              width: 26,
              height: 26,
              p: 0,
              color: "#344054",
              borderRadius: "6px",
              "&:hover": { backgroundColor: "#F2F4F7" },
              "&.Mui-disabled": { color: "#D0D5DD" },
            }}
          >
            <ChevronRightIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
};
