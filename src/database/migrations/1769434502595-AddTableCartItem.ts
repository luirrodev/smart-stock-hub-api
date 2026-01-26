import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTableCartItem1769434502595 implements MigrationInterface {
    name = 'AddTableCartItem1769434502595'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "cart_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cart_id" uuid NOT NULL, "product_id" integer NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "price" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_6fccf5ec03c172d27a28a82928b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "carts" DROP CONSTRAINT "PK_b5f695a59f5ebb50af3c8160816"`);
        await queryRunner.query(`ALTER TABLE "carts" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "carts" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "carts" ADD CONSTRAINT "PK_b5f695a59f5ebb50af3c8160816" PRIMARY KEY ("id")`);
        await queryRunner.query(`CREATE INDEX "IDX_f57f87515b7c25718dc380c69c" ON "carts" ("session_id") `);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_6385a745d9e12a89b859bb25623" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_30e89257a105eab7648a35c7fce" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_30e89257a105eab7648a35c7fce"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_6385a745d9e12a89b859bb25623"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f57f87515b7c25718dc380c69c"`);
        await queryRunner.query(`ALTER TABLE "carts" DROP CONSTRAINT "PK_b5f695a59f5ebb50af3c8160816"`);
        await queryRunner.query(`ALTER TABLE "carts" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "carts" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "carts" ADD CONSTRAINT "PK_b5f695a59f5ebb50af3c8160816" PRIMARY KEY ("id")`);
        await queryRunner.query(`DROP TABLE "cart_items"`);
    }

}
