import React, { MouseEvent } from 'react';
import { IMaskInput } from 'react-imask';
import {
  FormControl,
  InputLabel,
  OutlinedInput,
  OutlinedInputProps,
  Paper,
  Popover,
} from '@mui/material';
import { DayPicker } from '@daypicker/react';
import '@daypicker/react/style.css';

type DateRangeInputProps = React.ComponentProps<'input'> & {
  ref?: React.Ref<HTMLInputElement>;
};

// react-imask's IMaskInput props are a discriminated union keyed on `mask`;
// spreading a generic props bag defeats that discrimination, so the
// pattern-mask shape we actually use is asserted explicitly here.
const MaskedPatternInput = IMaskInput as unknown as React.ComponentType<
  React.ComponentProps<'input'> & {
    mask: string;
    inputRef?: React.Ref<HTMLInputElement>;
  }
>;

const DateRangeMaskedInput = ({ ref, ...props }: DateRangeInputProps) => (
  <MaskedPatternInput
    {...props}
    mask="00/00/0000 – 00/00/0000"
    placeholder="MM/DD/YYYY – MM/DD/YYYY"
    inputRef={ref}
  />
);

export interface DateRangePickerProps extends OutlinedInputProps {
  label?: string;
  required?: boolean;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  label,
  required,
  ...restProps
}) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLInputElement | null>(null);

  const handleOnClick = (event: MouseEvent<HTMLInputElement>) => {
    setAnchorEl(event.currentTarget);
  };

  return (
    <>
      <FormControl required={required} onClick={handleOnClick}>
        {label && <InputLabel>{label}</InputLabel>}
        <OutlinedInput {...restProps} inputComponent={DateRangeMaskedInput} />
      </FormControl>
      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
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
          <DayPicker animate mode="range" />
        </Paper>
      </Popover>
    </>
  );
};
