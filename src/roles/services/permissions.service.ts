import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from '../entities/permission.entity';
import { Repository } from 'typeorm';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
} from '../dtos/permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,
  ) {}

  async getAllPermissions() {
    return this.permissionRepo.find();
  }

  async getPermissionById(id: number) {
    const permission = await this.permissionRepo.findOne({
      where: { id },
      relations: ['roles'], // Cargamos los roles relacionados con este permiso
    });
    if (!permission) {
      throw new Error('Permission not found');
    }
    return permission;
  }

  async createPermission(data: CreatePermissionDto) {
    const permission = this.permissionRepo.create(data);
    return this.permissionRepo.save(permission);
  }

  async updatePermission(id: number, data: UpdatePermissionDto) {
    const permission = await this.getPermissionById(id);
    permission.description = data.description;
    return this.permissionRepo.save(permission);
  }
}
