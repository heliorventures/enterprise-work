import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { DocumentsService } from './documents.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('documents')
@ApiBearerAuth()
@Controller()
export class DocumentsController {
  constructor(private documents: DocumentsService) {}

  @Get('documents')
  @RequirePermissions('DOCUMENT_VIEW')
  list(@Query('workItemId') workItemId?: string, @Query('taskId') taskId?: string) {
    return this.documents.list(workItemId, taskId);
  }

  @Get('work-items/:id/documents')
  @RequirePermissions('DOCUMENT_VIEW')
  listForWork(@Param('id') id: string) {
    return this.documents.list(id);
  }

  @Post('work-items/:id/documents')
  @RequirePermissions('DOCUMENT_UPLOAD')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 10_485_760 } }))
  upload(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
    @Body('description') description?: string,
    @Body('taskId') taskId?: string,
  ) {
    return this.documents.upload(file, user, { workItemId: id, taskId, description });
  }

  @Get('documents/:id/download')
  @RequirePermissions('DOCUMENT_VIEW')
  async download(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const { doc, file } = await this.documents.download(id);
    res.setHeader('Content-Type', doc.fileType);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName}"`);
    return file;
  }

  @Delete('documents/:id')
  @RequirePermissions('DOCUMENT_DELETE')
  remove(@Param('id') id: string) {
    return this.documents.remove(id);
  }
}
