import { Box, Stack, Typography } from '@mui/material';
import { ReactNode } from 'react';

const highlights = [
  { title: 'See the work', body: 'Who is doing what, in which vertical, and whether it is on track.' },
  { title: 'Follow the process', body: 'Leads, projects, tenders and reviews stay in one shared flow.' },
  { title: 'Close the outcome', body: 'Documents, blockers and results stay attached to the work.' },
];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(320px, 1.05fr) minmax(360px, 1fr)' },
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: { md: 6, lg: 8 },
          color: '#F8F4EC',
          position: 'relative',
          overflow: 'hidden',
          background:
            'radial-gradient(circle at 12% 18%, rgba(232,176,86,0.28), transparent 36%), radial-gradient(circle at 88% 82%, rgba(94,180,168,0.22), transparent 32%), linear-gradient(165deg, #10263F 0%, #1B3F6B 55%, #0F2A44 100%)',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              bgcolor: '#E8B056',
              color: '#10263F',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
              fontSize: 18,
            }}
          >
            S
          </Box>
          <Box>
            <Typography fontWeight={700}>Solvian Group</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Digital Command Centre
            </Typography>
          </Box>
        </Stack>
        <Box sx={{ maxWidth: 460 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, letterSpacing: '-0.03em', mb: 1.5, lineHeight: 1.15 }}>
            Work you can see. Outcomes you can trust.
          </Typography>
          <Typography sx={{ opacity: 0.82, mb: 4, lineHeight: 1.6 }}>
            One place for leads, projects, teams and documents across all nine verticals.
          </Typography>
          <Stack spacing={2}>
            {highlights.map((item) => (
              <Box key={item.title}>
                <Typography fontWeight={700}>{item.title}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.25 }}>
                  {item.body}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
        <Typography variant="caption" sx={{ opacity: 0.55 }}>
          Internal use · Solvian Group
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'grid',
          placeItems: 'center',
          px: 2,
          py: { xs: 4, md: 6 },
          bgcolor: 'background.default',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 440 }}>{children}</Box>
      </Box>
    </Box>
  );
}
