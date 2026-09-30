import { Global, Module } from '@nestjs/common';
import { DocumentStorageService, LocalDocumentStorage } from './document-storage.service';

@Global()
@Module({
  providers: [{ provide: DocumentStorageService, useClass: LocalDocumentStorage }],
  exports: [DocumentStorageService],
})
export class StorageModule {}
