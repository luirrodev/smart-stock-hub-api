import { SetMetadata } from '@nestjs/common';
import { Role } from '../models/roles.model';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// *** This decorator is used to set the roles metadata for a route handler.
// *** It allows you to specify which roles are allowed to access the route.
