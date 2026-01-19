export interface PayloadToken {
  role: string;
  roleId: number;
  roleVersion: number;
  sub: number;
}

export interface UserPermissionsCache {
  roleId: number;
  roleName: string;
  roleVersion: number;
  permissions: string[];
}
