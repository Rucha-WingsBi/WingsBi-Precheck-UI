import React, { useState } from "react";
import {
  Box,
  Card,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Autocomplete,
  FormHelperText,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
} from "@mui/material";
import { Controller } from "react-hook-form";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import StepHeader from "./StepHeader";
import type { DrawingNumber, Shape } from "../../../types";

interface DrawingDetailsStepProps {
  control: any;
  errors: any;
  setValue: any;
  clearErrors: any;
  watch: any;
  componentType: string;
  setComponentType: (type: any) => void;
  qrTypeState: string;
  setQrTypeState: (state: string) => void;
  onQrTypeChange?: (val: string) => void;
  poNumbers: any[];
  selectedPO: any;
  setSelectedPO: (po: any) => void;
  poLoading: boolean;
  poInputValue: string;
  setPoInputValue: (val: string) => void;
  setPOSearchText: (val: string) => void;
  populatePOData: (po: any) => void;
  handlePOKeyDown: (e: any) => void;
  allDrawingNumbers: any[];
  selectedDrawing: any;
  setSelectedDrawing: (drawing: any) => void;
  isLnSearchLoading: boolean;
  isLnSearchFetching: boolean;
  updateDebouncedLnSearch: (val: string) => void;
  setDrawingSearchText: (val: string) => void;
  debouncedDrawingSearch: (val: string) => void;
  drawingNumbers: any[];
  updateComponentAndQrType: (compType: string) => void;
  productionSeries: any[];
  units: any[];
  irNumbers: any[];
  selectedIRNumber: any;
  setSelectedIRNumber: (ir: any) => void;
  handleIROpen: () => void;
  handleIRInputChange: (e: any, value: string) => void;
  setIrSearchText: (val: string) => void;
  msnNumbers: any[];
  selectedMSNNumber: any;
  setSelectedMSNNumber: (msn: any) => void;
  handleMSNOpen: () => void;
  handleMSNInputChange: (e: any, value: string) => void;
  setMsnSearchText: (val: string) => void;
  noExpiryDate: boolean;
  setNoExpiryDate: (val: boolean) => void;
  shapesData: any[];
  formatComponentType: (type?: string) => string;
  loading: boolean;
}

function DrawingDetailsStep({
  control,
  errors,
  setValue,
  clearErrors,
  watch,
  componentType,
  setComponentType,
  qrTypeState,
  setQrTypeState,
  onQrTypeChange,
  poNumbers,
  selectedPO,
  setSelectedPO,
  poLoading,
  poInputValue,
  setPoInputValue,
  setPOSearchText,
  populatePOData,
  handlePOKeyDown,
  allDrawingNumbers,
  selectedDrawing,
  setSelectedDrawing,
  isLnSearchLoading,
  isLnSearchFetching,
  updateDebouncedLnSearch,
  setDrawingSearchText,
  debouncedDrawingSearch,
  drawingNumbers,
  updateComponentAndQrType,
  productionSeries,
  units,
  irNumbers,
  selectedIRNumber,
  setSelectedIRNumber,
  handleIROpen,
  handleIRInputChange,
  setIrSearchText,
  msnNumbers,
  selectedMSNNumber,
  setSelectedMSNNumber,
  handleMSNOpen,
  handleMSNInputChange,
  setMsnSearchText,
  noExpiryDate,
  setNoExpiryDate,
  shapesData,
  formatComponentType,
  loading,
}: DrawingDetailsStepProps) {
  // Controlled open states for all Autocomplete fields to guarantee immediate opening on text field click
  const [openPO, setOpenPO] = useState(false);
  const [openLN, setOpenLN] = useState(false);
  const [openDrawing, setOpenDrawing] = useState(false);
  const [openProdSeries, setOpenProdSeries] = useState(false);
  const [openIR, setOpenIR] = useState(false);
  const [openMSN, setOpenMSN] = useState(false);
  const [openShape, setOpenShape] = useState(false);

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: "10px",
        borderColor: "#EAECF0",
        backgroundColor: "#FFFFFF",
        p: { xs: 1.5, md: 1.75 },
        mb: 1.5,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <StepHeader number={1} title="Basic Details" />

      {/* Top QR Type Radio Group */}
      <Box sx={{ mb: 1.5 }}>
        <Controller
          name="qrType"
          control={control}
          defaultValue="ID"
          render={({ field }) => {
            const currentVal = field.value || qrTypeState || "ID";
            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, flexWrap: "wrap" }}>
                <FormLabel
                  component="legend"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    color: "#111827",
                    display: "block",
                    "&.MuiFormLabel-root": { color: "#111827" },
                  }}
                >
                  QR Type
                </FormLabel>
                <RadioGroup
                  row
                  value={currentVal}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val);
                    if (onQrTypeChange) {
                      onQrTypeChange(val);
                    } else {
                      setQrTypeState(val);
                      const newCompType = (val === "Purchase Item" ? "SI" : val) as any;
                      setComponentType(newCompType);
                      setValue("componentType", newCompType);
                    }
                  }}
                  sx={{ gap: { xs: 1, sm: 1.5 } }}
                >
                  {[
                    { value: "ID", label: "ID" },
                    { value: "BATCH", label: "BATCH" },
                    { value: "FIM", label: "FIM" },
                    { value: "Purchase Item", label: "Purchase Item" },
                  ].map((item) => (
                    <FormControlLabel
                      key={item.value}
                      value={item.value}
                      control={
                        <Radio
                          size="small"
                          sx={{
                            color: currentVal === item.value ? "primary.main" : "#D1D5DB",
                            "&.Mui-checked": {
                              color: "primary.main",
                            },
                          }}
                        />
                      }
                      label={
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: currentVal === item.value ? 600 : 500,
                            color: "#111827",
                            fontSize: "0.875rem",
                          }}
                        >
                          {item.label}
                        </Typography>
                      }
                      sx={{ mr: 1 }}
                    />
                  ))}
                </RadioGroup>
              </Box>
            );
          }}
        />
      </Box>

      {/* Standard Manufacturing Item Form (ID & BATCH) */}
      {(componentType === "ID" || componentType === "BATCH") && (
        <Grid container rowSpacing={1.5} columnSpacing={2} sx={{ mb: 1 }}>
          {/* Row 1: PO Number *, LN Item Code *, Drawing No. * */}
          <Grid item xs={12} md={4}>
            <Controller
              name="poNumber"
              control={control}
              rules={{ required: "PO Number is required" }}
              render={({ field: { onChange, ref }, fieldState: { error } }) => (
                <Autocomplete
                  size="small"
                  freeSolo
                  open={openPO}
                  onOpen={() => setOpenPO(true)}
                  onClose={() => setOpenPO(false)}
                  openOnFocus={true}
                  selectOnFocus={true}
                  forcePopupIcon={true}
                  ListboxProps={{ style: { maxHeight: "300px" } }}
                  options={Array.isArray(poNumbers) ? poNumbers : []}
                  getOptionLabel={(option) =>
                    typeof option === "string"
                      ? option
                      : option.productionOrderNumber || ""
                  }
                  isOptionEqualToValue={(option, value) => {
                    if (!value) return false;
                    if (typeof value === "string")
                      return option.productionOrderNumber === value;
                    return (
                      option.productionOrderNumber ===
                      value.productionOrderNumber
                    );
                  }}
                  filterOptions={(options, { inputValue }) => {
                    if (!inputValue) return options;
                    const searchLower = inputValue.toLowerCase();
                    const selectedVal = (selectedPO?.productionOrderNumber || watch("poNumber") || "").toLowerCase();
                    if (searchLower === selectedVal) return options;
                    return options.filter((opt: any) => {
                      if (typeof opt === "string")
                        return (opt as string).toLowerCase().includes(searchLower);
                      return (
                        opt.productionOrderNumber
                          ?.toLowerCase()
                          .includes(searchLower) ||
                        opt.lnItemCode
                          ?.toLowerCase()
                          .includes(searchLower) ||
                        opt.drawingNumber
                          ?.toLowerCase()
                          .includes(searchLower) ||
                        opt.nomenclature
                          ?.toLowerCase()
                          .includes(searchLower)
                      );
                    });
                  }}
                  value={selectedPO || watch("poNumber") || null}
                  loading={poLoading}
                  inputValue={poInputValue}
                  onInputChange={(_, inputValue, reason) => {
                    setPoInputValue(inputValue);
                    if (reason === "input") {
                      setPOSearchText(inputValue);
                    }
                  }}
                  onChange={(_, newValue) => {
                    setOpenPO(false);
                    if (newValue && typeof newValue !== "string") {
                      populatePOData(newValue);
                      setPoInputValue(newValue.productionOrderNumber || "");
                      onChange(newValue.productionOrderNumber || "");
                    } else if (typeof newValue === "string") {
                      const matchingPO = poNumbers.find((po) =>
                        po.productionOrderNumber
                          ?.toLowerCase()
                          .includes(newValue.toLowerCase()),
                      );
                      if (matchingPO) {
                        populatePOData(matchingPO);
                        setPoInputValue(
                          matchingPO.productionOrderNumber || newValue,
                        );
                      } else {
                        setSelectedPO(null);
                        setPoInputValue(newValue || "");
                      }
                      onChange(newValue);
                    } else {
                      setSelectedPO(null);
                      setPoInputValue("");
                      setValue("lnItemCode", "");
                      setValue("drawingNumber", "");
                      setValue("nomenclature", "");
                      setValue("unit", "");
                      setValue("projectNumber" as any, "");
                      setValue("buildNumber" as any, "");
                      setValue("partAssemblyId", "");
                      onChange("");
                    }
                  }}
                  renderOption={(props, option) => {
                    const { key, ...optionProps } = props;
                    if (typeof option === "string") {
                      return (
                        <li {...optionProps} key={key}>
                          {option}
                        </li>
                      );
                    }
                    const details = [
                      option.lnItemCode ? `LN: ${option.lnItemCode}` : null,
                      option.nomenclature || option.drawingNumber
                        ? `${option.drawingNumber || ""} ${option.nomenclature || ""}`.trim()
                        : null,
                      option.componentType
                        ? formatComponentType(option.componentType)
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" | ");

                    return (
                      <li {...optionProps} key={key}>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            py: 0.5,
                            width: "100%",
                          }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight="700"
                            sx={{ fontSize: "0.875rem", color: "primary.main" }}
                          >
                            {option.productionOrderNumber}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ fontSize: "0.75rem", lineHeight: 1.35, color: "#64748B" }}
                          >
                            {details}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="PO Number *"
                      fullWidth
                      size="small"
                      inputRef={ref}
                      onKeyDown={handlePOKeyDown}
                      onClick={() => setOpenPO(true)}
                      onFocus={(e) => {
                        setOpenPO(true);
                        (e.target as HTMLInputElement)?.select?.();
                      }}
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name="lnItemCode"
              control={control}
              render={({ field: { onChange }, fieldState: { error } }) => (
                <Autocomplete
                  open={openLN}
                  onOpen={() => setOpenLN(true)}
                  onClose={() => setOpenLN(false)}
                  options={allDrawingNumbers || []}
                  openOnFocus={true}
                  selectOnFocus={true}
                  forcePopupIcon={true}
                  ListboxProps={{ style: { maxHeight: "300px" } }}
                  getOptionLabel={(option) =>
                    typeof option === "string" ? option : option.lnItemCode || ""
                  }
                  value={selectedDrawing}
                  loading={isLnSearchLoading || isLnSearchFetching}
                  size="small"
                  filterOptions={(options, { inputValue }) => {
                    if (!inputValue) return options.slice(0, 100);
                    const searchLower = inputValue.toLowerCase();
                    const selectedLn = (selectedDrawing?.lnItemCode || "").toLowerCase();
                    if (searchLower === selectedLn) return options.slice(0, 100);
                    return options
                      .filter(
                        (option) =>
                          option.lnItemCode?.toLowerCase().includes(searchLower) ||
                          option.drawingNumber?.toLowerCase().includes(searchLower) ||
                          option.nomenclature?.toLowerCase().includes(searchLower),
                      )
                      .slice(0, 100);
                  }}
                  onInputChange={(_, value, reason) => {
                    if (reason === "input") {
                      updateDebouncedLnSearch(value);
                    }
                  }}
                  onChange={(_, newValue) => {
                    setOpenLN(false);
                    if (newValue && typeof newValue !== "string") {
                      setSelectedDrawing(newValue);
                      setValue("drawingNumber", newValue.drawingNumber, { shouldValidate: true, shouldDirty: true });
                      setValue("lnItemCode", newValue.lnItemCode || "", { shouldValidate: true, shouldDirty: true });
                      setValue("nomenclature", newValue.nomenclature);
                      setValue("unit", newValue.unitName || "");
                      setValue("location", newValue.location || "");
                      setValue(
                        "partAssemblyId",
                        newValue.parentDrawingNumbers?.[0] || "",
                      );
                      if (newValue.componentType) {
                        updateComponentAndQrType(newValue.componentType);
                      }
                      if (clearErrors) clearErrors(["drawingNumber", "lnItemCode"]);
                      onChange(newValue.lnItemCode || newValue.drawingNumber);
                    } else {
                      setSelectedDrawing(null);
                      setValue("drawingNumber", "");
                      setValue("lnItemCode", "");
                      setValue("nomenclature", "");
                      setValue("unit", "");
                      setValue("partAssemblyId", "");
                      setValue("location", "");
                      onChange("");
                    }
                  }}
                  renderOption={(props, option) => {
                    const { key, ...optionProps } = props;
                    const lnCode = typeof option === "string" ? option : (option.lnItemCode || option.drawingNumber || "");
                    const drawingNo = typeof option === "string" ? "" : option.drawingNumber;
                    const nomenclature = typeof option === "string" ? "" : option.nomenclature;
                    const compType = typeof option === "string" ? "" : formatComponentType(option.componentType);

                    const details = [
                      drawingNo ? `Drawing: ${drawingNo}` : null,
                      nomenclature,
                      compType,
                    ].filter(Boolean).join(" | ");

                    return (
                      <li {...optionProps} key={key}>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            py: 0.5,
                            width: "100%",
                          }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight="700"
                            sx={{ fontSize: "0.875rem", color: "primary.main" }}
                          >
                            {lnCode}
                          </Typography>
                          {details && (
                            <Typography
                              variant="caption"
                              sx={{ fontSize: "0.75rem", lineHeight: 1.35, color: "#64748B" }}
                            >
                              {details}
                            </Typography>
                          )}
                        </Box>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="LN Item Code *"
                      fullWidth
                      size="small"
                      onClick={() => setOpenLN(true)}
                      onFocus={(e) => {
                        setOpenLN(true);
                        (e.target as HTMLInputElement)?.select?.();
                      }}
                      error={!!error || !!errors.lnItemCode || !!errors.drawingNumber}
                      helperText={error?.message || errors.lnItemCode?.message || errors.drawingNumber?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name="drawingNumber"
              control={control}
              rules={{ required: "Drawing Number or LN Item Code is required" }}
              render={({ field: { onChange, ref }, fieldState: { error } }) => (
                <Autocomplete
                  open={openDrawing}
                  onOpen={() => setOpenDrawing(true)}
                  onClose={() => setOpenDrawing(false)}
                  options={allDrawingNumbers || []}
                  openOnFocus={true}
                  selectOnFocus={true}
                  forcePopupIcon={true}
                  ListboxProps={{ style: { maxHeight: "300px" } }}
                  getOptionLabel={(option) =>
                    typeof option === "string" ? option : option.drawingNumber || ""
                  }
                  value={selectedDrawing}
                  loading={isLnSearchLoading || isLnSearchFetching}
                  size="small"
                  filterOptions={(options, { inputValue }) => {
                    if (!inputValue) return options.slice(0, 100);
                    const searchLower = inputValue.toLowerCase();
                    const selectedDrw = (selectedDrawing?.drawingNumber || "").toLowerCase();
                    if (searchLower === selectedDrw) return options.slice(0, 100);
                    return options
                      .filter(
                        (option) =>
                          option.drawingNumber?.toLowerCase().includes(searchLower) ||
                          option.lnItemCode?.toLowerCase().includes(searchLower) ||
                          option.nomenclature?.toLowerCase().includes(searchLower),
                      )
                      .slice(0, 100);
                  }}
                  onInputChange={(_, value, reason) => {
                    if (reason === "input") {
                      updateDebouncedLnSearch(value);
                    }
                  }}
                  onChange={(_, newValue) => {
                    setOpenDrawing(false);
                    if (newValue && typeof newValue !== "string") {
                      setSelectedDrawing(newValue);
                      setValue("drawingNumber", newValue.drawingNumber, { shouldValidate: true, shouldDirty: true });
                      setValue("lnItemCode", newValue.lnItemCode || "", { shouldValidate: true, shouldDirty: true });
                      setValue("nomenclature", newValue.nomenclature);
                      setValue("unit", newValue.unitName || "");
                      setValue("location", newValue.location || "");
                      setValue(
                        "partAssemblyId",
                        newValue.parentDrawingNumbers?.[0] || "",
                      );
                      if (newValue.componentType) {
                        updateComponentAndQrType(newValue.componentType);
                      }
                      if (clearErrors) clearErrors(["drawingNumber", "lnItemCode"]);
                      onChange(newValue.drawingNumber);
                    } else {
                      setSelectedDrawing(null);
                      setValue("drawingNumber", "");
                      setValue("lnItemCode", "");
                      setValue("nomenclature", "");
                      setValue("unit", "");
                      setValue("partAssemblyId", "");
                      setValue("location", "");
                      onChange("");
                    }
                  }}
                  renderOption={(props, option) => {
                    const { key, ...optionProps } = props;
                    const drawingNo = typeof option === "string" ? option : (option.drawingNumber || option.lnItemCode || "");
                    const lnCode = typeof option === "string" ? "" : option.lnItemCode;
                    const nomenclature = typeof option === "string" ? "" : option.nomenclature;
                    const compType = typeof option === "string" ? "" : formatComponentType(option.componentType);

                    const details = [
                      lnCode ? `LN: ${lnCode}` : null,
                      nomenclature,
                      compType,
                    ].filter(Boolean).join(" | ");

                    return (
                      <li {...optionProps} key={key}>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            py: 0.5,
                            width: "100%",
                          }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight="700"
                            sx={{ fontSize: "0.875rem", color: "primary.main" }}
                          >
                            {drawingNo}
                          </Typography>
                          {details && (
                            <Typography
                              variant="caption"
                              sx={{ fontSize: "0.75rem", lineHeight: 1.35, color: "#64748B" }}
                            >
                              {details}
                            </Typography>
                          )}
                        </Box>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Drawing No. *"
                      fullWidth
                      size="small"
                      inputRef={ref}
                      onClick={() => setOpenDrawing(true)}
                      onFocus={(e) => {
                        setOpenDrawing(true);
                        (e.target as HTMLInputElement)?.select?.();
                      }}
                      error={!!error || !!errors.drawingNumber}
                      helperText={error?.message || errors.drawingNumber?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* Row 2: Production Series *, Unit *, IR Number */}
          <Grid item xs={12} md={4}>
            <Controller
              name="productionSeries"
              control={control}
              rules={{ required: "Production Series is required" }}
              render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
                <Autocomplete
                  size="small"
                  open={openProdSeries}
                  onOpen={() => setOpenProdSeries(true)}
                  onClose={() => setOpenProdSeries(false)}
                  openOnFocus={true}
                  selectOnFocus={true}
                  forcePopupIcon={true}
                  options={productionSeries || []}
                  getOptionLabel={(option) => typeof option === "string" ? option : option.productionSeries || ""}
                  value={(productionSeries || []).find((s) => s.productionSeries === value) || (value ? (value as any) : null)}
                  filterOptions={(options, { inputValue }) => {
                    if (!inputValue) return options;
                    const searchLower = inputValue.toLowerCase();
                    if (value && searchLower === String(value).toLowerCase()) return options;
                    return options.filter((s: any) =>
                      (s.productionSeries || s).toLowerCase().includes(searchLower)
                    );
                  }}
                  onChange={(_, newValue) => {
                    setOpenProdSeries(false);
                    const val = newValue ? (typeof newValue === "string" ? newValue : newValue.productionSeries) : "";
                    setValue("productionSeries", val);
                    onChange(val);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Production Series *"
                      inputRef={ref}
                      onClick={() => setOpenProdSeries(true)}
                      onFocus={(e) => {
                        setOpenProdSeries(true);
                        (e.target as HTMLInputElement)?.select?.();
                      }}
                      error={!!error || !!errors.productionSeries}
                      helperText={error?.message || errors.productionSeries?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Controller name="unit" control={control} rules={{ required: "Unit is required" }} render={({ field, fieldState: { error } }) => (
              <FormControl fullWidth error={!!error || !!errors.unit} size="small">
                <InputLabel>Unit *</InputLabel>
                <Select
                  {...field}
                  label="Unit *"
                  onChange={(e) => {
                    field.onChange(e);
                    if (e.target.value) {
                      clearErrors("unit");
                    }
                  }}
                >
                  {units.map((u) => (
                    <MenuItem key={u.id} value={u.unitName}>
                      {u.unitName}
                    </MenuItem>
                  ))}
                </Select>
                {(error || errors.unit) && (
                  <FormHelperText error>{error?.message || errors.unit?.message}</FormHelperText>
                )}
              </FormControl>
            )} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Controller name="irNumber" control={control} render={({ field, fieldState: { error } }) => (
              <Autocomplete
                {...field}
                open={openIR}
                onOpen={() => {
                  handleIROpen();
                  setOpenIR(true);
                }}
                onClose={() => setOpenIR(false)}
                openOnFocus={true}
                selectOnFocus={true}
                forcePopupIcon={true}
                options={irNumbers}
                getOptionLabel={(option) => typeof option === "string" ? option : option.irNumber || ""}
                value={selectedIRNumber}
                loading={loading}
                size="small"
                onInputChange={handleIRInputChange}
                filterOptions={(options, { inputValue }) => {
                  if (!inputValue) return options;
                  const searchLower = inputValue.toLowerCase();
                  const currentIr = (selectedIRNumber?.irNumber || watch("irNumber") || "").toLowerCase();
                  if (searchLower === currentIr) return options;
                  return options.filter((item: any) =>
                    typeof item === "string"
                      ? item.toLowerCase().includes(searchLower)
                      : item.irNumber?.toLowerCase().includes(searchLower)
                  );
                }}
                onChange={(_, value) => {
                  setOpenIR(false);
                  setSelectedIRNumber(value);
                  setValue("irNumber", value?.irNumber || "");
                  setIrSearchText("");
                  field.onChange(value?.irNumber || "");
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="IR Number"
                    onClick={() => setOpenIR(true)}
                    onFocus={(e) => {
                      setOpenIR(true);
                      (e.target as HTMLInputElement)?.select?.();
                    }}
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
            )} />
          </Grid>

          {/* Row 3: MSN Number *, MFG Date *, Expiry Date */}
          <Grid item xs={12} md={4}>
            <Controller name="msnNumber" control={control} rules={{ required: "MSN Number is required" }} render={({ field: { onChange, ref }, fieldState: { error } }) => (
              <Autocomplete
                open={openMSN}
                onOpen={() => {
                  handleMSNOpen();
                  setOpenMSN(true);
                }}
                onClose={() => setOpenMSN(false)}
                openOnFocus={true}
                selectOnFocus={true}
                forcePopupIcon={true}
                options={msnNumbers}
                getOptionLabel={(option) => typeof option === "string" ? option : option.msnNumber || ""}
                value={selectedMSNNumber}
                loading={loading}
                size="small"
                onInputChange={handleMSNInputChange}
                filterOptions={(options, { inputValue }) => {
                  if (!inputValue) return options;
                  const searchLower = inputValue.toLowerCase();
                  const currentMsn = (selectedMSNNumber?.msnNumber || watch("msnNumber") || "").toLowerCase();
                  if (searchLower === currentMsn) return options;
                  return options.filter((item: any) =>
                    typeof item === "string"
                      ? item.toLowerCase().includes(searchLower)
                      : item.msnNumber?.toLowerCase().includes(searchLower)
                  );
                }}
                onChange={(_, value) => {
                  setOpenMSN(false);
                  setSelectedMSNNumber(value);
                  const val = value?.msnNumber || "";
                  setValue("msnNumber", val);
                  setMsnSearchText("");
                  onChange(val);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="MSN Number *"
                    inputRef={ref}
                    onClick={() => setOpenMSN(true)}
                    onFocus={(e) => {
                      setOpenMSN(true);
                      (e.target as HTMLInputElement)?.select?.();
                    }}
                    error={!!error || !!errors.msnNumber}
                    helperText={error?.message || errors.msnNumber?.message}
                  />
                )}
              />
            )} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Controller
              name="manufacturingDate"
              control={control}
              rules={{ required: "MFG Date is required" }}
              render={({ field, fieldState: { error } }) => (
                <DatePicker
                  {...field}
                  label="MFG Date *"
                  maxDate={new Date()}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      error: !!error || !!errors.manufacturingDate,
                      helperText: error?.message || errors.manufacturingDate?.message,
                      sx: {
                        "& .MuiInputBase-root": { height: 40 },
                        "& .MuiOutlinedInput-input": { padding: "8.5px 14px" },
                      },
                    },
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Controller name="expiryDate" control={control} render={({ field }) => <DatePicker {...field} value={field.value || null} disabled={noExpiryDate} onChange={(newValue) => { field.onChange(newValue || null); if (newValue) setNoExpiryDate(false); }} label="Expiry Date" slotProps={{ textField: { size: "small", fullWidth: true, sx: { "& .MuiInputBase-root": { height: 40 }, "& .MuiOutlinedInput-input": { padding: "8.5px 14px" } } } }} />} />
          </Grid>
        </Grid>
      )}

      {/* FIM Item Form */}
      {componentType === "FIM" && (
        <Grid container rowSpacing={1.5} columnSpacing={2} sx={{ mb: 1 }}>
          {/* Row 1: RM Drawing Number *, RM Item Code, Production Series * */}
          <Grid item xs={12} md={4}>
            <Controller
              name="drawingNumber"
              control={control}
              rules={{ required: "RM Drawing Number is required" }}
              render={({ field: { onChange, ref }, fieldState: { error } }) => (
                <Autocomplete
                  open={openDrawing}
                  onOpen={() => setOpenDrawing(true)}
                  onClose={() => setOpenDrawing(false)}
                  openOnFocus={true}
                  selectOnFocus={true}
                  forcePopupIcon={true}
                  options={drawingNumbers.filter(
                    (d: DrawingNumber) =>
                      !selectedDrawing?.lnItemCode || d.lnItemCode === selectedDrawing.lnItemCode,
                  )}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    return option.drawingNumber || "";
                  }}
                  value={selectedDrawing}
                  size="small"
                  filterOptions={(options, { inputValue }) => {
                    if (!inputValue) return options;
                    const searchLower = inputValue.toLowerCase();
                    const selectedDrw = (selectedDrawing?.drawingNumber || watch("drawingNumber") || "").toLowerCase();
                    if (searchLower === selectedDrw) return options;
                    return options.filter((option) =>
                      option.drawingNumber?.toLowerCase().includes(searchLower) ||
                      option.lnItemCode?.toLowerCase().includes(searchLower) ||
                      option.nomenclature?.toLowerCase().includes(searchLower),
                    );
                  }}
                  onInputChange={(_, value, reason) => {
                    if (value.length === 0) setDrawingSearchText("");
                    else if (reason === "input" && value.length >= 1) debouncedDrawingSearch(value);
                  }}
                  onChange={(_, value) => {
                    setOpenDrawing(false);
                    setSelectedDrawing(value);
                    const val = value ? value.drawingNumber : "";
                    onChange(val);
                    setValue("drawingNumber", val);
                    if (value) {
                      setValue("nomenclature", value.nomenclature);
                      setValue("location", value.location || "");
                      setValue("unit", value.unitName || "");
                      setValue("rmItemCode", value.lnItemCode || "");
                      if (value.componentType) {
                        updateComponentAndQrType(value.componentType);
                      }
                      setValue("partAssemblyId", value.parentDrawingNumbers?.[0] || "");
                    } else {
                      setValue("nomenclature", "");
                      setValue("location", "");
                      setValue("unit", "");
                      setValue("rmItemCode", "");
                      setValue("partAssemblyId", "");
                    }
                  }}
                  renderOption={(props, option) => {
                    const { key, ...optionProps } = props;
                    const drawingNo = typeof option === "string" ? option : (option.drawingNumber || option.lnItemCode || "");
                    const lnCode = typeof option === "string" ? "" : option.lnItemCode;
                    const nomenclature = typeof option === "string" ? "" : option.nomenclature;
                    const compType = typeof option === "string" ? "" : formatComponentType(option.componentType);

                    const details = [
                      lnCode ? `LN: ${lnCode}` : null,
                      nomenclature,
                      compType,
                    ].filter(Boolean).join(" | ");

                    return (
                      <li {...optionProps} key={key}>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            py: 0.5,
                            width: "100%",
                          }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight="700"
                            sx={{ fontSize: "0.875rem", color: "primary.main" }}
                          >
                            {drawingNo}
                          </Typography>
                          {details && (
                            <Typography
                              variant="caption"
                              sx={{ fontSize: "0.75rem", lineHeight: 1.35, color: "#64748B" }}
                            >
                              {details}
                            </Typography>
                          )}
                        </Box>
                      </li>
                    );
                  }}
                  ListboxProps={{ style: { maxHeight: "300px" } }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="RM Drawing Number *"
                      inputRef={ref}
                      onClick={() => setOpenDrawing(true)}
                      onFocus={(e) => {
                        setOpenDrawing(true);
                        (e.target as HTMLInputElement)?.select?.();
                      }}
                      error={!!error || !!errors.drawingNumber}
                      helperText={error?.message || errors.drawingNumber?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Controller
              name="rmItemCode"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="RM Item Code"
                  fullWidth
                  size="small"
                  value={field.value || ""}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Controller
              name="productionSeries"
              control={control}
              rules={{ required: "Production Series is required" }}
              render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
                <Autocomplete
                  size="small"
                  open={openProdSeries}
                  onOpen={() => setOpenProdSeries(true)}
                  onClose={() => setOpenProdSeries(false)}
                  openOnFocus={true}
                  selectOnFocus={true}
                  forcePopupIcon={true}
                  options={productionSeries || []}
                  getOptionLabel={(option) => typeof option === "string" ? option : option.productionSeries || ""}
                  value={(productionSeries || []).find((s) => s.productionSeries === value) || (value ? (value as any) : null)}
                  filterOptions={(options, { inputValue }) => {
                    if (!inputValue) return options;
                    const searchLower = inputValue.toLowerCase();
                    if (value && searchLower === String(value).toLowerCase()) return options;
                    return options.filter((s: any) =>
                      (s.productionSeries || s).toLowerCase().includes(searchLower)
                    );
                  }}
                  onChange={(_, newValue) => {
                    setOpenProdSeries(false);
                    const val = newValue ? (typeof newValue === "string" ? newValue : newValue.productionSeries) : "";
                    setValue("productionSeries", val);
                    onChange(val);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Production Series *"
                      inputRef={ref}
                      onClick={() => setOpenProdSeries(true)}
                      onFocus={(e) => {
                        setOpenProdSeries(true);
                        (e.target as HTMLInputElement)?.select?.();
                      }}
                      error={!!error || !!errors.productionSeries}
                      helperText={error?.message || errors.productionSeries?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* Row 2: Unit *, IR Number, MSN Number * */}
          <Grid item xs={12} md={4}>
            <Controller name="unit" control={control} rules={{ required: "Unit is required" }} render={({ field, fieldState: { error } }) => (
              <FormControl fullWidth error={!!error || !!errors.unit} size="small">
                <InputLabel>Unit *</InputLabel>
                <Select
                  {...field}
                  label="Unit *"
                  onChange={(e) => {
                    field.onChange(e);
                    if (e.target.value) {
                      clearErrors("unit");
                    }
                  }}
                >
                  {units.map((u) => (
                    <MenuItem key={u.id} value={u.unitName}>
                      {u.unitName}
                    </MenuItem>
                  ))}
                </Select>
                {(error || errors.unit) && (
                  <FormHelperText error>{error?.message || errors.unit?.message}</FormHelperText>
                )}
              </FormControl>
            )} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Controller name="irNumber" control={control} render={({ field, fieldState: { error } }) => (
              <Autocomplete
                {...field}
                open={openIR}
                onOpen={() => {
                  handleIROpen();
                  setOpenIR(true);
                }}
                onClose={() => setOpenIR(false)}
                openOnFocus={true}
                selectOnFocus={true}
                forcePopupIcon={true}
                options={irNumbers}
                getOptionLabel={(option) => typeof option === "string" ? option : option.irNumber || ""}
                value={selectedIRNumber}
                loading={loading}
                size="small"
                onInputChange={handleIRInputChange}
                filterOptions={(options, { inputValue }) => {
                  if (!inputValue) return options;
                  const searchLower = inputValue.toLowerCase();
                  const currentIr = (selectedIRNumber?.irNumber || watch("irNumber") || "").toLowerCase();
                  if (searchLower === currentIr) return options;
                  return options.filter((item: any) =>
                    typeof item === "string"
                      ? item.toLowerCase().includes(searchLower)
                      : item.irNumber?.toLowerCase().includes(searchLower)
                  );
                }}
                onChange={(_, value) => {
                  setOpenIR(false);
                  setSelectedIRNumber(value);
                  setValue("irNumber", value?.irNumber || "");
                  setIrSearchText("");
                  field.onChange(value?.irNumber || "");
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="IR Number"
                    onClick={() => setOpenIR(true)}
                    onFocus={(e) => {
                      setOpenIR(true);
                      (e.target as HTMLInputElement)?.select?.();
                    }}
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
            )} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Controller name="msnNumber" control={control} rules={{ required: "MSN Number is required" }} render={({ field: { onChange, ref }, fieldState: { error } }) => (
              <Autocomplete
                open={openMSN}
                onOpen={() => {
                  handleMSNOpen();
                  setOpenMSN(true);
                }}
                onClose={() => setOpenMSN(false)}
                openOnFocus={true}
                selectOnFocus={true}
                forcePopupIcon={true}
                options={msnNumbers}
                getOptionLabel={(option) => typeof option === "string" ? option : option.msnNumber || ""}
                value={selectedMSNNumber}
                loading={loading}
                size="small"
                onInputChange={handleMSNInputChange}
                filterOptions={(options, { inputValue }) => {
                  if (!inputValue) return options;
                  const searchLower = inputValue.toLowerCase();
                  const currentMsn = (selectedMSNNumber?.msnNumber || watch("msnNumber") || "").toLowerCase();
                  if (searchLower === currentMsn) return options;
                  return options.filter((item: any) =>
                    typeof item === "string"
                      ? item.toLowerCase().includes(searchLower)
                      : item.msnNumber?.toLowerCase().includes(searchLower)
                  );
                }}
                onChange={(_, value) => {
                  setOpenMSN(false);
                  setSelectedMSNNumber(value);
                  const val = value?.msnNumber || "";
                  setValue("msnNumber", val);
                  setMsnSearchText("");
                  onChange(val);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="MSN Number *"
                    inputRef={ref}
                    onClick={() => setOpenMSN(true)}
                    onFocus={(e) => {
                      setOpenMSN(true);
                      (e.target as HTMLInputElement)?.select?.();
                    }}
                    error={!!error || !!errors.msnNumber}
                    helperText={error?.message || errors.msnNumber?.message}
                  />
                )}
              />
            )} />
          </Grid>

          {/* Row 3: FAN/MAN Number, FAN/MAN Serial Number, GFN No */}
          <Grid item xs={12} md={4}>
            <Controller name="fanManNumber" control={control} render={({ field }) => <TextField {...field} label="FAN/MAN Number" fullWidth size="small" />} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Controller name="fanManSerialNumber" control={control} render={({ field }) => <TextField {...field} label="FAN/MAN Serial Number" fullWidth size="small" />} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Controller name="gfnNo" control={control} render={({ field }) => <TextField {...field} label="GFN No" fullWidth size="small" />} />
          </Grid>

          {/* Row 4: MFG Date *, Expiry Date */}
          <Grid item xs={12} md={6}>
            <Controller
              name="manufacturingDate"
              control={control}
              rules={{ required: "MFG Date is required" }}
              render={({ field, fieldState: { error } }) => (
                <DatePicker
                  {...field}
                  label="MFG Date *"
                  maxDate={new Date()}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      error: !!error || !!errors.manufacturingDate,
                      helperText: error?.message || errors.manufacturingDate?.message,
                      sx: {
                        "& .MuiInputBase-root": { height: 40 },
                        "& .MuiOutlinedInput-input": { padding: "8.5px 14px" },
                      },
                    },
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller name="expiryDate" control={control} render={({ field }) => <DatePicker {...field} value={field.value || null} disabled={noExpiryDate} onChange={(newValue) => { field.onChange(newValue || null); if (newValue) setNoExpiryDate(false); }} label="Expiry Date" slotProps={{ textField: { size: "small", fullWidth: true, sx: { "& .MuiInputBase-root": { height: 40 }, "& .MuiOutlinedInput-input": { padding: "8.5px 14px" } } } }} />} />
          </Grid>
        </Grid>
      )}

      {/* SI / Purchase Item Form */}
      {(componentType === "SI" || componentType === "Purchase Item" || componentType === "PURCHASE ITEM") && (
        <Grid container rowSpacing={1.5} columnSpacing={2} sx={{ mb: 1 }}>
          {/* Row 1: RM Drawing Number *, RM Item Code, Production Series * */}
          <Grid item xs={12} md={4}>
            <Controller
              name="drawingNumber"
              control={control}
              rules={{ required: "RM Drawing Number is required" }}
              render={({ field: { onChange, ref }, fieldState: { error } }) => (
                <Autocomplete
                  open={openDrawing}
                  onOpen={() => setOpenDrawing(true)}
                  onClose={() => setOpenDrawing(false)}
                  openOnFocus={true}
                  selectOnFocus={true}
                  forcePopupIcon={true}
                  options={drawingNumbers.filter(
                    (d: DrawingNumber) =>
                      !selectedDrawing?.lnItemCode || d.lnItemCode === selectedDrawing.lnItemCode,
                  )}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    return option.drawingNumber || "";
                  }}
                  value={selectedDrawing}
                  size="small"
                  filterOptions={(options, { inputValue }) => {
                    if (!inputValue) return options;
                    const searchLower = inputValue.toLowerCase();
                    const selectedDrw = (selectedDrawing?.drawingNumber || watch("drawingNumber") || "").toLowerCase();
                    if (searchLower === selectedDrw) return options;
                    return options.filter((option) =>
                      option.drawingNumber?.toLowerCase().includes(searchLower) ||
                      option.lnItemCode?.toLowerCase().includes(searchLower) ||
                      option.nomenclature?.toLowerCase().includes(searchLower),
                    );
                  }}
                  onInputChange={(_, value, reason) => {
                    if (value.length === 0) setDrawingSearchText("");
                    else if (reason === "input" && value.length >= 1) debouncedDrawingSearch(value);
                  }}
                  onChange={(_, value) => {
                    setOpenDrawing(false);
                    setSelectedDrawing(value);
                    const val = value ? value.drawingNumber : "";
                    onChange(val);
                    setValue("drawingNumber", val);
                    if (value) {
                      setValue("nomenclature", value.nomenclature);
                      setValue("location", value.location || "");
                      setValue("unit", value.unitName || "");
                      setValue("rmItemCode", value.lnItemCode || "");
                      if (value.componentType) {
                        updateComponentAndQrType(value.componentType);
                      }
                      setValue("partAssemblyId", value.parentDrawingNumbers?.[0] || "");
                    } else {
                      setValue("nomenclature", "");
                      setValue("location", "");
                      setValue("unit", "");
                      setValue("rmItemCode", "");
                      setValue("partAssemblyId", "");
                    }
                  }}
                  renderOption={(props, option) => {
                    const { key, ...optionProps } = props;
                    const drawingNo = typeof option === "string" ? option : (option.drawingNumber || option.lnItemCode || "");
                    const lnCode = typeof option === "string" ? "" : option.lnItemCode;
                    const nomenclature = typeof option === "string" ? "" : option.nomenclature;
                    const compType = typeof option === "string" ? "" : formatComponentType(option.componentType);

                    const details = [
                      lnCode ? `LN: ${lnCode}` : null,
                      nomenclature,
                      compType,
                    ].filter(Boolean).join(" | ");

                    return (
                      <li {...optionProps} key={key}>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            py: 0.5,
                            width: "100%",
                          }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight="700"
                            sx={{ fontSize: "0.875rem", color: "primary.main" }}
                          >
                            {drawingNo}
                          </Typography>
                          {details && (
                            <Typography
                              variant="caption"
                              sx={{ fontSize: "0.75rem", lineHeight: 1.35, color: "#64748B" }}
                            >
                              {details}
                            </Typography>
                          )}
                        </Box>
                      </li>
                    );
                  }}
                  ListboxProps={{ style: { maxHeight: "300px" } }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="RM Drawing Number *"
                      inputRef={ref}
                      onClick={() => setOpenDrawing(true)}
                      onFocus={(e) => {
                        setOpenDrawing(true);
                        (e.target as HTMLInputElement)?.select?.();
                      }}
                      error={!!error || !!errors.drawingNumber}
                      helperText={error?.message || errors.drawingNumber?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Controller
              name="rmItemCode"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="RM Item Code"
                  fullWidth
                  size="small"
                  value={field.value || ""}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Controller
              name="productionSeries"
              control={control}
              rules={{ required: "Production Series is required" }}
              render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
                <Autocomplete
                  size="small"
                  open={openProdSeries}
                  onOpen={() => setOpenProdSeries(true)}
                  onClose={() => setOpenProdSeries(false)}
                  openOnFocus={true}
                  selectOnFocus={true}
                  forcePopupIcon={true}
                  options={productionSeries || []}
                  getOptionLabel={(option) => typeof option === "string" ? option : option.productionSeries || ""}
                  value={(productionSeries || []).find((s) => s.productionSeries === value) || (value ? (value as any) : null)}
                  filterOptions={(options, { inputValue }) => {
                    if (!inputValue) return options;
                    const searchLower = inputValue.toLowerCase();
                    if (value && searchLower === String(value).toLowerCase()) return options;
                    return options.filter((s: any) =>
                      (s.productionSeries || s).toLowerCase().includes(searchLower)
                    );
                  }}
                  onChange={(_, newValue) => {
                    setOpenProdSeries(false);
                    const val = newValue ? (typeof newValue === "string" ? newValue : newValue.productionSeries) : "";
                    setValue("productionSeries", val);
                    onChange(val);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Production Series *"
                      inputRef={ref}
                      onClick={() => setOpenProdSeries(true)}
                      onFocus={(e) => {
                        setOpenProdSeries(true);
                        (e.target as HTMLInputElement)?.select?.();
                      }}
                      error={!!error || !!errors.productionSeries}
                      helperText={error?.message || errors.productionSeries?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* Row 2: Unit *, IR Number, MSN Number * */}
          <Grid item xs={12} md={4}>
            <Controller name="unit" control={control} rules={{ required: "Unit is required" }} render={({ field, fieldState: { error } }) => (
              <FormControl fullWidth error={!!error || !!errors.unit} size="small">
                <InputLabel>Unit *</InputLabel>
                <Select
                  {...field}
                  label="Unit *"
                  onChange={(e) => {
                    field.onChange(e);
                    if (e.target.value) {
                      clearErrors("unit");
                    }
                  }}
                >
                  {units.map((u) => (
                    <MenuItem key={u.id} value={u.unitName}>
                      {u.unitName}
                    </MenuItem>
                  ))}
                </Select>
                {(error || errors.unit) && (
                  <FormHelperText error>{error?.message || errors.unit?.message}</FormHelperText>
                )}
              </FormControl>
            )} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Controller name="irNumber" control={control} render={({ field, fieldState: { error } }) => (
              <Autocomplete
                {...field}
                open={openIR}
                onOpen={() => {
                  handleIROpen();
                  setOpenIR(true);
                }}
                onClose={() => setOpenIR(false)}
                openOnFocus={true}
                selectOnFocus={true}
                forcePopupIcon={true}
                options={irNumbers}
                getOptionLabel={(option) => typeof option === "string" ? option : option.irNumber || ""}
                value={selectedIRNumber}
                loading={loading}
                size="small"
                onInputChange={handleIRInputChange}
                filterOptions={(options, { inputValue }) => {
                  if (!inputValue) return options;
                  const searchLower = inputValue.toLowerCase();
                  const currentIr = (selectedIRNumber?.irNumber || watch("irNumber") || "").toLowerCase();
                  if (searchLower === currentIr) return options;
                  return options.filter((item: any) =>
                    typeof item === "string"
                      ? item.toLowerCase().includes(searchLower)
                      : item.irNumber?.toLowerCase().includes(searchLower)
                  );
                }}
                onChange={(_, value) => {
                  setOpenIR(false);
                  setSelectedIRNumber(value);
                  setValue("irNumber", value?.irNumber || "");
                  setIrSearchText("");
                  field.onChange(value?.irNumber || "");
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="IR Number"
                    onClick={() => setOpenIR(true)}
                    onFocus={(e) => {
                      setOpenIR(true);
                      (e.target as HTMLInputElement)?.select?.();
                    }}
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
            )} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Controller name="msnNumber" control={control} rules={{ required: "MSN Number is required" }} render={({ field: { onChange, ref }, fieldState: { error } }) => (
              <Autocomplete
                open={openMSN}
                onOpen={() => {
                  handleMSNOpen();
                  setOpenMSN(true);
                }}
                onClose={() => setOpenMSN(false)}
                openOnFocus={true}
                selectOnFocus={true}
                forcePopupIcon={true}
                options={msnNumbers}
                getOptionLabel={(option) => typeof option === "string" ? option : option.msnNumber || ""}
                value={selectedMSNNumber}
                loading={loading}
                size="small"
                onInputChange={handleMSNInputChange}
                filterOptions={(options, { inputValue }) => {
                  if (!inputValue) return options;
                  const searchLower = inputValue.toLowerCase();
                  const currentMsn = (selectedMSNNumber?.msnNumber || watch("msnNumber") || "").toLowerCase();
                  if (searchLower === currentMsn) return options;
                  return options.filter((item: any) =>
                    typeof item === "string"
                      ? item.toLowerCase().includes(searchLower)
                      : item.msnNumber?.toLowerCase().includes(searchLower)
                  );
                }}
                onChange={(_, value) => {
                  setOpenMSN(false);
                  setSelectedMSNNumber(value);
                  const val = value?.msnNumber || "";
                  setValue("msnNumber", val);
                  setMsnSearchText("");
                  onChange(val);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="MSN Number *"
                    inputRef={ref}
                    onClick={() => setOpenMSN(true)}
                    onFocus={(e) => {
                      setOpenMSN(true);
                      (e.target as HTMLInputElement)?.select?.();
                    }}
                    error={!!error || !!errors.msnNumber}
                    helperText={error?.message || errors.msnNumber?.message}
                  />
                )}
              />
            )} />
          </Grid>

          {/* Row 3: Shape, Material Specification */}
          <Grid item xs={12} md={6}>
            <Controller name="shapes" control={control} render={({ field: { onChange, value } }) => (
              <Autocomplete
                open={openShape}
                onOpen={() => setOpenShape(true)}
                onClose={() => setOpenShape(false)}
                openOnFocus={true}
                selectOnFocus={true}
                forcePopupIcon={true}
                value={shapesData.find((s: Shape) => s.id.toString() === value) || null}
                onChange={(_, newValue) => {
                  setOpenShape(false);
                  onChange(newValue ? newValue.id.toString() : "");
                }}
                options={shapesData}
                getOptionLabel={(option) => option.materialName || ""}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Shape"
                    size="small"
                    fullWidth
                    placeholder="Select Shape"
                    onClick={() => setOpenShape(true)}
                    onFocus={(e) => {
                      setOpenShape(true);
                      (e.target as HTMLInputElement)?.select?.();
                    }}
                  />
                )}
                size="small"
              />
            )} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller name="material" control={control} render={({ field }) => <TextField {...field} label="Material Specification" fullWidth size="small" />} />
          </Grid>

          {/* Row 4: MFG Date *, Expiry Date */}
          <Grid item xs={12} md={6}>
            <Controller
              name="manufacturingDate"
              control={control}
              rules={{ required: "MFG Date is required" }}
              render={({ field, fieldState: { error } }) => (
                <DatePicker
                  {...field}
                  label="MFG Date *"
                  maxDate={new Date()}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      error: !!error || !!errors.manufacturingDate,
                      helperText: error?.message || errors.manufacturingDate?.message,
                      sx: {
                        "& .MuiInputBase-root": { height: 40 },
                        "& .MuiOutlinedInput-input": { padding: "8.5px 14px" },
                      },
                    },
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller name="expiryDate" control={control} render={({ field }) => <DatePicker {...field} value={field.value || null} disabled={noExpiryDate} onChange={(newValue) => { field.onChange(newValue || null); if (newValue) setNoExpiryDate(false); }} label="Expiry Date" slotProps={{ textField: { size: "small", fullWidth: true, sx: { "& .MuiInputBase-root": { height: 40 }, "& .MuiOutlinedInput-input": { padding: "8.5px 14px" } } } }} />} />
          </Grid>
        </Grid>
      )}
    </Card>
  );
}

export default React.memo(DrawingDetailsStep);

