import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { IsOptional, IsString } from 'class-validator';

class AuditQuery extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  entityId?: string;
}

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private audit: AuditService) {}

  @Get()
  @RequirePermissions('AUDIT_VIEW')
  list(@Query() q: AuditQuery) {
    return this.audit.list({
      entityType: q.entityType,
      entityId: q.entityId,
      page: q.page,
      pageSize: q.pageSize,
    });
  }
}
