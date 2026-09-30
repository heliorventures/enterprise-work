import { useState } from 'react';
import {
  Button,
  ButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Menu,
  MenuItem,
  TextField,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowDropDownRoundedIcon from '@mui/icons-material/ArrowDropDownRounded';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';
import api, { unwrap } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { Paginated, WorkItem } from '../../types/models';

export function QuickCreate({ variant = 'contained' }: { variant?: 'contained' | 'outlined' }) {
  const { has, user } = useAuth();
  const nav = useNavigate();
  const [menuEl, setMenuEl] = useState<null | HTMLElement>(null);
  const [taskOpen, setTaskOpen] = useState(false);

  if (!has('WORK_CREATE') && !has('TASK_CREATE') && !has('PROCESS_CREATE')) return null;

  return (
    <>
      <ButtonGroup variant={variant} color="primary">
        <Button startIcon={<AddRoundedIcon />} onClick={() => nav('/work/new')} aria-label="New work item">
          New work
        </Button>
        <Button size="small" aria-label="More create actions" onClick={(e) => setMenuEl(e.currentTarget)}>
          <ArrowDropDownRoundedIcon />
        </Button>
      </ButtonGroup>
      <Menu anchorEl={menuEl} open={!!menuEl} onClose={() => setMenuEl(null)}>
        {has('WORK_CREATE') && (
          <MenuItem
            onClick={() => {
              setMenuEl(null);
              nav('/work/new');
            }}
          >
            New work item
          </MenuItem>
        )}
        {has('TASK_CREATE') && (
          <MenuItem
            onClick={() => {
              setMenuEl(null);
              setTaskOpen(true);
            }}
          >
            New task
          </MenuItem>
        )}
        {has('PROCESS_CREATE') && (
          <MenuItem
            onClick={() => {
              setMenuEl(null);
              nav('/processes?new=1');
            }}
          >
            New process
          </MenuItem>
        )}
      </Menu>
      <NewTaskDialog open={taskOpen} onClose={() => setTaskOpen(false)} defaultAssigneeId={user?.id} />
    </>
  );
}

export function NewTaskDialog({
  open,
  onClose,
  workItemId,
  defaultAssigneeId,
}: {
  open: boolean;
  onClose: () => void;
  workItemId?: string;
  defaultAssigneeId?: string;
}) {
  const qc = useQueryClient();
  const nav = useNavigate();
  const [title, setTitle] = useState('');
  const [selectedWork, setSelectedWork] = useState(workItemId ?? '');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  const { data: work } = useQuery({
    queryKey: ['work-items', 'picker'],
    queryFn: async () =>
      unwrap<Paginated<WorkItem>>(await api.get('/work-items', { params: { pageSize: 100, sortBy: 'updatedAt' } }).then((r) => r.data)),
    enabled: open && !workItemId,
  });

  const create = useMutation({
    mutationFn: () =>
      api.post('/tasks', {
        workItemId: selectedWork || workItemId,
        title,
        dueDate: dueDate || undefined,
        priority,
        assignedToId: defaultAssigneeId,
      }),
    onSuccess: () => {
      enqueueSnackbar('Task created', { variant: 'success' });
      qc.invalidateQueries({ queryKey: ['work-items'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      const id = selectedWork || workItemId;
      onClose();
      setTitle('');
      if (id) nav(`/work/${id}`);
    },
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>New task</DialogTitle>
      <DialogContent>
        {!workItemId && (
          <TextField
            select
            fullWidth
            required
            label="Work item"
            value={selectedWork}
            onChange={(e) => setSelectedWork(e.target.value)}
            sx={{ mt: 1 }}
            helperText="Tasks belong to a work item (the project of work)."
          >
            {(work?.items ?? []).map((w) => (
              <MenuItem key={w.id} value={w.id}>
                {w.title}
              </MenuItem>
            ))}
          </TextField>
        )}
        <TextField
          fullWidth
          required
          label="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mt: 2 }}
        />
        <TextField
          select
          fullWidth
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          sx={{ mt: 2 }}
        >
          {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => (
            <MenuItem key={p} value={p}>
              {p}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          fullWidth
          type="date"
          label="Due date"
          InputLabelProps={{ shrink: true }}
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!title.trim() || !(selectedWork || workItemId) || create.isPending}
          onClick={() => create.mutate()}
        >
          Add task
        </Button>
      </DialogActions>
    </Dialog>
  );
}
