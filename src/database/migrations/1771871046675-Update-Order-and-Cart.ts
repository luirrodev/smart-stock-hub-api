import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateOrderAndCart1771871046675 implements MigrationInterface {
    name = 'UpdateOrderAndCart1771871046675'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_9263386c35b6b242540f9493b00"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_30e89257a105eab7648a35c7fce"`);
        await queryRunner.query(`ALTER TABLE "order_items" RENAME COLUMN "product_id" TO "product_store_id"`);
        await queryRunner.query(`ALTER TABLE "cart_items" RENAME COLUMN "product_id" TO "product_store_id"`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_eef2ebdce3031f3bf4451f8ff8a" FOREIGN KEY ("product_store_id") REFERENCES "product_store"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_248020758e8c729e1568793743a" FOREIGN KEY ("product_store_id") REFERENCES "product_store"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_248020758e8c729e1568793743a"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_eef2ebdce3031f3bf4451f8ff8a"`);
        await queryRunner.query(`ALTER TABLE "cart_items" RENAME COLUMN "product_store_id" TO "product_id"`);
        await queryRunner.query(`ALTER TABLE "order_items" RENAME COLUMN "product_store_id" TO "product_id"`);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_30e89257a105eab7648a35c7fce" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_9263386c35b6b242540f9493b00" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
