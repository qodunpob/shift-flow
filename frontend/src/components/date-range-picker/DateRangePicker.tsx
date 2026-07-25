'use client';

import React, { MouseEvent, useState } from 'react';
import { IMaskInput } from 'react-imask';
import {
  FormControl,
  InputLabel,
  OutlinedInput,
  OutlinedInputProps,
  Paper,
  Popover,
} from '@mui/material';
import { DateRange as RdpDateRange, DayPicker } from '@daypicker/react';
import '@daypicker/react/style.css';
import { useLocale } from 'next-intl';
import { dateFormat } from '@/constants/dates';
import { DateRange, formatRange, parseRangeText } from './utils';

type DateRangeInputProps = React.ComponentProps<'input'> & {
  ref?: React.Ref<HTMLInputElement>;
  onAccept?: (value: string) => void;
};

// IMaskInput's props are a discriminated union on `mask`; assert the shape we use.
const MaskedPatternInput = IMaskInput as unknown as React.ComponentType<
  React.ComponentProps<'input'> & {
    mask: string;
    inputRef?: React.Ref<HTMLInputElement>;
    onAccept?: (value: string) => void;
  }
>;

const DateRangeMaskedInput = ({
  ref,
  onAccept,
  ...props
}: DateRangeInputProps) => (
  <MaskedPatternInput
    {...props}
    mask="00/00/0000 – 00/00/0000"
    placeholder="MM/DD/YYYY – MM/DD/YYYY"
    inputRef={ref}
    onAccept={onAccept}
  />
);

export interface DateRangePickerProps extends Omit<
  OutlinedInputProps,
  'value' | 'onChange'
> {
  label?: string;
  required?: boolean;
  value: DateRange | null;
  onChange: (value: DateRange | null) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  label,
  required,
  value,
  onChange,
  ...restProps
}) => {
  const locale = useLocale();
  const format = dateFormat(locale).dateRangeInput;

  const [anchorEl, setAnchorEl] = useState<HTMLInputElement | null>(null);
  const [calendarRange, setCalendarRange] = useState<RdpDateRange | undefined>(
    value ? { from: value.startsAt, to: value.endsAt } : undefined,
  );
  const [text, setText] = useState(() => formatRange(value, format));

  // Distinguishes our own onChange echoes from real external value changes,
  // so the sync below doesn't clobber in-progress typing (useState, not
  // useRef: this is read during render).
  const [lastEmittedValue, setLastEmittedValue] = useState(value);

  const emitChange = (next: DateRange | null) => {
    setLastEmittedValue(next);
    onChange(next);
  };

  // Mirror external value changes (e.g. a Formik reset) into local state.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (value !== lastEmittedValue) {
      setCalendarRange(
        value ? { from: value.startsAt, to: value.endsAt } : undefined,
      );
      setText(formatRange(value, format));
    }
  }

  const handleOnClick = (event: MouseEvent<HTMLInputElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCalendarSelect = (range: RdpDateRange | undefined) => {
    setCalendarRange(range);
    if (range?.from && range?.to) {
      const selected: DateRange = { startsAt: range.from, endsAt: range.to };
      setText(formatRange(selected, format));
      emitChange(selected);
      setAnchorEl(null);
    }
  };

  const handleTextAccept = (typedText: string) => {
    setText(typedText);
    emitChange(parseRangeText(typedText, format));
  };

  return (
    <>
      <FormControl required={required} onClick={handleOnClick}>
        {label && <InputLabel>{label}</InputLabel>}
        <OutlinedInput
          {...restProps}
          value={text}
          inputComponent={DateRangeMaskedInput}
          inputProps={{ onAccept: handleTextAccept }}
        />
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
          <DayPicker
            animate
            mode="range"
            selected={calendarRange}
            onSelect={handleCalendarSelect}
          />
        </Paper>
      </Popover>
    </>
  );
};
