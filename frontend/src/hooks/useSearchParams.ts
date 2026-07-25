import 'client-only';
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsStringEnum,
  useQueryState,
} from 'nuqs';
import { Schedule } from '@/lib/api/types';

export const usePage = () =>
  useQueryState('page', parseAsInteger.withDefault(1));

export const scheduleStatuses: Schedule['status'][] = [
  'DRAFT',
  'IN_REVIEW',
  'AWAITING_APPROVAL',
  'APPROVED',
  'REJECTED',
];

export const useStatusFilter = () =>
  useQueryState('status', parseAsStringEnum(scheduleStatuses));

export const useMineFilter = () =>
  useQueryState('mine', parseAsBoolean.withDefault(false));
