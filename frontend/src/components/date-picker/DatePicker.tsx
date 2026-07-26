import React from 'react';
import {
  FormControl,
  FormHelperText,
  InputLabel,
  OutlinedInputProps,
  Paper,
  Popover,
} from '@mui/material';
import { useLocale } from 'next-intl';
import { usePopoverVisibility } from '@/hooks/usePopoverVisibility';
import { MaskedTextField } from '@/components/masked-text-field/MaskedTextField';
import { DayPicker } from '@daypicker/react';
import '@daypicker/react/style.css';
import { useDatePickerValue } from '@/components/date-picker/useDatePickerValue';

export interface DatePickerProps extends Omit<
  OutlinedInputProps,
  'value' | 'onChange'
> {
  label?: string;
  required?: boolean;
  helperText?: React.ReactNode;
  value: Date | null;
  onChange: (value: Date | null) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({
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

  const { anchorEl, handleOnClick, handleClose } = usePopoverVisibility();
  const { value, textValue, handleCalendarSelect, handleInputAccept } =
    useDatePickerValue({
      givenValue,
      locale,
      onChange,
      onClose: handleClose,
    });
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
          mask="00/00/0000"
          placeholder="MM/DD/YYYY"
          value={textValue}
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
            mode="single"
            selected={value ?? undefined}
            onSelect={handleCalendarSelect}
          />
        </Paper>
      </Popover>
    </>
  );
};
