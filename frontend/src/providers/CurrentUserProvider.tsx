'use client';

import React, { createContext, useContext } from 'react';
import { CurrentUser } from '@/lib/api/types';

const CurrentUserContext = createContext<CurrentUser | null>(null);

export interface CurrentUserProviderProps {
  user: CurrentUser;
  children: React.ReactNode;
}

export const CurrentUserProvider: React.FC<CurrentUserProviderProps> = ({
  user,
  children,
}) => (
  <CurrentUserContext.Provider value={user}>
    {children}
  </CurrentUserContext.Provider>
);

export const useCurrentUser = (): CurrentUser => {
  const user = useContext(CurrentUserContext);
  if (!user) {
    throw new Error('useCurrentUser must be used within a CurrentUserProvider');
  }
  return user;
};
