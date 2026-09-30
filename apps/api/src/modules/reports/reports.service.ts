import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../../database/prisma.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { workItemWhereForUser } from '../../common/utils/scope';
import { DashFilters } from '../dashboard/dashboard.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private where(user: AuthUser, f: DashFilters): Prisma.WorkItemWhereInput {
    const parts: Prisma.WorkItemWhereInput[] = [workItemWhereForUser(user) as Prisma.WorkItemWhereInput];
    if (f.departmentId) parts.push({ departmentId: f.departmentId });
    if (f.teamId) parts.push({ teamId: f.teamId });
    if (f.employeeId) parts.push({ assignedToId: f.employeeId });
    if (f.processId) parts.push({ processId: f.processId });
    if (f.status) parts.push({ status: f.status });
    if (f.from || f.to) {
      parts.push({
        createdAt: {
          ...(f.from ? { gte: new Date(f.from) } : {}),
          ...(f.to ? { lte: new Date(f.to) } : {}),
        },
      });
    }
    return { AND: parts };
  }

  private async items(user: AuthUser, f: DashFilters) {
    return this.prisma.workItem.findMany({
      where: this.where(user, f),
      include: {
        process: true,
        department: true,
        team: true,
        assignedTo: true,
        manager: true,
        outcome: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async workSummary(user: AuthUser, f: DashFilters) {
    const items = await this.items(user, f);
    const now = new Date();
    return {
      total: items.length,
      byStatus: this.group(items.map((i) => i.status)),
      byPriority: this.group(items.map((i) => i.priority)),
      overdue: items.filter((i) => i.dueDate && i.dueDate < now && !['COMPLETED', 'CANCELLED'].includes(i.status)).length,
      items: items.map(this.row),
    };
  }

  async departmentPerformance(user: AuthUser, f: DashFilters) {
    const items = await this.items(user, f);
    const map = new Map<string, typeof items>();
    for (const i of items) {
      const key = i.department?.name ?? 'Unassigned';
      map.set(key, [...(map.get(key) || []), i]);
    }
    return [...map.entries()].map(([department, rows]) => ({
      department,
      total: rows.length,
      completed: rows.filter((r) => r.status === 'COMPLETED').length,
      blocked: rows.filter((r) => r.status === 'BLOCKED').length,
      overdue: rows.filter((r) => r.dueDate && r.dueDate < new Date() && !['COMPLETED', 'CANCELLED'].includes(r.status)).length,
      outcomesAchieved: rows.filter((r) => r.outcome?.status === 'ACHIEVED').length,
    }));
  }

  async processPerformance(user: AuthUser, f: DashFilters) {
    const items = await this.items(user, f);
    const map = new Map<string, typeof items>();
    for (const i of items) {
      const key = i.process.name;
      map.set(key, [...(map.get(key) || []), i]);
    }
    return [...map.entries()].map(([process, rows]) => ({
      process,
      total: rows.length,
      completed: rows.filter((r) => r.status === 'COMPLETED').length,
      inProgress: rows.filter((r) => r.status === 'IN_PROGRESS').length,
      blocked: rows.filter((r) => r.status === 'BLOCKED').length,
      outcomeRate: rows.length
        ? Math.round((rows.filter((r) => r.outcome?.status === 'ACHIEVED').length / rows.length) * 100)
        : 0,
    }));
  }

  async outcomes(user: AuthUser, f: DashFilters) {
    const items = await this.items(user, f);
    return {
      summary: this.group(items.map((i) => i.outcome?.status ?? 'PENDING')),
      items: items.map(this.row),
    };
  }

  async overdue(user: AuthUser, f: DashFilters) {
    const items = await this.items(user, { ...f });
    const now = new Date();
    return items.filter((i) => i.dueDate && i.dueDate < now && !['COMPLETED', 'CANCELLED'].includes(i.status)).map(this.row);
  }

  async completionTrends(user: AuthUser, f: DashFilters) {
    const items = await this.items(user, f);
    const buckets = new Map<string, { created: number; completed: number }>();
    for (const i of items) {
      const key = i.createdAt.toISOString().slice(0, 10);
      const cur = buckets.get(key) ?? { created: 0, completed: 0 };
      cur.created += 1;
      if (i.status === 'COMPLETED') cur.completed += 1;
      buckets.set(key, cur);
    }
    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));
  }

  async export(user: AuthUser, f: DashFilters, format: 'csv' | 'xlsx' | 'pdf', kind: string) {
    const summary = await this.workSummary(user, f);
    const rows = summary.items;
    const headers = ['Title', 'Process', 'Department', 'Assigned To', 'Priority', 'Status', 'Due Date', 'Outcome'];
    if (format === 'csv') {
      const lines = [headers.join(','), ...rows.map((r) => headers.map((h) => csv(String(cell(r, h)))).join(','))];
      return { buffer: Buffer.from(lines.join('\n'), 'utf8'), contentType: 'text/csv', filename: `${kind}.csv` };
    }
    if (format === 'xlsx') {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Report');
      ws.addRow(headers);
      rows.forEach((r) => ws.addRow(headers.map((h) => cell(r, h))));
      const buffer = Buffer.from(await wb.xlsx.writeBuffer());
      return { buffer, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: `${kind}.xlsx` };
    }
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ margin: 40, size: 'LETTER' });
    doc.on('data', (c) => chunks.push(c as Buffer));
    const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));
    doc.fontSize(16).text('Solvian Command Centre Report', { underline: false });
    doc.moveDown(0.5).fontSize(10).text(`Generated ${new Date().toLocaleString()}`);
    doc.moveDown();
    rows.slice(0, 40).forEach((r) => {
      doc.fontSize(11).text(r.title);
      doc.fontSize(9).fillColor('#555').text(`${r.process} · ${r.status} · ${r.assignedTo}`);
      doc.fillColor('#000').moveDown(0.4);
    });
    doc.end();
    const buffer = await done;
    return { buffer, contentType: 'application/pdf', filename: `${kind}.pdf` };
  }

  private group(values: string[]) {
    return values.reduce<Record<string, number>>((acc, v) => {
      acc[v] = (acc[v] || 0) + 1;
      return acc;
    }, {});
  }

  private row = (i: Awaited<ReturnType<ReportsService['items']>>[number]) => ({
    id: i.id,
    title: i.title,
    process: i.process.name,
    department: i.department?.name ?? '—',
    assignedTo: i.assignedTo ? `${i.assignedTo.firstName} ${i.assignedTo.lastName}` : 'Unassigned',
    priority: i.priority,
    status: i.status,
    dueDate: i.dueDate,
    outcome: i.outcome?.status ?? 'PENDING',
  });
}

function csv(v: string) {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function cell(r: Record<string, unknown>, header: string) {
  const map: Record<string, string> = {
    Title: 'title',
    Process: 'process',
    Department: 'department',
    'Assigned To': 'assignedTo',
    Priority: 'priority',
    Status: 'status',
    'Due Date': 'dueDate',
    Outcome: 'outcome',
  };
  const val = r[map[header]];
  return val instanceof Date ? val.toISOString().slice(0, 10) : val ?? '';
}
