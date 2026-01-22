import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTableShippingAddresses1769116426081 implements MigrationInterface {
    name = 'AddTableShippingAddresses1769116426081'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "shipping_addresses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "province" character varying(100) NOT NULL, "municipality" character varying(100) NOT NULL, "first_name" character varying(100) NOT NULL, "middle_name" character varying(100), "last_name" character varying(100) NOT NULL, "second_last_name" character varying(100), "street" character varying(255) NOT NULL, "number" character varying(50) NOT NULL, "apartment" character varying(50), "floor" character varying(50), "between_streets" character varying(255), "neighborhood" character varying(255), "postal_code" character varying(20) NOT NULL, "contact_phone" character varying(20) NOT NULL, "customerId" integer, CONSTRAINT "PK_cced78984eddbbe24470f226692" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "shipping_addresses" ADD CONSTRAINT "FK_c5a977fc21116efb37481bdbe51" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shipping_addresses" DROP CONSTRAINT "FK_c5a977fc21116efb37481bdbe51"`);
        await queryRunner.query(`DROP TABLE "shipping_addresses"`);
    }

}
