import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedTableInventory1753035209393 implements MigrationInterface {
    name = 'AddedTableInventory1753035209393'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "inventories" ("id" SERIAL NOT NULL, "current_quantity" numeric(15,4) NOT NULL DEFAULT '0', "reserved_quantity" numeric(15,4) NOT NULL DEFAULT '0', "available_quantity" numeric(15,4) NOT NULL DEFAULT '0', "min_stock" numeric(15,4) NOT NULL DEFAULT '0', "max_stock" numeric(15,4) NOT NULL DEFAULT '0', "batch_number" character varying(100), "serial_number" character varying(100), "expiration_date" date, "average_cost" numeric(15,4) NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "product_id" integer, "warehouse_id" integer, CONSTRAINT "PK_7b1946392ffdcb50cfc6ac78c0e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "inventories" ADD CONSTRAINT "FK_92fc0c77bab4a656b9619322c62" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventories" ADD CONSTRAINT "FK_a033c259d39ca838058f5619e48" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventories" DROP CONSTRAINT "FK_a033c259d39ca838058f5619e48"`);
        await queryRunner.query(`ALTER TABLE "inventories" DROP CONSTRAINT "FK_92fc0c77bab4a656b9619322c62"`);
        await queryRunner.query(`DROP TABLE "inventories"`);
    }

}
