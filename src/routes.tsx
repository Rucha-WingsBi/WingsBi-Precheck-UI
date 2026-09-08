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
const Precheck = lazy(() => import("./pages/precheck/Precheck"));
const ViewPrecheck = lazy(() => import("./pages/precheck/ViewPrecheck"));
const MakePrecheck = lazy(() => import("./pages/precheck/MakePrecheck"));
const StoreIn = lazy(() => import("./pages/precheck/StoreIn"));
const StoredInComponents = lazy(
  () => import("./pages/precheck/StoredInComponents")
);
const MakeOrder = lazy(() => import("./pages/precheck/MakeOrder"));
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
const PendingForPrecheck = lazy(
  () => import("./pages/productionorder/PendingForPrecheck")
);
const UpdateComponents = lazy(
  () => import("./pages/adminmaster/UpdateComponents")
);
const UpdateDrawingNumber = lazy(
  () => import("./pages/adminmaster/UpdateDrawingNumber")
);
const Archive = lazy(() => import("./pages/adminmaster/Archive"));
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

        {/* Protected Dashboard/App Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Precheck Module */}
            <Route path="precheck">
              <Route index element={<Precheck />} />
              <Route path="make-order" element={<MakeOrder />} />
              <Route path="available-store" element={<AvailableInStore />} />
              <Route path="available-in-store" element={<AvailableInStore />} />
              <Route path="view" element={<ViewPrecheck />} />
              <Route path="consumed" element={<ViewConsumedIn />} />
              <Route path="view-consumed" element={<ViewConsumedIn />} />
              <Route path="make" element={<MakePrecheck />} />
              <Route path="store-in" element={<StoreIn />} />
              <Route path="stored-components" element={<StoredInComponents />} />
            </Route>

            {/* Archive Module */}
            <Route path="archive" element={<Archive />} />

            {/* IR/MSN Module */}
            <Route path="irmsn">
              <Route index element={<ViewIRMSN />} />
              <Route path="generate" element={<GenerateIRMSN />} />
              <Route path="view" element={<ViewIRMSN />} />
              <Route path="edit/:type/:id" element={<EditIRMSN />} />
            </Route>

            {/* QR Code Module */}
            <Route path="qrcode">
              <Route index element={<ViewBarcode />} />
              <Route path="generate" element={<BarcodeGeneration />} />
              <Route path="generate-new" element={<BarcodeGeneration />} />
              <Route path="view" element={<ViewBarcode />} />
              <Route path="update/:id" element={<UpdateBarcode />} />
            </Route>

            {/* SOP Module */}
            <Route path="sop">
              <Route index element={<ViewSOP />} />
              <Route path="view" element={<ViewSOP />} />
              <Route path="viewBOM" element={<ViewSOP />} />
            </Route>

            {/* Settings Module */}
            <Route path="settings">
              <Route index element={<Settings />} />
            </Route>

            {/* Components Module */}
            <Route path="components">
              <Route index element={<ViewComponents />} />
              <Route path="view" element={<ViewComponents />} />
              <Route path="assembly" element={<ViewAssembly />} />
              <Route path="view-assembly" element={<ViewAssembly />} />
            </Route>

            {/* AdminMaster Module */}
            <Route path="production-order">
              <Route index element={<ViewOrder />} />
              <Route path="upload" element={<ProductionOrderUpload />} />
              <Route path="view" element={<ViewOrder />} />
              <Route path="edit/:id" element={<EditProductionOrder />} />
              <Route path="store" element={<PendingForPrecheck />} />
            </Route>

            <Route path="adminmaster">
              <Route path="update-components" element={<UpdateComponents />} />
              <Route path="updatecomponents" element={<UpdateComponents />} />
              <Route path="updatecomponents/:id" element={<UpdateComponents />} />
              <Route path="update-drawing" element={<UpdateDrawingNumber />} />
              <Route path="add-components" element={<AddComponents />} />
              <Route path="addcomponents" element={<AddComponents />} />
              <Route path="user-management" element={<UserManagement />} />
              <Route path="usermanagement" element={<UserManagement />} />
              <Route path="role-management" element={<RoleManagement />} />
              <Route path="rolemanagement" element={<RoleManagement />} />
              <Route path="archive" element={<Archive />} />
            </Route>

            {/* Material Requisition Module */}
            <Route path="material-requisition" element={<MaterialRequisition />} />
            <Route path="materialrequisition" element={<MaterialRequisition />} />

            {/* Script Executor Module */}
            <Route path="script-executor" element={<ScriptExecutor />} />
            <Route path="scriptexecutor" element={<ScriptExecutor />} />
          </Route>
        </Route>

        {/* Catch-all Route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
