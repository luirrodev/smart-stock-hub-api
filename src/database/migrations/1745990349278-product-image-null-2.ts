import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductImageNull21745990349278 implements MigrationInterface {
  name = 'ProductImageNull21745990349278';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "image" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "image" SET NOT NULL`,
    );
  }
}
