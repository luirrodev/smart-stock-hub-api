import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldisActiveOnProducts1769436199308 implements MigrationInterface {
    name = 'AddFieldisActiveOnProducts1769436199308'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "is_active" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "is_active"`);
    }

}
