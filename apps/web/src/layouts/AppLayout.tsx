import { useEffect, useMemo, useState } from 'react';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Divider,
  Drawer,
  Fab,
  IconButton,
  InputBase,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useThemeMode } from '../theme/AppThemeProvider';
import { adminNav, NavItem, navGroups } from '../components/layout/nav';
import api, { unwrap } from '../api/client';
import { NotificationDrawer } from './NotificationDrawer';
import { GlobalSearch } from './GlobalSearch';
import { QuickCreate } from '../components/work/QuickCreate';
import { timeGreeting } from '../utils/greeting';

const DRAWER_WIDTH = 276;

export function AppLayout() {
  const theme = useTheme();
  const mdDown = useMediaQuery(theme.breakpoints.down('md'));
  const lgDown = useMediaQuery(theme.breakpoints.down('lg'));
  const [open, setOpen] = useState(!mdDown);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const { user, logout, has } = useAuth();
  const { mode, toggle } = useThemeMode();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    setOpen(!mdDown);
  }, [mdDown]);

  const { data: unread } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => unwrap<{ count: number }>(await api.get('/notifications/unread-count').then((r) => r.data)),
    refetchInterval: 30_000,
  });

  const groups = useMemo(
    () =>
      navGroups
        .map((group) => ({ ...group, items: group.items.filter((i) => !i.permission || has(i.permission)) }))
        .filter((group) => group.items.length > 0),
    [has],
  );
  const adminItems = useMemo(() => adminNav.filter((i) => !i.permission || has(i.permission)), [has]);

  const go = (path: string) => {
    nav(path);
    if (mdDown) setOpen(false);
  };

  const renderItem = (item: NavItem) => {
    const selected = item.path === '/' ? loc.pathname === '/' : loc.pathname.startsWith(item.path);
    return (
      <ListItemButton key={item.path} selected={selected} onClick={() => go(item.path)} sx={{ mb: 0.25, py: 0.85 }}>
        <ListItemIcon sx={{ minWidth: 36 }}>
          <item.icon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: selected ? 700 : 550, fontSize: 14 }} />
      </ListItemButton>
    );
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', px: 1.75, py: 2.25 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 1, mb: 3 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: 'linear-gradient(145deg, #1B3F6B 0%, #2B6CB0 100%)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 800,
            boxShadow: '0 8px 18px rgba(27,63,107,0.22)',
          }}
        >
          S
        </Box>
        <Box>
          <Typography variant="subtitle1" lineHeight={1.15} fontWeight={750}>
            Command Centre
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Solvian Group
          </Typography>
        </Box>
      </Stack>
      {groups.map((group) => (
        <Box key={group.title ?? 'home'} sx={{ mb: 1.25 }}>
          {group.title && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ px: 1.5, mb: 0.5, display: 'block', fontWeight: 700, letterSpacing: 0.6 }}
            >
              {group.title.toUpperCase()}
            </Typography>
          )}
          <List dense disablePadding>
            {group.items.map(renderItem)}
          </List>
        </Box>
      ))}
      {adminItems.length > 0 && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ px: 1.5, mb: 0.5, display: 'block', fontWeight: 700, letterSpacing: 0.6 }}
          >
            ADMIN
          </Typography>
          <List dense disablePadding>
            {adminItems.map(renderItem)}
          </List>
        </>
      )}
      <Box sx={{ flex: 1 }} />
      <Box
        sx={{
          p: 1.5,
          borderRadius: 3,
          bgcolor: 'action.hover',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Signed in
        </Typography>
        <Typography variant="body2" fontWeight={700}>
          {user?.firstName} {user?.lastName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {user?.department?.name ?? user?.role.name.replaceAll('_', ' ')}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', overflowX: 'hidden', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        color="inherit"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          width: { md: open && !mdDown ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%' },
          ml: { md: open && !mdDown ? `${DRAWER_WIDTH}px` : 0 },
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton edge="start" onClick={() => setOpen((v) => !v)} aria-label="Open navigation">
            <MenuRoundedIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ display: { xs: 'none', lg: 'block' }, mr: 1, minWidth: 0 }} noWrap>
            {timeGreeting()}, {user?.firstName}
          </Typography>
          <Box
            component="button"
            onClick={() => setSearchOpen(true)}
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              px: 1.75,
              py: 1,
              ml: { lg: 2 },
              width: lgDown ? 240 : 420,
              cursor: 'pointer',
              border: 1,
              borderColor: 'divider',
              bgcolor: 'background.default',
              borderRadius: 999,
              color: 'text.secondary',
            }}
          >
            <SearchRoundedIcon fontSize="small" />
            <InputBase placeholder="Find work, people or processes" readOnly sx={{ ml: 1, flex: 1 }} />
            <Typography variant="caption" sx={{ opacity: 0.6, display: { xs: 'none', md: 'block' } }}>
              Search
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          <Box sx={{ display: { xs: 'none', sm: 'block' }, mr: 0.5 }}>
            <QuickCreate />
          </Box>
          <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
            <IconButton onClick={toggle} aria-label="Toggle color theme">
              {mode === 'dark' ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Alerts">
            <IconButton onClick={() => setNotifyOpen(true)} aria-label="Notifications">
              <Badge badgeContent={unread?.count ?? 0} color="error">
                <NotificationsNoneRoundedIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <IconButton onClick={(e) => setAnchor(e.currentTarget)} aria-label="Account menu" sx={{ ml: 0.5 }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 13, fontWeight: 700 }}>
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </Avatar>
          </IconButton>
          <Menu open={!!anchor} anchorEl={anchor} onClose={() => setAnchor(null)}>
            <Box sx={{ px: 2, py: 1.25, minWidth: 200 }}>
              <Typography fontWeight={700}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem
              onClick={() => {
                setAnchor(null);
                nav('/admin/settings');
              }}
            >
              Settings
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAnchor(null);
                logout().then(() => nav('/login'));
              }}
            >
              Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      {mdDown ? (
        <Drawer open={open} onClose={() => setOpen(false)} ModalProps={{ keepMounted: true }}>
          <Box sx={{ width: DRAWER_WIDTH }}>{drawer}</Box>
        </Drawer>
      ) : (
        <Drawer
          variant="persistent"
          open={open}
          sx={{
            width: open ? DRAWER_WIDTH : 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              bgcolor: 'background.paper',
              borderRight: 1,
              borderColor: 'divider',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          minWidth: 0,
          pt: 11,
          px: { xs: 2, md: 3.5 },
          pb: 6,
        }}
      >
        <Box sx={{ maxWidth: 1440, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
      <NotificationDrawer open={notifyOpen} onClose={() => setNotifyOpen(false)} />
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      {has('WORK_CREATE') && (
        <Fab
          color="primary"
          aria-label="New work item"
          onClick={() => nav('/work/new')}
          sx={{ position: 'fixed', bottom: 24, right: 24, display: { sm: 'none' }, zIndex: 1200 }}
        >
          <AddRoundedIcon />
        </Fab>
      )}
    </Box>
  );
}
