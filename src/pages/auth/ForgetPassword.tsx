import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  IconButton,
  MenuItem,
  Alert,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useSecurityQuestions } from "../../hooks/useMasterData";
import { forgetPassword } from "../../store/slices/authSlice";
import { CustomMessageBox } from "../../utils/notifications";
import type { RootState } from "../../store/store";

const ForgetPassword: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  // TanStack Query Hook
  const { data: securityQuestions = [], isLoading: isLoadingCommon } = useSecurityQuestions();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    userId: "",
    securityQuestion: "",
    securityAnswer: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Security questions handled by hook

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.userId.trim()) errors.userId = "User ID is required";
    if (!formData.securityQuestion)
      errors.securityQuestion = "Security question is required";
    if (!formData.securityAnswer.trim())
      errors.securityAnswer = "Security answer is required";
    if (!formData.newPassword.trim())
      errors.newPassword = "New password is required";
    if (!formData.confirmPassword.trim())
      errors.confirmPassword = "Please confirm your password";
    if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    if (formData.newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters long";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const resultAction = await dispatch(
          forgetPassword({
            userId: formData.userId,
            securityQuestion: formData.securityQuestion,
            securityAnswer: formData.securityAnswer,
            newPassword: formData.newPassword,
          }) as any
        );

        if (forgetPassword.fulfilled.match(resultAction)) {
          CustomMessageBox.ShowSuccess(
            "Password has been reset successfully! You can now login with your new password."
          );

          // Clear form
          setFormData({
            userId: "",
            securityQuestion: "",
            securityAnswer: "",
            newPassword: "",
            confirmPassword: "",
          });
          setFormErrors({});

          // Navigate to login after 3 seconds
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        }
      } catch (err) {
        // Error handling is managed by the Redux slice
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleToggleNewPassword = () => {
    setShowNewPassword(!showNewPassword);
  };

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  if (isLoadingCommon) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        background: "linear-gradient(135deg, #F4EBFF 0%, #F9FAFB 50%, #FCF5F9 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 3,
      }}
    >
      <Card
        sx={{
          maxWidth: 540,
          width: "100%",
          mx: 2,
          boxShadow: "0px 12px 32px rgba(16, 24, 40, 0.08), 0px 4px 12px rgba(16, 24, 40, 0.04)",
          borderRadius: "16px",
          border: "1px solid #EAECF0",
          backgroundColor: "#ffffff",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #6D2A8F 0%, #8E35B7 100%)",
            p: 3,
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="h5" color="white" fontWeight="700" sx={{ fontSize: "1.35rem", lineHeight: 1.2 }}>
              Reset Password
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "0.8rem", mt: 0.5 }}>
              Verify your security question to set a new password
            </Typography>
          </Box>

          <Box
            sx={{
              backgroundColor: "#ffffff",
              p: 0.5,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
            }}
          >
            <Box
              component="img"
              src="/assets/logo.jpg"
              alt="Logo"
              sx={{
                height: 42,
                width: "auto",
                borderRadius: "6px",
                display: "block",
              }}
            />
          </Box>
        </Box>

        {/* Form */}
        <CardContent sx={{ p: 3, pt: 3.5 }}>
          <form onSubmit={handleSubmit}>
            <Box mb={2.5}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: "#344054",
                  fontSize: "0.825rem",
                  mb: 0.75,
                }}
              >
                User ID
              </Typography>
              <TextField
                fullWidth
                size="small"
                id="userId"
                name="userId"
                placeholder="Enter your user ID"
                value={formData.userId}
                onChange={handleChange}
                error={!!formErrors.userId}
                helperText={formErrors.userId}
                disabled={isLoading}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.875rem",
                    height: 40,
                    "& fieldset": { borderColor: "#D0D5DD" },
                    "&:hover fieldset": { borderColor: "#6D2A8F" },
                    "&.Mui-focused fieldset": { borderColor: "#6D2A8F", borderWidth: "1.5px" },
                  },
                }}
              />
            </Box>

            <Grid container spacing={2} mb={2.5}>
              <Grid item xs={12} sm={6}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: "#344054",
                    fontSize: "0.825rem",
                    mb: 0.75,
                  }}
                >
                  Security Question
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  id="securityQuestion"
                  name="securityQuestion"
                  value={formData.securityQuestion}
                  onChange={handleChange}
                  error={!!formErrors.securityQuestion}
                  helperText={formErrors.securityQuestion}
                  disabled={isLoading}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      backgroundColor: "#FFFFFF",
                      fontSize: "0.875rem",
                      height: 40,
                      "& fieldset": { borderColor: "#D0D5DD" },
                      "&:hover fieldset": { borderColor: "#6D2A8F" },
                      "&.Mui-focused fieldset": { borderColor: "#6D2A8F", borderWidth: "1.5px" },
                    },
                  }}
                >
                  {securityQuestions.map((option: any) => (
                    <MenuItem key={option.id} value={option.id} sx={{ fontSize: "0.85rem" }}>
                      {option.question || option.securityQuestion}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: "#344054",
                    fontSize: "0.825rem",
                    mb: 0.75,
                  }}
                >
                  Security Answer
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  id="securityAnswer"
                  name="securityAnswer"
                  placeholder="Enter your answer"
                  value={formData.securityAnswer}
                  onChange={handleChange}
                  error={!!formErrors.securityAnswer}
                  helperText={formErrors.securityAnswer}
                  disabled={isLoading}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      backgroundColor: "#FFFFFF",
                      fontSize: "0.875rem",
                      height: 40,
                      "& fieldset": { borderColor: "#D0D5DD" },
                      "&:hover fieldset": { borderColor: "#6D2A8F" },
                      "&.Mui-focused fieldset": { borderColor: "#6D2A8F", borderWidth: "1.5px" },
                    },
                  }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2} mb={2.5}>
              <Grid item xs={12} sm={6}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: "#344054",
                    fontSize: "0.825rem",
                    mb: 0.75,
                  }}
                >
                  New Password
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  error={!!formErrors.newPassword}
                  helperText={formErrors.newPassword}
                  disabled={isLoading}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      backgroundColor: "#FFFFFF",
                      fontSize: "0.875rem",
                      height: 40,
                      "& fieldset": { borderColor: "#D0D5DD" },
                      "&:hover fieldset": { borderColor: "#6D2A8F" },
                      "&.Mui-focused fieldset": { borderColor: "#6D2A8F", borderWidth: "1.5px" },
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleToggleNewPassword}
                          edge="end"
                          size="small"
                          sx={{ color: "#667085" }}
                        >
                          {showNewPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: "#344054",
                    fontSize: "0.825rem",
                    mb: 0.75,
                  }}
                >
                  Confirm Password
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={!!formErrors.confirmPassword}
                  helperText={formErrors.confirmPassword}
                  disabled={isLoading}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      backgroundColor: "#FFFFFF",
                      fontSize: "0.875rem",
                      height: 40,
                      "& fieldset": { borderColor: "#D0D5DD" },
                      "&:hover fieldset": { borderColor: "#6D2A8F" },
                      "&.Mui-focused fieldset": { borderColor: "#6D2A8F", borderWidth: "1.5px" },
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleToggleConfirmPassword}
                          edge="end"
                          size="small"
                          sx={{ color: "#667085" }}
                        >
                          {showConfirmPassword ? (
                            <VisibilityOff fontSize="small" />
                          ) : (
                            <Visibility fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: "8px", fontSize: "0.825rem" }}>
                {error}
              </Alert>
            )}

            <Box
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2, gap: 2 }}
            >
              <Button
                component={RouterLink}
                to="/login"
                variant="outlined"
                sx={{
                  height: 40,
                  px: 2.5,
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  textTransform: "none",
                  borderRadius: "8px",
                  borderColor: "#D0D5DD",
                  color: "#344054",
                  "&:hover": { backgroundColor: "#F9FAFB", borderColor: "#98A2B3", color: "#101828" },
                }}
              >
                Back to Login
              </Button>

              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
                sx={{
                  height: 40,
                  px: 3,
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  textTransform: "none",
                  borderRadius: "8px",
                  backgroundColor: "#6D2A8F",
                  color: "#ffffff",
                  boxShadow: "0 1px 2px rgba(16, 24, 40, 0.05)",
                  "&:hover": { backgroundColor: "#582075" },
                  "&.Mui-disabled": { backgroundColor: "#EAECF0", color: "#98A2B3" },
                }}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ForgetPassword;
