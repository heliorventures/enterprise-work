import { Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api, { unwrap } from '../../api/client';
import { KpiCard } from '../../components/dashboard/KpiCard';
import { DashboardFilters } from './ExecutiveDashboard';
import { StatusChip, WorkloadChip, fullName } from '../../components/common/StatusChips';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { timeGreeting } from '../../utils/greeting';

export function ManagerDashboard() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const query = Object.fromEntries(params.entries());
  const { data } = useQuery({
    queryKey: ['dashboard', 'manager', query],
    queryFn: async () => unwrap<any>(await api.get('/dashboard/manager', { params: query }).then((r) => r.data)),
  });

  return (
    <>
      <PageHeader
        eyebrow="Team"
        title={`${timeGreeting()}, ${user?.firstName ?? 'there'}`}
        subtitle="See who is loaded, what needs a review, and what changed recently."
      />
      <DashboardFilters />
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          ['Team size', data?.kpis.teamSize, '/resources'],
          ['Active work', data?.kpis.activeWork, '/work'],
          ['Completed', data?.kpis.completed, '/work?status=COMPLETED'],
          ['Overdue', data?.kpis.overdue, '/work?overdue=true'],
          ['Blocked', data?.kpis.blocked, '/work?blocked=true'],
          ['Avg completion (days)', data?.kpis.averageCompletionDays, '/reports'],
        ].map(([label, value, path]) => (
          <Grid item xs={12} sm={6} md={2} key={String(label)}>
            <KpiCard label={String(label)} value={(value as number) ?? '—'} onClick={() => nav(String(path))} />
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Team workload</Typography>
              {(data?.workload ?? []).map((w: any) => (
                <Stack
                  key={w.id}
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  sx={{ py: 1, cursor: 'pointer' }}
                  onClick={() => nav(`/resources/${w.id}`)}
                >
                  <Typography sx={{ flex: 1 }}>{w.employee}</Typography>
                  <Typography variant="body2">{w.active} active</Typography>
                  <WorkloadChip level={w.workload} />
                </Stack>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Pending reviews</Typography>
              {(data?.pendingReviews ?? []).length === 0 && (
                <EmptyState compact title="No reviews waiting" description="Your team has nothing sitting in review." />
              )}
              {(data?.pendingReviews ?? []).map((w: any) => (
                <Stack
                  key={w.id}
                  direction="row"
                  sx={{ py: 1, cursor: 'pointer' }}
                  onClick={() => nav(`/work/${w.id}`)}
                >
                  <Typography sx={{ flex: 1 }}>{w.title}</Typography>
                  <StatusChip status={w.status} />
                </Stack>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6">Recent activity</Typography>
              {(data?.recentActivity ?? []).map((a: any) => (
                <Typography key={a.id} variant="body2" sx={{ py: 0.5 }}>
                  {fullName(a.performedBy)} · {a.action.replaceAll('_', ' ')} ·{' '}
                  {formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}
                </Typography>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
