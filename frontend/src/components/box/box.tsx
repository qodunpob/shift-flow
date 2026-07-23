import React from 'react';
import { Box, BoxProps } from '@mui/material';

export interface FlexBoxProps extends BoxProps {
  gap?: number;
  direction?: 'row' | 'column';
  alignItems?: 'center' | 'flex-start' | 'flex-end' | 'baseline' | 'stretch';
  justifyContent?:
    | 'center'
    | 'flex-start'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
}

export const FlexBox: React.FC<FlexBoxProps> = ({
  gap = 2,
  direction = 'row',
  alignItems = 'center',
  justifyContent,
  children,
  ...restProps
}) => (
  <Box
    {...restProps}
    sx={{
      display: 'flex',
      gap,
      flexDirection: direction,
      alignItems,
      justifyContent,
      ...restProps.sx,
    }}
  >
    {children}
  </Box>
);
