import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';
import type { RootState } from '../store/store';
import { usePageAccess } from '../hooks/useMasterData';
import { isPageAccessible } from '../utils/accessUtils';

// Map routes to exact API page names
const routeToPageMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/scriptexecutor': 'Bulk Import',
  '/script-executor': 'Bulk Import',

  '/irmsn/generate': 'New IR/MSN',
  '/irmsn/view': 'IR/MSN List',

  '/qrcode/generate': 'New QR Code',
  '/qrcode/generate-new': 'New QR Code',
  '/qrcode/view': 'QR Code List',

  '/precheck/view': 'Precheck History',
  '/precheck/make': 'Run Precheck',
  '/precheck/pending': 'Run Precheck',
  '/precheck/store-in': 'Store In',
  '/precheck/stored-components': 'Store In',
  '/precheck/available-in-store': 'Available In Store',
  '/precheck/available-store': 'Available In Store',
  '/precheck/consumed': 'Available In Store',
  '/precheck/view-consumed': 'Available In Store',

  '/production-order/upload': 'Manage Orders',
  '/production-order/view': 'Manage Orders',
  '/production-order/edit': 'Manage Orders',
  '/production-order': 'Manage Orders',

  '/adminmaster/archive': 'Master Data',
  '/adminmaster/updatecomponents': 'Master Data',
  '/adminmaster/update-components': 'Master Data',
  '/adminmaster/usermanagement': 'User Management',
  '/adminmaster/user-management': 'User Management',
  '/adminmaster/rolemanagement': 'Role Management',
  '/adminmaster/role-management': 'Role Management',
  '/adminmaster/addcomponents': 'Master Data',
  '/adminmaster/add-components': 'Master Data',

  '/materialrequisition': 'Run Precheck',
  '/material-requisition': 'Run Precheck',

  '/sop/view': 'Assembly Explorer',
  '/sop/viewBOM': 'Assembly Explorer',
  '/components/view-assembly': 'Components',
  '/components/assembly': 'Components',
  '/components': 'Components',
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
    const targetPageName = routeToPageMap[matchingRoute];
    let hasAccess = isPageAccessible(pageAccessData, targetPageName);

    // Bypass page access for Update Components page
    if (matchingRoute === '/adminmaster/updatecomponents') {
      hasAccess = true;
    }

    if (!hasAccess && currentPath !== '/dashboard') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;