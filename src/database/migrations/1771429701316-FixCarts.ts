import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixCarts1771429701316 implements MigrationInterface {
  name = 'FixCarts1771429701316';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "carts" DROP CONSTRAINT "FK_5a9dade7a4baafc128f8e0d8041"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5a9dade7a4baafc128f8e0d804"`,
    );
    await queryRunner.query(`ALTER TABLE "carts" DROP COLUMN "customer_id"`);
    await queryRunner.query(
      `ALTER TABLE "carts" ADD "store_id" integer NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "carts" ADD "store_user_id" integer`);
    await queryRunner.query(
      `CREATE INDEX "IDX_40adab2d2921a344e92a3db449" ON "carts" ("store_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1a925adfce0c3d20d21dd382e6" ON "carts" ("store_user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "carts" ADD CONSTRAINT "FK_40adab2d2921a344e92a3db449d" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "carts" ADD CONSTRAINT "FK_1a925adfce0c3d20d21dd382e6b" FOREIGN KEY ("store_user_id") REFERENCES "store_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "carts" DROP CONSTRAINT "FK_1a925adfce0c3d20d21dd382e6b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "carts" DROP CONSTRAINT "FK_40adab2d2921a344e92a3db449d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1a925adfce0c3d20d21dd382e6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_40adab2d2921a344e92a3db449"`,
    );
    await queryRunner.query(`ALTER TABLE "carts" DROP COLUMN "store_user_id"`);
    await queryRunner.query(`ALTER TABLE "carts" DROP COLUMN "store_id"`);
    await queryRunner.query(`ALTER TABLE "carts" ADD "customer_id" integer`);
    await queryRunner.query(
      `CREATE INDEX "IDX_5a9dade7a4baafc128f8e0d804" ON "carts" ("customer_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "carts" ADD CONSTRAINT "FK_5a9dade7a4baafc128f8e0d8041" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
