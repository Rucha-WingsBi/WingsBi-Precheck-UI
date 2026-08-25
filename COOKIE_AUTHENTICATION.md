# Cookie-Based Authentication Implementation

## Overview

The application has been updated to use cookies instead of localStorage for authentication token storage. This provides better security and follows best practices for web applications.

## Key Changes

### 1. Cookie Configuration
- **Expiration**: 7 days
- **Secure**: Only sent over HTTPS in production
- **SameSite**: 'strict' to prevent CSRF attacks
- **Path**: '/' (available across entire site)

### 2. Cookie Names
- `auth_token`: Stores the JWT authentication token
- `auth_user`: Stores user data (optional, for backup)

### 3. Migration from localStorage
- Automatic migration from localStorage to cookies on app startup
- Backward compatibility maintained
- Cleanup of old localStorage data

## Benefits of Cookie-Based Authentication

### ✅ **Security Improvements**
- **HttpOnly cookies** (when configured) prevent XSS attacks
- **SameSite attribute** prevents CSRF attacks
- **Secure flag** ensures HTTPS-only transmission in production
- **Automatic expiration** based on cookie settings

### ✅ **Better UX**
- **Automatic token management** by the browser
- **Cross-tab synchronization** of authentication state
- **No manual token cleanup** required

### ✅ **Server-Side Compatibility**
- **Automatic inclusion** in HTTP requests
- **Better integration** with server-side session management
- **Standard web practice** for authentication

## Implementation Details

### Cookie Utility Functions

```typescript
// Set authentication token
cookieUtils.setToken(token: string)

// Get authentication token
cookieUtils.getToken(): string | undefined

// Remove authentication token
cookieUtils.removeToken()

// Clear all authentication data
cookieUtils.clearAuth()

// Check if user is authenticated
cookieUtils.isAuthenticated(): boolean

// Migrate from localStorage (automatic)
cookieUtils.migrateFromLocalStorage()
```

### API Integration

The API interceptors now read tokens directly from cookies instead of Redux state:

```typescript
// Request interceptor
api.interceptors.request.use((config) => {
  const token = cookieUtils.getToken();
  if (token && !isTokenExpired(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Redux State Management

The auth slice has been updated to:
- Initialize from cookies on app startup
- Store tokens in cookies on login
- Clear cookies on logout
- Automatically migrate from localStorage

## Migration Process

### Automatic Migration
1. **App Startup**: `getInitialAuthState()` is called
2. **Check localStorage**: If token exists in localStorage
3. **Migrate to cookies**: Move token to cookies
4. **Cleanup**: Remove token from localStorage
5. **Continue**: Use cookie-based authentication

### Manual Migration (if needed)
```typescript
// Force migration
cookieUtils.migrateFromLocalStorage();

// Clear old localStorage data
cookieUtils.clearLocalStorage();
```

## Testing

### Verify Cookie Storage
1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Check Cookies section
4. Verify `auth_token` cookie exists
5. Check localStorage is empty of auth data

### Test Authentication Flow
1. **Login**: Should set cookie with token
2. **Refresh**: Should restore session from cookie
3. **Logout**: Should clear cookie
4. **Expired token**: Should auto-clear cookie

## Security Considerations

### Cookie Security Features
- **HttpOnly**: Prevents JavaScript access (when configured)
- **Secure**: HTTPS-only in production
- **SameSite**: Prevents CSRF attacks
- **Expiration**: Automatic cleanup after 7 days

### Token Validation
- **JWT decoding**: Validates token structure
- **Expiration check**: Prevents use of expired tokens
- **Automatic cleanup**: Removes invalid tokens

## Troubleshooting

### Common Issues

1. **Token not persisting**:
   - Check cookie settings in browser
   - Verify domain and path settings
   - Check for HTTPS requirements

2. **Migration not working**:
   - Clear browser cache
   - Check console for migration logs
   - Verify localStorage has old token

3. **API requests failing**:
   - Check if token is being sent in headers
   - Verify token expiration
   - Check cookie accessibility

### Debug Steps

1. **Check cookies**:
   ```javascript
   // In browser console
   document.cookie
   ```

2. **Check migration**:
   ```javascript
   // In browser console
   localStorage.getItem('token')
   ```

3. **Force migration**:
   ```javascript
   // In browser console
   window.cookieUtils.migrateFromLocalStorage()
   ```

## Future Enhancements

1. **HttpOnly cookies**: Server-side cookie setting
2. **Refresh tokens**: Implement token refresh mechanism
3. **Session management**: Track multiple sessions
4. **Audit logging**: Log authentication events
5. **Rate limiting**: Prevent brute force attacks

## Files Modified

- `src/utils/cookieUtils.ts` - New cookie utility functions
- `src/store/slices/authSlice.ts` - Updated to use cookies
- `src/services/api.ts` - Updated interceptors to use cookies
- `package.json` - Added js-cookie dependency

## Dependencies Added

```json
{
  "js-cookie": "^3.0.5",
  "@types/js-cookie": "^3.0.6"
}
```

This implementation provides a secure, user-friendly authentication system using industry-standard cookie-based token storage.
