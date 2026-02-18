import { MigrationInterface, QueryRunner } from "typeorm";

export class FixOrders1771446239797 implements MigrationInterface {
    name = 'FixOrders1771446239797'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "fk_orders_store_user_id"`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_616bdc6d321da0f98cb02b41a1d" FOREIGN KEY ("store_user_id") REFERENCES "store_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_616bdc6d321da0f98cb02b41a1d"`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "fk_orders_store_user_id" FOREIGN KEY ("store_user_id") REFERENCES "store_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
