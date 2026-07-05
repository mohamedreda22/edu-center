import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { ThemeProvider } from './ThemeProvider';
import { AuthProvider } from '../features/auth/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const Providers = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="edu-core-theme">
        <AuthProvider>
          <div
            dir="rtl"
            className="min-h-screen bg-background font-sans antialiased"
          >
            {children}
          </div>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};
