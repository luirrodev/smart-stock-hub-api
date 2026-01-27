import { MigrationInterface, QueryRunner } from "typeorm";

export class FixFieldInOrderTable1769525134519 implements MigrationInterface {
    name = 'FixFieldInOrderTable1769525134519'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "shipping_last_name" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "shipping_last_name" SET NOT NULL`);
    }

}
