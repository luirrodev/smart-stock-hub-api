import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedTablesStoresOrdersPickupPoints1769521284215 implements MigrationInterface {
    name = 'AddedTablesStoresOrdersPickupPoints1769521284215'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "stores" ("id" SERIAL NOT NULL, "name" character varying(150) NOT NULL, "address" character varying(255) NOT NULL, "city" character varying(100) NOT NULL, "state" character varying(100) NOT NULL, "zip_code" character varying(20) NOT NULL, "country" character varying(100) NOT NULL, "phone" character varying(20), "email" character varying(150), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7aa6e7d71fa7acdd7ca43d7c9cb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."orders_fulfillment_type_enum" AS ENUM('shipping', 'pickup')`);
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')`);
        await queryRunner.query(`CREATE TYPE "public"."orders_payment_status_enum" AS ENUM('pending', 'paid', 'failed', 'refunded')`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" SERIAL NOT NULL, "order_number" character varying(50) NOT NULL, "customer_id" integer NOT NULL, "store_id" integer NOT NULL, "fulfillment_type" "public"."orders_fulfillment_type_enum" NOT NULL DEFAULT 'shipping', "pickup_point_id" integer, "shipping_province" character varying(100) NOT NULL, "shipping_municipality" character varying(100) NOT NULL, "shipping_first_name" character varying(100) NOT NULL, "shipping_middle_name" character varying(100), "shipping_last_name" character varying(100) NOT NULL, "shipping_second_last_name" character varying(100), "shipping_street" character varying(255) NOT NULL, "shipping_number" character varying(50) NOT NULL, "shipping_apartment" character varying(50), "shipping_floor" character varying(50), "shipping_between_streets" character varying(255), "shipping_neighborhood" character varying(255), "shipping_postal_code" character varying(20), "shipping_contact_phone" character varying(20) NOT NULL, "shipping_reference" text, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'pending', "payment_status" "public"."orders_payment_status_enum" NOT NULL DEFAULT 'pending', "payment_method" character varying(50), "payment_transaction_id" character varying(255), "subtotal" numeric(14,2) NOT NULL, "tax" numeric(14,2) NOT NULL DEFAULT '0', "shipping_cost" numeric(14,2) NOT NULL DEFAULT '0', "discount" numeric(14,2) NOT NULL DEFAULT '0', "total" numeric(14,2) NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'USD', "customer_notes" text, "admin_notes" text, "tracking_number" character varying(100), "shipping_carrier" character varying(100), "shipped_at" TIMESTAMP WITH TIME ZONE, "delivered_at" TIMESTAMP WITH TIME ZONE, "cancelled_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_75eba1c6b1a66b09f2a97e6927b" UNIQUE ("order_number"), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pickup_points" ("id" SERIAL NOT NULL, "name" character varying(150) NOT NULL, "code" character varying(50), "address" character varying(255) NOT NULL, "city" character varying(100) NOT NULL, "state" character varying(100) NOT NULL, "zip_code" character varying(20) NOT NULL, "country" character varying(100) NOT NULL, "phone" character varying(20), "email" character varying(150), "schedule" text, "instructions" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_7c60ebd4e663e0e4b3b17b8f4e2" UNIQUE ("code"), CONSTRAINT "PK_8fe939caf756e30da9a5b5d7317" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_772d0ce0473ac2ccfa26060dbe9" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_b7a7bb813431fc7cd73cced0001" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_b7d8c98102b7cc1788236d49ed5" FOREIGN KEY ("pickup_point_id") REFERENCES "pickup_points"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_b7d8c98102b7cc1788236d49ed5"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_b7a7bb813431fc7cd73cced0001"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_772d0ce0473ac2ccfa26060dbe9"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`DROP TABLE "pickup_points"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."orders_payment_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."orders_fulfillment_type_enum"`);
        await queryRunner.query(`DROP TABLE "stores"`);
    }

}
