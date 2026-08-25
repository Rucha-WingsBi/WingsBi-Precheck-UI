import { useState, useCallback } from 'react';
import { AxiosError } from 'axios';

interface ApiError {
  message: string;
  status?: number;
}

export const useApiError = () => {
  const [error, setError] = useState<ApiError | null>(null);

  const handleError = useCallback((error: unknown) => {
    if (error instanceof Error) {
      const axiosError = error as AxiosError<any>;
      
      // Handle Axios error responses
      if (axiosError.response) {
        setError({
          message: axiosError.response.data?.message || 'An error occurred',
          status: axiosError.response.status,
        });
      }
      // Handle network errors
      else if (axiosError.request) {
        setError({
          message: 'Network error. Please check your connection.',
        });
      }
      // Handle other errors
      else {
        setError({
          message: axiosError.message || 'An unexpected error occurred',
        });
      }
    } else {
      setError({
        message: 'An unexpected error occurred',
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
  };
};

export default useApiError; 