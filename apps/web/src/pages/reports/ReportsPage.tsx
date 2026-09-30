import { Box, Button, Card, CardContent, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import api, { unwrap } from '../../api/client';
import { PageHeader } from '../../components/layout/PageHeader';

const kinds = [
  ['work', 'Work summary'],
  ['departments', 'Department performance'],
  ['processes', 'Process performance'],
  ['outcomes', 'Outcome report'],
  ['overdue', 'Overdue work'],
  ['trends', 'Completion trends'],
] as const;

export function ReportsPage() {
  const [kind, setKind] = useState<(typeof kinds)[number][0]>('work');
  const { data } = useQuery({
    queryKey: ['reports', kind],
    queryFn: async () => unwrap<any>(await api.get(`/reports/${kind}`).then((r) => r.data)),
  });
  const download = async (format: 'csv' | 'xlsx' | 'pdf') => {
    const res = await api.get('/reports/export', { params: { format }, responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report.${format}`;
    a.click();
  };
  return (
    <Box>
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        subtitle="Leadership views of work, people, processes and outcomes."
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
        <TextField select size="small" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} sx={{ minWidth: 240 }}>
          {kinds.map(([k, l]) => (
            <MenuItem key={k} value={k}>
              {l}
            </MenuItem>
          ))}
        </TextField>
        <Button onClick={() => download('csv')}>CSV</Button>
        <Button onClick={() => download('xlsx')}>Excel</Button>
        <Button onClick={() => download('pdf')}>PDF</Button>
      </Stack>
      {kind === 'work' && data && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography>Total work items: {data.total}</Typography>
            <Typography>Overdue: {data.overdue}</Typography>
            <SimpleTable rows={data.items ?? []} cols={['title', 'process', 'department', 'assignedTo', 'status', 'outcome']} />
          </CardContent>
        </Card>
      )}
      {kind === 'departments' && Array.isArray(data) && (
        <SimpleTable rows={data} cols={['department', 'total', 'completed', 'blocked', 'overdue', 'outcomesAchieved']} />
      )}
      {kind === 'processes' && Array.isArray(data) && (
        <SimpleTable rows={data} cols={['process', 'total', 'completed', 'inProgress', 'blocked', 'outcomeRate']} />
      )}
      {kind === 'outcomes' && data && (
        <Card>
          <CardContent>
            <Typography sx={{ mb: 2 }}>{JSON.stringify(data.summary)}</Typography>
            <SimpleTable rows={data.items ?? []} cols={['title', 'process', 'assignedTo', 'outcome']} />
          </CardContent>
        </Card>
      )}
      {kind === 'overdue' && Array.isArray(data) && <SimpleTable rows={data} cols={['title', 'process', 'assignedTo', 'priority', 'dueDate']} />}
      {kind === 'trends' && Array.isArray(data) && (
        <Card>
          <CardContent sx={{ height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line dataKey="created" stroke="#1E4D7B" />
                <Line dataKey="completed" stroke="#059669" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

function SimpleTable({ rows, cols }: { rows: any[]; cols: string[] }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          {cols.map((c) => (
            <TableCell key={c}>{c}</TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={r.id ?? i}>
            {cols.map((c) => (
              <TableCell key={c}>{String(r[c] ?? '')}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
