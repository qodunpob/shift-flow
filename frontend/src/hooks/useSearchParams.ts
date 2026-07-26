import 'client-only';
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsStringEnum,
  useQueryState,
} from 'nuqs';
import { scheduleStatuses } from '@/constants/common';

export const usePage = () =>
  useQueryState('page', parseAsInteger.withDefault(1));

export const useStatusFilter = () =>
  useQueryState('status', parseAsStringEnum(scheduleStatuses));

export const useMineFilter = () =>
  useQueryState('mine', parseAsBoolean.withDefault(false));
