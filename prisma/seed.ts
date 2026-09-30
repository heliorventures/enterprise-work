import { PrismaClient, WorkPriority, WorkStatus, OutcomeStatus, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PERMISSIONS = [
  ['USER_VIEW', 'View users'],
  ['USER_CREATE', 'Create users'],
  ['USER_UPDATE', 'Update users'],
  ['USER_DELETE', 'Delete users'],
  ['TASK_VIEW', 'View tasks'],
  ['TASK_CREATE', 'Create tasks'],
  ['TASK_UPDATE', 'Update tasks'],
  ['TASK_DELETE', 'Delete tasks'],
  ['TASK_ASSIGN', 'Assign tasks'],
  ['PROCESS_VIEW', 'View processes'],
  ['PROCESS_CREATE', 'Create processes'],
  ['PROCESS_UPDATE', 'Update processes'],
  ['PROCESS_DELETE', 'Delete processes'],
  ['DOCUMENT_VIEW', 'View documents'],
  ['DOCUMENT_UPLOAD', 'Upload documents'],
  ['DOCUMENT_DELETE', 'Delete documents'],
  ['OUTCOME_VIEW', 'View outcomes'],
  ['OUTCOME_CREATE', 'Create outcomes'],
  ['OUTCOME_REVIEW', 'Review outcomes'],
  ['REPORT_VIEW', 'View reports'],
  ['DASHBOARD_VIEW', 'View dashboards'],
  ['WORK_VIEW', 'View work items'],
  ['WORK_CREATE', 'Create work items'],
  ['WORK_UPDATE', 'Update work items'],
  ['WORK_DELETE', 'Delete work items'],
  ['WORK_ASSIGN', 'Assign work items'],
  ['DEPARTMENT_VIEW', 'View departments'],
  ['DEPARTMENT_MANAGE', 'Manage departments'],
  ['TEAM_VIEW', 'View teams'],
  ['TEAM_MANAGE', 'Manage teams'],
  ['ROLE_MANAGE', 'Manage roles and permissions'],
  ['SETTINGS_MANAGE', 'Manage system settings'],
  ['AUDIT_VIEW', 'View audit logs'],
  ['COMMENT_CREATE', 'Create comments'],
  ['NOTIFICATION_VIEW', 'View notifications'],
] as const;

const ALL_CODES = PERMISSIONS.map(([c]) => c);

const ROLE_PERMS: Record<string, string[]> = {
  SUPER_ADMIN: ALL_CODES,
  ADMIN: ALL_CODES,
  VP: [
    'USER_VIEW',
    'TASK_VIEW',
    'TASK_CREATE',
    'TASK_UPDATE',
    'TASK_ASSIGN',
    'PROCESS_VIEW',
    'PROCESS_CREATE',
    'PROCESS_UPDATE',
    'DOCUMENT_VIEW',
    'DOCUMENT_UPLOAD',
    'OUTCOME_VIEW',
    'OUTCOME_REVIEW',
    'REPORT_VIEW',
    'DASHBOARD_VIEW',
    'WORK_VIEW',
    'WORK_CREATE',
    'WORK_UPDATE',
    'WORK_ASSIGN',
    'DEPARTMENT_VIEW',
    'TEAM_VIEW',
    'AUDIT_VIEW',
    'NOTIFICATION_VIEW',
    'COMMENT_CREATE',
  ],
  DEPARTMENT_HEAD: [
    'USER_VIEW',
    'TASK_VIEW',
    'TASK_CREATE',
    'TASK_UPDATE',
    'TASK_ASSIGN',
    'PROCESS_VIEW',
    'PROCESS_UPDATE',
    'DOCUMENT_VIEW',
    'DOCUMENT_UPLOAD',
    'OUTCOME_VIEW',
    'OUTCOME_CREATE',
    'OUTCOME_REVIEW',
    'REPORT_VIEW',
    'DASHBOARD_VIEW',
    'WORK_VIEW',
    'WORK_CREATE',
    'WORK_UPDATE',
    'WORK_ASSIGN',
    'DEPARTMENT_VIEW',
    'TEAM_VIEW',
    'AUDIT_VIEW',
    'COMMENT_CREATE',
    'NOTIFICATION_VIEW',
  ],
  MANAGER: [
    'USER_VIEW',
    'TASK_VIEW',
    'TASK_CREATE',
    'TASK_UPDATE',
    'TASK_ASSIGN',
    'PROCESS_VIEW',
    'DOCUMENT_VIEW',
    'DOCUMENT_UPLOAD',
    'OUTCOME_VIEW',
    'OUTCOME_CREATE',
    'OUTCOME_REVIEW',
    'REPORT_VIEW',
    'DASHBOARD_VIEW',
    'WORK_VIEW',
    'WORK_CREATE',
    'WORK_UPDATE',
    'WORK_ASSIGN',
    'DEPARTMENT_VIEW',
    'TEAM_VIEW',
    'COMMENT_CREATE',
    'NOTIFICATION_VIEW',
  ],
  EMPLOYEE: [
    'USER_VIEW',
    'TASK_VIEW',
    'TASK_CREATE',
    'TASK_UPDATE',
    'PROCESS_VIEW',
    'DOCUMENT_VIEW',
    'DOCUMENT_UPLOAD',
    'OUTCOME_VIEW',
    'OUTCOME_CREATE',
    'DASHBOARD_VIEW',
    'WORK_VIEW',
    'WORK_CREATE',
    'WORK_UPDATE',
    'DEPARTMENT_VIEW',
    'TEAM_VIEW',
    'COMMENT_CREATE',
    'NOTIFICATION_VIEW',
  ],
};

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.document.deleteMany();
  await prisma.outcome.deleteMany();
  await prisma.task.deleteMany();
  await prisma.workItem.deleteMany();
  await prisma.savedFilter.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.process.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();
  await prisma.department.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.workStatusDefinition.deleteMany();
  await prisma.appSetting.deleteMany();

  const permissionRecords = await Promise.all(
    PERMISSIONS.map(([code, description]) =>
      prisma.permission.create({ data: { code, description } }),
    ),
  );
  const permByCode = Object.fromEntries(permissionRecords.map((p) => [p.code, p]));

  const roles = await Promise.all(
    Object.entries({
      SUPER_ADMIN: 'Full platform access',
      ADMIN: 'System administration',
      VP: 'Executive visibility across the company',
      DEPARTMENT_HEAD: 'Owns a department and its outcomes',
      MANAGER: 'Leads a team and assigns work',
      EMPLOYEE: 'Executes assigned work',
    }).map(([name, description]) => prisma.role.create({ data: { name, description } })),
  );
  const roleByName = Object.fromEntries(roles.map((r) => [r.name, r]));

  for (const [roleName, codes] of Object.entries(ROLE_PERMS)) {
    await prisma.rolePermission.createMany({
      data: codes.map((code) => ({
        roleId: roleByName[roleName].id,
        permissionId: permByCode[code].id,
      })),
    });
  }

  const statuses = [
    { code: 'NOT_STARTED', label: 'Not Started', color: '#64748b', sortOrder: 1, isDefault: true, isFinal: false },
    { code: 'IN_PROGRESS', label: 'In Progress', color: '#2563eb', sortOrder: 2, isDefault: false, isFinal: false },
    { code: 'ON_HOLD', label: 'On Hold', color: '#d97706', sortOrder: 3, isDefault: false, isFinal: false },
    { code: 'BLOCKED', label: 'Blocked', color: '#dc2626', sortOrder: 4, isDefault: false, isFinal: false },
    { code: 'IN_REVIEW', label: 'In Review', color: '#7c3aed', sortOrder: 5, isDefault: false, isFinal: false },
    { code: 'COMPLETED', label: 'Completed', color: '#059669', sortOrder: 6, isDefault: false, isFinal: true },
    { code: 'CANCELLED', label: 'Cancelled', color: '#6b7280', sortOrder: 7, isDefault: false, isFinal: true },
  ];
  await prisma.workStatusDefinition.createMany({ data: statuses });
  await prisma.appSetting.createMany({
    data: [
      { key: 'company.name', value: 'Solvian Group' },
      { key: 'company.timezone', value: 'Asia/Kolkata' },
      { key: 'work.defaultPriority', value: 'MEDIUM' },
      { key: 'notifications.dueSoonHours', value: 24 },
    ],
  });

  const passwordHash = await bcrypt.hash('Welcome123!', 10);

  const deptRows = [
    { key: 'arica', name: 'Arica Real Estate & Development', description: 'Arica Buildcon, Arica Consultancy, Arica Properties. Real estate and construction.' },
    { key: 'biofuels', name: 'Shri Venkateshwara Biorefineries', description: 'Biorefineries and biofuels operations.' },
    { key: 'sipl', name: 'Solvian Infrastructure and Projects', description: 'SIPL - infrastructure and project execution.' },
    { key: 'consultancy', name: 'Solvian Consultancy', description: 'Group consultancy and advisory mandates.' },
    { key: 'ideamint', name: 'Ideamint & Chaitra Creations', description: 'Ideamint India and Chaitra Creations and Publications.' },
    { key: 'myara', name: 'Myara Trades and Agro', description: 'Myara Trades and Services / Solvian Infra & Agro. Geography: Rajasthan, Odisha, Pan-India.' },
    { key: 'security', name: 'Arica Tech Security', description: 'Cybersecurity and technology security services.' },
    { key: 'stargold', name: 'Stargold / BT-Bio Brilliance', description: 'Distillery and bio-brilliance operations.' },
    { key: 'mobility', name: 'Futuristics Mobility', description: 'EV mobility. Group coordination and dashboard ownership.' },
    { key: 'group', name: 'Group Office', description: 'Group Leadership, Finance Committee, Legal Counsel, and platform administration.' },
  ];
  const departments = await Promise.all(deptRows.map((d) => prisma.department.create({ data: { name: d.name, description: d.description } })));
  const dept: Record<string, (typeof departments)[0]> = {};
  deptRows.forEach((row, i) => {
    dept[row.key] = departments[i];
  });

  const mkUser = (data: {
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    departmentId?: string;
    managerId?: string;
  }) =>
    prisma.user.create({
      data: {
        employeeId: data.employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash,
        roleId: roleByName[data.role].id,
        departmentId: data.departmentId,
        managerId: data.managerId,
        status: UserStatus.ACTIVE,
        lastLoginAt: daysAgo(0),
      },
    });

  const vinay = await mkUser({
    employeeId: 'SG-1000',
    firstName: 'Vinay',
    lastName: 'Phadnis',
    email: 'vinay.phadnis@solvian.local',
    role: 'VP',
    departmentId: dept.group.id,
  });
  const admin = await mkUser({
    employeeId: 'SG-1001',
    firstName: 'Platform',
    lastName: 'Administrator',
    email: 'admin@solvian.local',
    role: 'ADMIN',
    departmentId: dept.group.id,
    managerId: vinay.id,
  });
  await mkUser({
    employeeId: 'SG-1002',
    firstName: 'System',
    lastName: 'Super Admin',
    email: 'superadmin@solvian.local',
    role: 'SUPER_ADMIN',
    departmentId: dept.group.id,
  });
  const cfo = await mkUser({
    employeeId: 'SG-1003',
    firstName: 'Group',
    lastName: 'CFO',
    email: 'cfo@solvian.local',
    role: 'DEPARTMENT_HEAD',
    departmentId: dept.group.id,
    managerId: vinay.id,
  });
  const legal = await mkUser({
    employeeId: 'SG-1004',
    firstName: 'Group',
    lastName: 'Legal Counsel',
    email: 'legal@solvian.local',
    role: 'MANAGER',
    departmentId: dept.group.id,
    managerId: vinay.id,
  });

  const sahil = await mkUser({
    employeeId: 'SG-1100',
    firstName: 'Sahil',
    lastName: 'Phadnis',
    email: 'sahil.phadnis@solvian.local',
    role: 'DEPARTMENT_HEAD',
    departmentId: dept.arica.id,
    managerId: vinay.id,
  });
  const uday = await mkUser({
    employeeId: 'SG-1200',
    firstName: 'Uday',
    lastName: 'Kulkarni',
    email: 'uday.kulkarni@solvian.local',
    role: 'DEPARTMENT_HEAD',
    departmentId: dept.biofuels.id,
    managerId: sahil.id,
  });
  const bhagyashree = await mkUser({
    employeeId: 'SG-1300',
    firstName: 'Bhagyashree',
    lastName: 'Gurav',
    email: 'bhagyashree.gurav@solvian.local',
    role: 'DEPARTMENT_HEAD',
    departmentId: dept.sipl.id,
    managerId: vinay.id,
  });
  const sunil = await mkUser({
    employeeId: 'SG-1400',
    firstName: 'Sunil',
    lastName: 'Rajani',
    email: 'sunil.rajani@solvian.local',
    role: 'DEPARTMENT_HEAD',
    departmentId: dept.consultancy.id,
    managerId: vinay.id,
  });
  const govind = await mkUser({
    employeeId: 'SG-1500',
    firstName: 'Govind',
    lastName: 'Mengji',
    email: 'govind.mengji@solvian.local',
    role: 'DEPARTMENT_HEAD',
    departmentId: dept.mobility.id,
    managerId: vinay.id,
  });
  const chitra = await mkUser({
    employeeId: 'SG-1600',
    firstName: 'Chitra',
    lastName: 'Mete',
    email: 'chitra.mete@solvian.local',
    role: 'DEPARTMENT_HEAD',
    departmentId: dept.ideamint.id,
    managerId: vinay.id,
  });
  const yogesh = await mkUser({
    employeeId: 'SG-1601',
    firstName: 'Yogesh',
    lastName: 'Badhi',
    email: 'yogesh.badhi@solvian.local',
    role: 'MANAGER',
    departmentId: dept.ideamint.id,
    managerId: chitra.id,
  });
  const ravikiran = await mkUser({
    employeeId: 'SG-1700',
    firstName: 'Ravikiran',
    lastName: 'Bhartee',
    email: 'ravikiran.bhartee@solvian.local',
    role: 'DEPARTMENT_HEAD',
    departmentId: dept.myara.id,
    managerId: vinay.id,
  });
  const sidhant = await mkUser({
    employeeId: 'SG-1800',
    firstName: 'Sidhant',
    lastName: 'Malegaonkar',
    email: 'sidhant.malegaonkar@solvian.local',
    role: 'DEPARTMENT_HEAD',
    departmentId: dept.security.id,
    managerId: vinay.id,
  });
  const kunal = await mkUser({
    employeeId: 'SG-1801',
    firstName: 'Kunal',
    lastName: 'Dhonge',
    email: 'kunal.dhonge@solvian.local',
    role: 'MANAGER',
    departmentId: dept.security.id,
    managerId: sidhant.id,
  });
  const sanjay = await mkUser({
    employeeId: 'SG-1900',
    firstName: 'Sanjay',
    lastName: 'Kanekar',
    email: 'sanjay.kanekar@solvian.local',
    role: 'DEPARTMENT_HEAD',
    departmentId: dept.stargold.id,
    managerId: vinay.id,
  });

  await prisma.department.update({ where: { id: dept.arica.id }, data: { headId: sahil.id } });
  await prisma.department.update({ where: { id: dept.biofuels.id }, data: { headId: uday.id } });
  await prisma.department.update({ where: { id: dept.sipl.id }, data: { headId: bhagyashree.id } });
  await prisma.department.update({ where: { id: dept.consultancy.id }, data: { headId: sunil.id } });
  await prisma.department.update({ where: { id: dept.ideamint.id }, data: { headId: chitra.id } });
  await prisma.department.update({ where: { id: dept.myara.id }, data: { headId: ravikiran.id } });
  await prisma.department.update({ where: { id: dept.security.id }, data: { headId: sidhant.id } });
  await prisma.department.update({ where: { id: dept.stargold.id }, data: { headId: sanjay.id } });
  await prisma.department.update({ where: { id: dept.mobility.id }, data: { headId: govind.id } });
  await prisma.department.update({ where: { id: dept.group.id }, data: { headId: vinay.id } });

  const teamBuildcon = await prisma.team.create({
    data: { name: 'Arica Buildcon', departmentId: dept.arica.id, leadId: sahil.id, description: 'Construction delivery' },
  });
  const teamBio = await prisma.team.create({
    data: { name: 'Plant Operations', departmentId: dept.biofuels.id, leadId: uday.id, description: 'Biorefinery operations' },
  });
  const teamSipl = await prisma.team.create({
    data: { name: 'Infrastructure Projects', departmentId: dept.sipl.id, leadId: bhagyashree.id, description: 'SIPL execution' },
  });
  const teamAdvisory = await prisma.team.create({
    data: { name: 'Advisory Mandates', departmentId: dept.consultancy.id, leadId: sunil.id, description: 'Consultancy delivery' },
  });
  const teamIdeamint = await prisma.team.create({
    data: { name: 'Ideamint India', departmentId: dept.ideamint.id, leadId: yogesh.id, description: 'Marketing and publications' },
  });
  const teamMyara = await prisma.team.create({
    data: { name: 'Agro Trading', departmentId: dept.myara.id, leadId: ravikiran.id, description: 'Rajasthan, Odisha, Pan-India' },
  });
  const teamSec = await prisma.team.create({
    data: { name: 'Security Operations', departmentId: dept.security.id, leadId: kunal.id, description: 'Cybersecurity delivery' },
  });
  const teamStar = await prisma.team.create({
    data: { name: 'Distillery Operations', departmentId: dept.stargold.id, leadId: sanjay.id, description: 'Stargold / BT-Bio Brilliance' },
  });
  const teamMobility = await prisma.team.create({
    data: { name: 'Group Coordination', departmentId: dept.mobility.id, leadId: govind.id, description: 'EV mobility and Group dashboard' },
  });
  const teamFinance = await prisma.team.create({
    data: { name: 'Finance Committee', departmentId: dept.group.id, leadId: cfo.id, description: 'Group finance oversight' },
  });
  const teamLegal = await prisma.team.create({
    data: { name: 'Legal & Compliance', departmentId: dept.group.id, leadId: legal.id, description: 'Contracts and compliance' },
  });

  await prisma.user.update({ where: { id: sahil.id }, data: { teamId: teamBuildcon.id } });
  await prisma.user.update({ where: { id: uday.id }, data: { teamId: teamBio.id } });
  await prisma.user.update({ where: { id: bhagyashree.id }, data: { teamId: teamSipl.id } });
  await prisma.user.update({ where: { id: sunil.id }, data: { teamId: teamAdvisory.id } });
  await prisma.user.update({ where: { id: govind.id }, data: { teamId: teamMobility.id } });
  await prisma.user.update({ where: { id: chitra.id }, data: { teamId: teamIdeamint.id } });
  await prisma.user.update({ where: { id: yogesh.id }, data: { teamId: teamIdeamint.id } });
  await prisma.user.update({ where: { id: ravikiran.id }, data: { teamId: teamMyara.id } });
  await prisma.user.update({ where: { id: sidhant.id }, data: { teamId: teamSec.id } });
  await prisma.user.update({ where: { id: kunal.id }, data: { teamId: teamSec.id } });
  await prisma.user.update({ where: { id: sanjay.id }, data: { teamId: teamStar.id } });
  await prisma.user.update({ where: { id: cfo.id }, data: { teamId: teamFinance.id } });
  await prisma.user.update({ where: { id: legal.id }, data: { teamId: teamLegal.id } });
  await prisma.user.update({ where: { id: vinay.id }, data: { teamId: teamFinance.id } });
  await prisma.user.update({ where: { id: admin.id }, data: { teamId: teamFinance.id } });

  const processRows = [
    { name: 'Lead & Opportunity Pipeline', departmentId: dept.group.id, ownerId: vinay.id, description: 'Lead from first contact through Converted/Won or Lost. Feeder into project execution.' },
    { name: 'Project Execution', departmentId: dept.group.id, ownerId: vinay.id, description: 'Live project record: owners, team, dates, revenue, issues, documents, timeline.' },
    { name: 'Document & RFP Repository', departmentId: dept.group.id, ownerId: legal.id, description: 'RFPs, contracts, drawings and invoices attached to the parent record.' },
    { name: 'Financial Tracker', departmentId: dept.group.id, ownerId: cfo.id, description: 'Project revenue, invoicing schedule and collections.' },
    { name: 'Risk & Issue Management', departmentId: dept.group.id, ownerId: vinay.id, description: 'What is blocking a project, severity, owner and mitigation.' },
    { name: 'Bidding & Tender Tracker', departmentId: dept.sipl.id, ownerId: bhagyashree.id, description: 'Live tenders, submission deadlines, EMD and consortium partners.' },
    { name: 'Internal Support Request', departmentId: dept.group.id, ownerId: vinay.id, description: 'What a vertical needs from the Group, routing and resolution.' },
    { name: 'KPI & 90-Day Goals', departmentId: dept.group.id, ownerId: govind.id, description: 'Individual and team 90-day commitments tracked to outcome.' },
  ];
  const processes = await Promise.all(processRows.map((p) => prisma.process.create({ data: p })));
  const proc = Object.fromEntries(processes.map((p) => [p.name, p]));

  type WorkSeed = {
    title: string;
    process: string;
    deptKey: string;
    teamId: string;
    assigned: { id: string };
    manager: { id: string };
    createdBy: { id: string };
    priority: WorkPriority;
    status: WorkStatus;
    start: number;
    due: number;
    completed?: number;
    expected: string;
    actual?: string;
    outcome?: OutcomeStatus;
    desc: string;
  };

  const workSeeds: WorkSeed[] = [
    {
      title: 'Arica Buildcon — Township execution',
      process: 'Project Execution',
      deptKey: 'arica',
      teamId: teamBuildcon.id,
      assigned: sahil,
      manager: vinay,
      createdBy: sahil,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      start: 40,
      due: 21,
      expected: 'Delivery milestones on plan with named owners and no unassigned work packages.',
      desc: 'Primary execution record for Arica Real Estate. Client/counterparty, primary owner Sahil Phadnis.',
    },
    {
      title: 'Institutional land parcel — Opportunity qualified',
      process: 'Lead & Opportunity Pipeline',
      deptKey: 'arica',
      teamId: teamBuildcon.id,
      assigned: sahil,
      manager: vinay,
      createdBy: sahil,
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      start: 18,
      due: 14,
      expected: 'Move from Opportunity Qualified to Proposal Submitted with estimated value recorded.',
      desc: 'BD funnel lead. Source: partner introduction. Sector: Institutional.',
    },
    {
      title: 'Biorefinery plant utilisation — Q3 cycle',
      process: 'Project Execution',
      deptKey: 'biofuels',
      teamId: teamBio.id,
      assigned: uday,
      manager: sahil,
      createdBy: uday,
      priority: 'CRITICAL',
      status: 'IN_PROGRESS',
      start: 25,
      due: 10,
      expected: 'Operating CEO has a live utilisation and issue log visible to Group leadership.',
      desc: 'Shri Venkateshwara Biorefineries. Accountable: Sahil Phadnis; Operating CEO: Uday Kulkarni.',
    },
    {
      title: 'SIPL infrastructure package — live execution',
      process: 'Project Execution',
      deptKey: 'sipl',
      teamId: teamSipl.id,
      assigned: bhagyashree,
      manager: vinay,
      createdBy: bhagyashree,
      priority: 'HIGH',
      status: 'IN_REVIEW',
      start: 50,
      due: 7,
      expected: 'End-to-end project record with next invoice date, OEM/vendor and dependency list.',
      desc: 'Solvian Infrastructure and Projects LLP. Accountable partner: Bhagyashree Gurav.',
    },
    {
      title: 'NHAI corridor bid — submission pack',
      process: 'Bidding & Tender Tracker',
      deptKey: 'sipl',
      teamId: teamSipl.id,
      assigned: bhagyashree,
      manager: vinay,
      createdBy: bhagyashree,
      priority: 'CRITICAL',
      status: 'BLOCKED',
      start: 12,
      due: -1,
      expected: 'Tender submitted before deadline with EMD and consortium documents filed.',
      desc: 'Blocked on legal review of consortium terms. Issuing authority: public infrastructure tender.',
    },
    {
      title: 'PSU advisory mandate — Solvian Consultancy',
      process: 'Project Execution',
      deptKey: 'consultancy',
      teamId: teamAdvisory.id,
      assigned: sunil,
      manager: vinay,
      createdBy: sunil,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      start: 30,
      due: 16,
      expected: 'Mandate delivered with named executing lead and documents on the project record.',
      desc: 'Accountable: Sunil Rajani, Govind Mengji (group coordination).',
    },
    {
      title: 'Ideamint brand campaign — 90-day delivery',
      process: 'KPI & 90-Day Goals',
      deptKey: 'ideamint',
      teamId: teamIdeamint.id,
      assigned: yogesh,
      manager: chitra,
      createdBy: chitra,
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      start: 20,
      due: 12,
      expected: 'CEO Yogesh Badhi check-ins logged against 90-day commitments.',
      desc: 'Ideamint India & Chaitra Creations. Accountable: Chitra Mete; CEO: Yogesh Badhi.',
    },
    {
      title: 'Rajasthan agro trade cycle',
      process: 'Project Execution',
      deptKey: 'myara',
      teamId: teamMyara.id,
      assigned: ravikiran,
      manager: vinay,
      createdBy: ravikiran,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      start: 15,
      due: 8,
      expected: 'Trade cycle closed with collections status visible to Finance Committee.',
      desc: 'Myara Trades / Solvian Infra & Agro. Geography: Rajasthan, Odisha, Pan-India.',
    },
    {
      title: 'Client SOC deployment — Arica Tech Security',
      process: 'Project Execution',
      deptKey: 'security',
      teamId: teamSec.id,
      assigned: kunal,
      manager: sidhant,
      createdBy: sidhant,
      priority: 'HIGH',
      status: 'ON_HOLD',
      start: 22,
      due: 5,
      expected: 'SOC go-live with HOD sign-off and contract documents on file.',
      desc: 'On hold pending client IAM roster. Accountable: Sidhant Malegaonkar; HOD: Kunal Dhonge.',
    },
    {
      title: 'Stargold distillery expansion — opportunity',
      process: 'Lead & Opportunity Pipeline',
      deptKey: 'stargold',
      teamId: teamStar.id,
      assigned: sanjay,
      manager: vinay,
      createdBy: sanjay,
      priority: 'MEDIUM',
      status: 'NOT_STARTED',
      start: 2,
      due: 30,
      expected: 'Funnel stage recorded through Proposal Submitted with estimated opportunity value.',
      desc: 'Stargold / BT-Bio Brilliance. Accountable: Sanjay Kanekar.',
    },
    {
      title: 'Digital Command Centre — Phase 1 MVP',
      process: 'Project Execution',
      deptKey: 'mobility',
      teamId: teamMobility.id,
      assigned: govind,
      manager: vinay,
      createdBy: vinay,
      priority: 'CRITICAL',
      status: 'IN_PROGRESS',
      start: 10,
      due: 45,
      expected: 'Vertical master, lead pipeline, project execution, documents, basic finance, risks, and executive dashboard live.',
      desc: 'Group-wide platform. Futuristics Mobility / Group Coordination owner: Govind Mengji.',
    },
    {
      title: 'Q3 invoicing & collections sweep',
      process: 'Financial Tracker',
      deptKey: 'group',
      teamId: teamFinance.id,
      assigned: cfo,
      manager: vinay,
      createdBy: cfo,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      start: 8,
      due: 4,
      expected: 'Planned / raised / collected / overdue invoices visible by vertical.',
      desc: 'Finance Committee oversight across all nine verticals.',
    },
    {
      title: 'Consortium DPA / contract pack — NHAI bid',
      process: 'Document & RFP Repository',
      deptKey: 'group',
      teamId: teamLegal.id,
      assigned: legal,
      manager: vinay,
      createdBy: bhagyashree,
      priority: 'CRITICAL',
      status: 'BLOCKED',
      start: 9,
      due: -2,
      expected: 'Legal clearance of consortium terms so the SIPL bid can submit.',
      desc: 'Documents live with the tender record. Blocking SIPL bid submission.',
    },
    {
      title: 'Funding request — biorefinery working capital',
      process: 'Internal Support Request',
      deptKey: 'biofuels',
      teamId: teamBio.id,
      assigned: uday,
      manager: vinay,
      createdBy: uday,
      priority: 'HIGH',
      status: 'IN_REVIEW',
      start: 6,
      due: 2,
      expected: 'Finance Committee decision logged with rationale and date decided.',
      desc: 'Vertical support request routed to Group Finance / Vinay Phadnis.',
    },
    {
      title: 'Partners review — vertical KPI scorecard',
      process: 'KPI & 90-Day Goals',
      deptKey: 'group',
      teamId: teamMobility.id,
      assigned: govind,
      manager: vinay,
      createdBy: govind,
      priority: 'MEDIUM',
      status: 'COMPLETED',
      start: 40,
      due: 8,
      completed: 6,
      expected: 'Group-level KPI scorecard published for Partners review.',
      actual: 'Scorecard published. Two verticals still missing monthly check-ins.',
      outcome: 'PARTIALLY_ACHIEVED',
      desc: '90-day cycle roll-up for Group Leadership.',
    },
    {
      title: 'Odisha agro offtake — converted project',
      process: 'Project Execution',
      deptKey: 'myara',
      teamId: teamMyara.id,
      assigned: ravikiran,
      manager: vinay,
      createdBy: ravikiran,
      priority: 'MEDIUM',
      status: 'COMPLETED',
      start: 55,
      due: 15,
      completed: 12,
      expected: 'Converted lead becomes an executing project with history carried forward.',
      actual: 'Offtake completed and collections closed. Linked from pipeline conversion.',
      outcome: 'ACHIEVED',
      desc: 'Lead-to-project lifecycle example for Myara.',
    },
    {
      title: 'Arica Properties — RFP response overdue',
      process: 'Lead & Opportunity Pipeline',
      deptKey: 'arica',
      teamId: teamBuildcon.id,
      assigned: sahil,
      manager: vinay,
      createdBy: sahil,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      start: 20,
      due: -3,
      expected: 'Proposal submitted before client deadline.',
      desc: 'Funnel stage: Proposal Submitted target missed. Needs Group visibility.',
    },
  ];

  const createdWork = [];
  for (const w of workSeeds) {
    const item = await prisma.workItem.create({
      data: {
        title: w.title,
        description: w.desc,
        processId: proc[w.process].id,
        departmentId: dept[w.deptKey].id,
        teamId: w.teamId,
        createdById: w.createdBy.id,
        assignedToId: w.assigned.id,
        managerId: w.manager.id,
        priority: w.priority,
        status: w.status,
        startDate: daysAgo(w.start),
        dueDate: w.due >= 0 ? daysFromNow(w.due) : daysAgo(Math.abs(w.due)),
        completedDate: w.completed != null ? daysAgo(w.completed) : null,
        expectedOutcome: w.expected,
      },
    });
    await prisma.outcome.create({
      data: {
        workItemId: item.id,
        expected: w.expected,
        actual: w.actual ?? null,
        status: w.outcome ?? 'PENDING',
        reviewedById: w.outcome ? w.manager.id : null,
        reviewedAt: w.outcome ? daysAgo(w.completed ?? 1) : null,
      },
    });
    createdWork.push({ item, seed: w });
  }

  const findW = (prefix: string) => createdWork.find((x) => x.item.title.startsWith(prefix))!.item;
  const township = findW('Arica Buildcon');
  const nhai = findW('NHAI corridor');
  const command = findW('Digital Command Centre');
  const soc = findW('Client SOC');
  const legalPack = findW('Consortium DPA');

  const taskDefs = [
    { work: township, title: 'Confirm primary and secondary owners', assigned: sahil, created: vinay, status: 'COMPLETED' as WorkStatus, priority: 'HIGH' as WorkPriority, due: -10 },
    { work: township, title: 'Attach drawings and contracts to the project record', assigned: sahil, created: sahil, status: 'IN_PROGRESS' as WorkStatus, priority: 'HIGH' as WorkPriority, due: 5 },
    { work: township, title: 'Log current issues and dependencies', assigned: sahil, created: sahil, status: 'NOT_STARTED' as WorkStatus, priority: 'MEDIUM' as WorkPriority, due: 7 },
    { work: nhai, title: 'Compile EMD and tender forms', assigned: bhagyashree, created: bhagyashree, status: 'COMPLETED' as WorkStatus, priority: 'CRITICAL' as WorkPriority, due: -2 },
    { work: nhai, title: 'Legal clearance of consortium terms', assigned: legal, created: bhagyashree, status: 'BLOCKED' as WorkStatus, priority: 'CRITICAL' as WorkPriority, due: -1 },
    { work: command, title: 'Vertical & company master for all nine verticals', assigned: govind, created: vinay, status: 'COMPLETED' as WorkStatus, priority: 'CRITICAL' as WorkPriority, due: -4 },
    { work: command, title: 'Lead pipeline and project execution modules', assigned: govind, created: vinay, status: 'IN_PROGRESS' as WorkStatus, priority: 'CRITICAL' as WorkPriority, due: 14 },
    { work: command, title: 'Executive Command Centre dashboard', assigned: govind, created: vinay, status: 'IN_PROGRESS' as WorkStatus, priority: 'HIGH' as WorkPriority, due: 20 },
    { work: soc, title: 'Client IAM roster', assigned: kunal, created: sidhant, status: 'ON_HOLD' as WorkStatus, priority: 'HIGH' as WorkPriority, due: 4 },
    { work: legalPack, title: 'Review consortium DPA clause pack', assigned: legal, created: vinay, status: 'BLOCKED' as WorkStatus, priority: 'CRITICAL' as WorkPriority, due: -1 },
  ];

  for (const t of taskDefs) {
    await prisma.task.create({
      data: {
        workItemId: t.work.id,
        title: t.title,
        assignedToId: t.assigned.id,
        createdById: t.created.id,
        status: t.status,
        priority: t.priority,
        startDate: daysAgo(6),
        dueDate: t.due >= 0 ? daysFromNow(t.due) : daysAgo(Math.abs(t.due)),
        completedDate: t.status === 'COMPLETED' ? daysAgo(2) : null,
      },
    });
  }

  await prisma.document.createMany({
    data: [
      {
        workItemId: township.id,
        fileName: 'Arica_Township_Contract.pdf',
        fileType: 'application/pdf',
        fileSize: 512000,
        storagePath: 'seed/Arica_Township_Contract.pdf',
        uploadedById: sahil.id,
        version: 1,
        description: 'Client contract',
      },
      {
        workItemId: nhai.id,
        fileName: 'NHAI_Tender_Notice.pdf',
        fileType: 'application/pdf',
        fileSize: 220100,
        storagePath: 'seed/NHAI_Tender_Notice.pdf',
        uploadedById: bhagyashree.id,
        version: 1,
        description: 'Tender notice',
      },
      {
        workItemId: legalPack.id,
        fileName: 'Consortium_DPA_v2.docx',
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileSize: 88000,
        storagePath: 'seed/Consortium_DPA_v2.docx',
        uploadedById: legal.id,
        version: 2,
        description: 'Legal pack under review',
      },
    ],
  });

  await prisma.comment.createMany({
    data: [
      { workItemId: township.id, userId: sahil.id, message: 'Owners confirmed. Drawings will be uploaded this week so Group can see progress without a status call.' },
      { workItemId: nhai.id, userId: bhagyashree.id, message: 'EMD pack is ready. We cannot submit until Legal clears consortium terms.' },
      { workItemId: legalPack.id, userId: legal.id, message: 'Clause 8.2 still open. This is blocking the SIPL NHAI bid.' },
      { workItemId: command.id, userId: govind.id, message: 'Phase 1: nine verticals are on the master. Pipeline and execution screens next.' },
      { workItemId: soc.id, userId: kunal.id, message: 'Waiting on the client IAM roster before we can resume provisioning.' },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      { entityType: 'WorkItem', entityId: command.id, action: 'WORK_CREATED', newValue: { title: command.title }, performedById: vinay.id, timestamp: daysAgo(10) },
      { entityType: 'WorkItem', entityId: nhai.id, action: 'STATUS_CHANGED', oldValue: { status: 'IN_PROGRESS' }, newValue: { status: 'BLOCKED' }, performedById: bhagyashree.id, timestamp: daysAgo(2) },
      { entityType: 'WorkItem', entityId: nhai.id, action: 'PRIORITY_CHANGED', oldValue: { priority: 'HIGH' }, newValue: { priority: 'CRITICAL' }, performedById: vinay.id, timestamp: daysAgo(2) },
      { entityType: 'Document', entityId: legalPack.id, action: 'DOCUMENT_UPLOADED', newValue: { fileName: 'Consortium_DPA_v2.docx' }, performedById: legal.id, timestamp: daysAgo(1) },
      { entityType: 'Outcome', entityId: findW('Odisha agro').id, action: 'OUTCOME_UPDATED', newValue: { status: 'ACHIEVED' }, performedById: ravikiran.id, timestamp: daysAgo(12) },
    ],
  });

  await prisma.notification.createMany({
    data: [
      { userId: legal.id, title: 'Blocked work', message: 'Consortium DPA / contract pack — NHAI bid is blocked and overdue.', type: 'BLOCKED', workItemId: legalPack.id, read: false },
      { userId: bhagyashree.id, title: 'Due soon', message: 'NHAI corridor bid — submission pack is past the target date.', type: 'OVERDUE', workItemId: nhai.id, read: false },
      { userId: vinay.id, title: 'Review requested', message: 'Funding request — biorefinery working capital is in review.', type: 'REVIEW', read: false },
      { userId: kunal.id, title: 'On hold', message: 'Client SOC deployment is on hold pending IAM roster.', type: 'BLOCKED', workItemId: soc.id, read: false },
      { userId: govind.id, title: 'Assigned work', message: 'You own Digital Command Centre — Phase 1 MVP.', type: 'ASSIGNMENT', workItemId: command.id, read: true },
      { userId: sahil.id, title: 'Overdue', message: 'Arica Properties — RFP response overdue.', type: 'OVERDUE', workItemId: findW('Arica Properties').id, read: false },
    ],
  });

  await prisma.savedFilter.create({
    data: {
      userId: vinay.id,
      name: 'Critical blocked',
      entity: 'WorkItem',
      filters: { priority: 'CRITICAL', blocked: true },
    },
  });

  console.log('Seed complete - Solvian Group Digital Command Centre.');
  console.log('Password for all users: Welcome123!');
  console.log('  Group Leadership   vinay.phadnis@solvian.local');
  console.log('  Admin              admin@solvian.local');
  console.log('  Vertical CEO       sahil.phadnis@solvian.local');
  console.log('  Operating CEO      uday.kulkarni@solvian.local');
  console.log('  Project manager    kunal.dhonge@solvian.local');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
