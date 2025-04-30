import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { PermissionsService } from '../services/permissions.service';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
} from '../dtos/permission.dto';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  async getAllPermissions() {
    return this.permissionsService.getAllPermissions();
  }

  @Get(':id')
  async getPermissionById(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.getPermissionById(id);
  }

  @Post()
  async createPermission(@Body() data: CreatePermissionDto) {
    return this.permissionsService.createPermission(data);
  }

  @Put(':id')
  async updatePermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdatePermissionDto,
  ) {
    return this.permissionsService.updatePermission(id, data);
  }
}
