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
  const user = await getCurrentUserFromServer();
  const { page = '1' } = await searchParams;
  const schedules = await getSchedulesFromServer(page);
  const t = await getTranslations('SchedulesPage');

  return (
    <AppShell title={t('title')} user={user}>
      <Schedules schedules={schedules} />
    </AppShell>
  );
}
