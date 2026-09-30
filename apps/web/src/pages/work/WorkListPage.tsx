import { useMemo, useState } from 'react';
import { Box, Button, MenuItem, Paper, Stack, TextField } from '@mui/material';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import api, { unwrap } from '../../api/client';
import { Paginated, WorkItem } from '../../types/models';
import { OutcomeChip, PriorityChip, StatusChip, fullName } from '../../components/common/StatusChips';
import { useAuth } from '../../hooks/useAuth';

export function WorkListPage() {
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const { has } = useAuth();
  const qc = useQueryClient();
  const [pagination, setPagination] = useState({ page: 0, pageSize: 25 });
  const query = {
    ...Object.fromEntries(params.entries()),
    page: pagination.page + 1,
    pageSize: pagination.pageSize,
    sortBy: 'updatedAt',
    sortDir: 'desc',
  };
  const { data, isLoading } = useQuery({
    queryKey: ['work-items', query],
    queryFn: async () => unwrap<Paginated<WorkItem>>(await api.get('/work-items', { params: query }).then((r) => r.data)),
  });
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => unwrap<any[]>(await api.get('/departments').then((r) => r.data)),
  });
  const { data: processes } = useQuery({
    queryKey: ['processes'],
    queryFn: async () => unwrap<any[]>(await api.get('/processes').then((r) => r.data)),
  });
  const { data: saved } = useQuery({
    queryKey: ['work-filters'],
    queryFn: async () => unwrap<any[]>(await api.get('/work-items/filters').then((r) => r.data)),
  });

  const patch = useMutation({
    mutationFn: ({ id, body }: { id: string; body: object }) => api.put(`/work-items/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['work-items'] }),
  });

  const setFilter = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next);
  };

  const columns: GridColDef[] = useMemo(
    () => [
      { field: 'title', headerName: 'Work item', flex: 1.4, minWidth: 220 },
      { field: 'process', headerName: 'Process', width: 180, valueGetter: (_, r) => r.process?.name },
      { field: 'department', headerName: 'Department', width: 150, valueGetter: (_, r) => r.department?.name },
      { field: 'assignedTo', headerName: 'Assigned to', width: 160, valueGetter: (_, r) => fullName(r.assignedTo) },
      {
        field: 'priority',
        headerName: 'Priority',
        width: 120,
        renderCell: (p) => <PriorityChip priority={p.value} />,
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 160,
        renderCell: (p) =>
          has('WORK_UPDATE') ? (
            <TextField
              select
              size="small"
              value={p.value}
              onChange={(e) => {
                e.stopPropagation();
                patch.mutate({ id: p.row.id, body: { status: e.target.value } });
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {['NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'BLOCKED', 'IN_REVIEW', 'COMPLETED', 'CANCELLED'].map((s) => (
                <MenuItem key={s} value={s}>
                  {s.replaceAll('_', ' ')}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <StatusChip status={p.value} />
          ),
      },
      {
        field: 'startDate',
        headerName: 'Start',
        width: 110,
        valueGetter: (_, r) => (r.startDate ? format(new Date(r.startDate), 'MMM d') : '—'),
      },
      {
        field: 'dueDate',
        headerName: 'Due',
        width: 110,
        valueGetter: (_, r) => (r.dueDate ? format(new Date(r.dueDate), 'MMM d') : '—'),
      },
      {
        field: 'outcome',
        headerName: 'Outcome',
        width: 160,
        renderCell: (p) => <OutcomeChip status={p.row.outcome?.status} />,
      },
      {
        field: 'updatedAt',
        headerName: 'Updated',
        width: 120,
        valueGetter: (_, r) => format(new Date(r.updatedAt), 'MMM d'),
      },
    ],
    [has, patch],
  );

  const exportCsv = async () => {
    const res = await api.get('/reports/export', { params: { ...Object.fromEntries(params), format: 'csv' }, responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'work.csv';
    a.click();
  };

  return (
    <Box>
      <PageHeader
        eyebrow="Work"
        title="All work"
        subtitle="Who is doing it, which process it belongs to, and what outcome is expected."
        action={<Button variant="outlined" onClick={exportCsv}>Export</Button>}
      />
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
        <TextField
          size="small"
          placeholder="Search by title or owner"
          defaultValue={params.get('search') ?? ''}
          onChange={(e) => setFilter('search', e.target.value)}
          sx={{ minWidth: { md: 220 } }}
        />
        <TextField size="small" select label="Department" value={params.get('departmentId') ?? ''} onChange={(e) => setFilter('departmentId', e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="">All</MenuItem>
          {(departments ?? []).map((d: any) => (
            <MenuItem key={d.id} value={d.id}>
              {d.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField size="small" select label="Process" value={params.get('processId') ?? ''} onChange={(e) => setFilter('processId', e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="">All</MenuItem>
          {(processes ?? []).map((p: any) => (
            <MenuItem key={p.id} value={p.id}>
              {p.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField size="small" select label="Status" value={params.get('status') ?? ''} onChange={(e) => setFilter('status', e.target.value)} sx={{ minWidth: 140 }}>
          <MenuItem value="">All</MenuItem>
          {['NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'BLOCKED', 'IN_REVIEW', 'COMPLETED', 'CANCELLED'].map((s) => (
            <MenuItem key={s} value={s}>
              {s.replaceAll('_', ' ')}
            </MenuItem>
          ))}
        </TextField>
        <TextField size="small" select label="Priority" value={params.get('priority') ?? ''} onChange={(e) => setFilter('priority', e.target.value)} sx={{ minWidth: 130 }}>
          <MenuItem value="">All</MenuItem>
          {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>
        <Button
          onClick={async () => {
            const name = window.prompt('Filter name?');
            if (!name) return;
            await api.post('/work-items/filters', { name, filters: Object.fromEntries(params) });
            qc.invalidateQueries({ queryKey: ['work-filters'] });
          }}
        >
          Save filter
        </Button>
      </Stack>
      </Paper>
      {(saved ?? []).length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
          {saved!.map((f: any) => (
            <Button
              key={f.id}
              size="small"
              variant="outlined"
              onClick={() => {
                const next = new URLSearchParams();
                Object.entries(f.filters || {}).forEach(([k, v]) => next.set(k, String(v)));
                setParams(next);
              }}
            >
              {f.name}
            </Button>
          ))}
        </Stack>
      )}
      <Box sx={{ height: 640, width: '100%' }}>
        <DataGrid
          rows={data?.items ?? []}
          columns={columns}
          rowCount={data?.total ?? 0}
          loading={isLoading}
          paginationMode="server"
          paginationModel={pagination}
          onPaginationModelChange={setPagination}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          onRowClick={(p) => nav(`/work/${p.id}`)}
          slots={{ toolbar: GridToolbar }}
          slotProps={{ toolbar: { showQuickFilter: false } }}
        />
      </Box>
    </Box>
  );
}
