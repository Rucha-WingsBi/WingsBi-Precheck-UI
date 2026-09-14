import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
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
import { register } from "../../store/slices/authSlice";
import { useDepartments, useUserRoles, useSecurityQuestions, usePlants } from "../../hooks/useMasterData";
import { CustomMessageBox } from "../../utils/notifications";
import type { RootState } from "../../store/store";

interface RegisterFormValues {
  username: string;
  email: string;
  userId: string;
  password: string;
  confirmPassword: string;
  role: string;
  department: string;
  plant: string;
  securityQuestion: string;
  securityAnswer: string;
}

const validationSchema = Yup.object({
  username: Yup.string()
    .min(3, "Username must be at least 3 characters")
    .required("Username is required"),
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  userId: Yup.string()
    .min(3, "User ID must be at least 3 characters")
    .required("User ID is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
  role: Yup.string().required("Role is required"),
  department: Yup.string().required("Department is required"),
  plant: Yup.string().required("Plant is required"),
  securityQuestion: Yup.string().required("Security question is required"),
  securityAnswer: Yup.string()
    .min(2, "Security answer must be at least 2 characters")
    .required("Security answer is required"),
});

const getFieldError = (
  touched: boolean | undefined,
  error: string | undefined
): string => {
  if (!touched || !error) return "";
  return error;
};

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  // TanStack Query Hooks
  const { data: departments = [] } = useDepartments();
  const { data: userRoles = [] } = useUserRoles();
  const { data: securityQuestions = [] } = useSecurityQuestions();
  const { data: plants = [] } = usePlants();

  const isLoadingCommon = !departments.length || !userRoles.length || !securityQuestions.length || !plants.length;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Master data handled by hooks

  const formik = useFormik<RegisterFormValues>({
    initialValues: {
      username: "",
      email: "",
      userId: "",
      password: "",
      confirmPassword: "",
      role: "",
      department: "",
      plant: "",
      securityQuestion: "",
      securityAnswer: "",
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        const { confirmPassword, ...registerData } = values;
        const transformedData = {
          username: registerData.username,
          userId: registerData.userId,
          password: registerData.password,
          name: registerData.userId,
          departmentId: Number(registerData.department),
          roleId: Number(registerData.role),
          securityQuestionId: Number(registerData.securityQuestion),
          securityAnswer: registerData.securityAnswer,
          email: registerData.email,
          plantId: Number(registerData.plant),
        };

        const resultAction = await dispatch(register(transformedData) as any);
        if (register.fulfilled.match(resultAction)) {
          CustomMessageBox.ShowSuccess(
            "Registration successful! You can now login with your credentials."
          );
          resetForm();

          // Navigate to login after 3 seconds
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        }
      } catch (err) {
        console.error("Registration error:", err);
      }
    },
  });

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
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
        <Typography>Loading registration data...</Typography>
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
          maxWidth: 680,
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
              New User Registration
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "0.8rem", mt: 0.5 }}>
              Fill in your details to request an account
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
              alt="Wingsbi Logo"
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
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={2}>
              {/* Left Column */}
              <Grid item xs={12} md={6}>
                <Box mb={2}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: "#344054",
                      fontSize: "0.825rem",
                      mb: 0.5,
                    }}
                  >
                    Username
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    id="username"
                    name="username"
                    placeholder="Enter username"
                    value={formik.values.username}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.username && Boolean(formik.errors.username)
                    }
                    helperText={getFieldError(
                      formik.touched.username,
                      formik.errors.username as string
                    )}
                    disabled={isLoading}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        backgroundColor: "#FFFFFF",
                        fontSize: "0.85rem",
                        height: 40,
                        "& fieldset": { borderColor: "#D0D5DD" },
                        "&:hover fieldset": { borderColor: "#6D2A8F" },
                        "&.Mui-focused fieldset": { borderColor: "#6D2A8F", borderWidth: "1.5px" },
                      },
                    }}
                  />
                </Box>

                <Box mb={2}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: "#344054",
                      fontSize: "0.825rem",
                      mb: 0.5,
                    }}
                  >
                    Email
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    id="email"
                    name="email"
                    placeholder="Enter email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={getFieldError(
                      formik.touched.email,
                      formik.errors.email as string
                    )}
                    disabled={isLoading}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        backgroundColor: "#FFFFFF",
                        fontSize: "0.85rem",
                        height: 40,
                        "& fieldset": { borderColor: "#D0D5DD" },
                        "&:hover fieldset": { borderColor: "#6D2A8F" },
                        "&.Mui-focused fieldset": { borderColor: "#6D2A8F", borderWidth: "1.5px" },
                      },
                    }}
                  />
                </Box>

                <Box mb={2}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: "#344054",
                      fontSize: "0.825rem",
                      mb: 0.5,
                    }}
                  >
                    User ID
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    id="userId"
                    name="userId"
                    placeholder="Enter user ID"
                    value={formik.values.userId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.userId && Boolean(formik.errors.userId)
                    }
                    helperText={getFieldError(
                      formik.touched.userId,
                      formik.errors.userId as string
                    )}
                    disabled={isLoading}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        backgroundColor: "#FFFFFF",
                        fontSize: "0.85rem",
                        height: 40,
                        "& fieldset": { borderColor: "#D0D5DD" },
                        "&:hover fieldset": { borderColor: "#6D2A8F" },
                        "&.Mui-focused fieldset": { borderColor: "#6D2A8F", borderWidth: "1.5px" },
                      },
                    }}
                  />
                </Box>

                <Box mb={2}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: "#344054",
                      fontSize: "0.825rem",
                      mb: 0.5,
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
                    value={formik.values.securityQuestion}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.securityQuestion &&
                      Boolean(formik.errors.securityQuestion)
                    }
                    helperText={getFieldError(
                      formik.touched.securityQuestion,
                      formik.errors.securityQuestion as string
                    )}
                    disabled={isLoading}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        backgroundColor: "#FFFFFF",
                        fontSize: "0.85rem",
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
                </Box>

                <Box mb={2}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: "#344054",
                      fontSize: "0.825rem",
                      mb: 0.5,
                    }}
                  >
                    Password
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.password && Boolean(formik.errors.password)
                    }
                    helperText={getFieldError(
                      formik.touched.password,
                      formik.errors.password as string
                    )}
                    disabled={isLoading}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        backgroundColor: "#FFFFFF",
                        fontSize: "0.85rem",
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
                </Box>
              </Grid>

              {/* Right Column */}
              <Grid item xs={12} md={6}>
                <Box mb={2}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: "#344054",
                      fontSize: "0.825rem",
                      mb: 0.5,
                    }}
                  >
                    Role
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    id="role"
                    name="role"
                    value={formik.values.role}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.role && Boolean(formik.errors.role)}
                    helperText={getFieldError(
                      formik.touched.role,
                      formik.errors.role as string
                    )}
                    disabled={isLoading}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        backgroundColor: "#FFFFFF",
                        fontSize: "0.85rem",
                        height: 40,
                        "& fieldset": { borderColor: "#D0D5DD" },
                        "&:hover fieldset": { borderColor: "#6D2A8F" },
                        "&.Mui-focused fieldset": { borderColor: "#6D2A8F", borderWidth: "1.5px" },
                      },
                    }}
                  >
                    {userRoles
                      .filter((role: any) => role.role !== "Admin")
                      .map((option: any) => (
                        <MenuItem key={option.id} value={option.id} sx={{ fontSize: "0.85rem" }}>
                          {option.role || option.name}
                        </MenuItem>
                      ))}
                  </TextField>
                </Box>

                <Box mb={2}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: "#344054",
                      fontSize: "0.825rem",
                      mb: 0.5,
                    }}
                  >
                    Department
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    id="department"
                    name="department"
                    value={formik.values.department}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.department &&
                      Boolean(formik.errors.department)
                    }
                    helperText={getFieldError(
                      formik.touched.department,
                      formik.errors.department as string
                    )}
                    disabled={isLoading}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        backgroundColor: "#FFFFFF",
                        fontSize: "0.85rem",
                        height: 40,
                        "& fieldset": { borderColor: "#D0D5DD" },
                        "&:hover fieldset": { borderColor: "#6D2A8F" },
                        "&.Mui-focused fieldset": { borderColor: "#6D2A8F", borderWidth: "1.5px" },
                      },
                    }}
                  >
                    {departments
                      .filter((dept: any) => dept.name !== "Admin")
                      .map((option: any) => (
                        <MenuItem key={option.id} value={option.id} sx={{ fontSize: "0.85rem" }}>
                          {option.name}
                        </MenuItem>
                      ))}
                  </TextField>
                </Box>

                <Box mb={2}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: "#344054",
                      fontSize: "0.825rem",
                      mb: 0.5,
                    }}
                  >
                    Plant
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    id="plant"
                    name="plant"
                    value={formik.values.plant}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.plant && Boolean(formik.errors.plant)}
                    helperText={getFieldError(
                      formik.touched.plant,
                      formik.errors.plant as string
                    )}
                    disabled={isLoading}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        backgroundColor: "#FFFFFF",
                        fontSize: "0.85rem",
                        height: 40,
                        "& fieldset": { borderColor: "#D0D5DD" },
                        "&:hover fieldset": { borderColor: "#6D2A8F" },
                        "&.Mui-focused fieldset": { borderColor: "#6D2A8F", borderWidth: "1.5px" },
                      },
                    }}
                  >
                    {plants.map((option: any) => (
                      <MenuItem key={option.id} value={option.id} sx={{ fontSize: "0.85rem" }}>
                        {option.name || option.plantname}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Box mb={2}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: "#344054",
                      fontSize: "0.825rem",
                      mb: 0.5,
                    }}
                  >
                    Security Answer
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    id="securityAnswer"
                    name="securityAnswer"
                    placeholder="Enter answer"
                    value={formik.values.securityAnswer}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.securityAnswer &&
                      Boolean(formik.errors.securityAnswer)
                    }
                    helperText={getFieldError(
                      formik.touched.securityAnswer,
                      formik.errors.securityAnswer as string
                    )}
                    disabled={isLoading}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        backgroundColor: "#FFFFFF",
                        fontSize: "0.85rem",
                        height: 40,
                        "& fieldset": { borderColor: "#D0D5DD" },
                        "&:hover fieldset": { borderColor: "#6D2A8F" },
                        "&.Mui-focused fieldset": { borderColor: "#6D2A8F", borderWidth: "1.5px" },
                      },
                    }}
                  />
                </Box>

                <Box mb={2}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: "#344054",
                      fontSize: "0.825rem",
                      mb: 0.5,
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
                    placeholder="Confirm password"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.confirmPassword &&
                      Boolean(formik.errors.confirmPassword)
                    }
                    helperText={getFieldError(
                      formik.touched.confirmPassword,
                      formik.errors.confirmPassword as string
                    )}
                    disabled={isLoading}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        backgroundColor: "#FFFFFF",
                        fontSize: "0.85rem",
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
                </Box>
              </Grid>
            </Grid>

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: "8px", fontSize: "0.825rem" }}>
                {error}
              </Alert>
            )}

            <Box
              sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 2.5, gap: 2 }}
            >
              <Button
                component={RouterLink}
                to="/login"
                variant="outlined"
                sx={{
                  height: 40,
                  px: 3,
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  textTransform: "none",
                  borderRadius: "8px",
                  borderColor: "#D0D5DD",
                  color: "#344054",
                  minWidth: "110px",
                  "&:hover": { backgroundColor: "#F9FAFB", borderColor: "#98A2B3", color: "#101828" },
                }}
              >
                Back to Login
              </Button>

              <Button
                type="submit"
                variant="contained"
                disabled={isLoading || !formik.isValid}
                sx={{
                  height: 40,
                  px: 4,
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  textTransform: "none",
                  borderRadius: "8px",
                  backgroundColor: "#6D2A8F",
                  color: "#ffffff",
                  minWidth: "110px",
                  boxShadow: "0 1px 2px rgba(16, 24, 40, 0.05)",
                  "&:hover": { backgroundColor: "#582075" },
                  "&.Mui-disabled": { backgroundColor: "#EAECF0", color: "#98A2B3" },
                }}
              >
                {isLoading ? "Registering..." : "Register"}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Register;
