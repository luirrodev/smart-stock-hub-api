import { Controller, Post, Body, UseGuards } from '@nestjs/common';

import { RolesService } from '../services/roles.service';
import { CreateRoleDto } from '../dtos/role.dto';
// import { AssignPermissionsDto } from './dto/assign-permissions.dto';
// import { RequirePermissions } from '../decorators/permissions.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';

@Controller('roles')
@UseGuards(PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  // @RequirePermissions('create_role')
  createRole(@Body() payload: CreateRoleDto) {
    return this.rolesService.createRole(payload);
  }

  // @Post(':roleId/permissions')
  // @RequirePermissions('manage_permissions')
  // assignPermissions(@Body() dto: AssignPermissionsDto) {
  //   return this.rolesService.assignPermissions(dto.roleId, dto.permissionIds);
  // }
}
