import { Avatar } from '@mui/material';
import React from 'react';
import type { CurrentUser } from '@/lib/api/users';
import { stringToColor } from '@/components/user-avatar/stringToColor';

export interface UserAvatarProps {
  user: Pick<CurrentUser, 'id' | 'firstName' | 'lastName'>;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ user }) => (
  <Avatar sx={{ bgcolor: stringToColor(user.id) }}>
    {user.firstName[0]}
    {user.lastName[0]}
  </Avatar>
);
