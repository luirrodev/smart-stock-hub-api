import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTableProducts1769199837286 implements MigrationInterface {
    name = 'AddTableProducts1769199837286'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "products" ("id" SERIAL NOT NULL, "sku" character varying(100), "name" character varying(255) NOT NULL, "sale_price" numeric(14,2) NOT NULL DEFAULT '0', "external_id" bigint, "summary" text, "observations" text, "source" character varying(50) NOT NULL DEFAULT 'external', "raw_data" jsonb, "mapped_at" TIMESTAMP WITH TIME ZONE, "is_imported" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_c44ac33a05b144dd0d9ddcf9327" UNIQUE ("sku"), CONSTRAINT "UQ_bbc46f4fc336522e99fc8782b43" UNIQUE ("external_id"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c44ac33a05b144dd0d9ddcf932" ON "products" ("sku") `);
        await queryRunner.query(`CREATE INDEX "IDX_bbc46f4fc336522e99fc8782b4" ON "products" ("external_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_bbc46f4fc336522e99fc8782b4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c44ac33a05b144dd0d9ddcf932"`);
        await queryRunner.query(`DROP TABLE "products"`);
    }

}
