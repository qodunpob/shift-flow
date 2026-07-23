import { Avatar } from '@mui/material';
import React from 'react';
import { stringToColor } from '@/components/user-avatar/stringToColor';
import { CurrentUser } from '@/lib/api/type-aliases';

export interface UserAvatarProps {
  user: Pick<CurrentUser, 'id' | 'firstName' | 'lastName'>;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ user }) => (
  <Avatar sx={{ bgcolor: stringToColor(user.id) }}>
    {user.firstName[0]}
    {user.lastName[0]}
  </Avatar>
);
