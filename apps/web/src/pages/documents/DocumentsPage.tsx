import { Box } from '@mui/material';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api, { unwrap } from '../../api/client';
import { fullName } from '../../components/common/StatusChips';

export function DocumentsPage() {
  const nav = useNavigate();
  const { data } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => unwrap<any[]>(await api.get('/documents').then((r) => r.data)),
  });
  const columns: GridColDef[] = [
    { field: 'fileName', headerName: 'File', flex: 1, minWidth: 180 },
    { field: 'fileType', headerName: 'Type', width: 180 },
    { field: 'version', headerName: 'Version', width: 90 },
    { field: 'uploadedBy', headerName: 'Uploaded by', width: 160, valueGetter: (_, r) => fullName(r.uploadedBy) },
    { field: 'uploadedAt', headerName: 'Uploaded', width: 140, valueGetter: (_, r) => format(new Date(r.uploadedAt), 'PP') },
  ];
  return (
    <Box>
      <PageHeader
        eyebrow="Files"
        title="Documents"
        subtitle="Files attached to work across the group. Open a row to jump to the work item."
      />
      <Box sx={{ height: 640 }}>
        <DataGrid
          rows={data ?? []}
          columns={columns}
          disableRowSelectionOnClick
          onRowClick={(p) => p.row.workItemId && nav(`/work/${p.row.workItemId}`)}
        />
      </Box>
    </Box>
  );
}
