import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for Staff User (Admin) Profile Response
 * Contains staff member information and their permissions
 */
export class StaffUserProfileResponseDto {
  @ApiProperty({
    description: 'StaffUser ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'User ID (global unique identifier)',
    example: 5,
  })
  userId: number;

  @ApiProperty({
    description: "Staff member's first name",
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: "Staff member's last name",
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: "Staff member's email address",
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Role/Position name',
    example: 'admin',
  })
  role: string;

  @ApiProperty({
    type: [String],
    description: 'List of permissions assigned to this role',
    example: ['manage_users', 'manage_stores', 'view_reports'],
    isArray: true,
  })
  permissions: string[];

  @ApiProperty({
    description: 'Whether the staff account is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Account creation date',
    example: '2024-01-15T10:00:00Z',
  })
  createdAt: Date;
}
