import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeCustomerIDOnUserIdInCart1769462984461 implements MigrationInterface {
    name = 'ChangeCustomerIDOnUserIdInCart1769462984461'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "carts" DROP CONSTRAINT "FK_2ec1c94a977b940d85a4f498aea"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2ec1c94a977b940d85a4f498ae"`);
        await queryRunner.query(`ALTER TABLE "carts" RENAME COLUMN "user_id" TO "customer_id"`);
        await queryRunner.query(`CREATE INDEX "IDX_5a9dade7a4baafc128f8e0d804" ON "carts" ("customer_id") `);
        await queryRunner.query(`ALTER TABLE "carts" ADD CONSTRAINT "FK_5a9dade7a4baafc128f8e0d8041" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "carts" DROP CONSTRAINT "FK_5a9dade7a4baafc128f8e0d8041"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5a9dade7a4baafc128f8e0d804"`);
        await queryRunner.query(`ALTER TABLE "carts" RENAME COLUMN "customer_id" TO "user_id"`);
        await queryRunner.query(`CREATE INDEX "IDX_2ec1c94a977b940d85a4f498ae" ON "carts" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "carts" ADD CONSTRAINT "FK_2ec1c94a977b940d85a4f498aea" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
