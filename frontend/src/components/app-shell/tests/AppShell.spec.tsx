import { render, screen } from '@testing-library/react';
import React from 'react';
import { AppShell } from '@/components/app-shell/AppShell';
import { useCurrentUser } from '@/providers/CurrentUserProvider';
import { CurrentUser } from '@/lib/api/types';

jest.mock('@/components/top-bar/TopBar', () => ({
  TopBar: () => <div data-testid="top-bar" />,
}));

const user: CurrentUser = {
  id: 'user-1',
  createdAt: '2026-07-20T00:00:00.000Z',
  createdBy: 'user-1',
  updatedAt: '2026-07-20T00:00:00.000Z',
  updatedBy: 'user-1',
  deletedAt: null,
  firstName: 'Ada',
  lastName: 'Lovelace',
  roles: ['MANAGER'],
};

const CurrentUserProbe = () => {
  const currentUser = useCurrentUser();
  return <div data-testid="current-user-probe">{currentUser.id}</div>;
};

describe('components/app-shell/AppShell', () => {
  it('should make the current user available to its children via context', () => {
    render(
      <AppShell title="Schedules" user={user}>
        <CurrentUserProbe />
      </AppShell>,
    );

    expect(screen.getByTestId('current-user-probe')).toHaveTextContent(
      'user-1',
    );
  });
});
