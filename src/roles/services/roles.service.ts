import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { CreateRoleDto } from '../dtos/role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,
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

  async assignPermissions(roleId: number, permissionIds: number[]) {
    const role = await this.getRoleById(roleId);
    const permissions = await this.permissionRepo.findBy({
      id: In(permissionIds),
    });

    role.permissions = [...role.permissions, ...permissions];
    return this.roleRepo.save(role);
  }
}
