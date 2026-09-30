import { Box, Checkbox, FormControlLabel, Paper, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api, { unwrap } from '../../api/client';
import { PageHeader } from '../../components/layout/PageHeader';

export function RolesPage() {
  const qc = useQueryClient();
  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => unwrap<any[]>(await api.get('/roles').then((r) => r.data)),
  });
  const { data: permissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => unwrap<any[]>(await api.get('/permissions').then((r) => r.data)),
  });
  const save = useMutation({
    mutationFn: ({ id, permissionIds }: { id: string; permissionIds: string[] }) => api.put(`/roles/${id}`, { permissionIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
  return (
    <Box>
      <PageHeader eyebrow="Admin" title="Roles" subtitle="What each role can see and change." />
      <Stack spacing={2}>
        {(roles ?? []).map((role: any) => {
          const selected = new Set(role.permissions.map((p: any) => p.permissionId || p.permission?.id));
          return (
            <Paper key={role.id} variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6">{role.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {role.description} · {role._count?.users ?? 0} users
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 0.5 }}>
                {(permissions ?? []).map((p: any) => (
                  <FormControlLabel
                    key={p.id}
                    control={
                      <Checkbox
                        checked={selected.has(p.id)}
                        onChange={(e) => {
                          const next = new Set(selected);
                          if (e.target.checked) next.add(p.id);
                          else next.delete(p.id);
                          save.mutate({ id: role.id, permissionIds: [...next] as string[] });
                        }}
                      />
                    }
                    label={p.code}
                  />
                ))}
              </Box>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}
