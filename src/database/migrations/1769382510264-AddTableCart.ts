import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTableCart1769382510264 implements MigrationInterface {
    name = 'AddTableCart1769382510264'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."carts_status_enum" AS ENUM('active', 'abandoned', 'converted', 'expired')`);
        await queryRunner.query(`CREATE TABLE "carts" ("id" SERIAL NOT NULL, "session_id" uuid, "status" "public"."carts_status_enum" NOT NULL DEFAULT 'active', "expires_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" integer, CONSTRAINT "PK_b5f695a59f5ebb50af3c8160816" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2ec1c94a977b940d85a4f498ae" ON "carts" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "carts" ADD CONSTRAINT "FK_2ec1c94a977b940d85a4f498aea" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "carts" DROP CONSTRAINT "FK_2ec1c94a977b940d85a4f498aea"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2ec1c94a977b940d85a4f498ae"`);
        await queryRunner.query(`DROP TABLE "carts"`);
        await queryRunner.query(`DROP TYPE "public"."carts_status_enum"`);
    }

}
