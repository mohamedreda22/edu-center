import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Only retry once at most
        if (failureCount >= 1) {
          return false;
        }

        // Determine the HTTP status code from the Axios error response
        const status = error?.response?.status || error?.status;

        // Never retry client side errors (4xx)
        if (status && status >= 400 && status < 500) {
          return false;
        }

        // Retry server side errors (5xx) once
        if (status && status >= 500) {
          return true;
        }

        // If there is no response/status (e.g., Network Error, Connection Reset, DNS failure)
        if (!status) {
          return true;
        }

        return false;
      },
    },
  },
});
