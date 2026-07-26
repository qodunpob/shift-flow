import { Avatar } from '@mui/material';
import React from 'react';
import { stringToColor } from '@/components/user-avatar/stringToColor';

import { CurrentUser } from '@/lib/api/types';

export interface UserAvatarProps {
  user: Pick<CurrentUser, 'id' | 'firstName' | 'lastName'>;
  size?: 'small' | 'medium';
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'medium',
}) => {
  const sizeSx =
    size === 'small' ? { width: 36, height: 36, fontSize: '1rem' } : {};
  return (
    <Avatar sx={{ ...sizeSx, bgcolor: stringToColor(user.id) }}>
      {user.firstName[0]}
      {user.lastName[0]}
    </Avatar>
  );
};
