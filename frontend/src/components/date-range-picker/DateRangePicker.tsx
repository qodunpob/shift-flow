'use client';

import React from 'react';
import {
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  OutlinedInputProps,
  Paper,
  Popover,
} from '@mui/material';
import { DayPicker } from '@daypicker/react';
import '@daypicker/react/style.css';
import { useLocale, useTranslations } from 'next-intl';
import { FlexBox } from '@/components/box/box';
import { DateRange } from '@/components/date-range-picker/types';
import { MaskedTextField } from '@/components/masked-text-field/MaskedTextField';
import { useDatePickerValue } from '@/components/date-range-picker/useDatePickerValue';
import { usePopoverVisibility } from '@/hooks/usePopoverVisibility';

export interface DateRangePickerProps extends Omit<
  OutlinedInputProps,
  'value' | 'onChange'
> {
  label?: string;
  required?: boolean;
  helperText?: React.ReactNode;
  value: DateRange | null;
  onChange: (value: DateRange | null) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  label,
  required,
  error,
  helperText,
  value: givenValue,
  fullWidth,
  onChange,
  ...restProps
}) => {
  const locale = useLocale();
  const t = useTranslations();

  const { calendarRange, textRange, handleCalendarSelect, handleInputAccept } =
    useDatePickerValue({
      givenValue,
      locale,
      onChange,
    });

  const { anchorEl, handleOnClick, handleClose } = usePopoverVisibility();

  return (
    <>
      <FormControl
        required={required}
        error={error}
        onClick={handleOnClick}
        fullWidth={fullWidth}
      >
        {label && <InputLabel>{label}</InputLabel>}
        <MaskedTextField
          {...restProps}
          mask="00/00/0000 – 00/00/0000"
          placeholder="MM/DD/YYYY – MM/DD/YYYY"
          value={textRange}
          onAccept={handleInputAccept}
        />
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>
      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        disableRestoreFocus
      >
        <Paper
          sx={{
            p: 2,
            '& .rdp-root': {
              '--rdp-accent-color': 'var(--mui-palette-primary-main)',
              '--rdp-accent-background-color':
                'rgba(var(--mui-palette-primary-mainChannel) / 0.2)',
              '--rdp-range_start-color':
                'var(--mui-palette-primary-contrastText)',
              '--rdp-range_end-color':
                'var(--mui-palette-primary-contrastText)',
              '--rdp-range_middle-color': 'var(--mui-palette-text-primary)',
            },
          }}
        >
          <DayPicker
            animate
            mode="range"
            min={1}
            selected={calendarRange}
            onSelect={handleCalendarSelect}
          />
          <FlexBox justifyContent="flex-end" sx={{ mt: 1 }}>
            <Button onClick={handleClose}>{t('common.ok')}</Button>
          </FlexBox>
        </Paper>
      </Popover>
    </>
  );
};
