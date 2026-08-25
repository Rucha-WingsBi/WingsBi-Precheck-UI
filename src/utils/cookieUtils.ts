import Cookies from 'js-cookie';

// Cookie configuration (session cookie: no explicit expiration)
const getCookieConfig = () => {
  const isProduction = import.meta.env.PROD;
  const isSecure = window.location.protocol === 'https:';
  
  // For IP-based domains or localhost, we need different settings
  const hostname = window.location.hostname;
  const isIPAddress = /^\d+\.\d+\.\d+\.\d+$/.test(hostname);
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  return {
    secure: isSecure, // Only send over HTTPS if using HTTPS
    sameSite: (isIPAddress || isLocalhost) ? 'lax' as const : 'strict' as const,
    path: '/', // Available across the entire site
    // Don't set domain for IP addresses or localhost
    ...(!(isIPAddress || isLocalhost) && { domain: hostname })
  };
};

// Cookie names
const TOKEN_COOKIE_NAME = 'auth_token';
const USER_COOKIE_NAME = 'auth_user';

export const cookieUtils = {
  // Set authentication token
  setToken: (token: string): void => {
    console.log('Setting auth token in cookie');
    const config = getCookieConfig();
    console.log('Cookie config:', config);
    Cookies.set(TOKEN_COOKIE_NAME, token, config);
    console.log('Auth token set successfully');
  },

  // Get authentication token
  getToken: (): string | undefined => {
    const token = Cookies.get(TOKEN_COOKIE_NAME);
    console.log('Getting auth token from cookie:', token ? 'Token exists' : 'No token found');
    return token;
  },

  // Remove authentication token
  removeToken: (): void => {
    console.log('Removing auth token from cookie');
    Cookies.remove(TOKEN_COOKIE_NAME, { path: '/' });
    console.log('Auth token removed successfully');
  },

  // Set user data
  setUser: (userData: any): void => {
    const config = getCookieConfig();
    Cookies.set(USER_COOKIE_NAME, JSON.stringify(userData), config);
  },

  // Get user data
  getUser: (): any => {
    const userData = Cookies.get(USER_COOKIE_NAME);
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing user data from cookie:', error);
        return null;
      }
    }
    return null;
  },

  // Remove user data
  removeUser: (): void => {
    Cookies.remove(USER_COOKIE_NAME, { path: '/' });
  },

  // Clear all authentication cookies
  clearAuth: (): void => {
    cookieUtils.removeToken();
    cookieUtils.removeUser();
  },

  // Check if user is authenticated (has valid token)
  isAuthenticated: (): boolean => {
    const token = cookieUtils.getToken();
    return !!token;
  },

  // Migrate from localStorage to cookies (for backward compatibility)
  migrateFromLocalStorage: (): void => {
    try {
      const token = localStorage.getItem('token');
      if (token && !cookieUtils.getToken()) {
        // Move token from localStorage to cookies
        cookieUtils.setToken(token);
        localStorage.removeItem('token');
        console.log('Successfully migrated token from localStorage to cookies');
      }
    } catch (error) {
      console.error('Error migrating from localStorage:', error);
    }
  },

  // Clear localStorage (cleanup after migration)
  clearLocalStorage: (): void => {
    try {
      localStorage.removeItem('token');
      console.log('Cleared localStorage authentication data');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};
