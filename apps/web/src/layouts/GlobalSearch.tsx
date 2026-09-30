import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api, { unwrap } from '../api/client';

interface Results {
  workItems: { id: string; title: string; status: string }[];
  tasks: { id: string; title: string; workItemId: string }[];
  users: { id: string; firstName: string; lastName: string; email: string }[];
  processes: { id: string; name: string }[];
  documents: { id: string; fileName: string; workItemId: string | null }[];
  departments: { id: string; name: string }[];
}

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Results | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      if (q.trim().length < 2) {
        setResults(null);
        return;
      }
      const res = await api.get('/search', { params: { q } });
      setResults(unwrap<Results>(res.data));
    }, 250);
    return () => clearTimeout(t);
  }, [q, open]);

  const go = (path: string) => {
    nav(path);
    onClose();
    setQ('');
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Find work, people or processes</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          placeholder="Try NHAI, Vinay, or SIPL…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ mb: 2 }}
        />
        {results && (
          <>
            <Group title="Work items" items={results.workItems.map((w) => ({ label: w.title, path: `/work/${w.id}` }))} onGo={go} />
            <Group title="Tasks" items={results.tasks.map((t) => ({ label: t.title, path: `/work/${t.workItemId}` }))} onGo={go} />
            <Group
              title="People"
              items={results.users.map((u) => ({
                label: `${u.firstName} ${u.lastName}`,
                path: `/resources/${u.id}`,
              }))}
              onGo={go}
            />
            <Group title="Processes" items={results.processes.map((p) => ({ label: p.name, path: `/processes/${p.id}` }))} onGo={go} />
            <Group
              title="Documents"
              items={results.documents.map((d) => ({
                label: d.fileName,
                path: d.workItemId ? `/work/${d.workItemId}` : '/documents',
              }))}
              onGo={go}
            />
            <Group
              title="Departments"
              items={results.departments.map((d) => ({ label: d.name, path: '/admin/departments' }))}
              onGo={go}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Group({
  title,
  items,
  onGo,
}: {
  title: string;
  items: { label: string; path: string }[];
  onGo: (p: string) => void;
}) {
  if (!items.length) return null;
  return (
    <>
      <Typography variant="overline" color="text.secondary">
        {title}
      </Typography>
      <List dense>
        {items.map((i) => (
          <ListItemButton key={i.path + i.label} onClick={() => onGo(i.path)}>
            <ListItemText primary={i.label} />
          </ListItemButton>
        ))}
      </List>
    </>
  );
}
