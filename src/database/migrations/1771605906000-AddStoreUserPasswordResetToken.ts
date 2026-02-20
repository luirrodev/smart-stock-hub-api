import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoreUserPasswordResetToken1771605906000
  implements MigrationInterface
{
  name = 'AddStoreUserPasswordResetToken1771605906000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop the existing unique index that only accounts for User tokens
    await queryRunner.query(
      `DROP INDEX IF EXISTS "ux_password_reset_active_per_user"`,
    );

    // 2. Add store_user_id column
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" ADD "store_user_id" integer`,
    );

    // 3. Make user_id nullable
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" ALTER COLUMN "user_id" DROP NOT NULL`,
    );

    // 4. Create foreign key to store_users
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "FK_password_reset_token_store_user_id" FOREIGN KEY ("store_user_id") REFERENCES "store_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // 5. Create new unique index for User tokens (global password resets)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "ux_password_reset_active_per_user_global" ON "password_reset_tokens" ("user_id") WHERE (used = false AND revoked_at IS NULL AND user_id IS NOT NULL)`,
    );

    // 6. Create new unique index for StoreUser tokens (per-store password resets)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "ux_password_reset_active_per_store_user" ON "password_reset_tokens" ("store_user_id") WHERE (used = false AND revoked_at IS NULL AND store_user_id IS NOT NULL)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop the new indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "ux_password_reset_active_per_store_user"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "ux_password_reset_active_per_user_global"`,
    );

    // 2. Drop the foreign key
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "FK_password_reset_token_store_user_id"`,
    );

    // 3. Make user_id NOT NULL again
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" ALTER COLUMN "user_id" SET NOT NULL`,
    );

    // 4. Remove store_user_id column
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" DROP COLUMN "store_user_id"`,
    );

    // 5. Recreate the original unique index
    await queryRunner.query(
      `CREATE UNIQUE INDEX "ux_password_reset_active_per_user" ON "password_reset_tokens" ("user_id") WHERE (used = false AND revoked_at IS NULL)`,
    );
  }
}
