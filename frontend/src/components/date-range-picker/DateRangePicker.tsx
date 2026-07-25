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

// react-imask's IMaskInput props are a discriminated union keyed on `mask`;
// spreading a generic props bag defeats that discrimination, so the
// pattern-mask shape we actually use is asserted explicitly here.
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

  // Tracks the value this component itself last reported via `onChange`, so
  // the sync block below can tell "value became null/changed because our
  // own onChange reported an in-progress edit" (skip resync) apart from
  // "value changed for an external reason, e.g. a parent/Formik reset"
  // (do resync).
  //
  // This is intentionally useState rather than useRef: the sync block below
  // needs to read this value during render, and the "react-hooks/refs" rule
  // (part of the Rules of React enforced by the React Compiler lint plugin)
  // disallows reading ref.current during render, since a component may
  // render without its refs reflecting the values from that same render
  // pass (e.g. under Strict Mode double-rendering or concurrent features).
  // Reading state during render is exactly what state is for, and updating
  // it here is batched with the onChange call below, so it lands in the
  // same commit as the resulting `value` prop update — no extra render
  // pass is introduced beyond the one already caused by that prop change.
  const [lastEmittedValue, setLastEmittedValue] = useState(value);

  const emitChange = (next: DateRange | null) => {
    setLastEmittedValue(next);
    onChange(next);
  };

  // Keep the calendar and displayed text in sync when the controlled value
  // (or the resolved format) changes from outside (e.g. a Formik form
  // reset). Adjusted during render rather than in a useEffect, per React's
  // guidance on syncing state to props without an extra render pass.
  const [prevValue, setPrevValue] = useState(value);
  const [prevFormat, setPrevFormat] = useState(format);
  const valueChangedExternally =
    value !== prevValue && value !== lastEmittedValue;
  const formatChanged = format !== prevFormat;
  if (value !== prevValue || formatChanged) {
    setPrevValue(value);
    setPrevFormat(format);
    if (valueChangedExternally || formatChanged) {
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
