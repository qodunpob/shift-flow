import 'client-only';
import { parseAsInteger, useQueryState } from 'nuqs';

export const usePage = () =>
  useQueryState('page', parseAsInteger.withDefault(1));
