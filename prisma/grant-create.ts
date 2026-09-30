import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const GRANT: Record<string, string[]> = {
  VP: [
    'TASK_CREATE',
    'TASK_UPDATE',
    'TASK_ASSIGN',
    'PROCESS_CREATE',
    'PROCESS_UPDATE',
    'DOCUMENT_UPLOAD',
    'WORK_CREATE',
    'WORK_UPDATE',
    'WORK_ASSIGN',
  ],
  EMPLOYEE: ['TASK_CREATE', 'WORK_CREATE'],
};

async function main() {
  for (const [roleName, codes] of Object.entries(GRANT)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) continue;
    const perms = await prisma.permission.findMany({ where: { code: { in: codes } } });
    for (const p of perms) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: p.id } },
        create: { roleId: role.id, permissionId: p.id },
        update: {},
      });
    }
    console.log(`Granted create permissions to ${roleName}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
