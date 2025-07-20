import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatedTableInventory1753037479850 implements MigrationInterface {
    name = 'UpdatedTableInventory1753037479850'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventories" DROP COLUMN "available_quantity"`);
        await queryRunner.query(`ALTER TABLE "inventories" DROP COLUMN "average_cost"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventories" ADD "average_cost" numeric(15,4) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "inventories" ADD "available_quantity" numeric(15,4) NOT NULL DEFAULT '0'`);
    }

}
