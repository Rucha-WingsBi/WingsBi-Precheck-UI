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
  if (!error.response && (error.message === "Network Error" || error === "Network Error")) {
    return "Unable to connect to the server. Please check your network connection.";
  }

  const status = error.response?.status;
  const serverData = error.response?.data;

  // 2. Handle 404 Not Found specifically
  if (status === 404) {
    if (serverData && typeof serverData.message === "string" && serverData.message.trim()) {
      return sanitizeTechnicalMessage(serverData.message);
    }
    if (serverData && typeof serverData === "string" && serverData.trim() && !serverData.includes("<!DOCTYPE")) {
      return sanitizeTechnicalMessage(serverData);
    }
    return "Requested item  not found.";
  }

  // 3. Server Crash (500 Internal Server Error) - Sanitize technical traces
  if (status && status >= 500) {
    return "A server error occurred. Please try again later.";
  }

  // 4. Business / Domain / Validation Errors (400, 404, 409, 422) - Show specific message
  if (serverData) {
    // Custom backend message: { message: "..." }
    if (typeof serverData.message === "string" && serverData.message.trim()) {
      return sanitizeTechnicalMessage(serverData.message);
    }
    // ASP.NET Core Validation errors dictionary: { errors: { Field: ["Error..."] } }
    if (serverData.errors && typeof serverData.errors === "object") {
      const firstErrList = Object.values(serverData.errors)[0];
      if (Array.isArray(firstErrList) && firstErrList[0]) {
        return sanitizeTechnicalMessage(String(firstErrList[0]));
      }
      if (typeof firstErrList === "string") {
        return sanitizeTechnicalMessage(firstErrList);
      }
    }
    // ProblemDetails title: { title: "..." }
    if (typeof serverData.title === "string" && serverData.title.trim()) {
      return sanitizeTechnicalMessage(serverData.title);
    }
    // Plain string error response
    if (typeof serverData === "string" && serverData.trim() && !serverData.includes("<!DOCTYPE")) {
      return sanitizeTechnicalMessage(serverData);
    }
  }

  // 5. Axios error message or provided string
  if (typeof error === "string" && error.trim()) {
    return sanitizeTechnicalMessage(error);
  }
  if (typeof error.message === "string" && error.message.trim()) {
    return sanitizeTechnicalMessage(error.message);
  }

  return defaultFallback;
};

/**
 * Detects raw technical/SQL error strings and replaces them with a user-friendly message.
 * Any string that looks like a database error, stack trace, or internal exception
 * is sanitized so end users never see raw technical details.
 */
const TECHNICAL_ERROR_PATTERNS = [
  /cannot insert the value null/i,
  /column does not allow nulls/i,
  /violation of.*constraint/i,
  /error executing scalar query/i,
  /error executing.*query/i,
  /the statement has been terminated/i,
  /invalid object name/i,
  /invalid column name/i,
  /conversion failed when converting/i,
  /arithmetic overflow/i,
  /divide by zero/i,
  /deadlock/i,
  /timeout expired/i,
  /at system\./i,
  /at microsoft\./i,
  /stacktrace/i,
  /exception:/i,
  /sqlexception/i,
  /dbo\./i,
  /inner exception/i,
];

const sanitizeTechnicalMessage = (message: string): string => {
  if (!message) return "";

  // Sanitize raw status code error strings (e.g. "Request failed with status code 404")
  if (/status code 404/i.test(message)) {
    return "Requested item or not found.";
  }
  if (/status code 500/i.test(message) || (/status code/i.test(message) && /50\d/.test(message))) {
    return "A server error occurred. Please try again later.";
  }
  if (/status code 400/i.test(message)) {
    return "Invalid request. Please verify the entered data.";
  }
  if (/status code 401/i.test(message) || /status code 403/i.test(message)) {
    return "Session expired or access denied. Please refresh and try again.";
  }

  const isTechnical = TECHNICAL_ERROR_PATTERNS.some((pattern) =>
    pattern.test(message)
  );
  if (isTechnical) {
    return "An unexpected error occurred. Something went wrong. Please refresh and try again.";
  }
  return message;
};
