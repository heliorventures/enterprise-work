import { Box, Button, Typography } from '@mui/material';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  compact,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: compact ? 2 : 5,
        px: 2,
        color: 'text.secondary',
      }}
    >
      {!compact && (
        <Box
          sx={{
            width: 48,
            height: 48,
            mx: 'auto',
            mb: 1.5,
            borderRadius: '50%',
            bgcolor: 'action.hover',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <InboxRoundedIcon color="action" />
        </Box>
      )}
      <Typography variant={compact ? 'body2' : 'subtitle1'} color="text.primary" fontWeight={600}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ mt: 0.5, maxWidth: 360, mx: 'auto' }}>
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" size="small" onClick={onAction} sx={{ mt: 2 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
