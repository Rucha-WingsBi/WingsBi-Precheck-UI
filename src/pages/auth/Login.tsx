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
        background: "linear-gradient(90deg, #6D2A8F 0%, #D82578 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 3,
      }}
    >
      <Card
        sx={{
          maxWidth: 420,
          width: "100%",
          mx: 2,
          boxShadow: "0px 20px 50px rgba(0, 0, 0, 0.3)",
          borderRadius: "16px",
          border: "none",
          backgroundColor: "#ffffff",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: "linear-gradient(90deg, #6D2A8F 0%, #D82578 100%)",
            p: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ color: "#ffffff", fontWeight: 700, fontSize: "1.35rem", lineHeight: 1.2 }}>
              Sign In
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "0.8rem", mt: 0.5 }}>
              Enter your credentials to access your account
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    document.getElementById("password")?.focus();
                  }
                }}
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

            <Box mb={2}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={0.75}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: "#344054",
                    fontSize: "0.825rem",
                  }}
                >
                  Password
                </Typography>
              </Box>
              <TextField
                fullWidth
                size="small"
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                error={!!formErrors.password}
                helperText={formErrors.password}
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
                        onClick={handleTogglePassword}
                        edge="end"
                        size="small"
                        sx={{ color: "#667085" }}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Box display="flex" justifyContent="flex-end" mt={1}>
                <Link
                  component={RouterLink}
                  to="/forget-password"
                  underline="hover"
                  sx={{ fontWeight: 600, color: "#6D2A8F", fontSize: "0.825rem" }}
                >
                  Forgot Password?
                </Link>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: "8px", fontSize: "0.825rem" }}>
                {error.toLowerCase().includes("invalid credentials") || error.toLowerCase().includes("deactivated")
                  ? "Incorrect User ID or Password. Please double-check your credentials and try again."
                  : error}
              </Alert>
            )}

            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={isLoading}
              sx={{
                mt: 1.5,
                height: 40,
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
              {isLoading ? "Logging in..." : "Login"}
            </Button>

            <Box mt={2.5} textAlign="center">
              <Typography variant="body2" sx={{ color: "#667085", fontSize: "0.825rem" }}>
                Don't have an account?{" "}
                <Link
                  component={RouterLink}
                  to="/register"
                  underline="hover"
                  sx={{ fontWeight: 600, color: "#6D2A8F" }}
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
