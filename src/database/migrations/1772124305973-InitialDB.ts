import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialDB1772124305973 implements MigrationInterface {
    name = 'InitialDB1772124305973'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "roles" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying, "version" integer NOT NULL DEFAULT '1', CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying(255) NOT NULL, "name" character varying(255), "role_id" integer NOT NULL, "phone" character varying(20), "avatar" text, "preferences" jsonb, "customer_id" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "created_by" integer, "updated_by" integer, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "REL_c7bc1ffb56c570f42053fa7503" UNIQUE ("customer_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "shipping_addresses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "province" character varying(100) NOT NULL, "municipality" character varying(100) NOT NULL, "first_name" character varying(100) NOT NULL, "middle_name" character varying(100), "last_name" character varying(100) NOT NULL, "second_last_name" character varying(100), "street" character varying(255) NOT NULL, "number" character varying(50) NOT NULL, "apartment" character varying(50), "floor" character varying(50), "between_streets" character varying(255), "neighborhood" character varying(255), "postal_code" character varying(20) NOT NULL, "contact_phone" character varying(20) NOT NULL, "customer_id" integer, CONSTRAINT "PK_cced78984eddbbe24470f226692" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "customers" ("id" SERIAL NOT NULL, "purchase_count" integer NOT NULL DEFAULT '0', "total_spent" numeric(14,2) NOT NULL DEFAULT '0', "last_purchase_at" TIMESTAMP WITH TIME ZONE, "notes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" integer, CONSTRAINT "UQ_11d81cd7be87b6f8865b0cf7661" UNIQUE ("user_id"), CONSTRAINT "REL_11d81cd7be87b6f8865b0cf766" UNIQUE ("user_id"), CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "store_users" ("id" SERIAL NOT NULL, "store_id" integer NOT NULL, "customer_id" integer NOT NULL, "password" character varying(255), "credentials" jsonb, "is_active" boolean NOT NULL DEFAULT true, "last_login_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_097ad656565e9b29fd2bdcd5930" UNIQUE ("store_id", "customer_id"), CONSTRAINT "PK_6af90d774177332a7a99a7c1c9d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "products" ("id" SERIAL NOT NULL, "sku" character varying(100), "external_id" bigint NOT NULL, "source" character varying(50) NOT NULL DEFAULT 'external', "raw_data" jsonb, "mapped_at" TIMESTAMP WITH TIME ZONE, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_c44ac33a05b144dd0d9ddcf9327" UNIQUE ("sku"), CONSTRAINT "UQ_bbc46f4fc336522e99fc8782b43" UNIQUE ("external_id"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c44ac33a05b144dd0d9ddcf932" ON "products" ("sku") `);
        await queryRunner.query(`CREATE INDEX "IDX_bbc46f4fc336522e99fc8782b4" ON "products" ("external_id") `);
        await queryRunner.query(`CREATE TABLE "categories" ("id" SERIAL NOT NULL, "external_id" integer, "name" character varying(150) NOT NULL, "description" text, "slug" character varying(200) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "raw_data" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_f073d4b501a8bd3c75144c21ac3" UNIQUE ("external_id"), CONSTRAINT "UQ_420d9f679d41281f282f5bc7d09" UNIQUE ("slug"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f073d4b501a8bd3c75144c21ac" ON "categories" ("external_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8b0be371d28245da6e4f4b6187" ON "categories" ("name") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_420d9f679d41281f282f5bc7d0" ON "categories" ("slug") `);
        await queryRunner.query(`CREATE TABLE "product_store_category" ("id" SERIAL NOT NULL, "product_store_id" integer NOT NULL, "category_id" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_d46d5abd904f7e2a22367af9d60" UNIQUE ("product_store_id", "category_id"), CONSTRAINT "PK_b80979c31e0232713b5c157f388" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bb8007133b4cfd2c474cc53213" ON "product_store_category" ("product_store_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_484f5bdafea63f039848c1740e" ON "product_store_category" ("category_id") `);
        await queryRunner.query(`CREATE TABLE "product_store" ("id" SERIAL NOT NULL, "product_id" integer NOT NULL, "store_id" integer NOT NULL, "price" numeric(14,2) NOT NULL DEFAULT '0', "name" character varying(255) NOT NULL, "summary" text, "observations" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_aa896c07fdea3d952da09280e9e" UNIQUE ("product_id", "store_id"), CONSTRAINT "PK_4fb20f5e0d195dcc2e27e8cc815" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9f3d186a9731a15c7a9a52218a" ON "product_store" ("product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_7733838f2aa47a580841471e34" ON "product_store" ("store_id") `);
        await queryRunner.query(`CREATE TABLE "stores" ("id" SERIAL NOT NULL, "name" character varying(150) NOT NULL, "address" character varying(255) NOT NULL, "city" character varying(100) NOT NULL, "state" character varying(100) NOT NULL, "zip_code" character varying(20) NOT NULL, "country" character varying(100) NOT NULL, "phone" character varying(20), "email" character varying(150), "api_key" character varying(255) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_030ecf07871de338a873ead830d" UNIQUE ("api_key"), CONSTRAINT "UQ_030ecf07871de338a873ead830d" UNIQUE ("api_key"), CONSTRAINT "PK_7aa6e7d71fa7acdd7ca43d7c9cb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."store_payment_configs_mode_enum" AS ENUM('sandbox', 'production')`);
        await queryRunner.query(`CREATE TABLE "store_payment_configs" ("id" SERIAL NOT NULL, "store_id" integer NOT NULL, "provider" character varying(50) NOT NULL, "client_id" character varying(255) NOT NULL, "secret" text NOT NULL, "mode" "public"."store_payment_configs_mode_enum" NOT NULL DEFAULT 'sandbox', "is_active" boolean NOT NULL DEFAULT false, "webhook_url" character varying(500), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e5890d532727c3699d40fc7e391" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pickup_points" ("id" SERIAL NOT NULL, "name" character varying(150) NOT NULL, "code" character varying(50), "address" character varying(255) NOT NULL, "city" character varying(100) NOT NULL, "state" character varying(100) NOT NULL, "zip_code" character varying(20) NOT NULL, "country" character varying(100) NOT NULL, "phone" character varying(20), "email" character varying(150), "schedule" text, "instructions" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_7c60ebd4e663e0e4b3b17b8f4e2" UNIQUE ("code"), CONSTRAINT "PK_8fe939caf756e30da9a5b5d7317" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order_status" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "code" character varying(50) NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_96a7efa43bbc9ad9bc137016d8b" UNIQUE ("name"), CONSTRAINT "UQ_5ba083ed178d6a695d146cd8769" UNIQUE ("code"), CONSTRAINT "PK_8ea75b2a26f83f3bc98b9c6aaf6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order_items" ("id" SERIAL NOT NULL, "order_id" integer NOT NULL, "product_store_id" integer NOT NULL, "product_name" character varying(255) NOT NULL, "product_sku" character varying(100), "product_image" character varying(500), "quantity" integer NOT NULL, "unit_price" numeric(14,2) NOT NULL, "total_price" numeric(14,2) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."orders_fulfillment_type_enum" AS ENUM('shipping', 'pickup')`);
        await queryRunner.query(`CREATE TYPE "public"."orders_payment_status_enum" AS ENUM('CREATED', 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" SERIAL NOT NULL, "order_number" character varying(50) NOT NULL, "store_user_id" integer NOT NULL, "store_id" integer NOT NULL, "fulfillment_type" "public"."orders_fulfillment_type_enum" NOT NULL DEFAULT 'shipping', "pickup_point_id" integer, "shipping_province" character varying(100), "shipping_municipality" character varying(100), "shipping_first_name" character varying(100), "shipping_middle_name" character varying(100), "shipping_last_name" character varying(100), "shipping_second_last_name" character varying(100), "shipping_street" character varying(255), "shipping_number" character varying(50), "shipping_apartment" character varying(50), "shipping_floor" character varying(50), "shipping_between_streets" character varying(255), "shipping_neighborhood" character varying(255), "shipping_postal_code" character varying(20), "shipping_contact_phone" character varying(20), "shipping_reference" text, "status_id" integer NOT NULL, "payment_status" "public"."orders_payment_status_enum" NOT NULL DEFAULT 'PENDING', "payment_method" character varying(50), "payment_transaction_id" character varying(255), "subtotal" numeric(14,2) NOT NULL, "tax" numeric(14,2) NOT NULL DEFAULT '0', "shipping_cost" numeric(14,2) NOT NULL DEFAULT '0', "discount" numeric(14,2) NOT NULL DEFAULT '0', "total" numeric(14,2) NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'USD', "customer_notes" text, "admin_notes" text, "tracking_number" character varying(100), "shipping_carrier" character varying(100), "shipped_at" TIMESTAMP WITH TIME ZONE, "delivered_at" TIMESTAMP WITH TIME ZONE, "cancelled_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_75eba1c6b1a66b09f2a97e6927b" UNIQUE ("order_number"), CONSTRAINT "CHK_1699fb3f430f2876cc0c0867f7" CHECK ("fulfillment_type" != 'shipping' OR (
    "shipping_province" IS NOT NULL AND
    "shipping_municipality" IS NOT NULL AND
    "shipping_first_name" IS NOT NULL AND
    "shipping_last_name" IS NOT NULL AND
    "shipping_street" IS NOT NULL AND
    "shipping_number" IS NOT NULL AND
    "shipping_contact_phone" IS NOT NULL
  )), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('CREATED', 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" SERIAL NOT NULL, "order_id" integer NOT NULL, "store_id" integer NOT NULL, "provider" character varying(50) NOT NULL, "provider_order_id" character varying(255) NOT NULL, "amount" numeric(14,2) NOT NULL, "currency" character varying(3) NOT NULL, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'CREATED', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."payment_transactions_transaction_type_enum" AS ENUM('CREATE', 'CAPTURE', 'REFUND', 'WEBHOOK')`);
        await queryRunner.query(`CREATE TABLE "payment_transactions" ("id" SERIAL NOT NULL, "payment_id" integer NOT NULL, "transaction_type" "public"."payment_transactions_transaction_type_enum" NOT NULL, "provider_transaction_id" character varying(255), "request_payload" jsonb, "response_payload" jsonb, "status" character varying(50), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_d32b3c6b0d2c1d22604cbcc8c49" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "components" ("id" SERIAL NOT NULL, "code" character varying(100) NOT NULL, "name" character varying(255) NOT NULL, "description" text, "external_id" bigint, "weight" numeric(10,4), "unit" character varying(50), "source" character varying(50) NOT NULL DEFAULT 'internal', "raw_data" jsonb, "mapped_at" TIMESTAMP WITH TIME ZONE, "is_imported" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "is_visible" boolean NOT NULL DEFAULT true, "is_archived" boolean NOT NULL DEFAULT false, "created_by" integer, "updated_by" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_5409124de81d8d24ef76b4a5315" UNIQUE ("code"), CONSTRAINT "UQ_74958a64458e985265a2719175c" UNIQUE ("external_id"), CONSTRAINT "PK_0d742661c63926321b5f5eac1ad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5409124de81d8d24ef76b4a531" ON "components" ("code") `);
        await queryRunner.query(`CREATE INDEX "IDX_74958a64458e985265a2719175" ON "components" ("external_id") `);
        await queryRunner.query(`CREATE TABLE "cart_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cart_id" uuid NOT NULL, "product_store_id" integer NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "price" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_6fccf5ec03c172d27a28a82928b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."carts_status_enum" AS ENUM('active', 'abandoned', 'converted', 'expired')`);
        await queryRunner.query(`CREATE TABLE "carts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "store_id" integer NOT NULL, "store_user_id" integer, "session_id" uuid, "status" "public"."carts_status_enum" NOT NULL DEFAULT 'active', "expires_at" TIMESTAMP WITH TIME ZONE, "last_activity_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_b5f695a59f5ebb50af3c8160816" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_40adab2d2921a344e92a3db449" ON "carts" ("store_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_1a925adfce0c3d20d21dd382e6" ON "carts" ("store_user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f57f87515b7c25718dc380c69c" ON "carts" ("session_id") `);
        await queryRunner.query(`CREATE TABLE "password_reset_tokens" ("id" SERIAL NOT NULL, "token" character varying(255) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "used" boolean NOT NULL DEFAULT false, "used_at" TIMESTAMP WITH TIME ZONE, "sent_at" TIMESTAMP WITH TIME ZONE, "ip_address" character varying(45), "user_agent" character varying(500), "attempts" integer NOT NULL DEFAULT '0', "revoked_at" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "user_id" integer, "store_user_id" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_d16bebd73e844c48bca50ff8d3d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "ux_password_reset_active_per_store_user" ON "password_reset_tokens" ("store_user_id") WHERE used = false AND revoked_at IS NULL AND store_user_id IS NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "ux_password_reset_active_per_user_global" ON "password_reset_tokens" ("user_id") WHERE used = false AND revoked_at IS NULL AND user_id IS NOT NULL`);
        await queryRunner.query(`CREATE TABLE "staff_users" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "password" character varying(255), "google_id" character varying(255), "auth_provider" character varying(50) NOT NULL DEFAULT 'local', "is_active" boolean NOT NULL DEFAULT true, "last_login_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_b42252566257d9ee8fb20f47510" UNIQUE ("user_id"), CONSTRAINT "REL_b42252566257d9ee8fb20f4751" UNIQUE ("user_id"), CONSTRAINT "PK_c6b167335377df69f7910c2c75e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "permissions" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying, CONSTRAINT "UQ_48ce552495d14eae9b187bb6716" UNIQUE ("name"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "roles_permissions" ("role_id" integer NOT NULL, "permission_id" integer NOT NULL, CONSTRAINT "PK_0cd11f0b35c4d348c6ebb9b36b7" PRIMARY KEY ("role_id", "permission_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7d2dad9f14eddeb09c256fea71" ON "roles_permissions" ("role_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_337aa8dba227a1fe6b73998307" ON "roles_permissions" ("permission_id") `);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_c7bc1ffb56c570f42053fa7503b" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_f32b1cb14a9920477bcfd63df2c" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_b75c92ef36f432fe68ec300a7d4" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shipping_addresses" ADD CONSTRAINT "FK_6acb476f20430e32f8382511c6b" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_11d81cd7be87b6f8865b0cf7661" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "store_users" ADD CONSTRAINT "FK_3077a42ec6ad94cfb93f919359d" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "store_users" ADD CONSTRAINT "FK_ec5c61b257ee2e70a26f3f8d048" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_store_category" ADD CONSTRAINT "FK_bb8007133b4cfd2c474cc53213b" FOREIGN KEY ("product_store_id") REFERENCES "product_store"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_store_category" ADD CONSTRAINT "FK_484f5bdafea63f039848c1740ea" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_store" ADD CONSTRAINT "FK_9f3d186a9731a15c7a9a52218aa" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_store" ADD CONSTRAINT "FK_7733838f2aa47a580841471e346" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "store_payment_configs" ADD CONSTRAINT "FK_b60cfa794f5a167b9f7afee70ef" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_eef2ebdce3031f3bf4451f8ff8a" FOREIGN KEY ("product_store_id") REFERENCES "product_store"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_616bdc6d321da0f98cb02b41a1d" FOREIGN KEY ("store_user_id") REFERENCES "store_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_b7a7bb813431fc7cd73cced0001" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_b7d8c98102b7cc1788236d49ed5" FOREIGN KEY ("pickup_point_id") REFERENCES "pickup_points"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_03a801095cb90cf148e474cfcb7" FOREIGN KEY ("status_id") REFERENCES "order_status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_b2f7b823a21562eeca20e72b006" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_8afabeaa460738befe497e857c7" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_transactions" ADD CONSTRAINT "FK_1f4dd90aece142a3a591cf4334b" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_6385a745d9e12a89b859bb25623" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_248020758e8c729e1568793743a" FOREIGN KEY ("product_store_id") REFERENCES "product_store"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "carts" ADD CONSTRAINT "FK_40adab2d2921a344e92a3db449d" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "carts" ADD CONSTRAINT "FK_1a925adfce0c3d20d21dd382e6b" FOREIGN KEY ("store_user_id") REFERENCES "store_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "FK_52ac39dd8a28730c63aeb428c9c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "FK_08daff4797a17784afb296ff65a" FOREIGN KEY ("store_user_id") REFERENCES "store_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "staff_users" ADD CONSTRAINT "FK_b42252566257d9ee8fb20f47510" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD CONSTRAINT "FK_7d2dad9f14eddeb09c256fea719" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD CONSTRAINT "FK_337aa8dba227a1fe6b73998307b" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP CONSTRAINT "FK_337aa8dba227a1fe6b73998307b"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP CONSTRAINT "FK_7d2dad9f14eddeb09c256fea719"`);
        await queryRunner.query(`ALTER TABLE "staff_users" DROP CONSTRAINT "FK_b42252566257d9ee8fb20f47510"`);
        await queryRunner.query(`ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "FK_08daff4797a17784afb296ff65a"`);
        await queryRunner.query(`ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "FK_52ac39dd8a28730c63aeb428c9c"`);
        await queryRunner.query(`ALTER TABLE "carts" DROP CONSTRAINT "FK_1a925adfce0c3d20d21dd382e6b"`);
        await queryRunner.query(`ALTER TABLE "carts" DROP CONSTRAINT "FK_40adab2d2921a344e92a3db449d"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_248020758e8c729e1568793743a"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_6385a745d9e12a89b859bb25623"`);
        await queryRunner.query(`ALTER TABLE "payment_transactions" DROP CONSTRAINT "FK_1f4dd90aece142a3a591cf4334b"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_8afabeaa460738befe497e857c7"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_b2f7b823a21562eeca20e72b006"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_03a801095cb90cf148e474cfcb7"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_b7d8c98102b7cc1788236d49ed5"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_b7a7bb813431fc7cd73cced0001"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_616bdc6d321da0f98cb02b41a1d"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_eef2ebdce3031f3bf4451f8ff8a"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`);
        await queryRunner.query(`ALTER TABLE "store_payment_configs" DROP CONSTRAINT "FK_b60cfa794f5a167b9f7afee70ef"`);
        await queryRunner.query(`ALTER TABLE "product_store" DROP CONSTRAINT "FK_7733838f2aa47a580841471e346"`);
        await queryRunner.query(`ALTER TABLE "product_store" DROP CONSTRAINT "FK_9f3d186a9731a15c7a9a52218aa"`);
        await queryRunner.query(`ALTER TABLE "product_store_category" DROP CONSTRAINT "FK_484f5bdafea63f039848c1740ea"`);
        await queryRunner.query(`ALTER TABLE "product_store_category" DROP CONSTRAINT "FK_bb8007133b4cfd2c474cc53213b"`);
        await queryRunner.query(`ALTER TABLE "store_users" DROP CONSTRAINT "FK_ec5c61b257ee2e70a26f3f8d048"`);
        await queryRunner.query(`ALTER TABLE "store_users" DROP CONSTRAINT "FK_3077a42ec6ad94cfb93f919359d"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_11d81cd7be87b6f8865b0cf7661"`);
        await queryRunner.query(`ALTER TABLE "shipping_addresses" DROP CONSTRAINT "FK_6acb476f20430e32f8382511c6b"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_b75c92ef36f432fe68ec300a7d4"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_f32b1cb14a9920477bcfd63df2c"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_c7bc1ffb56c570f42053fa7503b"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_337aa8dba227a1fe6b73998307"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d2dad9f14eddeb09c256fea71"`);
        await queryRunner.query(`DROP TABLE "roles_permissions"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
        await queryRunner.query(`DROP TABLE "staff_users"`);
        await queryRunner.query(`DROP INDEX "public"."ux_password_reset_active_per_user_global"`);
        await queryRunner.query(`DROP INDEX "public"."ux_password_reset_active_per_store_user"`);
        await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f57f87515b7c25718dc380c69c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1a925adfce0c3d20d21dd382e6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_40adab2d2921a344e92a3db449"`);
        await queryRunner.query(`DROP TABLE "carts"`);
        await queryRunner.query(`DROP TYPE "public"."carts_status_enum"`);
        await queryRunner.query(`DROP TABLE "cart_items"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_74958a64458e985265a2719175"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5409124de81d8d24ef76b4a531"`);
        await queryRunner.query(`DROP TABLE "components"`);
        await queryRunner.query(`DROP TABLE "payment_transactions"`);
        await queryRunner.query(`DROP TYPE "public"."payment_transactions_transaction_type_enum"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."orders_payment_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."orders_fulfillment_type_enum"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`DROP TABLE "order_status"`);
        await queryRunner.query(`DROP TABLE "pickup_points"`);
        await queryRunner.query(`DROP TABLE "store_payment_configs"`);
        await queryRunner.query(`DROP TYPE "public"."store_payment_configs_mode_enum"`);
        await queryRunner.query(`DROP TABLE "stores"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7733838f2aa47a580841471e34"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9f3d186a9731a15c7a9a52218a"`);
        await queryRunner.query(`DROP TABLE "product_store"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_484f5bdafea63f039848c1740e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bb8007133b4cfd2c474cc53213"`);
        await queryRunner.query(`DROP TABLE "product_store_category"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_420d9f679d41281f282f5bc7d0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8b0be371d28245da6e4f4b6187"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f073d4b501a8bd3c75144c21ac"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bbc46f4fc336522e99fc8782b4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c44ac33a05b144dd0d9ddcf932"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "store_users"`);
        await queryRunner.query(`DROP TABLE "customers"`);
        await queryRunner.query(`DROP TABLE "shipping_addresses"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "roles"`);
    }

}
