import { User } from 'src/access-control/users/entities/user.entity';
import { Role } from 'src/access-control/roles/entities/role.entity';

/**
 * Factory function to create complete User mock objects for testing
 * Ensures all required fields are present to pass TypeScript type checking
 */
export function createMockUser(overrides?: Partial<User>): User {
  const defaultRole: Role = {
    id: 1,
    name: 'admin',
    description: 'Administrator',
    version: 1,
    permissions: [],
  };

  return {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    roleId: 1,
    role: defaultRole,
    phone: null,
    avatar: null,
    preferences: null,
    customerId: null,
    customer: undefined,
    createdBy: undefined,
    updatedBy: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  } as unknown as User;
}

/**
 * Create a STAFF user (admin, employee, auditor, etc.)
 */
export function createMockStaffUser(overrides?: Partial<User>): User {
  return createMockUser({
    id: 1,
    email: 'admin@example.com',
    name: 'Admin User',
    role: {
      id: 1,
      name: 'admin',
      description: 'Administrator',
      version: 1,
      permissions: [],
    },
    roleId: 1,
    customerId: null,
    ...overrides,
  });
}

/**
 * Create a CUSTOMER user
 */
export function createMockCustomerUser(overrides?: Partial<User>): User {
  return createMockUser({
    id: 2,
    email: 'customer@example.com',
    name: 'Customer User',
    role: {
      id: 2,
      name: 'customer',
      description: 'Customer',
      version: 1,
      permissions: [],
    },
    roleId: 2,
    customerId: 10,
    ...overrides,
  });
}

/**
 * Create a mock Role
 */
export function createMockRole(overrides?: Partial<Role>): Role {
  return {
    id: 1,
    name: 'admin',
    description: 'Administrator',
    version: 1,
    permissions: [],
    ...overrides,
  } as Role;
}
