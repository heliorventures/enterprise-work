import { Box, Button, List, ListItemButton, ListItemText } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api, { unwrap } from '../../api/client';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';

export function NotificationsPage() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => unwrap<any[]>(await api.get('/notifications').then((r) => r.data)),
  });
  const markAll = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  return (
    <Box>
      <PageHeader
        eyebrow="Insights"
        title="Alerts"
        subtitle="Overdue work, reviews and assignments that need your eye."
        action={
          <Button variant="outlined" onClick={() => markAll.mutate()}>
            Mark all read
          </Button>
        }
      />
      {(data ?? []).length === 0 && <EmptyState title="You're all caught up" description="No alerts right now." />}
      <List>
        {(data ?? []).map((n) => (
          <ListItemButton key={n.id} selected={!n.read} onClick={() => n.workItem && nav(`/work/${n.workItem.id}`)}>
            <ListItemText
              primary={n.title}
              secondary={`${n.message} · ${formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}`}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
