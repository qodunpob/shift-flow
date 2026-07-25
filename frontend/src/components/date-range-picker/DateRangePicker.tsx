'use client';

import React, { MouseEvent, useEffect, useState } from 'react';
import { IMaskInput } from 'react-imask';
import {
  Button,
  FormControl,
  InputLabel,
  OutlinedInput,
  OutlinedInputProps,
  Paper,
  Popover,
} from '@mui/material';
import { DateRange as RdpDateRange, DayPicker } from '@daypicker/react';
import '@daypicker/react/style.css';
import { useLocale, useTranslations } from 'next-intl';
import { FlexBox } from '@/components/box/box';
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
  value: givenValue,
  onChange,
  ...restProps
}) => {
  const locale = useLocale();
  const format = dateFormat(locale).dateRangeInput;
  const t = useTranslations();

  const [anchorEl, setAnchorEl] = useState<HTMLInputElement | null>(null);
  const [calendarRange, setCalendarRange] = useState<RdpDateRange | undefined>(
    givenValue
      ? { from: givenValue.startsAt, to: givenValue.endsAt }
      : undefined,
  );
  const [text, setText] = useState(() => formatRange(givenValue, format));

  const [value, setValue] = useState(givenValue);

  const emitChange = (next: DateRange | null) => {
    setValue(next);
    onChange(next);
  };

  useEffect(() => {
    // One-way sync from givenValue into local state - not a two-way
    // binding, so this can't cascade.
    if (givenValue !== value) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(givenValue);
      setCalendarRange(
        givenValue
          ? { from: givenValue.startsAt, to: givenValue.endsAt }
          : undefined,
      );
      setText(formatRange(givenValue, format));
    }
  }, [givenValue, value, format]);

  const handleOnClick = (event: MouseEvent<HTMLInputElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleCalendarSelect = (range: RdpDateRange | undefined) => {
    setCalendarRange(range);
    if (range?.from && range?.to) {
      const selected: DateRange = { startsAt: range.from, endsAt: range.to };
      setText(formatRange(selected, format));
      emitChange(selected);
      handleClose();
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
            selected={calendarRange}
            onSelect={handleCalendarSelect}
          />
          <FlexBox justifyContent="flex-end" sx={{ mt: 1 }}>
            <Button onClick={handleClose}>{t('common.close')}</Button>
          </FlexBox>
        </Paper>
      </Popover>
    </>
  );
};
