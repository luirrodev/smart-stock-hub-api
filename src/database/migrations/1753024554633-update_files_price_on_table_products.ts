import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateFilesPriceOnTableProducts1753024554633 implements MigrationInterface {
    name = 'UpdateFilesPriceOnTableProducts1753024554633'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "price"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "cost"`);
        await queryRunner.query(`ALTER TABLE "products" ADD "sale_price" double precision NOT NULL`);
        await queryRunner.query(`ALTER TABLE "products" ADD "purchase_price" double precision NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "purchase_price"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "sale_price"`);
        await queryRunner.query(`ALTER TABLE "products" ADD "cost" double precision`);
        await queryRunner.query(`ALTER TABLE "products" ADD "price" double precision NOT NULL`);
    }

}
