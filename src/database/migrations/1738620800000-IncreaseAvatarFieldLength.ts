import { MigrationInterface, QueryRunner } from 'typeorm';

export class IncreaseAvatarFieldLength1738620800000
  implements MigrationInterface
{
  name = 'IncreaseAvatarFieldLength1738620800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "avatar" TYPE text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "avatar" TYPE character varying(500)`,
    );
  }
}
