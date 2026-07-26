import { useState } from 'react';
import { DateRange as RdpDateRange } from '@daypicker/react';
import '@daypicker/react/style.css';
import { dateFormat } from '@/constants/dates';
import { formatRange, isSameDateRange, parseRangeText } from './utils';
import { DateRange } from '@/components/date-range-picker/types';

export interface UseDatePickerValueArgs {
  givenValue: DateRange | null;
  locale: string;
  onChange: (value: DateRange | null) => void;
}

export const useDatePickerValue = ({
  givenValue,
  locale,
  onChange,
}: UseDatePickerValueArgs) => {
  const format = dateFormat(locale).dateRangeInput;
  const [value, setValue] = useState(givenValue);
  const [textRange, setTextRange] = useState(() =>
    formatRange(givenValue, format),
  );
  const [calendarRange, setCalendarRange] = useState<RdpDateRange | undefined>(
    givenValue
      ? { from: givenValue.startsAt, to: givenValue.endsAt }
      : undefined,
  );

  const emitChange = (next: DateRange | null) => {
    setValue(next);
    onChange(next);
  };

  if (!isSameDateRange(givenValue, value)) {
    setValue(givenValue);
    setCalendarRange(
      givenValue
        ? { from: givenValue.startsAt, to: givenValue.endsAt }
        : undefined,
    );
    setTextRange(formatRange(givenValue, format));
  }

  const handleCalendarSelect = (range: RdpDateRange | undefined) => {
    setCalendarRange(range);
    if (range?.from && range?.to) {
      const selected: DateRange = { startsAt: range.from, endsAt: range.to };
      setTextRange(formatRange(selected, format));
      emitChange(selected);
    }
  };

  const handleInputAccept = (typedText: string) => {
    setTextRange(typedText);
    emitChange(parseRangeText(typedText, format));
  };

  return {
    textRange,
    calendarRange,
    handleInputAccept,
    handleCalendarSelect,
  };
};
