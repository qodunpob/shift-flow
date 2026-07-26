'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import theme from '@/theme';
import { NuqsAdapter } from 'nuqs/adapters/next';
import { getQueryClient } from '@/lib/query-client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import React from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
            <ToastContainer position="top-right" />
          </ThemeProvider>
        </AppRouterCacheProvider>
      </NuqsAdapter>
    </QueryClientProvider>
  );
}
