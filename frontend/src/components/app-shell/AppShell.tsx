import type { PropsWithChildren } from 'react';
import React from 'react';
import { Container } from '@mui/material';
import { TopBar, TopBarProps } from '@/components/top-bar/TopBar';
import { CurrentUserProvider } from '@/providers/CurrentUserProvider';
import { CurrentUser } from '@/lib/api/types';

export interface AppShellProps
  extends Omit<TopBarProps, 'user'>, PropsWithChildren {
  user: CurrentUser;
}

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
      <CurrentUserProvider user={user}>{children}</CurrentUserProvider>
    </Container>
  );
};
