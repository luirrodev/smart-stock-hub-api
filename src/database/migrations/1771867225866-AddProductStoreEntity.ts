import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductStoreEntity1771867225866 implements MigrationInterface {
    name = 'AddProductStoreEntity1771867225866'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "FK_password_reset_token_store_user_id"`);
        await queryRunner.query(`CREATE TABLE "product_store" ("id" SERIAL NOT NULL, "product_id" integer NOT NULL, "store_id" integer NOT NULL, "price" numeric(14,2) NOT NULL DEFAULT '0', "summary" text, "observations" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_aa896c07fdea3d952da09280e9e" UNIQUE ("product_id", "store_id"), CONSTRAINT "PK_4fb20f5e0d195dcc2e27e8cc815" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9f3d186a9731a15c7a9a52218a" ON "product_store" ("product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_7733838f2aa47a580841471e34" ON "product_store" ("store_id") `);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "sale_price"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "is_imported"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "summary"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "observations"`);
        await queryRunner.query(`ALTER TABLE "product_store" ADD CONSTRAINT "FK_9f3d186a9731a15c7a9a52218aa" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_store" ADD CONSTRAINT "FK_7733838f2aa47a580841471e346" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "FK_08daff4797a17784afb296ff65a" FOREIGN KEY ("store_user_id") REFERENCES "store_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "FK_08daff4797a17784afb296ff65a"`);
        await queryRunner.query(`ALTER TABLE "product_store" DROP CONSTRAINT "FK_7733838f2aa47a580841471e346"`);
        await queryRunner.query(`ALTER TABLE "product_store" DROP CONSTRAINT "FK_9f3d186a9731a15c7a9a52218aa"`);
        await queryRunner.query(`ALTER TABLE "products" ADD "observations" text`);
        await queryRunner.query(`ALTER TABLE "products" ADD "summary" text`);
        await queryRunner.query(`ALTER TABLE "products" ADD "is_imported" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "products" ADD "sale_price" numeric(14,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7733838f2aa47a580841471e34"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9f3d186a9731a15c7a9a52218a"`);
        await queryRunner.query(`DROP TABLE "product_store"`);
        await queryRunner.query(`ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "FK_password_reset_token_store_user_id" FOREIGN KEY ("store_user_id") REFERENCES "store_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
