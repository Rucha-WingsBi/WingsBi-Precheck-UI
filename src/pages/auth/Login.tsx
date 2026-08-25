import React, { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Card,
  CardContent,
  InputAdornment,
  IconButton,
  Alert,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { login, clearError } from "../../store/slices/authSlice";
import type { RootState } from "../../store/store";

interface LoginForm {
  userId: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<LoginForm>({
    userId: "",
    password: "",
  });

  const [formErrors, setFormErrors] = useState<Partial<LoginForm>>({});

  const validateForm = () => {
    const errors: Partial<LoginForm> = {};
    if (!formData.userId.trim()) {
      errors.userId = "User ID is required";
    }
    if (!formData.password.trim()) {
      errors.password = "Password is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        // Clear any previous errors
        dispatch(clearError());

        const resultAction = await dispatch(login(formData) as any);
        console.log("Login result:", resultAction);

        if (login.fulfilled.match(resultAction)) {
          console.log("Login successful, navigating to dashboard");
          navigate("/dashboard", { replace: true });
        } else if (login.rejected.match(resultAction)) {
          console.log("Login failed:", resultAction.payload);
        }
      } catch (err) {
        console.error("Login error:", err);
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
    if (formErrors[name as keyof LoginForm]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    // Clear Redux error when user starts typing
    if (error) {
      dispatch(clearError());
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        background: "linear-gradient(135deg, #a8005a 0%, #c2185b 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card
        sx={{
          maxWidth: 420,  
          width: "100%",
          mx: 2,
          boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.1)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            bgcolor: "primary.main",
            background: "linear-gradient(90deg, #800B4C 0%, #B5106D 100%)",
            p: 3,
            pb: 4,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box
              component="img"
              src="/assets/logo.jpg"
              alt="Logo"
              sx={{
                height: 50,
                width: "auto",
                borderRadius: 2,
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    document.getElementById("password")?.focus();
                  }
                }}
                InputProps={{
                  sx: {
                    borderRadius: 1.5,
                    bgcolor: "background.default",
                  },
                }}
              />
            </Box>

            <Box mb={2}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight="600"
                  color="secondary.main"
                >
                  Password
                </Typography>
              </Box>
              <TextField
                fullWidth
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                error={!!formErrors.password}
                helperText={formErrors.password}
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
                        onClick={handleTogglePassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Box display="flex" justifyContent="flex-end" mt={1}>
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  color="primary"
                  underline="hover"
                  sx={{ fontWeight: 500 }}
                >
                  Forgot Password?
                </Link>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={isLoading}
              sx={{
                mt: 2,
                py: 1.5,
                fontWeight: 600,
                backgroundColor: "#a8005a",
                "&:hover": { backgroundColor: "#8e004b" },
              }}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>

            <Box mt={3} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{" "}
                <Link
                  component={RouterLink}
                  to="/register"
                  color="primary"
                  underline="hover"
                  sx={{ fontWeight: 500 }}
                >
                  Register
                </Link>
              </Typography>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
