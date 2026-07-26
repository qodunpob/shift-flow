import { DateTime } from 'luxon';

export const startOfDayWithTz = (date: Date, timeZone: string): Date =>
  DateTime.fromJSDate(date).setZone(timeZone).startOf('day').toUTC().toJSDate();

export const endOfDayWithTz = (date: Date, timeZone: string): Date =>
  DateTime.fromJSDate(date).setZone(timeZone).endOf('day').toUTC().toJSDate();
