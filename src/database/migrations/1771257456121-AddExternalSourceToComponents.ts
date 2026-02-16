import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExternalSourceToComponents1771257456121 implements MigrationInterface {
    name = 'AddExternalSourceToComponents1771257456121'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "components" ADD "external_id" bigint`);
        await queryRunner.query(`ALTER TABLE "components" ADD CONSTRAINT "UQ_74958a64458e985265a2719175c" UNIQUE ("external_id")`);
        await queryRunner.query(`ALTER TABLE "components" ADD "source" character varying(50) NOT NULL DEFAULT 'internal'`);
        await queryRunner.query(`ALTER TABLE "components" ADD "raw_data" jsonb`);
        await queryRunner.query(`ALTER TABLE "components" ADD "mapped_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "components" ADD "is_imported" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE INDEX "IDX_74958a64458e985265a2719175" ON "components" ("external_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_74958a64458e985265a2719175"`);
        await queryRunner.query(`ALTER TABLE "components" DROP COLUMN "is_imported"`);
        await queryRunner.query(`ALTER TABLE "components" DROP COLUMN "mapped_at"`);
        await queryRunner.query(`ALTER TABLE "components" DROP COLUMN "raw_data"`);
        await queryRunner.query(`ALTER TABLE "components" DROP COLUMN "source"`);
        await queryRunner.query(`ALTER TABLE "components" DROP CONSTRAINT "UQ_74958a64458e985265a2719175c"`);
        await queryRunner.query(`ALTER TABLE "components" DROP COLUMN "external_id"`);
    }

}
