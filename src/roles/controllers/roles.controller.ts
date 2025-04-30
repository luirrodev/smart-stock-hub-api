import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import { RolesService } from '../services/roles.service';
import { AssignPermissionsDto, CreateRoleDto } from '../dtos/role.dto';
// import { AssignPermissionsDto } from './dto/assign-permissions.dto';
// import { RequirePermissions } from '../decorators/permissions.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';

@Controller('roles')
@UseGuards(PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  getAllRoles() {
    return this.rolesService.getAllRoles();
  }

  @Get(':id')
  getRoleById(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.getRoleById(id);
  }

  @Post()
  createRole(@Body() payload: CreateRoleDto) {
    return this.rolesService.createRole(payload);
  }

  @Post(':id/permissions')
  assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissions(id, payload);
  }
}
