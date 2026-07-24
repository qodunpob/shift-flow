import { getTranslations } from 'next-intl/server';
import { getCurrentUserFromServer } from '@/lib/api/users';
import { AppShell } from '@/components/app-shell/AppShell';
import { getSchedulesFromServer } from '@/features/schedules/api';
import { Schedules } from '@/features/schedules/Schedules';

export default async function SchedulesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam = '1' } = await searchParams;
  const page = Number(pageParam);
  const [user, schedules] = await Promise.all([
    getCurrentUserFromServer(),
    getSchedulesFromServer(page),
  ]);
  const t = await getTranslations('SchedulesPage');

  return (
    <AppShell title={t('title')} user={user}>
      <Schedules schedules={schedules} page={page} />
    </AppShell>
  );
}
