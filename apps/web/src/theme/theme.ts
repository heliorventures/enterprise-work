import { alpha, createTheme, PaletteMode } from '@mui/material';

export function buildTheme(mode: PaletteMode) {
  const isDark = mode === 'dark';
  const navy = isDark ? '#8FB4DE' : '#1B3F6B';
  const gold = isDark ? '#E8B056' : '#C9842A';
  const paper = isDark ? '#121A28' : '#FFFEFB';
  const bg = isDark ? '#0B1220' : '#F3F0EA';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(27,63,107,0.1)';

  return createTheme({
    palette: {
      mode,
      primary: { main: navy, dark: isDark ? '#6E93BE' : '#122C4C', light: isDark ? '#B5CDE8' : '#3D6A99' },
      secondary: { main: gold, dark: '#9A6418', light: '#E8B056' },
      success: { main: '#0F8A6A' },
      warning: { main: '#C9842A' },
      error: { main: '#C2413B' },
      info: { main: isDark ? '#7BA4D0' : '#2B6CB0' },
      background: { default: bg, paper },
      divider: border,
      text: {
        primary: isDark ? '#E8EEF6' : '#162033',
        secondary: isDark ? '#9AA8BC' : '#5B6575',
      },
    },
    shape: { borderRadius: 14 },
    spacing: 8,
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Inter", "Segoe UI", system-ui, sans-serif',
      h3: { fontWeight: 720, letterSpacing: '-0.03em' },
      h4: { fontWeight: 720, letterSpacing: '-0.03em' },
      h5: { fontWeight: 680, letterSpacing: '-0.02em' },
      h6: { fontWeight: 650, letterSpacing: '-0.015em' },
      subtitle1: { fontWeight: 650 },
      subtitle2: { fontWeight: 650 },
      button: { textTransform: 'none', fontWeight: 650, letterSpacing: 0 },
      overline: { fontWeight: 700, letterSpacing: '0.12em' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: bg },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 12, paddingInline: 16, minHeight: 40 },
          contained: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
        },
      },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 18,
            border: `1px solid ${border}`,
            boxShadow: isDark ? 'none' : '0 10px 30px rgba(22, 32, 51, 0.04)',
          },
        },
      },
      MuiAppBar: { styleOverrides: { root: { boxShadow: 'none' } } },
      MuiDrawer: { styleOverrides: { paper: { borderRight: 'none' } } },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 999, fontWeight: 650 },
        },
      },
      MuiTextField: {
        defaultProps: { size: 'small' },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: isDark ? alpha('#fff', 0.03) : alpha('#fff', 0.72),
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            '&.Mui-selected': {
              backgroundColor: alpha(navy, isDark ? 0.22 : 0.1),
              color: navy,
              '& .MuiListItemIcon-root': { color: navy },
              '&:hover': { backgroundColor: alpha(navy, isDark ? 0.3 : 0.14) },
            },
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-root': { fontWeight: 700, color: isDark ? '#9AA8BC' : '#5B6575' },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: { tooltip: { borderRadius: 10, fontSize: 12 } },
      },
    },
  });
}
