import { Card, CardContent, TextField, Typography } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import api, { unwrap } from '../../api/client';
import { WorkloadChip } from '../../components/common/StatusChips';
import { KpiCard } from '../../components/dashboard/KpiCard';
import { PageHeader } from '../../components/layout/PageHeader';
import { Box, Grid, Stack } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { useParams } from 'react-router-dom';
import { StatusChip } from '../../components/common/StatusChips';

export function ResourcesPage() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const { data } = useQuery({
    queryKey: ['dashboard', 'resources'],
    queryFn: async () => unwrap<any[]>(await api.get('/dashboard/resources').then((r) => r.data)),
  });
  const rows = (data ?? []).filter((r) => r.employee.toLowerCase().includes(q.toLowerCase()));
  const columns: GridColDef[] = useMemo(
    () => [
      { field: 'employee', headerName: 'Employee', flex: 1, minWidth: 160 },
      { field: 'department', headerName: 'Department', width: 160 },
      { field: 'team', headerName: 'Team', width: 160 },
      { field: 'active', headerName: 'Active', width: 100 },
      { field: 'completed', headerName: 'Completed', width: 110 },
      { field: 'overdue', headerName: 'Overdue', width: 100 },
      { field: 'highPriority', headerName: 'High priority', width: 130 },
      {
        field: 'workload',
        headerName: 'Workload',
        width: 130,
        renderCell: (p) => <WorkloadChip level={p.value} />,
      },
    ],
    [],
  );
  return (
    <Box>
      <PageHeader
        eyebrow="People"
        title="People"
        subtitle="Who is loaded, who is blocked, and who still has capacity."
      />
      <TextField size="small" placeholder="Search employees" value={q} onChange={(e) => setQ(e.target.value)} sx={{ mb: 2 }} />
      <Box sx={{ height: 640 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          disableRowSelectionOnClick
          onRowClick={(p) => nav(`/resources/${p.id}`)}
        />
      </Box>
    </Box>
  );
}

export function EmployeeProfilePage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data } = useQuery({
    queryKey: ['dashboard', 'employee-profile', id],
    queryFn: async () => unwrap<any>(await api.get(`/dashboard/employees/${id}`).then((r) => r.data)),
  });
  if (!data?.person) return null;
  const p = data.person;
  return (
    <Box>
      <Typography variant="h4">
        {p.firstName} {p.lastName}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {p.role?.name.replaceAll('_', ' ')} · {p.department?.name} · {p.team?.name}
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}>
          <KpiCard label="Active" value={data.active.length} onClick={() => nav(`/work?employeeId=${id}`)} />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard label="Completed" value={data.completed.length} />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard label="Overdue" value={data.overdue.length} />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard label="Upcoming" value={data.upcoming.length} />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6">Active work</Typography>
              {data.active.map((w: any) => (
                <Stack key={w.id} direction="row" sx={{ py: 1, cursor: 'pointer' }} onClick={() => nav(`/work/${w.id}`)}>
                  <Typography sx={{ flex: 1 }}>{w.title}</Typography>
                  <StatusChip status={w.status} />
                </Stack>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6">Outcome performance</Typography>
              {Object.entries(data.outcomes ?? {}).map(([k, v]) => (
                <Typography key={k}>
                  {k.replaceAll('_', ' ')}: {v as number}
                </Typography>
              ))}
              <Typography variant="h6" sx={{ mt: 2 }}>
                Recent activity
              </Typography>
              {(data.activity ?? []).map((a: any) => (
                <Typography key={a.id} variant="body2">
                  {a.action.replaceAll('_', ' ')} · {formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}
                </Typography>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
