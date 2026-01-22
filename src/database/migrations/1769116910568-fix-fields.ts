import { MigrationInterface, QueryRunner } from "typeorm";

export class FixFields1769116910568 implements MigrationInterface {
    name = 'FixFields1769116910568'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shipping_addresses" DROP CONSTRAINT "FK_c5a977fc21116efb37481bdbe51"`);
        await queryRunner.query(`ALTER TABLE "shipping_addresses" RENAME COLUMN "customerId" TO "customer_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastLoginAt"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "purchaseCount"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "totalSpent"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "lastPurchaseAt"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "is_active" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "users" ADD "last_login_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" ADD "customer_id" integer`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_c7bc1ffb56c570f42053fa7503b" UNIQUE ("customer_id")`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "purchase_count" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "total_spent" numeric(14,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "last_purchase_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_c7bc1ffb56c570f42053fa7503b" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shipping_addresses" ADD CONSTRAINT "FK_6acb476f20430e32f8382511c6b" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shipping_addresses" DROP CONSTRAINT "FK_6acb476f20430e32f8382511c6b"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_c7bc1ffb56c570f42053fa7503b"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "last_purchase_at"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "total_spent"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "purchase_count"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_c7bc1ffb56c570f42053fa7503b"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "customer_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_login_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_active"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "lastPurchaseAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "totalSpent" numeric(14,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "purchaseCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastLoginAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "shipping_addresses" RENAME COLUMN "customer_id" TO "customerId"`);
        await queryRunner.query(`ALTER TABLE "shipping_addresses" ADD CONSTRAINT "FK_c5a977fc21116efb37481bdbe51" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
