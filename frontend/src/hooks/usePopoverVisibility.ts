'use client';
import { MouseEvent, useState } from 'react';

export const usePopoverVisibility = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLInputElement | null>(null);

  const handleOnClick = (event: MouseEvent<HTMLInputElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  return {
    anchorEl,
    handleOnClick,
    handleClose,
  };
};
