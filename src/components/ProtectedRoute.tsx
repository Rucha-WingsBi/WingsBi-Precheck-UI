import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';
import type { RootState } from '../store/store';
import { usePageAccess } from '../hooks/useMasterData';
import { isPageAccessible } from '../utils/accessUtils';

// Map routes to API page names
const routeToPageMap: Record<string, string> = {
  '/irmsn/generate': 'Create',
  '/qrcode/generate': 'Generate QR Code',
  '/qrcode/generate-new': 'Generate STD QR Code',
  '/precheck/make': 'Make Precheck',
  '/precheck/store-in': 'Store In',
  '/precheck/stored-components': 'Stored In Components',
  '/precheck/available-in-store': 'Available In Store',
  '/precheck/available-store': 'Available In Store',
  '/precheck/consumed': 'View Consumed In',
  '/precheck/view-consumed': 'View Consumed In',
  '/precheck/make-order': 'Make Order',
  '/precheck/pending': 'Pending For Precheck',
  '/production-order/upload': 'Upload Orders',
  '/production-order/view': 'View Order Details',
  '/production-order/edit': 'Upload Orders',
  '/production-order': 'Upload Orders',
  '/adminmaster/archive': 'Archive',
  '/adminmaster/updatecomponents': 'Update Components',
  '/adminmaster/update-components': 'Update Components',
  '/adminmaster/usermanagement': 'User Management',
  '/adminmaster/user-management': 'User Management',
  '/adminmaster/rolemanagement': 'Role Management',
  '/adminmaster/role-management': 'Role Management',
  '/adminmaster/addcomponents': 'Add Components',
  '/adminmaster/add-components': 'Add Components',
  '/materialrequisition': 'Material Requisition',
  '/material-requisition': 'Material Requisition',
  '/scriptexecutor': 'Script Executor',
  '/script-executor': 'Script Executor',
  '/sop/view': 'View SOP',
  '/sop/viewBOM': 'View BOM Details',
  '/components/view-assembly': 'View Components',
  '/components/assembly': 'View Components',
  '/components': 'View Components',
};

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading: isAuthLoading } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  // Fetch page access for the current role
  const { data: pageAccessData, isLoading: isAccessLoading } = usePageAccess(
    user?.roleid ? Number(user.roleid) : null
  );

  const isLoading = isAuthLoading || isAccessLoading;

  // Show loading spinner while authentication or access data is loading
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check access for the current route
  const currentPath = location.pathname;
  
  // Find the most specific mapping (longest match)
  const matchingRoute = Object.keys(routeToPageMap)
    .filter(path => currentPath.startsWith(path))
    .sort((a, b) => b.length - a.length)[0];

  if (matchingRoute) {
    const pageName = routeToPageMap[matchingRoute];
    let hasAccess = isPageAccessible(pageAccessData, pageName);

    // Bypass page access for Update Components page
    if (matchingRoute === '/adminmaster/updatecomponents') {
      hasAccess = true;
    }

    // Special case for Production Order Edit:
    // Allow if user has access to either "Upload Orders" or "Pending For Precheck"
    if (matchingRoute === '/production-order/edit' && !hasAccess) {
      hasAccess = isPageAccessible(pageAccessData, 'Pending For Precheck');
    }

    if (!hasAccess) {
      // If user doesn't have required access, redirect to dashboard
      // Avoid redirect loops if dashboard itself is restricted (though usually it's not)
      if (currentPath !== '/dashboard') {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;