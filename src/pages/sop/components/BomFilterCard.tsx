import React from "react";
import {
  Paper,
  Grid,
  Box,
  Button,
  Autocomplete,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";


interface AssemblyOption {
  id: number;
  drawingNumber: string;
  nomenclature: string;
  lnItemCode?: string;
}

interface BomFilterCardProps {
  selectedAssembly: AssemblyOption | null;
  handleAssemblyChange: (_: any, newValue: AssemblyOption | null) => void;
  assemblyInputValue: string;
  handleAssemblyInputChange: (_: any, newInputValue: string) => void;
  assemblySearchResults: AssemblyOption[];
  isSearchingAssembly: boolean;
  handleSearch: () => void;
  handleReset: () => void;
  handleExport?: () => void;
  isBomLoading: boolean;
  isExporting?: boolean;
  hasBomData?: boolean;
}

export const BomFilterCard: React.FC<BomFilterCardProps> = ({
  selectedAssembly,
  handleAssemblyChange,
  assemblyInputValue,
  handleAssemblyInputChange,
  assemblySearchResults,
  isSearchingAssembly,
  handleSearch,
  handleReset,
  isBomLoading,
  hasBomData = false,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        mb: 2,
        borderRadius: "10px",
        border: "1px solid #EAECF0",
        backgroundColor: "#ffffff",
      }}
    >
      <Grid container spacing={1.25} alignItems="center">
        {/* Assembly Number / LN Item Code */}
        <Grid item xs={12} sm={7} md={8}>
          <Autocomplete
            value={selectedAssembly}
            onChange={handleAssemblyChange}
            inputValue={assemblyInputValue}
            onInputChange={handleAssemblyInputChange}
            options={assemblySearchResults || []}
            getOptionLabel={(option) =>
              option.drawingNumber
                ? `${option.drawingNumber}${
                    option.lnItemCode ? ` - ${option.lnItemCode}` : ""
                  }`
                : ""
            }
            isOptionEqualToValue={(option, value) => option.id === value.id}
            loading={isSearchingAssembly}
            size="small"
            renderInput={(params) => (
              <TextField
                {...params}
                label="Assembly Number / LN Item Code"
                placeholder="Type 3+ chars to search Assembly Number or LN item code..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isSearchingAssembly ? (
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
            renderOption={(props, option) => {
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
                    {option.lnItemCode && (
                      <Box
                        component="span"
                        sx={{ color: "text.secondary", fontWeight: 400, ml: 1 }}
                      >
                        - {option.lnItemCode}
                      </Box>
                    )}
                  </Typography>
                </Box>
              );
            }}
            noOptionsText={
              isSearchingAssembly
                ? "Loading drawings..."
                : assemblyInputValue.length < 3
                ? "Type at least 3 characters"
                : "No drawings found"
            }
            loadingText="Loading drawings..."
            freeSolo={false}
          />
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12} sm={5} md={4}>
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", alignItems: "center" }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleSearch}
              disabled={isBomLoading || !selectedAssembly}
              sx={{
                height: 38,
                minWidth: 65,
                px: 2,
                borderRadius: "6px",
                backgroundColor: "primary.main",
                color: "#FFFFFF",
                fontWeight: 600,
                fontSize: "0.82rem",
                textTransform: "none",
                boxShadow: "none",
                "&:hover": {
                  backgroundColor: "primary.dark",
                  boxShadow: "none",
                },
                "&.Mui-disabled": {
                  backgroundColor: "#EAECF0",
                  color: "#98A2B3",
                },
              }}
            >
              {isBomLoading ? "Applying..." : "Apply"}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleReset}
              disabled={!selectedAssembly && !hasBomData && !assemblyInputValue}
              sx={{
                height: 38,
                minWidth: 55,
                px: 1.5,
                borderRadius: "6px",
                borderColor: "#D0D5DD",
                backgroundColor: "#ffffff",
                color: "#667085",
                fontWeight: 600,
                fontSize: "0.82rem",
                textTransform: "none",
                boxShadow: "none",
                "&:hover": {
                  borderColor: "#98A2B3",
                  backgroundColor: "#F9FAFB",
                  color: "#101828",
                },
              }}
            >
              Clear
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};
