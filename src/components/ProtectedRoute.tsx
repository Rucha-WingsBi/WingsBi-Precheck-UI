import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';
import type { RootState } from '../store/store';
import { usePageAccess } from '../hooks/useMasterData';
import { isPageAccessible } from '../utils/accessUtils';

const routeToPageMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/bulk-import': 'Bulk Import',

  '/irmsn/new': 'New IR/MSN',
  '/irmsn/list': 'IR/MSN List',
  '/irmsn/edit': 'IR/MSN List',

  '/qrcode/new': 'New QR Code',
  '/qrcode/list': 'QR Code List',
  '/qrcode/update': 'QR Code List',
  '/qrcode/store-in': 'Store In',

  '/verification/history': 'Verification History',
  '/verification/parts': 'Part Verification',
  '/verification/material-requisition': 'Material Requisition',

  '/production-order/history': 'Manage Orders',
  '/production-order/view': 'Manage Orders',
  '/production-order/edit': 'Manage Orders',

  '/adminmaster/master-data': 'Master Data',
  '/adminmaster/update-components': 'Master Data',
  '/adminmaster/user-management': 'User Management',
  '/adminmaster/role-management': 'Role Management',

  '/assembly/explorer': 'Assembly Explorer',
  '/assembly/components': 'Components',
  '/assembly/view-assembly': 'Components',
  '/settings': 'Settings',
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
    if (matchingRoute === '/adminmaster/update-components') {
      hasAccess = true;
    }

    if (!hasAccess && currentPath !== '/dashboard') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;