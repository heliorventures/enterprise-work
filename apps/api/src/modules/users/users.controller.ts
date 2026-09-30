import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { IsOptional, IsString } from 'class-validator';

class UserQuery extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  teamId?: string;
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get()
  @RequirePermissions('USER_VIEW')
  list(@CurrentUser() user: AuthUser, @Query() q: UserQuery) {
    return this.users.list(user, q);
  }

  @Get(':id')
  @RequirePermissions('USER_VIEW')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.users.get(id, user);
  }

  @Post()
  @RequirePermissions('USER_CREATE')
  create(@Body() dto: CreateUserDto, @CurrentUser() user: AuthUser) {
    return this.users.create(dto, user);
  }

  @Put(':id')
  @RequirePermissions('USER_UPDATE')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: AuthUser) {
    return this.users.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions('USER_DELETE')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.users.remove(id, user);
  }
}
