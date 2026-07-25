import { getTranslations } from 'next-intl/server';
import { getCurrentUserFromServer } from '@/lib/api/server/users';
import { AppShell } from '@/components/app-shell/AppShell';
import { getSchedulesFromServer } from '@/features/schedules/api/server';
import { Schedules } from '@/features/schedules/Schedules';
import { Schedule } from '@/lib/api/types';

export default async function SchedulesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; mine?: string }>;
}) {
  const { page: pageParam = '1', status, mine: mineParam } = await searchParams;
  const page = Number(pageParam);
  const filter = {
    status: status as Schedule['status'] | undefined,
    mine: mineParam === 'true',
  };
  const [user, schedules] = await Promise.all([
    getCurrentUserFromServer(),
    getSchedulesFromServer(page, filter),
  ]);
  const t = await getTranslations('SchedulesPage');

  return (
    <AppShell title={t('title')} user={user}>
      <Schedules
        user={user}
        schedules={schedules}
        page={page}
        status={filter.status ?? null}
        mine={filter.mine}
      />
    </AppShell>
  );
}
