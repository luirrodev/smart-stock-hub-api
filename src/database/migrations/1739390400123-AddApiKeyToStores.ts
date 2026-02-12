import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import * as crypto from 'crypto';

export class AddApiKeyToStores1739390400123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add api_key column with temporary default
    await queryRunner.addColumn(
      'stores',
      new TableColumn({
        name: 'api_key',
        type: 'varchar',
        length: '255',
        isUnique: true,
        isNullable: true, // Temporary nullable to allow existing rows
        default: null,
      }),
    );

    // 2. Generate API keys for existing stores
    const stores = await queryRunner.query('SELECT id FROM stores');

    for (const store of stores) {
      const apiKey = crypto.randomBytes(32).toString('hex');
      await queryRunner.query('UPDATE stores SET api_key = $1 WHERE id = $2', [
        apiKey,
        store.id,
      ]);
    }

    // 3. Make api_key NOT NULL after populating
    await queryRunner.changeColumn(
      'stores',
      new TableColumn({
        name: 'api_key',
        type: 'varchar',
        length: '255',
        isUnique: true,
        isNullable: true,
        default: null,
      }),
      new TableColumn({
        name: 'api_key',
        type: 'varchar',
        length: '255',
        isUnique: true,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('stores', 'api_key');
  }
}
