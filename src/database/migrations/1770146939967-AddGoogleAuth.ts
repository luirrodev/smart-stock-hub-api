import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGoogleAuth1770146939967 implements MigrationInterface {
    name = 'AddGoogleAuth1770146939967'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "google_id" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "auth_provider" character varying(50) NOT NULL DEFAULT 'local'`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "auth_provider"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "google_id"`);
    }

}
