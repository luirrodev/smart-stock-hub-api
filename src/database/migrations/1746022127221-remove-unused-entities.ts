import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveUnusedEntities1746022127221 implements MigrationInterface {
    name = 'RemoveUnusedEntities1746022127221'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_c7bc1ffb56c570f42053fa7503b"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "REL_c7bc1ffb56c570f42053fa7503"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "customer_id"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "customer_id" integer`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "REL_c7bc1ffb56c570f42053fa7503" UNIQUE ("customer_id")`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_c7bc1ffb56c570f42053fa7503b" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
