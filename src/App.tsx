import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from './theme/theme';
import { store } from './store/store';
// Removed initializeAuth to prevent auto-login from cookies/localStorage
import AppRoutes from './routes';
import { cookieUtils } from './utils/cookieUtils';
import { decodeJwt } from './utils/jwtUtils';
import { setAuthFromStorage } from './store/slices/authSlice';
import type { AppDispatch } from './store/store';

// Create QueryClient for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
      gcTime: 30 * 60 * 1000, // Keep unused data in cache for 30 minutes
      retry: 2, // Retry failed requests twice
      refetchOnWindowFocus: false, // Don't refetch on tab focus
    },
  },
});

// Rehydrate auth from session cookie on first load (not persistent across browser restarts)
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    try {
      // Session sentinel: if this is a brand-new browser session (no sentinel),
      // clear any leftover cookies to avoid auto-login, then set the sentinel.
      // Refreshes within the same session will keep cookies and rehydrate auth.
      const SESSION_SENTINEL_KEY = 'session_started';
      const hasSession = sessionStorage.getItem(SESSION_SENTINEL_KEY);
      if (!hasSession) {
        // New browser session → clear auth cookies to force fresh login
        cookieUtils.clearAuth();
        sessionStorage.setItem(SESSION_SENTINEL_KEY, '1');
      }

      const token = cookieUtils.getToken();
      if (token) {
        const decoded: any = decodeJwt(token);
        const now = Date.now() / 1000;
        if (decoded?.exp && decoded.exp > now) {
          dispatch(setAuthFromStorage({
            token,
            id: decoded.id,
            userid: decoded.userid,
            username: decoded.username,
            roleid: decoded.roleid,
            role: decoded.role,
            plantid: decoded.plantid,
            email: decoded.email,
            deptid: decoded.deptid,
            department: decoded.department,
          }));
        }
      }
    } finally {
      setBootstrapped(true);
    }
  }, [dispatch]);

  // Add visibility change listener to track tab switching
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Only log in development
      if (import.meta.env.MODE === 'development') {
        console.log('Tab visibility changed:', {
          hidden: document.hidden,
          timestamp: new Date().toISOString(),
          token: cookieUtils.getToken() ? 'Token exists' : 'No token'
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (!bootstrapped) return null;
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            style={{ zIndex: 9999 }}
          />
        </ThemeProvider>
      </Provider>
    </QueryClientProvider>
  );
}

export default App;
