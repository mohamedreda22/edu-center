import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { ThemeProvider } from './ThemeProvider';
import { AuthProvider } from '../features/auth/AuthContext';
import { queryClient } from '../shared/lib/queryClient';

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
