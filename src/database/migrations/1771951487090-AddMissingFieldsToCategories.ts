import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingFieldsToCategories1771951487090 implements MigrationInterface {
    name = 'AddMissingFieldsToCategories1771951487090'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" ADD "external_id" integer`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "UQ_f073d4b501a8bd3c75144c21ac3" UNIQUE ("external_id")`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "raw_data" jsonb`);
        await queryRunner.query(`CREATE INDEX "IDX_f073d4b501a8bd3c75144c21ac" ON "categories" ("external_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_f073d4b501a8bd3c75144c21ac"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "raw_data"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "UQ_f073d4b501a8bd3c75144c21ac3"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "external_id"`);
    }

}
