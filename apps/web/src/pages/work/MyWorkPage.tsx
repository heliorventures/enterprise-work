import { Box, Button, Card, CardContent, MenuItem, Select, Stack, Tab, Tabs, Typography } from '@mui/material';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import api, { unwrap } from '../../api/client';
import { WorkItem } from '../../types/models';
import { PriorityChip, StatusChip } from '../../components/common/StatusChips';
import { CSS } from '@dnd-kit/utilities';

const COLS = ['NOT_STARTED', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'COMPLETED'] as const;

export function MyWorkPage() {
  const { data } = useQuery({
    queryKey: ['dashboard', 'employee'],
    queryFn: async () => unwrap<any>(await api.get('/dashboard/employee').then((r) => r.data)),
  });
  const [tab, setTab] = useState(0);
  return (
    <Box>
      <PageHeader
        eyebrow="Personal"
        title="My work"
        subtitle="What is due today, what is coming next, and what is stuck — only items assigned to you."
      />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2.5 }}>
        <Tab label="List" />
        <Tab label="Kanban" />
        <Tab label="Calendar" />
      </Tabs>
      {tab === 0 && <ListSections data={data} />}
      {tab === 1 && <KanbanBoard items={data?.all ?? []} />}
      {tab === 2 && <CalendarView items={data?.all ?? []} />}
    </Box>
  );
}

function ListSections({ data }: { data: any }) {
  const sections = [
    ['Today', data?.today],
    ['Upcoming', data?.upcoming],
    ['Overdue', data?.overdue],
    ['Blocked', data?.blocked],
    ['Completed', data?.completed],
  ] as const;
  return (
    <Stack spacing={2}>
      {sections.map(([title, rows]) => (
        <Card key={title}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {title} ({rows?.length ?? 0})
            </Typography>
            {(rows ?? []).length === 0 ? (
              <EmptyState compact title="Nothing here" description="This list is clear for now." />
            ) : (
              (rows ?? []).map((w: WorkItem) => <WorkRow key={w.id} work={w} />)
            )}
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

function WorkRow({ work }: { work: WorkItem }) {
  const nav = useNavigate();
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: (status: string) => api.put(`/work-items/${work.id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['work-items'] });
    },
  });
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1}
      alignItems={{ sm: 'center' }}
      sx={{ py: 1.25, borderBottom: 1, borderColor: 'divider', '&:last-of-type': { borderBottom: 0 } }}
    >
      <Box sx={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => nav(`/work/${work.id}`)}>
        <Typography noWrap fontWeight={600}>
          {work.title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {work.process?.name} {work.dueDate ? `· due ${format(new Date(work.dueDate), 'MMM d')}` : ''}
        </Typography>
      </Box>
      <PriorityChip priority={work.priority} />
      <Select
        size="small"
        value={work.status}
        onChange={(e) => mut.mutate(e.target.value)}
        aria-label={`Change status for ${work.title}`}
        sx={{ minWidth: 150 }}
      >
        {COLS.map((s) => (
          <MenuItem key={s} value={s}>
            {s.replaceAll('_', ' ')}
          </MenuItem>
        ))}
        <MenuItem value="ON_HOLD">ON HOLD</MenuItem>
        <MenuItem value="CANCELLED">CANCELLED</MenuItem>
      </Select>
    </Stack>
  );
}

function KanbanBoard({ items }: { items: WorkItem[] }) {
  const qc = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const mut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.put(`/work-items/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboard'] }),
  });
  const onDragEnd = (e: DragEndEvent) => {
    const status = e.over?.id as string | undefined;
    const id = e.active.id as string;
    if (status && COLS.includes(status as never)) mut.mutate({ id, status });
  };
  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(5, minmax(200px, 1fr))' },
          gap: 2,
          overflowX: 'auto',
        }}
      >
        {COLS.map((col) => (
          <KanbanColumn key={col} status={col} items={items.filter((i) => i.status === col)} />
        ))}
      </Box>
    </DndContext>
  );
}

function KanbanColumn({ status, items }: { status: string; items: WorkItem[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <Card ref={setNodeRef} sx={{ minHeight: 320, bgcolor: isOver ? 'action.hover' : undefined }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <StatusChip status={status} />
          <Typography variant="caption">{items.length}</Typography>
        </Stack>
        {items.map((w) => (
          <KanbanCard key={w.id} work={w} />
        ))}
      </CardContent>
    </Card>
  );
}

function KanbanCard({ work }: { work: WorkItem }) {
  const nav = useNavigate();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: work.id });
  return (
    <Paperish
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.6 : 1 }}
      {...listeners}
      {...attributes}
      onClick={() => nav(`/work/${work.id}`)}
      title={work.title}
      priority={work.priority}
    />
  );
}

function Paperish({
  title,
  priority,
  ...rest
}: {
  title: string;
  priority: string;
} & Record<string, unknown>) {
  return (
    <Box
      {...rest}
      sx={{
        p: 1.25,
        mb: 1,
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        cursor: 'grab',
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="body2" fontWeight={600}>
        {title}
      </Typography>
      <PriorityChip priority={priority} />
    </Box>
  );
}

function CalendarView({ items }: { items: WorkItem[] }) {
  const [month, setMonth] = useState(new Date());
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const nav = useNavigate();
  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Button onClick={() => setMonth((m) => subMonths(m, 1))}>Previous</Button>
        <Typography variant="h6">{format(month, 'MMMM yyyy')}</Typography>
        <Button onClick={() => setMonth((m) => addMonths(m, 1))}>Next</Button>
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
        {days.map((d) => {
          const due = items.filter((i) => i.dueDate && isSameDay(new Date(i.dueDate), d));
          return (
            <Box key={d.toISOString()} sx={{ p: 1, border: 1, borderColor: 'divider', borderRadius: 1, minHeight: 88 }}>
              <Typography variant="caption">{format(d, 'd')}</Typography>
              {due.map((w) => (
                <Typography
                  key={w.id}
                  variant="caption"
                  display="block"
                  noWrap
                  sx={{ cursor: 'pointer' }}
                  onClick={() => nav(`/work/${w.id}`)}
                >
                  {w.title}
                </Typography>
              ))}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
