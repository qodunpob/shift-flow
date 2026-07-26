import { DateTime } from 'luxon';
import { DateRange } from '@/components/date-range-picker/types';

const RANGE_SEPARATOR = ' – ';

export const formatRange = (
  range: DateRange | null,
  format: string,
): string => {
  if (!range) return '';
  return [
    DateTime.fromJSDate(range.startsAt).toFormat(format),
    DateTime.fromJSDate(range.endsAt).toFormat(format),
  ].join(RANGE_SEPARATOR);
};

export const isSameDateRange = (
  a: DateRange | null,
  b: DateRange | null,
): boolean => {
  return (
    a?.startsAt.getTime() === b?.startsAt.getTime() &&
    a?.endsAt.getTime() === b?.endsAt.getTime()
  );
};

export const parseRangeText = (
  text: string,
  format: string,
): DateRange | null => {
  const [startText, endText] = text.split(RANGE_SEPARATOR);
  if (!startText || !endText) return null;

  const startsAt = DateTime.fromFormat(startText, format);
  const endsAt = DateTime.fromFormat(endText, format);

  if (!startsAt.isValid || !endsAt.isValid) return null;
  if (startsAt > endsAt) return null;

  return { startsAt: startsAt.toJSDate(), endsAt: endsAt.toJSDate() };
};
