/**
 * Standardized Utility for extracting and formatting error messages across the application.
 *
 * Rules:
 * 1. Business / Validation Errors (400, 404, 409, 422): Shows backend message directly.
 * 2. Technical / Database / 500 Server Errors: Sanitizes raw stack traces to a friendly message.
 * 3. Connection / Network Failures: Shows a clear network connection alert.
 */
export const getErrorMessage = (
  error: any,
  defaultFallback: string = "Operation failed. Please try again."
): string => {
  if (!error) return defaultFallback;

  // 1. Connection / Network Failures
  if (!error.response && error.message === "Network Error") {
    return "Unable to connect to the server. Please check your network connection.";
  }

  const status = error.response?.status;
  const serverData = error.response?.data;

  // 2. Server Crash (500 Internal Server Error) - Sanitize technical traces
  if (status && status >= 500) {
    return "A server error occurred. Please try again later.";
  }

  // 3. Business / Domain / Validation Errors (400, 404, 409, 422) - Show specific message
  if (serverData) {
    // Custom backend message: { message: "..." }
    if (typeof serverData.message === "string" && serverData.message.trim()) {
      return serverData.message;
    }
    // ASP.NET Core Validation errors dictionary: { errors: { Field: ["Error..."] } }
    if (serverData.errors && typeof serverData.errors === "object") {
      const firstErrList = Object.values(serverData.errors)[0];
      if (Array.isArray(firstErrList) && firstErrList[0]) {
        return String(firstErrList[0]);
      }
      if (typeof firstErrList === "string") {
        return firstErrList;
      }
    }
    // ProblemDetails title: { title: "..." }
    if (typeof serverData.title === "string" && serverData.title.trim()) {
      return serverData.title;
    }
    // Plain string error response
    if (typeof serverData === "string" && serverData.trim()) {
      return serverData;
    }
  }

  // 4. Axios error message or provided string
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }

  return defaultFallback;
};
