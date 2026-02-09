import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateStoreUsers1770657349323 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'store_users',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'store_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'customer_id',
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
            name: 'credentials',
            type: 'jsonb',
            isNullable: true,
            default: null,
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
            columnNames: ['store_id', 'customer_id'],
          },
        ],
      }),
      true,
    );

    // Add foreign key to stores
    await queryRunner.createForeignKey(
      'store_users',
      new TableForeignKey({
        columnNames: ['store_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'stores',
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign key to customers
    await queryRunner.createForeignKey(
      'store_users',
      new TableForeignKey({
        columnNames: ['customer_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'customers',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('store_users');
    if (table) {
      // Drop foreign keys
      const storesFk = table.foreignKeys.find(
        (fk) => fk.columnNames[0] === 'store_id',
      );
      if (storesFk) {
        await queryRunner.dropForeignKey('store_users', storesFk);
      }

      const customersFk = table.foreignKeys.find(
        (fk) => fk.columnNames[0] === 'customer_id',
      );
      if (customersFk) {
        await queryRunner.dropForeignKey('store_users', customersFk);
      }

      // Drop table
      await queryRunner.dropTable('store_users');
    }
  }
}
