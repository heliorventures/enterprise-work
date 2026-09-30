import { Box, Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import { ReactNode } from 'react';

const TONES = {
  default: { bar: 'primary.main', wash: 'transparent' },
  info: { bar: 'info.main', wash: 'rgba(43,108,176,0.06)' },
  success: { bar: 'success.main', wash: 'rgba(15,138,106,0.06)' },
  warning: { bar: 'warning.main', wash: 'rgba(201,132,42,0.08)' },
  danger: { bar: 'error.main', wash: 'rgba(194,65,59,0.07)' },
} as const;

export function KpiCard({
  label,
  value,
  delta,
  onClick,
  hint,
  tone = 'default',
  icon,
}: {
  label: string;
  value: number | string;
  delta?: number;
  onClick?: () => void;
  hint?: string;
  tone?: keyof typeof TONES;
  icon?: ReactNode;
}) {
  const colors = TONES[tone];
  const inner = (
    <CardContent sx={{ bgcolor: colors.wash }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Typography variant="body2" color="text.secondary" fontWeight={650}>
          {label}
        </Typography>
        {icon && (
          <Box sx={{ color: colors.bar, display: 'grid', placeItems: 'center', opacity: 0.85 }}>{icon}</Box>
        )}
      </Stack>
      <Typography variant="h4" sx={{ mt: 0.75, mb: 0.5 }}>
        {value}
      </Typography>
      {delta !== undefined && (
        <Stack direction="row" spacing={0.5} alignItems="center">
          {delta >= 0 ? (
            <TrendingUpRoundedIcon fontSize="small" color="success" />
          ) : (
            <TrendingDownRoundedIcon fontSize="small" color="error" />
          )}
          <Typography variant="caption" color={delta >= 0 ? 'success.main' : 'error.main'} fontWeight={700}>
            {Math.abs(delta)}% vs last period
          </Typography>
        </Stack>
      )}
      {hint && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
    </CardContent>
  );
  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
        '&:hover': onClick ? { transform: 'translateY(-2px)' } : undefined,
        '&:before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          bgcolor: colors.bar,
        },
      }}
    >
      {onClick ? (
        <CardActionArea onClick={onClick} aria-label={`${label} ${value}`} sx={{ height: '100%' }}>
          {inner}
        </CardActionArea>
      ) : (
        inner
      )}
    </Card>
  );
}
