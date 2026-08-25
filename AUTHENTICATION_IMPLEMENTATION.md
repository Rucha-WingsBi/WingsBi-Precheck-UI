# Authentication Implementation Documentation

## Overview

This document outlines the comprehensive authentication system implemented for the React application, based on the WPF implementation requirements. The system includes login, registration, and password reset functionality with proper validation, error handling, and user feedback.

## Features Implemented

### 1. Login System
- **File**: `src/pages/auth/Login.tsx`
- **Features**:
  - User ID and password authentication
  - Form validation with real-time error feedback
  - Password visibility toggle
  - Remember login state using localStorage
  - JWT token handling and automatic expiration
  - Navigation to dashboard after successful login
  - Link to registration and forgot password pages

### 2. Registration System
- **File**: `src/pages/auth/Register.tsx`
- **Features**:
  - Comprehensive user registration form
  - Dynamic loading of security questions, roles, departments, and plants from API
  - Field validation using Yup schema
  - Password confirmation matching
  - Admin role filtering (Admin roles are excluded from registration)
  - Success notification and automatic redirect to login
  - Form reset after successful registration

### 3. Password Reset (Forget Password)
- **File**: `src/pages/auth/ForgetPassword.tsx`
- **Features**:
  - Security question-based password reset
  - Dynamic security questions loaded from API
  - New password and confirmation validation
  - Success notification and automatic redirect to login
  - Form validation and error handling

### 4. Redux State Management
- **File**: `src/store/slices/authSlice.ts`
- **Features**:
  - Centralized authentication state management
  - JWT token handling and storage
  - User session management
  - Authentication initialization from localStorage
  - Login, register, and password reset async actions
  - Error handling and loading states

### 5. Common Data Management
- **File**: `src/store/slices/commonSlice.ts`
- **Features**:
  - API calls for security questions, departments, roles, and plants
  - Centralized loading states for dropdown data
  - Error handling for data fetching

### 6. Notification System
- **File**: `src/utils/notifications.ts`
- **Features**:
  - Toast notifications using react-toastify
  - CustomMessageBox utility similar to WPF implementation
  - Success, error, warning, and info message types
  - Consistent notification styling and behavior

## API Endpoints Used

### Authentication Endpoints
- `POST /api/Auth/Login` - User login
- `POST /api/Auth/register` - User registration
- `POST /api/Auth/reset` - Password reset

### Common Data Endpoints
- `GET /api/Auth/GetSecurityQuestion` - Security questions
- `GET /api/Auth/GetAllDepartment` - Departments
- `GET /api/Auth/GetUserRoles` - User roles
- `GET /api/Auth/GetAllPlants` - Plants

## Key Components and Structure

### Authentication Flow
```
Login Page → Redux Action → API Call → JWT Token → Dashboard
```

### Registration Flow
```
Register Page → Load Dropdown Data → Form Validation → Redux Action → API Call → Success Message → Login Page
```

### Password Reset Flow
```
Forgot Password Page → Load Security Questions → Form Validation → Redux Action → API Call → Success Message → Login Page
```

### Protected Routes
- **File**: `src/components/ProtectedRoute.tsx`
- Checks authentication status before allowing access to protected pages
- Redirects to login if user is not authenticated
- Shows loading spinner during authentication check

## Form Validation

### Login Form
- User ID: Required, trimmed
- Password: Required, trimmed

### Registration Form
- Username: Required, minimum 3 characters
- Email: Required, valid email format
- User ID: Required, minimum 3 characters
- Password: Required, minimum 6 characters
- Confirm Password: Required, must match password
- Role: Required, excludes Admin role
- Department: Required, excludes Admin department
- Plant: Required
- Security Question: Required
- Security Answer: Required, minimum 2 characters

### Password Reset Form
- User ID: Required, trimmed
- Security Question: Required
- Security Answer: Required, trimmed
- New Password: Required, minimum 6 characters
- Confirm Password: Required, must match new password

## Error Handling

### Redux Level
- Network errors handled in async thunks
- Error messages stored in state
- Loading states managed for UI feedback

### Component Level
- Form validation errors displayed in real-time
- API errors displayed using Alert components
- Success messages using toast notifications

### Global Level
- Axios interceptors for token management
- Automatic logout on token expiration
- 401 error handling with redirect to login

## Security Features

### JWT Token Management
- Tokens stored in localStorage
- Automatic token validation and expiration checking
- Token included in API requests via Axios interceptors
- Automatic logout and redirect on token expiration

### Password Security
- Password visibility toggles
- Minimum password length requirements
- Password confirmation validation

### Role-Based Access
- Admin roles filtered from registration
- User roles fetched dynamically from API
- Protected routes based on authentication status

## UI/UX Features

### Responsive Design
- Mobile-friendly layouts
- Consistent Material-UI theming
- Gradient backgrounds matching brand colors
- Card-based layouts with shadows and rounded corners

### User Feedback
- Loading spinners during API calls
- Real-time form validation feedback
- Success and error toast notifications
- Smooth transitions and animations

### Navigation
- Automatic redirects after successful operations
- "Back to Login" buttons on all auth pages
- Links between authentication pages

## File Structure

```
src/
├── pages/auth/
│   ├── Login.tsx           # Login page component
│   ├── Register.tsx        # Registration page component
│   └── ForgetPassword.tsx  # Password reset page component
├── store/slices/
│   ├── authSlice.ts       # Authentication state management
│   └── commonSlice.ts     # Common data management
├── utils/
│   ├── notifications.ts   # Toast notification utilities
│   └── jwtUtils.ts       # JWT token utilities
├── components/
│   └── ProtectedRoute.tsx # Route protection component
├── routes.tsx             # Application routing configuration
└── App.tsx               # Main app with toast container
```

## Usage Examples

### Login
1. Navigate to `/login`
2. Enter User ID and Password
3. Click "Login" button
4. Successful login redirects to dashboard
5. Failed login shows error message

### Registration
1. Navigate to `/register`
2. Fill all required fields
3. Select from dynamically loaded dropdowns
4. Password confirmation must match
5. Submit form for registration
6. Success notification and redirect to login

### Password Reset
1. Navigate to `/forgot-password` from login page
2. Enter User ID
3. Select security question from dropdown
4. Enter security answer
5. Set new password and confirm
6. Submit for password reset
7. Success notification and redirect to login

## Installation and Setup

### Dependencies
```bash
npm install react-toastify
```

### Configuration
1. Ensure API endpoints are configured in environment variables
2. Update API base URL in `src/services/api.ts`
3. Configure toast notifications in `src/App.tsx`

### Environment Variables
```env
VITE_API_BASE_URL=your_api_base_url
```

## Testing the Implementation

### Manual Testing Steps
1. **Login Flow**:
   - Test with valid credentials
   - Test with invalid credentials
   - Test form validation
   - Test password visibility toggle

2. **Registration Flow**:
   - Test all form validations
   - Test dropdown data loading
   - Test password confirmation
   - Test success notification

3. **Password Reset Flow**:
   - Test security question loading
   - Test form validation
   - Test password reset process
   - Test success notification

4. **Navigation**:
   - Test navigation between auth pages
   - Test protected route redirection
   - Test automatic logout on token expiration

## Integration with Existing Codebase

The authentication system integrates seamlessly with the existing codebase:

1. **Redux Store**: Uses existing store configuration
2. **API Service**: Uses existing Axios configuration
3. **Routing**: Integrates with React Router setup
4. **Theming**: Uses existing Material-UI theme
5. **Layout**: Consistent with existing page layouts

## Future Enhancements

1. **Two-Factor Authentication**: Add SMS/Email verification
2. **Social Login**: Google, Microsoft, etc.
3. **Password Strength Indicator**: Visual password strength meter
4. **Account Lockout**: Security feature after failed attempts
5. **Audit Logging**: Track authentication events
6. **Session Management**: Multiple device session handling

## Troubleshooting

### Common Issues
1. **API Connection**: Check environment variables and API endpoints
2. **Token Issues**: Clear localStorage and retry
3. **Dropdown Loading**: Check network connectivity and API responses
4. **Navigation Issues**: Verify route configurations
5. **Notification Issues**: Check ToastContainer configuration

### Debug Steps
1. Check browser console for errors
2. Verify network tab for API calls
3. Check Redux DevTools for state changes
4. Verify localStorage for token storage
5. Test with different user roles and data

This implementation provides a robust, secure, and user-friendly authentication system that matches the functionality of the WPF implementation while leveraging modern React patterns and best practices. 