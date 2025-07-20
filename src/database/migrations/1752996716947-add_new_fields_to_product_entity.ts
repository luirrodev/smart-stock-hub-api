import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewFieldsToProductEntity1752996716947 implements MigrationInterface {
    name = 'AddNewFieldsToProductEntity1752996716947'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "sku" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "UQ_c44ac33a05b144dd0d9ddcf9327" UNIQUE ("sku")`);
        await queryRunner.query(`ALTER TABLE "products" ADD "barcode" character varying(100)`);
        await queryRunner.query(`CREATE TYPE "public"."products_status_enum" AS ENUM('active', 'discontinued', 'out_of_stock')`);
        await queryRunner.query(`ALTER TABLE "products" ADD "status" "public"."products_status_enum" NOT NULL DEFAULT 'active'`);
        await queryRunner.query(`ALTER TABLE "products" ADD "cost" double precision`);
        await queryRunner.query(`ALTER TABLE "products" ADD "notes" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "cost"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."products_status_enum"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "barcode"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "UQ_c44ac33a05b144dd0d9ddcf9327"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "sku"`);
    }

}
