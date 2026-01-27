import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedTableOrderStatus1769523180327 implements MigrationInterface {
    name = 'AddedTableOrderStatus1769523180327'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "order_status" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "code" character varying(50) NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_96a7efa43bbc9ad9bc137016d8b" UNIQUE ("name"), CONSTRAINT "UQ_5ba083ed178d6a695d146cd8769" UNIQUE ("code"), CONSTRAINT "PK_8ea75b2a26f83f3bc98b9c6aaf6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "status_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "shipping_province" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "shipping_municipality" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "shipping_first_name" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "shipping_street" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "shipping_number" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "shipping_contact_phone" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "CHK_1699fb3f430f2876cc0c0867f7" CHECK ("fulfillment_type" != 'shipping' OR (
    "shipping_province" IS NOT NULL AND
    "shipping_municipality" IS NOT NULL AND
    "shipping_first_name" IS NOT NULL AND
    "shipping_last_name" IS NOT NULL AND
    "shipping_street" IS NOT NULL AND
    "shipping_number" IS NOT NULL AND
    "shipping_contact_phone" IS NOT NULL
  ))`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_03a801095cb90cf148e474cfcb7" FOREIGN KEY ("status_id") REFERENCES "order_status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_03a801095cb90cf148e474cfcb7"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "CHK_1699fb3f430f2876cc0c0867f7"`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "shipping_contact_phone" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "shipping_number" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "shipping_street" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "shipping_first_name" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "shipping_municipality" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "shipping_province" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "status_id"`);
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "status" "public"."orders_status_enum" NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`DROP TABLE "order_status"`);
    }

}
