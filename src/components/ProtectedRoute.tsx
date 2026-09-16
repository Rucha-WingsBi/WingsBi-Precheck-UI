import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';
import type { RootState } from '../store/store';
import { usePageAccess } from '../hooks/useMasterData';
import { isPageAccessible } from '../utils/accessUtils';

// Map routes to API page names (supports multiple page name aliases)
const routeToPageMap: Record<string, string | string[]> = {
  '/irmsn/generate': ['New IR/MSN', 'Create'],
  '/irmsn/view': ['IR/MSN List', 'View All IR/MSN'],
  '/qrcode/generate': ['New QR Code', 'Generate QR Code'],
  '/qrcode/generate-new': ['New QR Code', 'Generate STD QR Code'],
  '/qrcode/view': ['QR Code List', 'View QR Code'],
  '/precheck/view': ['Precheck History', 'View Precheck'],
  '/precheck/make': ['Run Precheck', 'Make Precheck'],
  '/precheck/store-in': ['Store In'],
  '/precheck/stored-components': ['Store In', 'Stored In Components'],
  '/precheck/available-in-store': ['Available In Store'],
  '/precheck/available-store': ['Available In Store'],
  '/precheck/consumed': ['Available In Store'],
  '/precheck/view-consumed': ['Available In Store'],

  '/precheck/pending': ['Run Precheck', 'Pending For Precheck'],
  '/production-order/upload': ['Manage Orders', 'Production Order'],
  '/production-order/view': ['Manage Orders', 'Production Order', 'View Order Details'],
  '/production-order/edit': ['Manage Orders', 'Production Order', 'Run Precheck'],
  '/production-order': ['Manage Orders', 'Production Order'],
  '/adminmaster/archive': ['Master Data', 'Archive'],
  '/adminmaster/updatecomponents': ['Master Data', 'Update Components'],
  '/adminmaster/update-components': ['Master Data', 'Update Components'],
  '/adminmaster/usermanagement': ['User Management'],
  '/adminmaster/user-management': ['User Management'],
  '/adminmaster/rolemanagement': ['Role Management'],
  '/adminmaster/role-management': ['Role Management'],
  '/adminmaster/addcomponents': ['Master Data', 'Add Components'],
  '/adminmaster/add-components': ['Master Data', 'Add Components'],
  '/materialrequisition': ['Run Precheck', 'Material Requisition'],
  '/material-requisition': ['Run Precheck', 'Material Requisition'],
  '/scriptexecutor': ['Bulk Import', 'Script Executor'],
  '/script-executor': ['Bulk Import', 'Script Executor'],
  '/sop/view': ['Assembly Explorer', 'View SOP'],
  '/sop/viewBOM': ['Assembly Explorer', 'View BOM Details'],
  '/components/view-assembly': ['Components', 'View Components'],
  '/components/assembly': ['Components', 'View Components'],
  '/components': ['Components', 'View Components'],
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
    const rawPageNames = routeToPageMap[matchingRoute];
    const pageNames = Array.isArray(rawPageNames) ? rawPageNames : [rawPageNames];
    let hasAccess = pageNames.some((pName) => isPageAccessible(pageAccessData, pName));

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