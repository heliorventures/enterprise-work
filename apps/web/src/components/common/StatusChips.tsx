import { Chip } from '@mui/material';
import { OUTCOME_LABEL, PRIORITY_LABEL, STATUS_LABEL } from '../../types/models';

const statusColor: Record<string, 'default' | 'info' | 'warning' | 'error' | 'secondary' | 'success'> = {
  NOT_STARTED: 'default',
  IN_PROGRESS: 'info',
  ON_HOLD: 'warning',
  BLOCKED: 'error',
  IN_REVIEW: 'secondary',
  COMPLETED: 'success',
  CANCELLED: 'default',
};

const priorityColor: Record<string, 'default' | 'info' | 'warning' | 'error'> = {
  LOW: 'default',
  MEDIUM: 'info',
  HIGH: 'warning',
  CRITICAL: 'error',
};

export function StatusChip({ status }: { status: string }) {
  return (
    <Chip
      size="small"
      color={statusColor[status] ?? 'default'}
      label={STATUS_LABEL[status] ?? status}
      variant={status === 'BLOCKED' || status === 'CRITICAL' ? 'filled' : 'outlined'}
      aria-label={`Status ${STATUS_LABEL[status] ?? status}`}
    />
  );
}

export function PriorityChip({ priority }: { priority: string }) {
  return (
    <Chip
      size="small"
      color={priorityColor[priority] ?? 'default'}
      label={PRIORITY_LABEL[priority] ?? priority}
      aria-label={`Priority ${PRIORITY_LABEL[priority] ?? priority}`}
    />
  );
}

export function OutcomeChip({ status }: { status?: string | null }) {
  const s = status ?? 'PENDING';
  const color = s === 'ACHIEVED' ? 'success' : s === 'NOT_ACHIEVED' ? 'error' : s === 'PARTIALLY_ACHIEVED' ? 'warning' : 'default';
  return <Chip size="small" color={color as 'success'} variant="outlined" label={OUTCOME_LABEL[s] ?? s} />;
}

export function WorkloadChip({ level }: { level: string }) {
  const color = level === 'CRITICAL' ? 'error' : level === 'HIGH' ? 'warning' : level === 'MEDIUM' ? 'info' : 'success';
  return <Chip size="small" color={color as 'success'} label={level} />;
}

export function fullName(p?: { firstName: string; lastName: string } | null) {
  return p ? `${p.firstName} ${p.lastName}` : 'Unassigned';
}
