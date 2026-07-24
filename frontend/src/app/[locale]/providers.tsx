'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from '@/theme';
import { NuqsAdapter } from 'nuqs/adapters/next';
import React from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NuqsAdapter>
      <AppRouterCacheProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </AppRouterCacheProvider>
    </NuqsAdapter>
  );
}
