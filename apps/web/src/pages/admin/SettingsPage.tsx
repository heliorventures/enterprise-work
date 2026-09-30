import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { enqueueSnackbar } from 'notistack';
import api, { unwrap } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { PageHeader } from '../../components/layout/PageHeader';

export function SettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => unwrap<any[]>(await api.get('/settings').then((r) => r.data)),
  });
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const save = useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => api.put('/settings', { key, value }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
  return (
    <Box maxWidth={640}>
      <PageHeader eyebrow="Admin" title="Settings" subtitle="Company defaults and your password." />
      <Typography variant="h6">Company</Typography>
      {(data ?? []).map((s: any) => (
        <TextField
          key={s.key}
          fullWidth
          sx={{ mt: 2 }}
          label={s.key}
          defaultValue={typeof s.value === 'string' ? s.value : JSON.stringify(s.value)}
          onBlur={(e) => save.mutate({ key: s.key, value: e.target.value })}
        />
      ))}
      <Typography variant="h6" sx={{ mt: 4 }}>
        Change password
      </Typography>
      <Stack spacing={2} sx={{ mt: 1 }}>
        <TextField label="Current password" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        <TextField label="New password" type="password" value={next} onChange={(e) => setNext(e.target.value)} />
        <Button
          variant="contained"
          onClick={async () => {
            await api.post('/auth/change-password', { currentPassword: current, newPassword: next });
            enqueueSnackbar('Password updated', { variant: 'success' });
          }}
        >
          Update password
        </Button>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
        Signed in as {user?.email}
      </Typography>
    </Box>
  );
}
