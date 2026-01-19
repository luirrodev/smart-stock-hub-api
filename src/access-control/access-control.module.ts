import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './users/entities/user.entity';
import { Role } from './roles/entities/role.entity';
import { Permission } from './permissions/entities/permission.entity';

import { UsersController } from './users/controllers/users.controller';
import { RolesController } from './roles/controllers/roles.controller';
import { PermissionsController } from './permissions/controllers/permissions.controller';

import { UsersService } from './users/services/users.service';
import { RolesService } from './roles/services/roles.service';
import { PermissionsService } from './permissions/services/permissions.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Permission])],
  controllers: [UsersController, RolesController, PermissionsController],
  providers: [UsersService, RolesService, PermissionsService],
  exports: [UsersService, RolesService, PermissionsService],
})
export class AccessControlModule {}
