import type { PropsWithChildren } from 'react';
import React from 'react';
import { Container } from '@mui/material';
import { TopBar, TopBarProps } from '@/components/top-bar/TopBar';

export interface AppShellProps extends TopBarProps, PropsWithChildren {}

export const AppShell: React.FC<AppShellProps> = ({
  title,
  user,
  breadcrumbs,
  children,
}) => {
  return (
    <Container
      maxWidth="lg"
      component="main"
      sx={{ display: 'flex', flexDirection: 'column', my: 8, gap: 4 }}
    >
      <TopBar title={title} user={user} breadcrumbs={breadcrumbs} />
      {children}
    </Container>
  );
};
