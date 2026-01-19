import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { PermissionsService } from '../../permissions/services/permissions.service';
import { AssignPermissionsDto, CreateRoleDto } from '../dtos/role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    private permissionsService: PermissionsService,
  ) {}

  async createRole(data: CreateRoleDto) {
    const role = this.roleRepo.create(data);
    return this.roleRepo.save(role);
  }

  async getAllRoles() {
    return this.roleRepo.find();
  }

  async getRoleById(id: number): Promise<Role> {
    const role = await this.roleRepo.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async assignPermissions(id: number, data: AssignPermissionsDto) {
    const role = await this.getRoleById(id);
    const permissions = await this.permissionsService.findByIds(
      data.permissionIds,
    );

    role.permissions = [...role.permissions, ...permissions];
    return this.roleRepo.save(role);
  }

  async updateRole(id: number, data: { description: string }) {
    const role = await this.getRoleById(id);
    this.roleRepo.merge(role, data);
    return this.roleRepo.save(role);
  }

  async deleteRole(id: number) {
    const role = await this.getRoleById(id);
    return this.roleRepo.remove(role);
  }
}
