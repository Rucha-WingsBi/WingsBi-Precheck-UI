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
        p: { xs: 2.5, md: 3 },
        mb: 3,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <StepHeader number={3} title="Disposition & remarks" />

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
          Disposition *
        </FormLabel>
        <Controller
          name="desposition"
          control={control}
          rules={{ required: "Disposition is required" }}
          render={({ field }) => (
            <RadioGroup
              {...field}
              row
              onChange={(e) => field.onChange(e.target.value)}
              sx={{ gap: { xs: 1.5, sm: 3 } }}
            >
              <FormControlLabel
                value="Accepted"
                control={
                  <Radio
                    size="small"
                    sx={{
                      color: "#D1D5DB",
                      "&.Mui-checked": { color: "primary.main" },
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", color: "#111827" }}>
                    Accepted
                  </Typography>
                }
              />
              <FormControlLabel
                value="Rejected"
                control={
                  <Radio
                    size="small"
                    sx={{
                      color: "#D1D5DB",
                      "&.Mui-checked": { color: "primary.main" },
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", color: "#111827" }}>
                    Rejected
                  </Typography>
                }
              />
              {componentType === "FIM" || componentType === "SI" ? (
                <FormControlLabel
                  value="Send Back to Customer"
                  control={
                    <Radio
                      size="small"
                      sx={{
                        color: "#D1D5DB",
                        "&.Mui-checked": { color: "primary.main" },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", color: "#111827" }}>
                      Send Back to Customer
                    </Typography>
                  }
                />
              ) : (
                <FormControlLabel
                  value="Used for QT"
                  control={
                    <Radio
                      size="small"
                      sx={{
                        color: "#D1D5DB",
                        "&.Mui-checked": { color: "#7E22CE" },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", color: "#111827" }}>
                      Used for QT
                    </Typography>
                  }
                />
              )}
            </RadioGroup>
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
