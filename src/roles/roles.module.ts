import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';

import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolesController } from './controllers/roles.controller';
import { RolesService } from './services/roles.service';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission])],
  controllers: [RolesController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    RolesService,
  ],
})
export class RolesModule {}
