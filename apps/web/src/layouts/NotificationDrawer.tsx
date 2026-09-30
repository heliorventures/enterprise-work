import {
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api, { unwrap } from '../api/client';

interface Note {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  workItem?: { id: string; title: string } | null;
}

export function NotificationDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const nav = useNavigate();
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => unwrap<Note[]>(await api.get('/notifications').then((r) => r.data)),
    enabled: open,
  });
  const mark = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markAll = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Stack sx={{ width: { xs: '100vw', sm: 400 }, p: 2 }} spacing={1}>
        <Stack direction="row" alignItems="center">
          <Typography variant="h6" sx={{ flex: 1 }}>
            Notifications
          </Typography>
          <Typography
            variant="caption"
            color="primary"
            sx={{ cursor: 'pointer', mr: 1 }}
            onClick={() => markAll.mutate()}
          >
            Mark all read
          </Typography>
          <IconButton onClick={onClose} aria-label="Close notifications">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
        <List>
          {(data ?? []).map((n) => (
            <ListItemButton
              key={n.id}
              selected={!n.read}
              onClick={() => {
                mark.mutate(n.id);
                if (n.workItem) nav(`/work/${n.workItem.id}`);
                onClose();
              }}
            >
              <ListItemText
                primary={n.title}
                secondary={`${n.message} · ${formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}`}
              />
            </ListItemButton>
          ))}
        </List>
      </Stack>
    </Drawer>
  );
}
