import React from "react";
import {
  Box,
  Card,
  TextField,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  FormHelperText,
} from "@mui/material";
import { Controller } from "react-hook-form";
import StepHeader from "./StepHeader";

interface DispositionStepProps {
  control: any;
  componentType: string;
}

function DispositionStep({
  control,
  componentType,
}: DispositionStepProps) {
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
      <StepHeader number={3} title="Disposition & remarks" />

      <Box sx={{ mb: 1.5 }}>
        <Controller
          name="desposition"
          control={control}
          rules={{ required: "Disposition is required" }}
          render={({ field, fieldState: { error } }) => (
            <Box>
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
                  Disposition <span style={{ color: "#050505ff" }}>*</span>
                </FormLabel>
                <RadioGroup
                  {...field}
                  row
                  onChange={(e) => field.onChange(e.target.value)}
                  sx={{ gap: { xs: 1, sm: 1.5 } }}
                >
                  <FormControlLabel
                    value="Accepted"
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color: field.value === "Accepted" ? "primary.main" : "#D1D5DB",
                          "&.Mui-checked": { color: "primary.main" },
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ fontWeight: field.value === "Accepted" ? 600 : 500, fontSize: "0.875rem", color: "#111827" }}>
                        Accepted
                      </Typography>
                    }
                    sx={{ mr: 1 }}
                  />
                  <FormControlLabel
                    value="Rejected"
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color: field.value === "Rejected" ? "primary.main" : "#D1D5DB",
                          "&.Mui-checked": { color: "primary.main" },
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ fontWeight: field.value === "Rejected" ? 600 : 500, fontSize: "0.875rem", color: "#111827" }}>
                        Rejected
                      </Typography>
                    }
                    sx={{ mr: 1 }}
                  />
                  {componentType === "FIM" || componentType === "SI" ? (
                    <FormControlLabel
                      value="Send Back to Customer"
                      control={
                        <Radio
                          size="small"
                          sx={{
                            color: field.value === "Send Back to Customer" ? "primary.main" : "#D1D5DB",
                            "&.Mui-checked": { color: "primary.main" },
                          }}
                        />
                      }
                      label={
                        <Typography sx={{ fontWeight: field.value === "Send Back to Customer" ? 600 : 500, fontSize: "0.875rem", color: "#111827" }}>
                          Send Back to Customer
                        </Typography>
                      }
                      sx={{ mr: 1 }}
                    />
                  ) : (
                    <FormControlLabel
                      value="Used for QT"
                      control={
                        <Radio
                          size="small"
                          sx={{
                            color: field.value === "Used for QT" ? "primary.main" : "#D1D5DB",
                            "&.Mui-checked": { color: "primary.main" },
                          }}
                        />
                      }
                      label={
                        <Typography sx={{ fontWeight: field.value === "Used for QT" ? 600 : 500, fontSize: "0.875rem", color: "#111827" }}>
                          Used for QT
                        </Typography>
                      }
                      sx={{ mr: 1 }}
                    />
                  )}
                </RadioGroup>
              </Box>
              {error && (
                <FormHelperText error sx={{ mt: 0.5, fontWeight: 500, fontSize: "0.75rem" }}>
                  {error.message}
                </FormHelperText>
              )}
            </Box>
          )}
        />
      </Box>

      <Box>
        <Controller
          name="remark"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Remarks"
              fullWidth
              size="small"
              multiline
              rows={3}
              placeholder="Optional — printed on the label record"
            />
          )}
        />
      </Box>
    </Card>
  );
}

export default React.memo(DispositionStep);
