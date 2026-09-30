import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';
import api, { unwrap } from '../../api/client';
import { PageHeader } from '../../components/layout/PageHeader';

const schema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional(),
  processId: z.string().min(1, 'Select a process'),
  departmentId: z.string().optional(),
  assignedToId: z.string().optional(),
  managerId: z.string().optional(),
  teamId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  expectedOutcome: z.string().min(8, 'Describe the expected outcome'),
  tasks: z.array(z.object({ title: z.string().min(2), assignedToId: z.string().optional() })),
});

type Form = z.infer<typeof schema>;

export function WorkCreatePage() {
  const nav = useNavigate();
  const { data: processes } = useQuery({
    queryKey: ['processes'],
    queryFn: async () => unwrap<any[]>(await api.get('/processes').then((r) => r.data)),
  });
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => unwrap<any[]>(await api.get('/departments').then((r) => r.data)),
  });
  const { data: users } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () => unwrap<{ items: any[] }>(await api.get('/users', { params: { pageSize: 100 } }).then((r) => r.data)),
  });
  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => unwrap<any[]>(await api.get('/teams').then((r) => r.data)),
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'MEDIUM', tasks: [{ title: '' }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'tasks' });

  return (
    <Box maxWidth={900}>
      <PageHeader
        eyebrow="Create"
        title="New work"
        subtitle="Name the work, pick a process, assign an owner, and say what good looks like. Tasks can be added now or later."
      />
      <form
        onSubmit={handleSubmit(async (values) => {
          const res = await api.post('/work-items', {
            ...values,
            tasks: values.tasks.filter((t) => t.title.trim()),
          });
          const created = unwrap<{ id: string }>(res.data);
          enqueueSnackbar('Work item created', { variant: 'success' });
          nav(`/work/${created.id}`);
        })}
      >
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Basic information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Title" error={!!errors.title} helperText={errors.title?.message} {...register('title')} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline minRows={3} label="Description" {...register('description')} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField select fullWidth label="Process" defaultValue="" error={!!errors.processId} helperText={errors.processId?.message} {...register('processId')}>
                    {(processes ?? []).map((p: any) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField select fullWidth label="Department" defaultValue="" {...register('departmentId')}>
                    <MenuItem value="">None</MenuItem>
                    {(departments ?? []).map((d: any) => (
                      <MenuItem key={d.id} value={d.id}>
                        {d.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Assignment
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField select fullWidth label="Assigned to" defaultValue="" {...register('assignedToId')}>
                    <MenuItem value="">Unassigned</MenuItem>
                    {(users?.items ?? []).map((u: any) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.firstName} {u.lastName}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField select fullWidth label="Manager" defaultValue="" {...register('managerId')}>
                    <MenuItem value="">None</MenuItem>
                    {(users?.items ?? []).map((u: any) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.firstName} {u.lastName}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField select fullWidth label="Team" defaultValue="" {...register('teamId')}>
                    <MenuItem value="">None</MenuItem>
                    {(teams ?? []).map((t: any) => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Schedule & priority
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth type="date" label="Start date" InputLabelProps={{ shrink: true }} {...register('startDate')} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth type="date" label="Due date" InputLabelProps={{ shrink: true }} {...register('dueDate')} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField select fullWidth label="Priority" defaultValue="MEDIUM" {...register('priority')}>
                    {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => (
                      <MenuItem key={p} value={p}>
                        {p}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Expected outcome
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="What does success look like?"
                error={!!errors.expectedOutcome}
                helperText={errors.expectedOutcome?.message}
                {...register('expectedOutcome')}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Tasks
              </Typography>
              {fields.map((f, i) => (
                <Stack key={f.id} direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1 }}>
                  <TextField fullWidth label="Task" {...register(`tasks.${i}.title`)} />
                  <Button onClick={() => remove(i)}>Remove</Button>
                </Stack>
              ))}
              <Button onClick={() => append({ title: '' })}>Add task</Button>
            </CardContent>
          </Card>
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            Create work item
          </Button>
        </Stack>
      </form>
    </Box>
  );
}
