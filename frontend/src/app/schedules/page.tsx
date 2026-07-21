import { Container, Typography } from "@mui/material";

export default async function SchedulesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page = "1" } = await searchParams;

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1">
        Schedules
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Page {page}
      </Typography>
    </Container>
  );
}
