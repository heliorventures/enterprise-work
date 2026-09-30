import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api, { unwrap } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';

export function UsersPage() {
  const { has } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: async () => unwrap<{ items: any[] }>(await api.get('/users', { params: { pageSize: 100 } }).then((r) => r.data)),
  });
  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => unwrap<any[]>(await api.get('/roles').then((r) => r.data)),
    enabled: has('ROLE_MANAGE') || has('USER_CREATE'),
  });
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => unwrap<any[]>(await api.get('/departments').then((r) => r.data)),
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    password: 'Welcome123!',
    roleId: '',
    departmentId: '',
  });
  const create = useMutation({
    mutationFn: () => api.post('/users', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
    },
  });
  const columns: GridColDef[] = [
    { field: 'employeeId', headerName: 'ID', width: 110 },
    { field: 'name', headerName: 'Name', flex: 1, valueGetter: (_, r) => `${r.firstName} ${r.lastName}` },
    { field: 'email', headerName: 'Email', flex: 1 },
    { field: 'role', headerName: 'Role', width: 160, valueGetter: (_, r) => r.role?.name },
    { field: 'department', headerName: 'Department', width: 150, valueGetter: (_, r) => r.department?.name },
    { field: 'status', headerName: 'Status', width: 110 },
  ];
  return (
    <Box>
      <PageHeader
        eyebrow="Admin"
        title="Users"
        subtitle="People who can sign in and own work across the Command Centre."
        action={
          has('USER_CREATE') ? (
            <Button variant="contained" onClick={() => setOpen(true)}>
              Add user
            </Button>
          ) : undefined
        }
      />
      <Box sx={{ height: 640 }}>
        <DataGrid rows={data?.items ?? []} columns={columns} />
      </Box>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>New user</DialogTitle>
        <DialogContent>
          {['employeeId', 'firstName', 'lastName', 'email', 'password'].map((k) => (
            <TextField
              key={k}
              fullWidth
              sx={{ mt: 2 }}
              label={k}
              type={k === 'password' ? 'password' : 'text'}
              value={(form as any)[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            />
          ))}
          <TextField select fullWidth sx={{ mt: 2 }} label="Role" value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
            {(roles ?? []).map((r: any) => (
              <MenuItem key={r.id} value={r.id}>
                {r.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField select fullWidth sx={{ mt: 2 }} label="Department" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
            {(departments ?? []).map((d: any) => (
              <MenuItem key={d.id} value={d.id}>
                {d.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => create.mutate()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
