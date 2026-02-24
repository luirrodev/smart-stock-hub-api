import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeSlugField1771951795052 implements MigrationInterface {
    name = 'ChangeSlugField1771951795052'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_420d9f679d41281f282f5bc7d0"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "UQ_420d9f679d41281f282f5bc7d09"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "slug"`);
        await queryRunner.query(`ALTER TABLE "product_store_category" ADD "slug" character varying(200) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "product_store_category" ADD CONSTRAINT "UQ_1d9b8d7e1244e10b5959c3c801e" UNIQUE ("slug")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1d9b8d7e1244e10b5959c3c801" ON "product_store_category" ("slug") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_1d9b8d7e1244e10b5959c3c801"`);
        await queryRunner.query(`ALTER TABLE "product_store_category" DROP CONSTRAINT "UQ_1d9b8d7e1244e10b5959c3c801e"`);
        await queryRunner.query(`ALTER TABLE "product_store_category" DROP COLUMN "slug"`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "slug" character varying(200) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "UQ_420d9f679d41281f282f5bc7d09" UNIQUE ("slug")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_420d9f679d41281f282f5bc7d0" ON "categories" ("slug") `);
    }

}
