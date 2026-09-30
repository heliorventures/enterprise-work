import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { enqueueSnackbar } from 'notistack';
import api, { unwrap } from '../../api/client';
import { WorkItem } from '../../types/models';
import { OutcomeChip, PriorityChip, StatusChip, fullName } from '../../components/common/StatusChips';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/SocketProvider';
import { NewTaskDialog } from '../../components/work/QuickCreate';

export function WorkDetailPage() {
  const { id } = useParams();
  const { has } = useAuth();
  const qc = useQueryClient();
  const socket = useSocket();
  const [tab, setTab] = useState(0);
  const [taskOpen, setTaskOpen] = useState(false);
  const { data: work } = useQuery({
    queryKey: ['work-items', id],
    queryFn: async () => unwrap<WorkItem>(await api.get(`/work-items/${id}`).then((r) => r.data)),
  });

  useEffect(() => {
    if (!id || !socket) return;
    socket.emit('work.subscribe', id);
    return () => {
      socket.emit('work.unsubscribe', id);
    };
  }, [id, socket]);

  const patch = useMutation({
    mutationFn: (body: object) => api.put(`/work-items/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-items', id] });
      enqueueSnackbar('Updated', { variant: 'success' });
    },
  });

  if (!work) return <Typography>Loading…</Typography>;

  return (
    <Box>
      <Typography variant="overline" color="text.secondary">
        {work.process?.name}
      </Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ flex: 1 }}>
          {work.title}
        </Typography>
        <StatusChip status={work.status} />
        <PriorityChip priority={work.priority} />
        {work.dueDate && (
          <Typography color="text.secondary">Due {format(new Date(work.dueDate), 'MMM d')}</Typography>
        )}
        {has('TASK_CREATE') && (
          <Button variant="contained" onClick={() => setTaskOpen(true)}>
            New task
          </Button>
        )}
      </Stack>
      {has('WORK_UPDATE') && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
          <TextField select size="small" label="Status" value={work.status} onChange={(e) => patch.mutate({ status: e.target.value })} sx={{ minWidth: 160 }}>
            {['NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'BLOCKED', 'IN_REVIEW', 'COMPLETED', 'CANCELLED'].map((s) => (
              <MenuItem key={s} value={s}>
                {s.replaceAll('_', ' ')}
              </MenuItem>
            ))}
          </TextField>
          <TextField select size="small" label="Priority" value={work.priority} onChange={(e) => patch.mutate({ priority: e.target.value })} sx={{ minWidth: 140 }}>
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            type="date"
            label="Due date"
            InputLabelProps={{ shrink: true }}
            defaultValue={work.dueDate ? format(new Date(work.dueDate), 'yyyy-MM-dd') : ''}
            onBlur={(e) => e.target.value && patch.mutate({ dueDate: e.target.value })}
          />
          <AssignControl work={work} onAssign={(assignedToId) => patch.mutate({ assignedToId })} />
        </Stack>
      )}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ mb: 2 }}>
        <Tab label="Overview" />
        <Tab label="Tasks" />
        <Tab label="Documents" />
        <Tab label="Outcome" />
        <Tab label="Comments" />
        <Tab label="Activity" />
      </Tabs>
      {tab === 0 && <Overview work={work} />}
      {tab === 1 && <TasksTab work={work} />}
      {tab === 2 && <DocumentsTab work={work} />}
      {tab === 3 && <OutcomeTab work={work} />}
      {tab === 4 && <CommentsTab work={work} />}
      {tab === 5 && <ActivityTab work={work} />}
      <NewTaskDialog open={taskOpen} onClose={() => setTaskOpen(false)} workItemId={work.id} />
    </Box>
  );
}

function AssignControl({ work, onAssign }: { work: WorkItem; onAssign: (id: string) => void }) {
  const { data } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () => unwrap<{ items: any[] }>(await api.get('/users', { params: { pageSize: 100 } }).then((r) => r.data)),
  });
  return (
    <TextField
      select
      size="small"
      label="Assign"
      value={work.assignedTo?.id ?? ''}
      onChange={(e) => onAssign(e.target.value)}
      sx={{ minWidth: 180 }}
    >
      {(data?.items ?? []).map((u: any) => (
        <MenuItem key={u.id} value={u.id}>
          {u.firstName} {u.lastName}
        </MenuItem>
      ))}
    </TextField>
  );
}

function Overview({ work }: { work: WorkItem }) {
  const rows = [
    ['Process', work.process?.name],
    ['Department', work.department?.name],
    ['Team', work.team?.name],
    ['Assigned to', fullName(work.assignedTo)],
    ['Manager', fullName(work.manager)],
    ['Created by', fullName(work.createdBy)],
    ['Start', work.startDate ? format(new Date(work.startDate), 'PP') : '—'],
    ['Due', work.dueDate ? format(new Date(work.dueDate), 'PP') : '—'],
  ];
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6">Description</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {work.description || 'No description'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            {rows.map(([k, v]) => (
              <Stack key={k} sx={{ py: 0.75 }}>
                <Typography variant="caption" color="text.secondary">
                  {k}
                </Typography>
                <Typography>{v || '—'}</Typography>
              </Stack>
            ))}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

function TasksTab({ work }: { work: WorkItem }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [parent, setParent] = useState('');
  const create = useMutation({
    mutationFn: () => api.post('/tasks', { workItemId: work.id, title, parentTaskId: parent || undefined }),
    onSuccess: () => {
      setTitle('');
      qc.invalidateQueries({ queryKey: ['work-items', work.id] });
    },
  });
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.put(`/tasks/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['work-items', work.id] }),
  });
  const roots = (work.tasks ?? []).filter((t) => !t.parentTaskId);
  const children = (parentId: string) => (work.tasks ?? []).filter((t) => t.parentTaskId === parentId);
  return (
    <Card>
      <CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
          <TextField size="small" label="New task" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth />
          <TextField size="small" select label="Subtask of" value={parent} onChange={(e) => setParent(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="">None</MenuItem>
            {roots.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.title}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" onClick={() => title && create.mutate()}>
            Add
          </Button>
        </Stack>
        {roots.map((t) => (
          <Box key={t.id} sx={{ py: 1 }}>
            <TaskRow task={t} onStatus={(status) => update.mutate({ id: t.id, status })} />
            {children(t.id).map((c) => (
              <Box key={c.id} sx={{ pl: 4 }}>
                <TaskRow task={c} onStatus={(status) => update.mutate({ id: c.id, status })} />
              </Box>
            ))}
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}

function TaskRow({ task, onStatus }: { task: NonNullable<WorkItem['tasks']>[number]; onStatus: (s: string) => void }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
      <Typography sx={{ flex: 1 }}>{task.title}</Typography>
      <Typography variant="body2" color="text.secondary">
        {fullName(task.assignedTo)}
      </Typography>
      <PriorityChip priority={task.priority} />
      <TextField select size="small" value={task.status} onChange={(e) => onStatus(e.target.value)} sx={{ minWidth: 150 }}>
        {['NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'BLOCKED', 'IN_REVIEW', 'COMPLETED', 'CANCELLED'].map((s) => (
          <MenuItem key={s} value={s}>
            {s.replaceAll('_', ' ')}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  );
}

function DocumentsTab({ work }: { work: WorkItem }) {
  const qc = useQueryClient();
  const [drag, setDrag] = useState(false);
  const upload = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    await api.post(`/work-items/${work.id}/documents`, fd);
    qc.invalidateQueries({ queryKey: ['work-items', work.id] });
    enqueueSnackbar('Document uploaded', { variant: 'success' });
  };
  return (
    <Card>
      <CardContent>
        <Box
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files[0];
            if (f) upload(f);
          }}
          sx={{
            p: 3,
            mb: 2,
            borderRadius: 2,
            border: '1px dashed',
            borderColor: drag ? 'primary.main' : 'divider',
            textAlign: 'center',
          }}
        >
          <Typography>Drag and drop files, or</Typography>
          <Button component="label" sx={{ mt: 1 }}>
            Browse
            <input
              hidden
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.png,.jpg,.jpeg,.txt"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
          </Button>
        </Box>
        {(work.documents ?? []).map((d) => (
          <Stack key={d.id} direction="row" spacing={2} sx={{ py: 1 }} alignItems="center">
            <Typography sx={{ flex: 1 }}>{d.fileName}</Typography>
            <Typography variant="caption">{d.fileType}</Typography>
            <Typography variant="caption">v{d.version}</Typography>
            <Typography variant="caption">{fullName(d.uploadedBy)}</Typography>
            <Typography variant="caption">{format(new Date(d.uploadedAt), 'PP')}</Typography>
            <Button
              size="small"
              onClick={async () => {
                const res = await api.get(`/documents/${d.id}/download`, { responseType: 'blob' });
                const url = URL.createObjectURL(res.data);
                const a = document.createElement('a');
                a.href = url;
                a.download = d.fileName;
                a.click();
              }}
            >
              Download
            </Button>
          </Stack>
        ))}
      </CardContent>
    </Card>
  );
}

function OutcomeTab({ work }: { work: WorkItem }) {
  const { has } = useAuth();
  const qc = useQueryClient();
  const [actual, setActual] = useState(work.outcome?.actual ?? '');
  const [status, setStatus] = useState(work.outcome?.status ?? 'PENDING');
  const save = useMutation({
    mutationFn: () => api.put(`/work-items/${work.id}/outcome`, { actual, status, expected: work.expectedOutcome }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-items', work.id] });
      enqueueSnackbar('Outcome updated', { variant: 'success' });
    },
  });
  return (
    <Card>
      <CardContent>
        <Typography variant="overline">Expected outcome</Typography>
        <Typography sx={{ mb: 2 }}>{work.expectedOutcome || work.outcome?.expected || '—'}</Typography>
        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Actual outcome"
          value={actual}
          onChange={(e) => setActual(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField select label="Outcome status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ mb: 2, minWidth: 240 }}>
          {['PENDING', 'ACHIEVED', 'PARTIALLY_ACHIEVED', 'NOT_ACHIEVED'].map((s) => (
            <MenuItem key={s} value={s}>
              {s.replaceAll('_', ' ')}
            </MenuItem>
          ))}
        </TextField>
        {(has('OUTCOME_CREATE') || has('OUTCOME_REVIEW')) && (
          <Button variant="contained" onClick={() => save.mutate()}>
            Save outcome
          </Button>
        )}
        <Box sx={{ mt: 2 }}>
          <OutcomeChip status={work.outcome?.status} />
        </Box>
      </CardContent>
    </Card>
  );
}

function CommentsTab({ work }: { work: WorkItem }) {
  const qc = useQueryClient();
  const [message, setMessage] = useState('');
  const send = useMutation({
    mutationFn: () => api.post(`/work-items/${work.id}/comments`, { message }),
    onSuccess: () => {
      setMessage('');
      qc.invalidateQueries({ queryKey: ['work-items', work.id] });
    },
  });
  return (
    <Card>
      <CardContent>
        {(work.comments ?? []).map((c) => (
          <Box key={c.id} sx={{ py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2">{fullName(c.user)}</Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
            </Typography>
            <Typography sx={{ mt: 0.5 }}>{c.message}</Typography>
          </Box>
        ))}
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <TextField fullWidth label="Comment" value={message} onChange={(e) => setMessage(e.target.value)} />
          <Button variant="contained" onClick={() => message && send.mutate()}>
            Post
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ActivityTab({ work }: { work: WorkItem }) {
  const groups = (work.activity ?? []).map((a) => {
    const d = new Date(a.timestamp);
    const heading = isToday(d) ? format(d, 'h:mm a') : isYesterday(d) ? 'Yesterday' : format(d, 'PP');
    return { ...a, heading };
  });
  return (
    <Card>
      <CardContent>
        {groups.map((a) => (
          <Box key={a.id} sx={{ py: 1.25, borderLeft: 2, borderColor: 'divider', pl: 2, mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {a.heading}
            </Typography>
            <Typography>
              {fullName(a.performedBy)} {labelAction(a.action)}
            </Typography>
            {!!a.oldValue && !!a.newValue && (
              <Typography variant="body2" color="text.secondary">
                {JSON.stringify(a.oldValue)} → {JSON.stringify(a.newValue)}
              </Typography>
            )}
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}

function labelAction(action: string) {
  const map: Record<string, string> = {
    STATUS_CHANGED: 'changed status',
    WORK_CREATED: 'created this work',
    USER_ASSIGNED: 'assigned this work',
    DOCUMENT_UPLOADED: 'uploaded a document',
    COMMENT_ADDED: 'added a comment',
    OUTCOME_UPDATED: 'updated the outcome',
    WORK_COMPLETED: 'completed this work',
    PRIORITY_CHANGED: 'changed priority',
    DUE_DATE_CHANGED: 'changed the due date',
    TASK_STATUS_CHANGED: 'updated a task',
    TASK_CREATED: 'created a task',
  };
  return map[action] ?? action.replaceAll('_', ' ').toLowerCase();
}
