import { dateFormat } from '@/constants/dates';
import { useState } from 'react';
import { DateTime } from 'luxon';

export interface UseDatePickerValueArgs {
  givenValue: Date | null;
  locale: string;
  onChange: (value: Date | null) => void;
  onClose?: () => void;
}

export const useDatePickerValue = ({
  givenValue,
  locale,
  onChange,
  onClose,
}: UseDatePickerValueArgs) => {
  const format = dateFormat(locale).dateRangeInput;
  const [value, setValue] = useState(givenValue);
  const [textValue, setTextValue] = useState(() =>
    formatValue(givenValue, format),
  );

  const emitChange = (next: Date | null) => {
    setValue(next);
    onChange(next);
  };

  if (givenValue?.getTime() !== value?.getTime()) {
    setValue(givenValue);
    setTextValue(formatValue(givenValue, format));
  }

  const handleCalendarSelect = (selected: Date | null = null) => {
    setTextValue(formatValue(selected, format));
    emitChange(selected);
    onClose?.();
  };

  const handleInputAccept = (typedText: string) => {
    setTextValue(typedText);
    const nextValue = parseValue(typedText, format);
    emitChange(nextValue);
  };

  return {
    value,
    textValue,
    handleInputAccept,
    handleCalendarSelect,
  };
};

const formatValue = (value: Date | null, format: string) =>
  value ? DateTime.fromJSDate(value).toFormat(format) : '';

const parseValue = (value: string, format: string) => {
  const parsed = DateTime.fromFormat(value, format);
  return parsed.isValid ? parsed.toJSDate() : null;
};
