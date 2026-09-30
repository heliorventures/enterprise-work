import {
  BadRequestException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DocumentStorageService } from '../../storage/document-storage.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { AuditService } from '../audit/audit.service';
import { EventsGateway } from '../../events/events.gateway';
import { ConfigService } from '@nestjs/config';

const ALLOWED = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png',
  'image/jpeg',
  'text/plain',
]);

const EXT = /\.(pdf|doc|docx|xls|xlsx|csv|ppt|pptx|png|jpe?g|txt)$/i;

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private storage: DocumentStorageService,
    private audit: AuditService,
    private events: EventsGateway,
    private config: ConfigService,
  ) {}

  list(workItemId?: string, taskId?: string) {
    return this.prisma.document.findMany({
      where: {
        ...(workItemId ? { workItemId } : {}),
        ...(taskId ? { taskId } : {}),
      },
      include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async upload(
    file: Express.Multer.File,
    user: AuthUser,
    meta: { workItemId?: string; taskId?: string; description?: string },
  ) {
    const max = Number(this.config.get('MAX_FILE_SIZE') ?? 10_485_760);
    if (!file) throw new BadRequestException({ message: 'File is required', code: 'FILE_REQUIRED' });
    if (file.size > max) {
      throw new BadRequestException({ message: 'File exceeds size limit', code: 'FILE_TOO_LARGE' });
    }
    if (!EXT.test(file.originalname) || (file.mimetype && !ALLOWED.has(file.mimetype) && file.mimetype !== 'application/octet-stream')) {
      throw new BadRequestException({ message: 'File type is not allowed', code: 'FILE_TYPE_INVALID' });
    }
    const saved = await this.storage.save(file.buffer, file.originalname, file.mimetype);
    const latest = meta.workItemId
      ? await this.prisma.document.findFirst({
          where: { workItemId: meta.workItemId, fileName: saved.fileName },
          orderBy: { version: 'desc' },
        })
      : null;
    const doc = await this.prisma.document.create({
      data: {
        workItemId: meta.workItemId,
        taskId: meta.taskId,
        fileName: saved.fileName,
        fileType: file.mimetype || 'application/octet-stream',
        fileSize: file.size,
        storagePath: saved.storagePath,
        uploadedById: user.id,
        version: (latest?.version ?? 0) + 1,
        description: meta.description,
      },
      include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (meta.workItemId) {
      await this.audit.record({
        entityType: 'Document',
        entityId: meta.workItemId,
        action: 'DOCUMENT_UPLOADED',
        performedById: user.id,
        newValue: { fileName: doc.fileName, version: doc.version },
      });
      this.events.emitToWork(meta.workItemId, 'document.uploaded', doc);
    }
    return doc;
  }

  async download(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException({ message: 'Document not found', code: 'DOCUMENT_NOT_FOUND' });
    const buf = await this.storage.read(doc.storagePath);
    return { doc, file: new StreamableFile(buf) };
  }

  async remove(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException({ message: 'Document not found', code: 'DOCUMENT_NOT_FOUND' });
    await this.storage.remove(doc.storagePath);
    await this.prisma.document.delete({ where: { id } });
    return { success: true };
  }
}
