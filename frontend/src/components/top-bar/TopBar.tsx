'use client';

import React from 'react';
import { AppBar, Box, styled, Toolbar, Typography } from '@mui/material';
import { UserAvatar } from '@/components/user-avatar/UserAvatar';
import { FlexBox } from '@/components/box/box';

import { CurrentUser } from '@/lib/api/types';

export interface TopBarProps {
  title: string;
  user: Pick<CurrentUser, 'id' | 'firstName' | 'lastName'>;
}

export const TopBar: React.FC<TopBarProps> = ({ title, user }) => {
  return (
    <StylessAppBar position="static">
      <StyledToolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>

        <FlexBox>
          <UserAvatar user={user} />
          <Box>
            {user.firstName} {user.lastName}
          </Box>
        </FlexBox>
      </StyledToolbar>
    </StylessAppBar>
  );
};

const StylessAppBar = styled(AppBar)(({ theme }) => ({
  boxShadow: 'none',
  background: 'none',
  color: theme.palette.text.primary,
}));

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
  borderRadius: `calc(${theme.shape.borderRadius}px + 8px)`,
  border: '1px solid',
  borderColor: (theme.vars || theme).palette.divider,
  boxShadow: (theme.vars || theme).shadows[1],
  padding: '8px 12px',
}));
