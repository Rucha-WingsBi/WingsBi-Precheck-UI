import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { CircularProgress, Box } from "@mui/material";
import Layout from "./layouts/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Loading fallback component
const LoadingFallback = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="60vh"
  >
    <CircularProgress />
  </Box>
);

// Lazy-loaded Auth Pages
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgetPassword = lazy(() => import("./pages/auth/ForgetPassword"));

// Lazy-loaded Main Pages
const Dashboard = lazy(() => import("./pages/Dashboard"));

// Lazy-loaded Precheck Pages
const ViewPrecheck = lazy(() => import("./pages/precheck/ViewPrecheck"));
const MakePrecheck = lazy(() => import("./pages/precheck/MakePrecheck"));
const StoreIn = lazy(() => import("./pages/precheck/StoreIn"));
const StoredInComponents = lazy(
  () => import("./pages/precheck/StoredInComponents")
);

const ViewConsumedIn = lazy(() => import("./pages/precheck/ViewConsumedIn"));
const AvailableInStore = lazy(
  () => import("./pages/precheck/AvailableInStore")
);

// Lazy-loaded IR/MSN Pages
const GenerateIRMSN = lazy(() => import("./pages/irmsn/GenerateIRMSN"));
const ViewIRMSN = lazy(() => import("./pages/irmsn/ViewIRMSN"));
const EditIRMSN = lazy(() => import("./pages/irmsn/EditIRMSN"));

// Lazy-loaded QR Code Pages
const BarcodeGeneration = lazy(
  () => import("./pages/qrcode/BarcodeGeneration")
);
const ViewBarcode = lazy(() => import("./pages/qrcode/ViewBarcode"));
const UpdateBarcode = lazy(() => import("./pages/qrcode/UpdateBarcode"));

// Lazy-loaded SOP Pages
const ViewSOP = lazy(() => import("./pages/sop/ViewSOP"));

// Lazy-loaded Settings Pages
const Settings = lazy(() => import("./pages/settings/Settings"));

// Lazy-loaded Components Pages
const ViewComponents = lazy(() => import("./pages/components/ViewComponents"));
const ViewAssembly = lazy(() => import("./pages/components/ViewAssembly"));

// Lazy-loaded AdminMaster Pages
const ProductionOrderUpload = lazy(
  () => import("./pages/productionorder/ProductionOrderUpload")
);
const ViewOrder = lazy(() => import("./pages/productionorder/ViewOrder"));
const EditProductionOrder = lazy(
  () => import("./pages/productionorder/editproductionorder")
);

const UpdateComponents = lazy(
  () => import("./pages/adminmaster/UpdateComponents")
);

const MaterialRequisition = lazy(
  () => import("./pages/materialrequisition/MaterialRequisition")
);
const AddComponents = lazy(
  () => import("./pages/adminmaster/AddComponents")
);
const UserManagement = lazy(
  () => import("./pages/adminmaster/UserManagement")
);
const RoleManagement = lazy(
  () => import("./pages/adminmaster/RoleManagement")
);
const ScriptExecutor = lazy(
  () => import("./pages/scriptexecutor/ScriptExecutor")
);

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forget-password" element={<ForgetPassword />} />
        <Route path="/forgot-password" element={<ForgetPassword />} />

        {/* Protected Dashboard/App Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Verification Module */}
            <Route path="verification">
              <Route index element={<MakePrecheck />} />
              <Route path="parts" element={<MakePrecheck />} />
              <Route path="history" element={<ViewPrecheck />} />
              <Route path="material-requisition" element={<MaterialRequisition />} />
            </Route>

            {/* IR/MSN Module */}
            <Route path="irmsn">
              <Route index element={<ViewIRMSN />} />
              <Route path="list" element={<ViewIRMSN />} />
              <Route path="new" element={<GenerateIRMSN />} />
              <Route path="edit/:type/:id" element={<EditIRMSN />} />
            </Route>

            {/* QR Code Module */}
            <Route path="qrcode">
              <Route index element={<ViewBarcode />} />
              <Route path="list" element={<ViewBarcode />} />
              <Route path="new" element={<BarcodeGeneration />} />
              <Route path="store-in" element={<StoreIn />} />
              <Route path="update/:id" element={<UpdateBarcode />} />
            </Route>

            {/* Assembly Module */}
            <Route path="assembly">
              <Route index element={<ViewSOP />} />
              <Route path="explorer" element={<ViewSOP />} />
              <Route path="components" element={<ViewComponents />} />
              <Route path="update-components/:id" element={<UpdateComponents />} />
              <Route path="view-assembly" element={<ViewAssembly />} />
            </Route>

            {/* Settings Module */}
            <Route path="settings">
              <Route index element={<Settings />} />
            </Route>

            {/* Production Order Module */}
            <Route path="production-order">
              <Route index element={<ProductionOrderUpload />} />
              <Route path="history" element={<ProductionOrderUpload />} />
              <Route path="view" element={<ViewOrder />} />
              <Route path="edit/:id" element={<EditProductionOrder />} />
            </Route>

            {/* AdminMaster Module */}
            <Route path="adminmaster">
              <Route path="user-management" element={<UserManagement />} />
              <Route path="role-management" element={<RoleManagement />} />
              <Route path="master-data" element={<AddComponents />} />
              
            </Route>

            {/* Bulk Import Module */}
            <Route path="bulk-import" element={<ScriptExecutor />} />
          </Route>
        </Route>

        {/* Catch-all Route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
