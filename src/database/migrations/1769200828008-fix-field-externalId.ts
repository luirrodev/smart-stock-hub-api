import { MigrationInterface, QueryRunner } from "typeorm";

export class FixFieldExternalId1769200828008 implements MigrationInterface {
    name = 'FixFieldExternalId1769200828008'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "external_id" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "external_id" DROP NOT NULL`);
    }

}
