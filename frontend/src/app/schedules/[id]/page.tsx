import { Container, Typography } from "@mui/material";

export default async function ScheduleDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1">
        Schedule {id}
      </Typography>
    </Container>
  );
}
