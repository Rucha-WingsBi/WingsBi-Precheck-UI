import React from "react";
import {
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Typography,
} from "@mui/material";

export interface OptionItem {
  id: string | number;
  label: string;
}

export interface MultiSelectFilterProps {
  label: string;
  value: (string | number)[];
  options: (string | OptionItem)[];
  onChange: (newValue: any[]) => void;
  minWidth?: number;
  flex?: string;
  height?: number;
}

export const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
  label,
  value = [],
  options = [],
  onChange,
  minWidth = 110,
  flex = "0 0 140px",
  height = 38,
}) => {
  const normalizedValues = value.map((v) => (typeof v === "object" ? (v as any).id || (v as any).productionSeries : v));

  const handleChange = (e: any) => {
    const rawVal = e.target.value;
    const valArray = typeof rawVal === "string" ? rawVal.split(",") : rawVal;
    onChange(valArray);
  };

  return (
    <FormControl size="small" sx={{ flex, minWidth }}>
      <Select
        multiple
        displayEmpty
        value={normalizedValues}
        onChange={handleChange}
        renderValue={(selected) => {
          if (!selected || selected.length === 0) {
            return (
              <Typography variant="body2" sx={{ color: "#98A2B3", fontSize: "0.82rem" }}>
                {label}
              </Typography>
            );
          }
          return (
            <Typography variant="body2" sx={{ color: "#344054", fontWeight: 600, fontSize: "0.82rem" }}>
              {`${label} (${selected.length})`}
            </Typography>
          );
        }}
        MenuProps={{
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "left",
          },
          transformOrigin: {
            vertical: "top",
            horizontal: "left",
          },
          PaperProps: {
            sx: {
              maxHeight: 260,
              borderRadius: "8px",
              boxShadow: "0px 4px 16px rgba(16, 24, 40, 0.12)",
              border: "1px solid #EAECF0",
              mt: 0.5,
              width: "0 !important",
              boxSizing: "border-box",
              "& .MuiMenuItem-root": {
                minHeight: "26px !important",
                py: "2px !important",
                px: "6px !important",
                fontSize: "0.82rem",
                color: "#2D3748",
                "&:hover": {
                  backgroundColor: "#F4F5F7",
                },
                "&.Mui-selected": {
                  backgroundColor: "#F5EEF8",
                  "&:hover": {
                    backgroundColor: "#EFE2F4",
                  },
                },
              },
            },
          },
        }}
        sx={{
          height,
          fontSize: "0.82rem",
          backgroundColor: "background.paper",
        }}
      >
        {options.map((opt) => {
          const itemVal = typeof opt === "string" || typeof opt === "number" ? opt : opt.id ?? opt.label;
          const itemLabel = typeof opt === "string" || typeof opt === "number" ? String(opt) : opt.label;
          const isChecked = normalizedValues.indexOf(itemVal) > -1 || normalizedValues.indexOf(itemLabel) > -1;

          return (
            <MenuItem key={String(itemVal)} value={itemVal}>
              <Checkbox
                size="small"
                checked={isChecked}
                sx={{
                  p: 0,
                  mr: 0.5,
                  color: "#2D3748",
                  "&.Mui-checked": {
                    color: "#6B288A",
                  },
                  "& .MuiSvgIcon-root": {
                    fontSize: 16,
                  },
                }}
              />
              <ListItemText
                primary={itemLabel}
                sx={{ m: 0 }}
                primaryTypographyProps={{ fontSize: "0.82rem", color: "#2D3748", noWrap: true }}
              />
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};

export default MultiSelectFilter;
