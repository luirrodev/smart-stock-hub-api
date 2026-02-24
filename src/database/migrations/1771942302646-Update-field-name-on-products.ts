import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateFieldNameOnProducts1771942302646 implements MigrationInterface {
    name = 'UpdateFieldNameOnProducts1771942302646'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "product_store" ADD "name" character varying(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_store" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "products" ADD "name" character varying(255) NOT NULL`);
    }

}
