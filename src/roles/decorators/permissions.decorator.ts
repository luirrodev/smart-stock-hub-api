import { SetMetadata } from '@nestjs/common';
import { Permission } from '../entities/permission.entity';

export const REQUIRE_PERMISSIONS_KEY = 'require_permissions';
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions);
