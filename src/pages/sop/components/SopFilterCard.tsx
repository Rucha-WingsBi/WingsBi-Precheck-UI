import React from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Autocomplete,
  CircularProgress,
  Paper,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as ResetIcon,
  GetApp as ExportIcon,
} from "@mui/icons-material";
import { Controller } from "react-hook-form";

interface SopFilterCardProps {
  control: any;
  productionSeriesData: any[];
  drawingNumbersData: any[];
  isDrawingNumbersLoading: boolean;
  drwDisplayText: string;
  setDrwDisplayText: (val: string) => void;
  selectedDrawingNumber: any;
  handleDrawingNumberChange: (val: any) => void;
  isDRWDropDownOpen: boolean;
  setIsDRWDropDownOpen: (val: boolean) => void;
  isSelectingItem: boolean;
  prodSeriesInputText: string;
  setProdSeriesInputText: (val: string) => void;
  executeSearch: () => void;
  executeReset: () => void;
  isLoading: boolean;
  isSearchAndResetEnabled: boolean;
  executeExport: () => void;
  isExporting: boolean;
  hasAssemblyData: boolean;
}

export const SopFilterCard: React.FC<SopFilterCardProps> = ({
  control,
  productionSeriesData,
  drawingNumbersData,
  isDrawingNumbersLoading,
  drwDisplayText,
  setDrwDisplayText,
  selectedDrawingNumber,
  handleDrawingNumberChange,
  isDRWDropDownOpen,
  setIsDRWDropDownOpen,
  isSelectingItem,
  prodSeriesInputText,
  setProdSeriesInputText,
  executeSearch,
  executeReset,
  isLoading,
  isSearchAndResetEnabled,
  executeExport,
  isExporting,
  hasAssemblyData,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.25,
        mb: 1.5,
        borderRadius: "10px",
        border: "1px solid #EAECF0",
        backgroundColor: "#ffffff",
      }}
    >
      <Grid container spacing={1.25} alignItems="center">
        {/* Production Series */}
        <Grid item xs={12} sm={4} md={3}>
          <Controller
            name="prodSeriesId"
            control={control}
            render={({ field: { onChange, value } }) => {
              const selectedOption =
                productionSeriesData.find((s: any) => s.id === value) || null;
              return (
                <Autocomplete
                  key={value || 0}
                  size="small"
                  freeSolo
                  options={productionSeriesData}
                  getOptionLabel={(option: any) => {
                    if (typeof option === "string") return option;
                    return option.productionSeries || "";
                  }}
                  value={selectedOption}
                  inputValue={prodSeriesInputText}
                  onInputChange={(_, newInputValue) => {
                    setProdSeriesInputText(newInputValue);
                    const match = productionSeriesData.find(
                      (s: any) =>
                        s.productionSeries?.toLowerCase() ===
                        newInputValue.trim().toLowerCase()
                    );
                    if (match) {
                      onChange(match.id);
                    } else if (!newInputValue) {
                      onChange(0);
                    }
                  }}
                  onChange={(_, newValue: any) => {
                    if (newValue && typeof newValue !== "string") {
                      onChange(newValue.id);
                      setProdSeriesInputText(newValue.productionSeries || "");
                    } else if (typeof newValue === "string") {
                      const match = productionSeriesData.find(
                        (s: any) =>
                          s.productionSeries?.toLowerCase() ===
                          newValue.toLowerCase()
                      );
                      onChange(match ? match.id : 0);
                      setProdSeriesInputText(newValue);
                    } else {
                      onChange(0);
                      setProdSeriesInputText("");
                    }
                  }}
                  ListboxProps={{
                    sx: {
                      "& li": {
                        alignItems: "flex-start !important",
                        textAlign: "left !important",
                        justifyContent: "flex-start !important",
                      },
                    },
                  }}
                  renderOption={(props, option: any) => {
                    const { key, ...otherProps } = props;
                    return (
                      <Box
                        component="li"
                        key={option.id || key}
                        {...otherProps}
                        sx={{
                          fontSize: "0.85rem",
                          py: 0.5,
                          width: "100%",
                          textAlign: "left !important",
                          justifyContent: "flex-start !important",
                        }}
                      >
                        <Typography variant="body2" sx={{ fontSize: "0.85rem", textAlign: "left !important", width: "100%" }}>
                          {option.productionSeries}
                        </Typography>
                      </Box>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Prod. Series *"
                      placeholder="Select series..."
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                          backgroundColor: "#ffffff",
                        },
                        "& .MuiInputLabel-root": {
                          fontSize: "0.85rem",
                          backgroundColor: "#ffffff",
                          px: 0.5,
                        },
                      }}
                    />
                  )}
                />
              );
            }}
          />
        </Grid>

        {/* Drawing Number */}
        <Grid item xs={12} sm={4} md={4}>
          <Autocomplete
            options={drawingNumbersData || []}
            filterOptions={(options, { inputValue }) => {
              if (inputValue.length < 3) return [];
              return options.slice(0, 100);
            }}
            getOptionLabel={(option: any) => option.drawingNumber || ""}
            value={selectedDrawingNumber}
            onChange={(_, newValue) => handleDrawingNumberChange(newValue)}
            inputValue={drwDisplayText}
            onInputChange={(_, newInputValue) => {
              if (!isSelectingItem) {
                setDrwDisplayText(newInputValue);
              }
            }}
            open={isDRWDropDownOpen}
            onOpen={() => setIsDRWDropDownOpen(true)}
            onClose={() => setIsDRWDropDownOpen(false)}
            size="small"
            renderInput={(params) => (
              <TextField
                {...params}
                label="Assembly No / LItem Code *"
                placeholder="Type 3+ chars (e.g. CK310)..."
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    backgroundColor: "#ffffff",
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: "0.85rem",
                    backgroundColor: "#ffffff",
                    px: 0.5,
                  },
                }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isDrawingNumbersLoading ? (
                        <CircularProgress color="inherit" size={16} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            ListboxProps={{
              sx: {
                "& li": {
                  alignItems: "flex-start !important",
                  textAlign: "left !important",
                  justifyContent: "flex-start !important",
                },
              },
            }}
            renderOption={(props, option: any) => {
              const { key, ...otherProps } = props;
              return (
                <Box
                  component="li"
                  key={option.id || key}
                  {...otherProps}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start !important",
                    textAlign: "left !important",
                    justifyContent: "flex-start !important",
                    py: 0.75,
                    width: "100%",
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.85rem", textAlign: "left !important", width: "100%" }}>
                    {option.drawingNumber}
                  </Typography>
                  {option.nomenclature && (
                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.75rem", textAlign: "left !important", width: "100%" }}>
                      {option.nomenclature}
                    </Typography>
                  )}
                </Box>
              );
            }}
            noOptionsText={
              drwDisplayText.length < 3
                ? "Type 3+ characters"
                : "No drawings found"
            }
          />
        </Grid>

        {/* Assembly ID Number */}
        <Grid item xs={12} sm={4} md={2.5}>
          <Controller
            name="assemblyNumber"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Assembly ID No."
                placeholder="ID number..."
                fullWidth
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    backgroundColor: "#ffffff",
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: "0.85rem",
                    backgroundColor: "#ffffff",
                    px: 0.5,
                  },
                }}
              />
            )}
          />
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12} md={2.5}>
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", alignItems: "center" }}>
            <Button
              variant="contained"
              size="small"
              startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon sx={{ fontSize: 18 }} />}
              onClick={executeSearch}
              disabled={isLoading || !isSearchAndResetEnabled}
              sx={{
                height: 38,
                px: 2,
                borderRadius: "8px",
                backgroundColor: "primary.main",
                fontWeight: 600,
                fontSize: "0.85rem",
                textTransform: "none",
                boxShadow: "none",
                "&:hover": { backgroundColor: "primary.dark" },
              }}
            >
              {isLoading ? "Searching..." : "Search"}
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={executeReset}
              disabled={!isSearchAndResetEnabled}
              sx={{
                height: 38,
                px: 1.5,
                color: "#667085",
                fontWeight: 600,
                fontSize: "0.85rem",
                textTransform: "none",
                "&:hover": { backgroundColor: "#F2F4F7", color: "#101828" },
              }}
            >
              Reset
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};
