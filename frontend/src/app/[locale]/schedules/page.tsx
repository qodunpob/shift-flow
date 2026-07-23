import { Container, Typography } from '@mui/material';
import { getTranslations } from 'next-intl/server';
import { getCurrentUserFromServer } from '@/lib/api/users';
import { AppShell } from '@/components/app-shell/AppShell';

export default async function SchedulesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getCurrentUserFromServer();
  const { page = '1' } = await searchParams;
  const t = await getTranslations('SchedulesPage');

  return (
    <AppShell title={t('title')} user={user}>
      <Container sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1">
          {t('title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('page', { page })}
        </Typography>
      </Container>
    </AppShell>
  );
}
