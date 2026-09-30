import { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import api, { unwrap } from '../../api/client';
import { KpiCard } from '../../components/dashboard/KpiCard';
import { OutcomeChip, PriorityChip, StatusChip, WorkloadChip, fullName } from '../../components/common/StatusChips';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { timeGreeting } from '../../utils/greeting';
import { startOfMonth, subMonths } from 'date-fns';

const COLORS = ['#64748b', '#2563eb', '#dc2626', '#7c3aed', '#059669', '#d97706', '#6b7280'];

export function DashboardFilters({ extra }: { extra?: React.ReactNode }) {
  const [params, setParams] = useSearchParams();
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => unwrap<any[]>(await api.get('/departments').then((r) => r.data)),
  });
  const { data: processes } = useQuery({
    queryKey: ['processes'],
    queryFn: async () => unwrap<any[]>(await api.get('/processes').then((r) => r.data)),
  });
  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next);
  };
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 3 }} flexWrap="wrap">
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Date</InputLabel>
        <Select
          label="Date"
          value={params.get('range') ?? 'month'}
          onChange={(e) => {
            const v = e.target.value;
            set('range', v);
            const now = new Date();
            if (v === 'month') {
              set('from', startOfMonth(now).toISOString());
            } else if (v === 'quarter') {
              set('from', subMonths(now, 3).toISOString());
            } else {
              const n = new URLSearchParams(params);
              n.delete('from');
              n.set('range', 'all');
              setParams(n);
            }
          }}
        >
          <MenuItem value="month">This month</MenuItem>
          <MenuItem value="quarter">Last 90 days</MenuItem>
          <MenuItem value="all">All time</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Department</InputLabel>
        <Select
          label="Department"
          value={params.get('departmentId') ?? ''}
          onChange={(e) => set('departmentId', e.target.value)}
        >
          <MenuItem value="">All departments</MenuItem>
          {(departments ?? []).map((d: any) => (
            <MenuItem key={d.id} value={d.id}>
              {d.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Process</InputLabel>
        <Select label="Process" value={params.get('processId') ?? ''} onChange={(e) => set('processId', e.target.value)}>
          <MenuItem value="">All processes</MenuItem>
          {(processes ?? []).map((p: any) => (
            <MenuItem key={p.id} value={p.id}>
              {p.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {extra}
    </Stack>
  );
}

export function ExecutiveDashboard() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const query = Object.fromEntries(params.entries());
  const { data } = useQuery({
    queryKey: ['dashboard', 'executive', query],
    queryFn: async () => unwrap<any>(await api.get('/dashboard/executive', { params: query }).then((r) => r.data)),
  });
  const pie = useMemo(
    () =>
      Object.entries(data?.statusCounts ?? {}).map(([name, value]) => ({
        name: name.replaceAll('_', ' '),
        value,
      })),
    [data],
  );

  return (
    <Box>
      <PageHeader
        eyebrow="Overview"
        title={`${timeGreeting()}, ${user?.firstName ?? 'there'}`}
        subtitle="A quick view of group work, people and outcomes. Tap a number to open the list."
      />
      <DashboardFilters />
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <KpiCard label="Active work" value={data?.kpis.activeWork ?? '—'} delta={data?.kpis.activeDelta} onClick={() => nav('/work')} icon={<AssignmentRoundedIcon fontSize="small" />} />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <KpiCard label="Completed" value={data?.kpis.completed ?? '—'} tone="success" onClick={() => nav('/work?status=COMPLETED')} icon={<CheckCircleRoundedIcon fontSize="small" />} />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <KpiCard label="Overdue" value={data?.kpis.overdue ?? '—'} tone="danger" hint="Needs attention" onClick={() => nav('/work?overdue=true')} icon={<WarningAmberRoundedIcon fontSize="small" />} />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <KpiCard label="Blocked" value={data?.kpis.blocked ?? '—'} tone="warning" onClick={() => nav('/work?blocked=true')} icon={<BlockRoundedIcon fontSize="small" />} />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <KpiCard label="People" value={data?.kpis.resources ?? '—'} tone="info" onClick={() => nav('/resources')} icon={<GroupsRoundedIcon fontSize="small" />} />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <KpiCard label="Outcomes won" value={data?.kpis.outcomesAchieved ?? '—'} tone="success" onClick={() => nav('/work?outcome=ACHIEVED')} icon={<EmojiEventsRoundedIcon fontSize="small" />} />
        </Grid>
      </Grid>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Company work status
              </Typography>
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} onClick={() => nav('/work')}>
                      {pie.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Work by department
              </Typography>
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={data?.workByDepartment ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1B3F6B" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Work by process
              </Typography>
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={data?.workByProcess ?? []} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={160} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0F8A6A" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Resource workload
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell>Completed</TableCell>
                    <TableCell>Overdue</TableCell>
                    <TableCell>Workload</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data?.workload ?? []).map((r: any) => (
                    <TableRow key={r.id} hover sx={{ cursor: 'pointer' }} onClick={() => nav(`/resources/${r.id}`)}>
                      <TableCell>{r.employee}</TableCell>
                      <TableCell>{r.department}</TableCell>
                      <TableCell>{r.active}</TableCell>
                      <TableCell>{r.completed}</TableCell>
                      <TableCell>{r.overdue}</TableCell>
                      <TableCell>
                        <WorkloadChip level={r.workload} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={5}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Outcome performance
              </Typography>
              {Object.entries(data?.outcomePerformance ?? {}).map(([k, v]) => (
                <Stack key={k} direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                  <OutcomeChip status={k} />
                  <Typography>{v as number}</Typography>
                </Stack>
              ))}
            </CardContent>
          </Card>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 0.5 }}>
                Overdue work
              </Typography>
              {(data?.overdueItems ?? []).length === 0 ? (
                <EmptyState compact title="Nothing overdue" description="Every live item is still within its date." />
              ) : (
                (data?.overdueItems ?? []).map((w: any) => (
                  <Stack
                    key={w.id}
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ py: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover', mx: -1, px: 1, borderRadius: 2 } }}
                    onClick={() => nav(`/work/${w.id}`)}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography noWrap fontWeight={600}>
                        {w.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {fullName(w.assignedTo)}
                      </Typography>
                    </Box>
                    <PriorityChip priority={w.priority} />
                  </Stack>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 0.5 }}>
                Blocked work
              </Typography>
              {(data?.blockedItems ?? []).length === 0 ? (
                <EmptyState compact title="No blockers" description="Nothing is waiting on another team." />
              ) : (
                (data?.blockedItems ?? []).map((w: any) => (
                  <Stack
                    key={w.id}
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ py: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover', mx: -1, px: 1, borderRadius: 2 } }}
                    onClick={() => nav(`/work/${w.id}`)}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography noWrap fontWeight={600}>
                        {w.title}
                      </Typography>
                    </Box>
                    <StatusChip status={w.status} />
                  </Stack>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
