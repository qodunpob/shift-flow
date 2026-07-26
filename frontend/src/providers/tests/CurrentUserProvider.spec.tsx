import { renderHook } from '@testing-library/react';
import React from 'react';
import {
  CurrentUserProvider,
  useCurrentUser,
} from '@/providers/CurrentUserProvider';
import { CurrentUser } from '@/lib/api/types';

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

describe('providers/CurrentUserProvider', () => {
  it('should return the provided user', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CurrentUserProvider user={user}>{children}</CurrentUserProvider>
    );

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    expect(result.current).toEqual(user);
  });

  it('should throw when used outside a CurrentUserProvider', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => renderHook(() => useCurrentUser())).toThrow(
      'useCurrentUser must be used within a CurrentUserProvider',
    );

    consoleError.mockRestore();
  });
});
