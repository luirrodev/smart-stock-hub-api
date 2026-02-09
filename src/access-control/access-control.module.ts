import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './users/entities/user.entity';
import { StoreUser } from './users/entities/store-user.entity';
import { Role } from './roles/entities/role.entity';
import { Permission } from './permissions/entities/permission.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Store } from '../stores/entities/store.entity';

import { UsersController } from './users/controllers/users.controller';
import { RolesController } from './roles/controllers/roles.controller';
import { PermissionsController } from './permissions/controllers/permissions.controller';

import { UsersService } from './users/services/users.service';
import { StoreUsersService } from './users/services/store-users.service';
import { RolesService } from './roles/services/roles.service';
import { PermissionsService } from './permissions/services/permissions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      StoreUser,
      Role,
      Permission,
      Customer,
      Store,
    ]),
  ],
  controllers: [UsersController, RolesController, PermissionsController],
  providers: [
    UsersService,
    StoreUsersService,
    RolesService,
    PermissionsService,
  ],
  exports: [UsersService, StoreUsersService, RolesService, PermissionsService],
})
export class AccessControlModule {}
