import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PermissionsService } from '../services/permissions.service';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
} from '../dtos/permission.dto';
import { Roles } from '../../roles/decorators/roles.decorator';
import { RequirePermissions } from '../decorators/permissions.decorator';
import { JWTAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';

@Controller('permissions')
@UseGuards(JWTAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @Roles('admin')
  @RequirePermissions('permissions:read')
  async getAllPermissions() {
    return this.permissionsService.getAllPermissions();
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('permissions:read')
  async getPermissionById(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.getPermissionById(id);
  }

  @Post()
  @Roles('admin')
  @RequirePermissions('permissions:write')
  async createPermission(@Body() data: CreatePermissionDto) {
    return this.permissionsService.createPermission(data);
  }

  @Put(':id')
  @Roles('admin')
  @RequirePermissions('permissions:write')
  async updatePermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdatePermissionDto,
  ) {
    return this.permissionsService.updatePermission(id, data);
  }
}
