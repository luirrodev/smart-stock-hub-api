import { MigrationInterface, QueryRunner } from "typeorm";

export class AdedIndexForForgotPassword1769188461102 implements MigrationInterface {
    name = 'AdedIndexForForgotPassword1769188461102'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX "ux_password_reset_active_per_user" ON "password_reset_tokens" ("user_id") WHERE used = false AND revoked_at IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."ux_password_reset_active_per_user"`);
    }

}
