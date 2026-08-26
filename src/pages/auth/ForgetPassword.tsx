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
        background: "linear-gradient(135deg, #80145A 0%, #9C1B68 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card
        sx={{
          maxWidth: 520,
          width: "100%",
          mx: 2,
          boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.15)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: "linear-gradient(90deg, #9C1B68 0%, #80145A 100%)",
            p: 3,
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h5" color="white" fontWeight="600">
            Reset Password
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "white",
              width: 42,
              height: 42,
              borderRadius: "50%",
              boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
              p: 0.5,
              overflow: "hidden",
            }}
          >
            <Box
              component="img"
              src="/assets/logo.svg"
              alt="Wingsbi Logo"
              sx={{
                height: 26,
                width: "auto",
              }}
            />
          </Box>
        </Box>

        {/* Form */}
        <CardContent sx={{ p: 3, pt: 4 }}>
          <form onSubmit={handleSubmit}>
            <Box mb={3}>
              <Typography
                variant="subtitle1"
                fontWeight="600"
                color="secondary.main"
                mb={1}
              >
                User ID
              </Typography>
              <TextField
                fullWidth
                id="userId"
                name="userId"
                placeholder="Enter your user ID"
                value={formData.userId}
                onChange={handleChange}
                error={!!formErrors.userId}
                helperText={formErrors.userId}
                disabled={isLoading}
                InputProps={{
                  sx: {
                    borderRadius: 1.5,
                    bgcolor: "background.default",
                  },
                }}
              />
            </Box>

            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} sm={6}>
                <Typography
                  variant="subtitle1"
                  fontWeight="600"
                  color="secondary.main"
                  mb={1}
                >
                  Security Question
                </Typography>
                <TextField
                  select
                  fullWidth
                  id="securityQuestion"
                  name="securityQuestion"
                  value={formData.securityQuestion}
                  onChange={handleChange}
                  error={!!formErrors.securityQuestion}
                  helperText={formErrors.securityQuestion}
                  disabled={isLoading}
                  InputProps={{
                    sx: {
                      borderRadius: 1.5,
                      bgcolor: "background.default",
                    },
                  }}
                >
                  {securityQuestions.map((option: any) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.question || option.securityQuestion}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography
                  variant="subtitle1"
                  fontWeight="600"
                  color="secondary.main"
                  mb={1}
                >
                  Security Answer
                </Typography>
                <TextField
                  fullWidth
                  id="securityAnswer"
                  name="securityAnswer"
                  placeholder="Enter your answer"
                  value={formData.securityAnswer}
                  onChange={handleChange}
                  error={!!formErrors.securityAnswer}
                  helperText={formErrors.securityAnswer}
                  disabled={isLoading}
                  InputProps={{
                    sx: {
                      borderRadius: 1.5,
                      bgcolor: "background.default",
                    },
                  }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} sm={6}>
                <Typography
                  variant="subtitle1"
                  fontWeight="600"
                  color="secondary.main"
                  mb={1}
                >
                  New Password
                </Typography>
                <TextField
                  fullWidth
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  error={!!formErrors.newPassword}
                  helperText={formErrors.newPassword}
                  disabled={isLoading}
                  InputProps={{
                    sx: {
                      borderRadius: 1.5,
                      bgcolor: "background.default",
                    },
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleToggleNewPassword}
                          edge="end"
                        >
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography
                  variant="subtitle1"
                  fontWeight="600"
                  color="secondary.main"
                  mb={1}
                >
                  Confirm Password
                </Typography>
                <TextField
                  fullWidth
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={!!formErrors.confirmPassword}
                  helperText={formErrors.confirmPassword}
                  disabled={isLoading}
                  InputProps={{
                    sx: {
                      borderRadius: 1.5,
                      bgcolor: "background.default",
                    },
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleToggleConfirmPassword}
                          edge="end"
                        >
                          {showConfirmPassword ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}
            >
              <Button
                component={RouterLink}
                to="/login"
                variant="outlined"
                color="secondary"
                sx={{
                  py: 1.5,
                  px: 3,
                  fontWeight: 600,
                  minWidth: "120px",
                }}
              >
                Back to Login
              </Button>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isLoading}
                sx={{
                  py: 1.5,
                  px: 4,
                  fontWeight: 600,
                  minWidth: "120px",
                  backgroundColor: "#a8005a",
                  "&:hover": { backgroundColor: "#8e004b" },
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
