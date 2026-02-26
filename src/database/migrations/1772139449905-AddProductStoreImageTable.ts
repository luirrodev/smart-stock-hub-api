import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductStoreImageTable1772139449905 implements MigrationInterface {
    name = 'AddProductStoreImageTable1772139449905'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "product_store_image" ("id" SERIAL NOT NULL, "product_store_id" integer NOT NULL, "image_url" character varying(500) NOT NULL, "position" integer NOT NULL, "alt_text" character varying(255), "title" character varying(255), "description" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_79974ad65ce1a6a97c7c4bcc9ce" UNIQUE ("product_store_id", "position"), CONSTRAINT "PK_792605c58482f74110e253f35e1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c30bc1b87a6caed9ba2ef8722d" ON "product_store_image" ("product_store_id") `);
        await queryRunner.query(`ALTER TABLE "product_store_image" ADD CONSTRAINT "FK_c30bc1b87a6caed9ba2ef8722de" FOREIGN KEY ("product_store_id") REFERENCES "product_store"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_store_image" DROP CONSTRAINT "FK_c30bc1b87a6caed9ba2ef8722de"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c30bc1b87a6caed9ba2ef8722d"`);
        await queryRunner.query(`DROP TABLE "product_store_image"`);
    }

}
