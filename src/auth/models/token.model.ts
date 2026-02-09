/**
 * JWT Payload Token Interface
 *
 * This token is used for both STAFF and CUSTOMER users, with different semantics:
 *
 * STAFF TOKEN (admin, employee, auditor, etc.):
 * - sub: User ID (from users table)
 * - role: Staff role name
 * - customerId: NOT present
 * - storeId: Optional - only present when endpoint requires store context
 * - storeUserId, credentials: NOT present
 *
 * CUSTOMER TOKEN (role.name === 'customer'):
 * - sub: Customer ID (from customers table)
 * - customerId: Also set to Customer ID for clarity
 * - role: Always 'customer'
 * - storeId: REQUIRED - specifies which store this token is for
 * - storeUserId: REQUIRED - reference to the StoreUser record
 * - credentials: Optional - auth provider info (google, local, etc)
 */
export interface PayloadToken {
  /** Subject identifier - meaning depends on role:
   *  - For STAFF: User ID from users table
   *  - For CUSTOMER: Customer ID from customers table
   */
  sub: number;

  /** Role name (e.g., 'admin', 'employee', 'customer', 'auditor') */
  role: string;

  /** Role ID from roles table */
  roleId: number;

  /** Role version - used for permission cache invalidation.
   *  If this doesn't match the current role version, user must re-authenticate
   */
  roleVersion: number;

  /** Customer ID - present only for CUSTOMER users.
   *  For STAFF users, this field is not included in the token
   */
  customerId?: number | null;

  /** Authentication method: 'local', 'google', or 'service'.
   *  Defaults to 'local'
   */
  authMethod?: 'local' | 'google' | 'service';

  /** Store context - semantics depend on role:
   *  - For STAFF: Optional, per-endpoint context selection
   *  - For CUSTOMER: REQUIRED, specifies the store for this session
   */
  storeId?: number;

  /** StoreUser ID - present only when storeId is present.
   *  References the specific StoreUser record for customer-store credentials
   *  Only populated for CUSTOMER users
   */
  storeUserId?: number;

  /** Store-specific user credentials metadata.
   *  Only populated for CUSTOMER users with store context
   */
  storeCustomerId?: number | null;
}

export interface UserPermissionsCache {
  roleId: number;
  roleName: string;
  roleVersion: number;
  permissions: string[];
}
