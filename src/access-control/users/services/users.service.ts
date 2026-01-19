import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';
import * as bcrypt from 'bcryptjs';
import { RolesService } from 'src/access-control/roles/services/roles.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private readonly roleService: RolesService,
  ) {}

  findAll() {
    return this.userRepo.find();
  }

  async findOne(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['role.permissions'],
    });
    if (!user) {
      throw new NotFoundException('This user does not exist');
    }
    return user;
  }

  async findByEmail(email: string) {
    const user = await this.userRepo.findOne({
      where: { email },
      relations: ['role.permissions'],
    });
    if (!user) {
      throw new NotFoundException('This user does not exist');
    }
    return user;
  }

  async create(data: CreateUserDto) {
    const existingUser = await this.userRepo.findOne({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new ConflictException('This email is already in use');
    }

    const role = await this.roleService.getRoleById(data.role);
    const { role: role_id, ...userData } = data;

    const newUser = this.userRepo.create(userData);
    newUser.role = role;

    const hashPassword = await bcrypt.hash(newUser.password, 10);
    newUser.password = hashPassword;

    return this.userRepo.save(newUser);
  }

  async update(id: number, changes: UpdateUserDto) {
    const userToUpdate = await this.findOne(id);

    if (changes.email && changes.email !== userToUpdate.email) {
      const existingUser = await this.userRepo.findOne({
        where: { email: changes.email },
      });
      if (existingUser) {
        throw new ConflictException('This email is already in use');
      }
    }

    if (changes.role) {
      const role = await this.roleService.getRoleById(changes.role);
      const { role: roleId, ...otherChanges } = changes;
      this.userRepo.merge(userToUpdate, otherChanges);
      userToUpdate.role = role;
    } else {
      const { role, ...otherChanges } = changes;
      this.userRepo.merge(userToUpdate, otherChanges);
    }
    return this.userRepo.save(userToUpdate);
  }

  remove(id: number) {
    return this.userRepo.delete(id);
  }
}
