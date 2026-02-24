import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategories1771950979878 implements MigrationInterface {
    name = 'AddCategories1771950979878'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_product_store_product_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_product_store_store_id"`);
        await queryRunner.query(`ALTER TABLE "product_store" DROP CONSTRAINT "UQ_product_store_unique"`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" SERIAL NOT NULL, "name" character varying(150) NOT NULL, "description" text, "slug" character varying(200) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_420d9f679d41281f282f5bc7d09" UNIQUE ("slug"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8b0be371d28245da6e4f4b6187" ON "categories" ("name") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_420d9f679d41281f282f5bc7d0" ON "categories" ("slug") `);
        await queryRunner.query(`CREATE TABLE "product_store_category" ("id" SERIAL NOT NULL, "product_store_id" integer NOT NULL, "category_id" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_d46d5abd904f7e2a22367af9d60" UNIQUE ("product_store_id", "category_id"), CONSTRAINT "PK_b80979c31e0232713b5c157f388" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bb8007133b4cfd2c474cc53213" ON "product_store_category" ("product_store_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_484f5bdafea63f039848c1740e" ON "product_store_category" ("category_id") `);
        await queryRunner.query(`ALTER TABLE "product_store" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "product_store" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`CREATE INDEX "IDX_9f3d186a9731a15c7a9a52218a" ON "product_store" ("product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_7733838f2aa47a580841471e34" ON "product_store" ("store_id") `);
        await queryRunner.query(`ALTER TABLE "product_store" ADD CONSTRAINT "UQ_aa896c07fdea3d952da09280e9e" UNIQUE ("product_id", "store_id")`);
        await queryRunner.query(`ALTER TABLE "product_store_category" ADD CONSTRAINT "FK_bb8007133b4cfd2c474cc53213b" FOREIGN KEY ("product_store_id") REFERENCES "product_store"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_store_category" ADD CONSTRAINT "FK_484f5bdafea63f039848c1740ea" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_store" ADD CONSTRAINT "FK_9f3d186a9731a15c7a9a52218aa" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_store" ADD CONSTRAINT "FK_7733838f2aa47a580841471e346" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_eef2ebdce3031f3bf4451f8ff8a" FOREIGN KEY ("product_store_id") REFERENCES "product_store"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_248020758e8c729e1568793743a" FOREIGN KEY ("product_store_id") REFERENCES "product_store"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_248020758e8c729e1568793743a"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_eef2ebdce3031f3bf4451f8ff8a"`);
        await queryRunner.query(`ALTER TABLE "product_store" DROP CONSTRAINT "FK_7733838f2aa47a580841471e346"`);
        await queryRunner.query(`ALTER TABLE "product_store" DROP CONSTRAINT "FK_9f3d186a9731a15c7a9a52218aa"`);
        await queryRunner.query(`ALTER TABLE "product_store_category" DROP CONSTRAINT "FK_484f5bdafea63f039848c1740ea"`);
        await queryRunner.query(`ALTER TABLE "product_store_category" DROP CONSTRAINT "FK_bb8007133b4cfd2c474cc53213b"`);
        await queryRunner.query(`ALTER TABLE "product_store" DROP CONSTRAINT "UQ_aa896c07fdea3d952da09280e9e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7733838f2aa47a580841471e34"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9f3d186a9731a15c7a9a52218a"`);
        await queryRunner.query(`ALTER TABLE "product_store" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "product_store" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`DROP INDEX "public"."IDX_484f5bdafea63f039848c1740e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bb8007133b4cfd2c474cc53213"`);
        await queryRunner.query(`DROP TABLE "product_store_category"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_420d9f679d41281f282f5bc7d0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8b0be371d28245da6e4f4b6187"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`ALTER TABLE "product_store" ADD CONSTRAINT "UQ_product_store_unique" UNIQUE ("product_id", "store_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_product_store_store_id" ON "product_store" ("store_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_product_store_product_id" ON "product_store" ("product_id") `);
    }

}
