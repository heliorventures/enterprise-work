import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api, { unwrap } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { PageHeader } from '../../components/layout/PageHeader';

export function DepartmentsPage() {
  const { has } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => unwrap<any[]>(await api.get('/departments').then((r) => r.data)),
  });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const create = useMutation({
    mutationFn: () => api.post('/departments', { name, description }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      setOpen(false);
    },
  });
  return (
    <Box>
      <PageHeader
        eyebrow="Admin"
        title="Departments"
        subtitle="The nine verticals and group office that own work."
        action={
          has('DEPARTMENT_MANAGE') ? (
            <Button variant="contained" onClick={() => setOpen(true)}>
              Add
            </Button>
          ) : undefined
        }
      />
      <Box sx={{ height: 520 }}>
        <DataGrid
          rows={data ?? []}
          columns={[
            { field: 'name', headerName: 'Name', flex: 1 },
            { field: 'description', headerName: 'Description', flex: 1.4 },
            { field: 'head', headerName: 'Head', width: 180, valueGetter: (_, r) => (r.head ? `${r.head.firstName} ${r.head.lastName}` : '—') },
            { field: 'users', headerName: 'People', width: 100, valueGetter: (_, r) => r._count?.users },
          ]}
        />
      </Box>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Department</DialogTitle>
        <DialogContent>
          <TextField fullWidth sx={{ mt: 1 }} label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField fullWidth sx={{ mt: 2 }} label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => create.mutate()}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export function TeamsPage() {
  const { has } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => unwrap<any[]>(await api.get('/teams').then((r) => r.data)),
  });
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => unwrap<any[]>(await api.get('/departments').then((r) => r.data)),
  });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const create = useMutation({
    mutationFn: () => api.post('/teams', { name, departmentId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      setOpen(false);
    },
  });
  return (
    <Box>
      <PageHeader
        eyebrow="Admin"
        title="Teams"
        subtitle="Smaller groups inside a vertical or the group office."
        action={
          has('TEAM_MANAGE') ? (
            <Button variant="contained" onClick={() => setOpen(true)}>
              Add
            </Button>
          ) : undefined
        }
      />
      <Box sx={{ height: 520 }}>
        <DataGrid
          rows={data ?? []}
          columns={[
            { field: 'name', headerName: 'Team', flex: 1 },
            { field: 'department', headerName: 'Department', flex: 1, valueGetter: (_, r) => r.department?.name },
            { field: 'members', headerName: 'Members', width: 110, valueGetter: (_, r) => r._count?.members },
          ]}
        />
      </Box>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Team</DialogTitle>
        <DialogContent>
          <TextField fullWidth sx={{ mt: 1 }} label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField select fullWidth sx={{ mt: 2 }} label="Department" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} SelectProps={{ native: true }}>
            <option value="" />
            {(departments ?? []).map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => create.mutate()}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
