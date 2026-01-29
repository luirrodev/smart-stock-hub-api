import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeEnumOnOrders1769723407623 implements MigrationInterface {
  name = 'ChangeEnumOnOrders1769723407623';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."orders_payment_status_enum" RENAME TO "orders_payment_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_payment_status_enum" AS ENUM('CREATED', 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "payment_status" DROP DEFAULT`,
    );
    await queryRunner.query(`UPDATE "orders" SET "payment_status" = CASE "payment_status" 
          WHEN 'paid' THEN 'COMPLETED' 
          WHEN 'pending' THEN 'PENDING' 
          WHEN 'failed' THEN 'FAILED' 
          WHEN 'refunded' THEN 'REFUNDED' 
          ELSE "payment_status" END`);
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "payment_status" TYPE "public"."orders_payment_status_enum" USING "payment_status"::"text"::"public"."orders_payment_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "payment_status" SET DEFAULT 'PENDING'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."orders_payment_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "provider_order_id" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "provider_order_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_payment_status_enum_old" AS ENUM('pending', 'paid', 'failed', 'refunded')`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "payment_status" DROP DEFAULT`,
    );
    await queryRunner.query(`UPDATE "orders" SET "payment_status" = CASE "payment_status" 
          WHEN 'COMPLETED' THEN 'paid' 
          WHEN 'PENDING' THEN 'pending' 
          WHEN 'FAILED' THEN 'failed' 
          WHEN 'REFUNDED' THEN 'refunded' 
          WHEN 'CREATED' THEN 'pending' 
          ELSE "payment_status" END`);
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "payment_status" TYPE "public"."orders_payment_status_enum_old" USING "payment_status"::"text"::"public"."orders_payment_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "payment_status" SET DEFAULT 'pending'`,
    );
    await queryRunner.query(`DROP TYPE "public"."orders_payment_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."orders_payment_status_enum_old" RENAME TO "orders_payment_status_enum"`,
    );
  }
}
