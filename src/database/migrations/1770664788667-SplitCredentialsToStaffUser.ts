import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class SplitCredentialsToStaffUser1770664788667
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create staff_users table
    await queryRunner.createTable(
      new Table({
        name: 'staff_users',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'password',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'google_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'auth_provider',
            type: 'varchar',
            length: '50',
            default: "'local'",
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'last_login_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
        uniques: [
          {
            columnNames: ['user_id'],
          },
        ],
      }),
      true,
    );

    // 2. Add foreign key to users
    await queryRunner.createForeignKey(
      'staff_users',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // 3. Copy STAFF user credentials from users table
    // Only copy non-customer users that have password or google_id
    await queryRunner.query(`
      INSERT INTO staff_users (user_id, password, google_id, auth_provider, is_active, last_login_at, created_at, updated_at, deleted_at)
      SELECT u.id, u.password, u.google_id, u.auth_provider, u.is_active, u.last_login_at, u.created_at, u.updated_at, u.deleted_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name != 'customer' AND (u.password IS NOT NULL OR u.google_id IS NOT NULL)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('staff_users');
    if (table) {
      const fk = table.foreignKeys.find((k) => k.columnNames[0] === 'user_id');
      if (fk) {
        await queryRunner.dropForeignKey('staff_users', fk);
      }
      await queryRunner.dropTable('staff_users');
    }
  }
}
