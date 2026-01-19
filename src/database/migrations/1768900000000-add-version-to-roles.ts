import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVersionToRoles1768900000000 implements MigrationInterface {
  name = 'AddVersionToRoles1768900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "roles" ADD "version" integer NOT NULL DEFAULT 1`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "version"`);
  }
}
