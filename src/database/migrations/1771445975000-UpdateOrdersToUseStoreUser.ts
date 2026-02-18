import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class UpdateOrdersToUseStoreUser1771445975000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add new store_user_id column (nullable initially)
    await queryRunner.addColumn(
      'orders',
      new TableColumn({
        name: 'store_user_id',
        type: 'int',
        isNullable: true,
      }),
    );

    // 2. Populate store_user_id from customer_id + store_id by joining with store_users
    // StoreUser has a unique constraint on [store_id, customer_id]
    await queryRunner.query(`
      UPDATE orders
      SET store_user_id = store_users.id
      FROM store_users
      WHERE store_users.customer_id = orders.customer_id
        AND store_users.store_id = orders.store_id
    `);

    // 3. Verify all orders have store_user_id populated
    const orphanedOrders = await queryRunner.query(`
      SELECT COUNT(*) as count FROM orders WHERE store_user_id IS NULL
    `);

    if (orphanedOrders[0]?.count > 0) {
      throw new Error(
        `Migration failed: ${orphanedOrders[0].count} orders could not be matched to store_users. ` +
          'Ensure all customers have corresponding StoreUser records.',
      );
    }

    // 4. Make store_user_id NOT NULL
    await queryRunner.changeColumn(
      'orders',
      new TableColumn({
        name: 'store_user_id',
        type: 'int',
        isNullable: true,
      }),
      new TableColumn({
        name: 'store_user_id',
        type: 'int',
        isNullable: false,
      }),
    );

    // 5. Add foreign key constraint on store_user_id
    await queryRunner.createForeignKey(
      'orders',
      new TableForeignKey({
        name: 'fk_orders_store_user_id',
        columnNames: ['store_user_id'],
        referencedTableName: 'store_users',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION',
      }),
    );

    // 6. Drop foreign key constraint on customer_id
    const table = await queryRunner.getTable('orders');
    const customerForeignKey = table?.foreignKeys.find((fk) =>
      fk.columnNames.includes('customer_id'),
    );

    if (customerForeignKey) {
      await queryRunner.dropForeignKey('orders', customerForeignKey);
    }

    // 7. Drop the customer_id column
    await queryRunner.dropColumn('orders', 'customer_id');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse migration: restore customer_id column and drop store_user_id

    // 1. Add back customer_id column (nullable initially)
    await queryRunner.addColumn(
      'orders',
      new TableColumn({
        name: 'customer_id',
        type: 'int',
        isNullable: true,
      }),
    );

    // 2. Populate customer_id from store_users relationship
    await queryRunner.query(`
      UPDATE orders
      SET customer_id = store_users.customer_id
      FROM store_users
      WHERE store_users.id = orders.store_user_id
    `);

    // 3. Make customer_id NOT NULL
    await queryRunner.changeColumn(
      'orders',
      new TableColumn({
        name: 'customer_id',
        type: 'int',
        isNullable: true,
      }),
      new TableColumn({
        name: 'customer_id',
        type: 'int',
        isNullable: false,
      }),
    );

    // 4. Add back foreign key constraint on customer_id
    await queryRunner.createForeignKey(
      'orders',
      new TableForeignKey({
        name: 'fk_orders_customer_id',
        columnNames: ['customer_id'],
        referencedTableName: 'customers',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION',
      }),
    );

    // 5. Drop foreign key on store_user_id
    const table = await queryRunner.getTable('orders');
    const storeUserForeignKey = table?.foreignKeys.find((fk) =>
      fk.columnNames.includes('store_user_id'),
    );

    if (storeUserForeignKey) {
      await queryRunner.dropForeignKey('orders', storeUserForeignKey);
    }

    // 6. Drop store_user_id column
    await queryRunner.dropColumn('orders', 'store_user_id');
  }
}
