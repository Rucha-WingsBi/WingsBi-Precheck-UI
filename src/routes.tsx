import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { CircularProgress, Box } from "@mui/material";
import Layout from "./layouts/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import ViewBOM from "./pages/sop/ViewBOM";

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
//const SearchUpdateIRMSN = lazy(() => import("./pages/irmsn/SearchUpdateIRMSN"));
const ViewIRMSN = lazy(() => import("./pages/irmsn/ViewIRMSN"));
const EditIRMSN = lazy(() => import("./pages/irmsn/EditIRMSN"));

// Lazy-loaded QR Code Pages
const BarcodeGeneration = lazy(
  () => import("./pages/qrcode/BarcodeGeneration")
);
const NewBarcodeGeneration = lazy(
  () => import("./pages/qrcode/NewBarcodeGeneration")
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

// Lazy-loaded Material Requisition Pages
const MaterialRequisition = lazy(() => import("./pages/materialrequisition/MaterialRequisition"));
// const InsertLNItemCode = lazy(() => import('./pages/adminmaster/InsertLNItemCode'));
// const LNItemCodeAssembly = lazy(() => import('./pages/adminmaster/LNItemCodeAssembly'));
// const UserRole = lazy(() => import('./pages/adminmaster/UserRole'));
const UserManagement = lazy(() => import("./pages/adminmaster/UserManagement"));
const RoleManagement = lazy(() => import("./pages/adminmaster/RoleManagement"));
const AddComponents = lazy(() => import("./pages/adminmaster/AddComponents"));
const ScriptExecutor = lazy(() => import("./pages/scriptexecutor/ScriptExecutor"));

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes - wrapped in Suspense */}
      <Route path="/login" element={<Suspense fallback={<LoadingFallback />}><Login /></Suspense>} />
      <Route path="/register" element={<Suspense fallback={<LoadingFallback />}><Register /></Suspense>} />
      <Route path="/forgot-password" element={<Suspense fallback={<LoadingFallback />}><ForgetPassword /></Suspense>} />

      {/* Protected Routes - Suspense is inside Layout around Outlet */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Precheck Module */}
          <Route path="precheck">
            <Route index element={<Precheck />} />
            <Route path="view" element={<ViewPrecheck />} />
            <Route path="make" element={<MakePrecheck />} />
            <Route path="store-in" element={<StoreIn />} />
            <Route path="stored-components" element={<StoredInComponents />} />
            <Route path="available-in-store" element={<AvailableInStore />} />
            <Route path="make-order" element={<MakeOrder />} />
            <Route path="consumed" element={<ViewConsumedIn />} />
            <Route path="pending">
              <Route path="qc" element={<PendingForPrecheck />} />
              <Route path="store" element={<PendingForPrecheck />} />
            </Route>
          </Route>

          {/* Archive Module */}
          <Route path="archive" element={<Archive />} />

          {/* IR/MSN Module */}
          <Route path="irmsn">
            <Route index element={<ViewIRMSN />} />
            <Route path="generate" element={<GenerateIRMSN />} />
            {/* <Route path="search-update" element={<SearchUpdateIRMSN />} /> */}
            <Route path="view" element={<ViewIRMSN />} />
            <Route path="edit/:type/:id" element={<EditIRMSN />} />
          </Route>

          {/* QR Code Module */}
          <Route path="qrcode">
            <Route index element={<ViewBarcode />} />
            <Route path="generate" element={<BarcodeGeneration />} />
            <Route path="generate-new" element={<NewBarcodeGeneration />} />
            <Route path="view" element={<ViewBarcode />} />
            <Route path="update/:id" element={<UpdateBarcode />} />
          </Route>

          {/* SOP Module */}
          <Route path="sop">
            <Route index element={<ViewSOP />} />
            <Route path="view" element={<ViewSOP />} />
            <Route path="viewBOM" element={<ViewBOM />} />
            {/* <Route path="generate" element={<SOPGeneration />} />
            <Route path="assembly" element={<SOPAssemblyGeneration />} /> */}
          </Route>

          {/* Settings Module */}
          <Route path="settings">
            <Route index element={<Settings />} />
          </Route>

          {/* Components Module */}
          <Route path="components">
            <Route index element={<ViewComponents />} />
            <Route path="assembly" element={<ViewAssembly />} />
          </Route>

          {/* Material Requisition Module */}
          <Route path="materialrequisition">
            <Route index element={<MaterialRequisition />} />
          </Route>

          {/* Production Order Module */}
          <Route path="production-order">
            <Route index element={<ProductionOrderUpload />} />
            <Route path="view" element={<ViewOrder />} />
            <Route path="edit/:id" element={<EditProductionOrder />} />
            <Route path="pending-for-precheck" element={<PendingForPrecheck />} />
          </Route>

          {/* Script Executor Module */}
          <Route path="scriptexecutor" element={<ScriptExecutor />} />

          {/* Admin Master Module */}
          <Route path="/adminmaster">
            <Route index element={<Navigate to="/adminmaster/rolemanagement" replace />} />
            <Route path="productionorder" element={<ProductionOrderUpload />} />
            <Route path="archive" element={<Archive />} />
            {/* <Route path="insertlnitemcode" element={<InsertLnitemcode />} />
            <Route path="lnitemcodeassembly" element={<LnItemCodeAssembly />} /> */}
            <Route path="updatecomponents/:id" element={<UpdateComponents />} />
            <Route path="updatecomponents" element={<UpdateComponents />} />
            <Route path="update-drawingnumber/:id" element={<UpdateDrawingNumber />} />
            <Route path="update-drawingnumber" element={<UpdateDrawingNumber />} />
            <Route path="usermanagement" element={<UserManagement />} />
            <Route path="rolemanagement" element={<RoleManagement />} />
            <Route path="addcomponents" element={<AddComponents />} />
          </Route>
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
  );
}
