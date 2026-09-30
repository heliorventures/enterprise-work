import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export abstract class DocumentStorageService {
  abstract save(buffer: Buffer, originalName: string, mimeType: string): Promise<{ storagePath: string; fileName: string }>;
  abstract read(storagePath: string): Promise<Buffer>;
  abstract remove(storagePath: string): Promise<void>;
}

@Injectable()
export class LocalDocumentStorage extends DocumentStorageService {
  private readonly root: string;

  constructor(config: ConfigService) {
    super();
    this.root = config.get('FILE_STORAGE_PATH') || './uploads';
  }

  async save(buffer: Buffer, originalName: string) {
    const ext = path.extname(originalName);
    const safe = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const id = randomUUID();
    const rel = path.join(id.slice(0, 2), `${id}${ext}`);
    const abs = path.join(this.root, rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, buffer);
    return { storagePath: rel.replace(/\\/g, '/'), fileName: safe };
  }

  async read(storagePath: string) {
    return fs.readFile(path.join(this.root, storagePath));
  }

  async remove(storagePath: string) {
    await fs.unlink(path.join(this.root, storagePath)).catch(() => undefined);
  }
}
