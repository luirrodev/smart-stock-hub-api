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
import { RequirePermissions } from '../../permissions/decorators/permissions.decorator';

@Controller('roles')
@UseGuards(JWTAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('roles:read')
  getAllRoles() {
    return this.rolesService.getAllRoles();
  }

  @Get(':id')
  @RequirePermissions('roles:read')
  getRoleById(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.getRoleById(id);
  }

  @Post()
  @RequirePermissions('roles:write')
  createRole(@Body() payload: CreateRoleDto) {
    return this.rolesService.createRole(payload);
  }

  @Post(':id/permissions')
  @RequirePermissions('roles:write')
  assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissions(id, payload);
  }

  @Put(':id')
  @RequirePermissions('roles:write')
  updateRole(@Param('id', ParseIntPipe) id: number, @Body() payload) {
    return this.rolesService.updateRole(id, payload);
  }

  @Delete(':id')
  @RequirePermissions('roles:write')
  deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.deleteRole(id);
  }
}
