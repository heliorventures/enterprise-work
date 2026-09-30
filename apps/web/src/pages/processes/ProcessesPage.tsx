import { Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Grid, TextField, Typography } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api, { unwrap } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { KpiCard } from '../../components/dashboard/KpiCard';
import { PageHeader } from '../../components/layout/PageHeader';

export function ProcessesPage() {
  const nav = useNavigate();
  const { has } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['processes'],
    queryFn: async () => unwrap<any[]>(await api.get('/processes').then((r) => r.data)),
  });
  const [search] = useSearchParams();
  const [open, setOpen] = useState(search.get('new') === '1');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  useEffect(() => {
    if (search.get('new') === '1') setOpen(true);
  }, [search]);
  const create = useMutation({
    mutationFn: () => api.post('/processes', { name, description, active: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['processes'] });
      setOpen(false);
    },
  });
  return (
    <Box>
      <PageHeader
        eyebrow="Work"
        title="Processes"
        subtitle="Shared flows for leads, projects, tenders and reviews — not a static task list."
        action={
          has('PROCESS_CREATE') ? (
            <Button variant="contained" onClick={() => setOpen(true)}>
              New process
            </Button>
          ) : undefined
        }
      />
      <Grid container spacing={2}>
        {(data ?? []).map((p: any) => (
          <Grid item xs={12} md={6} lg={4} key={p.id}>
            <Card sx={{ cursor: 'pointer', height: '100%' }} onClick={() => nav(`/processes/${p.id}`)}>
              <CardContent>
                <Typography variant="h6">{p.name}</Typography>
                <Typography color="text.secondary" sx={{ mb: 1 }}>
                  {p.description}
                </Typography>
                <Typography variant="caption">
                  {p.department?.name ?? 'Company-wide'} · {p._count?.workItems ?? 0} work items
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>Create process</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Name" sx={{ mt: 1 }} value={name} onChange={(e) => setName(e.target.value)} />
          <TextField fullWidth label="Description" sx={{ mt: 2 }} value={description} onChange={(e) => setDescription(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => create.mutate()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export function ProcessDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data } = useQuery({
    queryKey: ['processes', id, 'analytics'],
    queryFn: async () => unwrap<any>(await api.get(`/processes/${id}/analytics`).then((r) => r.data)),
  });
  if (!data) return null;
  return (
    <Box>
      <Typography variant="h4">{data.process.name}</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {data.process.description}
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={2}>
          <KpiCard label="Total" value={data.total} onClick={() => nav(`/work?processId=${id}`)} />
        </Grid>
        <Grid item xs={6} md={2}>
          <KpiCard label="Completed" value={data.completed} />
        </Grid>
        <Grid item xs={6} md={2}>
          <KpiCard label="In progress" value={data.inProgress} />
        </Grid>
        <Grid item xs={6} md={2}>
          <KpiCard label="Blocked" value={data.blocked} />
        </Grid>
        <Grid item xs={6} md={2}>
          <KpiCard label="Overdue" value={data.overdue} />
        </Grid>
        <Grid item xs={6} md={2}>
          <KpiCard label="Outcome rate" value={`${data.outcomeAchievementRate}%`} />
        </Grid>
      </Grid>
      <Card>
        <CardContent>
          <Typography>Average processing time: {data.averageProcessingDays} days</Typography>
          <Typography>Average completion time: {data.averageCompletionDays} days</Typography>
          <Typography>Bottleneck: {data.bottleneck}</Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
