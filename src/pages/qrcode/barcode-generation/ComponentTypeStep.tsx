import React from "react";
import {
  Box,
  Card,
  Grid,
  TextField,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Button,
} from "@mui/material";
import { Controller } from "react-hook-form";
import { Add as AddIcon } from "@mui/icons-material";
import StepHeader from "./StepHeader";

interface ComponentTypeStepProps {
  control: any;
  componentType: string;
  watchIdType: string;
  watchStartRange: any;
  watchEndRange: any;
  watchCustomIdRange: string;
  selectedPO: any;
  poStartId: number;
  poEndId: number;
  idRangeNotice: string;
  visibleRandomCount: number;
  setVisibleRandomCount: React.Dispatch<React.SetStateAction<number>>;
  handleRandomIdChange: (index: number, value: string) => void;
  totalQuantity: number;
  QrTableRows: Array<{
    srNo: number;
    idNo: string;
    quantity: number | string;
    size: string;
    mirir: string;
    heatLotBatchNo: string;
  }>;
  handleQrTableChange: (index: number, field: any, value: any) => void;
  handleEnterKey: (
    e: React.KeyboardEvent,
    rowIndex: number,
    isLastColumn: boolean,
  ) => void;
  addNewQrRow: () => void;
}

function ComponentTypeStep({
  control,
  componentType,
  watchIdType,
  selectedPO,
  poStartId,
  poEndId,
  idRangeNotice,
  visibleRandomCount,
  setVisibleRandomCount,
  handleRandomIdChange,
  totalQuantity,
  QrTableRows,
  handleQrTableChange,
  handleEnterKey,
  addNewQrRow,
}: ComponentTypeStepProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: "10px",
        borderColor: "#EAECF0",
        backgroundColor: "#FFFFFF",
        p: { xs: 1.75, md: 2 },
        mb: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <StepHeader
        number={2}
        title="ID range"
      />

      {componentType === "ID" && (
        <>
          <Box sx={{ mb: 2.5 }}>
            <FormLabel
              component="legend"
              sx={{
                fontWeight: 700,
                fontSize: "0.875rem",
                color: "#111827",
                mb: 1,
                display: "block",
              }}
            >
              ID Type *
            </FormLabel>
            <Controller
              name="idType"
              control={control}
              render={({ field }) => (
                <RadioGroup {...field} row sx={{ gap: { xs: 1.5, sm: 3 } }}>
                  <FormControlLabel
                    value="series"
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color: "#D1D5DB",
                          "&.Mui-checked": { color: "primary.main" },
                        }}
                      />
                    }
                    label="Series"
                  />
                  <FormControlLabel
                    value="custom"
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color: "#D1D5DB",
                          "&.Mui-checked": { color: "primary.main" },
                        }}
                      />
                    }
                    label="Custom"
                  />
                  <FormControlLabel
                    value="random"
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color: "#D1D5DB",
                          "&.Mui-checked": { color: "primary.main" },
                        }}
                      />
                    }
                    label="Random"
                  />
                </RadioGroup>
              )}
            />
          </Box>

          {watchIdType === "series" && (
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={4}>
                <Controller
                  name="startRange"
                  control={control}
                  rules={{
                    required: "Start ID is required",
                    validate: (val) => {
                      if (!val) return true;
                      const num = Number(val);
                      if (selectedPO && poStartId > 0 && num < poStartId)
                        return `ID should not be less than ${poStartId}`;
                      if (selectedPO && poEndId > 0 && num > poEndId)
                        return `ID should not be greater than ${poEndId}`;
                      return true;
                    },
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label="Start ID *"
                      type="number"
                      placeholder="e.g. 301"
                      fullWidth
                      size="small"
                      error={!!error}
                      helperText={error?.message || idRangeNotice}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="endRange"
                  control={control}
                  rules={{
                    required: "End ID is required",
                    validate: (val) => {
                      if (!val) return true;
                      const num = Number(val);
                      if (selectedPO && poStartId > 0 && num < poStartId)
                        return `ID should not be less than ${poStartId}`;
                      if (selectedPO && poEndId > 0 && num > poEndId)
                        return `ID should not be greater than ${poEndId}`;
                      return true;
                    },
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label="End ID *"
                      type="number"
                      placeholder="e.g. 320"
                      fullWidth
                      size="small"
                      error={!!error}
                      helperText={error?.message || idRangeNotice}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="quantity"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Quantity - calculated"
                      placeholder="—"
                      type="number"
                      fullWidth
                      size="small"
                      InputProps={{
                        readOnly: true,
                        style: { backgroundColor: "#F9FAFB" },
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          )}

          {watchIdType === "custom" && (
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={8}>
                <Controller
                  name="customIdRange"
                  control={control}
                  rules={{
                    required: "ID Range is required",
                    validate: (val) => {
                      if (!val) return true;
                      if (!selectedPO || poStartId <= 0 || poEndId <= 0)
                        return true;
                      const parts = val.split(",").map((p: string) => p.trim());
                      for (const part of parts) {
                        if (!part) continue;
                        if (part.includes("-")) {
                          const [s, e] = part
                            .split("-")
                            .map((n: string) => Number(n.trim()));
                          if (!isNaN(s) && s < poStartId)
                            return `ID should not be less than ${poStartId}`;
                          if (!isNaN(e) && e > poEndId)
                            return `ID should not be greater than ${poEndId}`;
                        } else {
                          const n = Number(part);
                          if (!isNaN(n) && n < poStartId)
                            return `ID should not be less than ${poStartId}`;
                          if (!isNaN(n) && n > poEndId)
                            return `ID should not be greater than ${poEndId}`;
                        }
                      }
                      return true;
                    },
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label="ID Range *"
                      fullWidth
                      size="small"
                      placeholder="e.g., 301, 302, 305-310"
                      error={!!error}
                      helperText={error?.message || idRangeNotice}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="quantity"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Quantity - calculated"
                      placeholder="—"
                      type="number"
                      fullWidth
                      size="small"
                      InputProps={{
                        readOnly: true,
                        style: { backgroundColor: "#F9FAFB" },
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          )}

          {watchIdType === "random" && (
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1.5,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                >
                  Random IDs (Showing {visibleRandomCount} of 200 IDs)
                </Typography>
                {selectedPO && poStartId > 0 && poEndId > 0 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 500 }}
                  >
                    select id between {poStartId}-{poEndId}
                  </Typography>
                )}
              </Box>

              <Grid container spacing={1} sx={{ mb: 2 }}>
                {Array.from({ length: visibleRandomCount }, (_, index) => (
                  <Grid item xs={6} sm={4} md={2.4} lg={1.2} key={index}>
                    <Controller
                      name={`randomIds.${index}`}
                      control={control}
                      rules={{
                        validate: (val) => {
                          if (!val) return true;
                          const num = Number(val);
                          if (isNaN(num)) return "Invalid";
                          if (!selectedPO) return true;
                          if (poStartId > 0 && num < Number(poStartId))
                            return `ID should not be less than ${poStartId}`;
                          if (poEndId > 0 && num > Number(poEndId))
                            return `ID should not be greater than ${poEndId}`;
                          return true;
                        },
                      }}
                      render={({ field, fieldState: { error } }) => (
                        <TextField
                          {...field}
                          size="small"
                          placeholder={`ID ${index + 1}`}
                          error={!!error}
                          helperText={error?.message}
                          inputProps={{ maxLength: 10 }}
                          fullWidth
                          onChange={(e) => {
                            field.onChange(e);
                            handleRandomIdChange(index, e.target.value);
                          }}
                        />
                      )}
                    />
                  </Grid>
                ))}
              </Grid>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mb: 1,
                }}
              >
                {visibleRandomCount < 200 && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() =>
                      setVisibleRandomCount((prev) => Math.min(prev + 20, 200))
                    }
                    sx={{ textTransform: "none", borderRadius: "8px" }}
                  >
                    Show More (+20)
                  </Button>
                )}

                <Controller
                  name="quantity"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Quantity"
                      type="number"
                      size="small"
                      InputProps={{
                        readOnly: true,
                        style: { backgroundColor: "#F9FAFB" },
                      }}
                      sx={{ width: 150 }}
                    />
                  )}
                />
              </Box>
            </Box>
          )}
        </>
      )}

      {componentType === "BATCH" && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={8}>
            <Controller
              name="customIdRange"
              control={control}
              rules={{
                required: "ID Range is required",
                validate: (val) => {
                  if (!val) return true;
                  if (!selectedPO || poStartId <= 0 || poEndId <= 0)
                    return true;
                  const parts = val.split(",").map((p: string) => p.trim());
                  for (const part of parts) {
                    if (!part) continue;
                    if (part.includes("-")) {
                      const [s, e] = part
                        .split("-")
                        .map((n: string) => Number(n.trim()));
                      if (!isNaN(s) && s < poStartId)
                        return `ID should not be less than ${poStartId}`;
                      if (!isNaN(e) && e > poEndId)
                        return `ID should not be greater than ${poEndId}`;
                    } else {
                      const n = Number(part);
                      if (!isNaN(n) && n < poStartId)
                        return `ID should not be less than ${poStartId}`;
                      if (!isNaN(n) && n > poEndId)
                        return `ID should not be greater than ${poEndId}`;
                    }
                  }
                  return true;
                },
              }}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label="ID Range *"
                  fullWidth
                  size="small"
                  placeholder="e.g., 1,2,3,4-7"
                  error={!!error}
                  helperText={error?.message || idRangeNotice}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Controller
              name="quantity"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Quantity - calculated"
                  type="number"
                  placeholder="—"
                  fullWidth
                  size="small"
                  InputProps={{
                    readOnly: true,
                    style: { backgroundColor: "#F9FAFB" },
                  }}
                />
              )}
            />
          </Grid>
        </Grid>
      )}

      {(componentType === "FIM" || componentType === "SI") && (
        <Box sx={{ mb: 1 }}>
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ width: "100%", maxHeight: "500px", overflowY: "auto" }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                  <TableCell>
                    <b>Sr.No</b>
                  </TableCell>
                  <TableCell>
                    <b>ID No</b>
                  </TableCell>
                  <TableCell>
                    <b>Quantity</b>
                  </TableCell>
                  <TableCell>
                    <b>Size</b>
                  </TableCell>
                  <TableCell>
                    <b>MRIR</b>
                  </TableCell>
                  <TableCell>
                    <b>HEAT / LOT / BATCH No</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {QrTableRows.map((row, index) => (
                  <TableRow key={row.srNo}>
                    <TableCell>{row.srNo}</TableCell>
                    <TableCell>
                      <TextField
                        value={row.idNo}
                        size="small"
                        fullWidth
                        onChange={(e) =>
                          handleQrTableChange(index, "idNo", e.target.value)
                        }
                        onKeyDown={(e) => handleEnterKey(e, index, false)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={row.quantity}
                        type="number"
                        size="small"
                        fullWidth
                        onFocus={(e) => e.target.select()}
                        onChange={(e) =>
                          handleQrTableChange(index, "quantity", e.target.value)
                        }
                        onKeyDown={(e) => handleEnterKey(e, index, false)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={row.size}
                        size="small"
                        fullWidth
                        onChange={(e) =>
                          handleQrTableChange(index, "size", e.target.value)
                        }
                        onKeyDown={(e) => handleEnterKey(e, index, false)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={row.mirir}
                        size="small"
                        fullWidth
                        onChange={(e) =>
                          handleQrTableChange(index, "mirir", e.target.value)
                        }
                        onKeyDown={(e) => handleEnterKey(e, index, false)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={row.heatLotBatchNo}
                        size="small"
                        fullWidth
                        onChange={(e) =>
                          handleQrTableChange(
                            index,
                            "heatLotBatchNo",
                            e.target.value,
                          )
                        }
                        onKeyDown={(e) => handleEnterKey(e, index, true)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box
            sx={{
              mt: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Tooltip title="Add Row" arrow>
              <IconButton
                onClick={addNewQrRow}
                sx={{
                  backgroundColor: "primary.main",
                  color: "#fff",
                  width: 36,
                  height: 36,
                  "&:hover": { backgroundColor: "primary.dark" },
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Total Quantity:
              </Typography>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "primary.main" }}
              >
                {totalQuantity}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Card>
  );
}

export default React.memo(ComponentTypeStep);
