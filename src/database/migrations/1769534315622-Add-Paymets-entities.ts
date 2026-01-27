import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymetsEntities1769534315622 implements MigrationInterface {
    name = 'AddPaymetsEntities1769534315622'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."store_payment_configs_mode_enum" AS ENUM('sandbox', 'production')`);
        await queryRunner.query(`CREATE TABLE "store_payment_configs" ("id" SERIAL NOT NULL, "store_id" integer NOT NULL, "provider" character varying(50) NOT NULL, "client_id" character varying(255) NOT NULL, "secret" text NOT NULL, "mode" "public"."store_payment_configs_mode_enum" NOT NULL DEFAULT 'sandbox', "is_active" boolean NOT NULL DEFAULT false, "webhook_url" character varying(500), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e5890d532727c3699d40fc7e391" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('CREATED', 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" SERIAL NOT NULL, "order_id" integer NOT NULL, "store_id" integer NOT NULL, "provider" character varying(50) NOT NULL, "provider_order_id" character varying(255), "amount" numeric(14,2) NOT NULL, "currency" character varying(3) NOT NULL, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'CREATED', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."payment_transactions_transaction_type_enum" AS ENUM('CREATE', 'CAPTURE', 'REFUND', 'WEBHOOK')`);
        await queryRunner.query(`CREATE TABLE "payment_transactions" ("id" SERIAL NOT NULL, "payment_id" integer NOT NULL, "transaction_type" "public"."payment_transactions_transaction_type_enum" NOT NULL, "provider_transaction_id" character varying(255), "request_payload" jsonb, "response_payload" jsonb, "status" character varying(50), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_d32b3c6b0d2c1d22604cbcc8c49" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "store_payment_configs" ADD CONSTRAINT "FK_b60cfa794f5a167b9f7afee70ef" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_b2f7b823a21562eeca20e72b006" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_8afabeaa460738befe497e857c7" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_transactions" ADD CONSTRAINT "FK_1f4dd90aece142a3a591cf4334b" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment_transactions" DROP CONSTRAINT "FK_1f4dd90aece142a3a591cf4334b"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_8afabeaa460738befe497e857c7"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_b2f7b823a21562eeca20e72b006"`);
        await queryRunner.query(`ALTER TABLE "store_payment_configs" DROP CONSTRAINT "FK_b60cfa794f5a167b9f7afee70ef"`);
        await queryRunner.query(`DROP TABLE "payment_transactions"`);
        await queryRunner.query(`DROP TYPE "public"."payment_transactions_transaction_type_enum"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
        await queryRunner.query(`DROP TABLE "store_payment_configs"`);
        await queryRunner.query(`DROP TYPE "public"."store_payment_configs_mode_enum"`);
    }

}
