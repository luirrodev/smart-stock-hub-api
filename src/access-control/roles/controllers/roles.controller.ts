import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  ParseIntPipe,
  Delete,
  Put,
} from '@nestjs/common';

import { RolesService } from '../services/roles.service';
import { AssignPermissionsDto, CreateRoleDto } from '../dtos/role.dto';
import { PermissionsGuard } from '../../permissions/guards/permissions.guard';
import { JWTAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from '../decorators/roles.decorator';
import { RequirePermissions } from '../../permissions/decorators/permissions.decorator';

@Controller('roles')
@UseGuards(JWTAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Roles('admin')
  @RequirePermissions('roles:read')
  getAllRoles() {
    return this.rolesService.getAllRoles();
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('roles:read')
  getRoleById(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.getRoleById(id);
  }

  @Post()
  @Roles('admin')
  @RequirePermissions('roles:write')
  createRole(@Body() payload: CreateRoleDto) {
    return this.rolesService.createRole(payload);
  }

  @Post(':id/permissions')
  @Roles('admin')
  @RequirePermissions('roles:write')
  assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissions(id, payload);
  }

  @Put(':id')
  @Roles('admin')
  @RequirePermissions('roles:write')
  updateRole(@Param('id', ParseIntPipe) id: number, @Body() payload) {
    return this.rolesService.updateRole(id, payload);
  }

  @Delete(':id')
  @Roles('admin')
  @RequirePermissions('roles:write')
  deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.deleteRole(id);
  }
}
