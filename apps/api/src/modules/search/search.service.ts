import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { workItemWhereForUser } from '../../common/utils/scope';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(q: string, user: AuthUser) {
    const term = q.trim();
    if (term.length < 2) {
      return { workItems: [], tasks: [], users: [], processes: [], documents: [], departments: [] };
    }
    const [workItems, tasks, users, processes, documents, departments] = await Promise.all([
      this.prisma.workItem.findMany({
        where: {
          AND: [
            workItemWhereForUser(user) as never,
            { OR: [{ title: { contains: term, mode: 'insensitive' } }, { description: { contains: term, mode: 'insensitive' } }] },
          ],
        },
        select: { id: true, title: true, status: true, priority: true },
        take: 8,
      }),
      this.prisma.task.findMany({
        where: { title: { contains: term, mode: 'insensitive' } },
        select: { id: true, title: true, status: true, workItemId: true },
        take: 8,
      }),
      this.prisma.user.findMany({
        where: {
          OR: [
            { firstName: { contains: term, mode: 'insensitive' } },
            { lastName: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: { id: true, firstName: true, lastName: true, email: true },
        take: 8,
      }),
      this.prisma.process.findMany({
        where: { name: { contains: term, mode: 'insensitive' } },
        select: { id: true, name: true },
        take: 8,
      }),
      this.prisma.document.findMany({
        where: { fileName: { contains: term, mode: 'insensitive' } },
        select: { id: true, fileName: true, workItemId: true },
        take: 8,
      }),
      this.prisma.department.findMany({
        where: { name: { contains: term, mode: 'insensitive' } },
        select: { id: true, name: true },
        take: 8,
      }),
    ]);
    return { workItems, tasks, users, processes, documents, departments };
  }
}
