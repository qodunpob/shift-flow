import type { PropsWithChildren } from 'react'
import React from 'react'
import { CurrentUser } from '@/lib/api/users'

export interface AppShellProps {
  user: CurrentUser
}

export const AppShell: React.FC<PropsWithChildren<AppShellProps>> = ({ user, children }) => {
  return <>
    <h1>Welcome {user.firstName} {user.lastName}</h1>
    {children}
  </>
}
