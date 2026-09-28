// app/admin/page.tsx
import { Box, Card, CardContent, Typography } from "@mui/material";

const stats = [
  { label: "Total Blogs", value: 12 },
  { label: "Published", value: 8 },
  { label: "Drafts", value: 4 },
];

export default function AdminOverview() {
  return (
    <>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Admin Dashboard
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
        }}
      >
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent>
              <Typography sx={{ color: "text.secondary" }}>{s.label}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {s.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </>
  );
}