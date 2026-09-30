import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import AssignmentIndRoundedIcon from '@mui/icons-material/AssignmentIndRounded';
import ViewKanbanRoundedIcon from '@mui/icons-material/ViewKanbanRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import CorporateFareRoundedIcon from '@mui/icons-material/CorporateFareRounded';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { SvgIconComponent } from '@mui/icons-material';

export interface NavItem {
  label: string;
  path: string;
  icon: SvgIconComponent;
  permission?: string;
  roles?: string[];
}

export const primaryNav: NavItem[] = [
  { label: 'Home', path: '/', icon: DashboardRoundedIcon, permission: 'DASHBOARD_VIEW' },
  { label: 'My work', path: '/my-work', icon: AssignmentIndRoundedIcon, permission: 'WORK_VIEW' },
  { label: 'All work', path: '/work', icon: ViewKanbanRoundedIcon, permission: 'WORK_VIEW' },
  { label: 'Processes', path: '/processes', icon: AccountTreeRoundedIcon, permission: 'PROCESS_VIEW' },
  { label: 'People', path: '/resources', icon: GroupsRoundedIcon, permission: 'USER_VIEW' },
  { label: 'Documents', path: '/documents', icon: FolderRoundedIcon, permission: 'DOCUMENT_VIEW' },
  { label: 'Reports', path: '/reports', icon: AssessmentRoundedIcon, permission: 'REPORT_VIEW' },
  { label: 'Alerts', path: '/notifications', icon: NotificationsRoundedIcon, permission: 'NOTIFICATION_VIEW' },
];

export const navGroups: { title: string | null; items: NavItem[] }[] = [
  { title: null, items: [primaryNav[0]] },
  { title: 'Work', items: [primaryNav[1], primaryNav[2], primaryNav[3]] },
  { title: 'People & files', items: [primaryNav[4], primaryNav[5]] },
  { title: 'Insights', items: [primaryNav[6], primaryNav[7]] },
];

export const adminNav: NavItem[] = [
  { label: 'Users', path: '/admin/users', icon: PeopleRoundedIcon, permission: 'USER_VIEW' },
  { label: 'Departments', path: '/admin/departments', icon: CorporateFareRoundedIcon, permission: 'DEPARTMENT_MANAGE' },
  { label: 'Teams', path: '/admin/teams', icon: HubRoundedIcon, permission: 'TEAM_MANAGE' },
  { label: 'Roles', path: '/admin/roles', icon: AdminPanelSettingsRoundedIcon, permission: 'ROLE_MANAGE' },
  { label: 'Settings', path: '/admin/settings', icon: SettingsRoundedIcon, permission: 'SETTINGS_MANAGE' },
];
