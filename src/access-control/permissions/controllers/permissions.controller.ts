import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PermissionsService } from '../services/permissions.service';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
} from '../dtos/permission.dto';
import { RequirePermissions } from '../decorators/permissions.decorator';
import { JWTAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

@Controller('permissions')
@UseGuards(JWTAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions('permissions:read')
  async getAllPermissions(@Query() paginationDto: PaginationDto) {
    return this.permissionsService.getAllPermissions(paginationDto);
  }

  @Get(':id')
  @RequirePermissions('permissions:read')
  async getPermissionById(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.getPermissionById(id);
  }

  @Post()
  @RequirePermissions('permissions:write')
  async createPermission(@Body() data: CreatePermissionDto) {
    return this.permissionsService.createPermission(data);
  }

  @Put(':id')
  @RequirePermissions('permissions:write')
  async updatePermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdatePermissionDto,
  ) {
    return this.permissionsService.updatePermission(id, data);
  }
}
