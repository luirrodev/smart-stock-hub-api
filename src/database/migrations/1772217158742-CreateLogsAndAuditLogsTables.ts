import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLogsAndAuditLogsTables1772217158742 implements MigrationInterface {
    name = 'CreateLogsAndAuditLogsTables1772217158742'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."logs_level_enum" AS ENUM('log', 'debug', 'warn', 'error')`);
        await queryRunner.query(`CREATE TABLE "logs" ("id" SERIAL NOT NULL, "request_id" uuid NOT NULL, "level" "public"."logs_level_enum" NOT NULL DEFAULT 'log', "message" text NOT NULL, "context" jsonb, "metadata" jsonb, "status_code" integer, "duration_ms" integer, "ip" character varying(45), "user_agent" text, "user_id" integer, "endpoint" character varying(255), "method" character varying(10), "error" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_fb1b805f2f7795de79fa69340ba" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8fc5bf83f19e36b61a21f1fd26" ON "logs" ("request_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_10d65a4fb56f62db29ed1b1459" ON "logs" ("level") `);
        await queryRunner.query(`CREATE INDEX "IDX_70c2c3d40d9f661ac502de5134" ON "logs" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_52af00fa72eacc23a3a3b14c80" ON "logs" ("endpoint") `);
        await queryRunner.query(`CREATE INDEX "IDX_0cea11b3443bee34697606c59c" ON "logs" ("created_at") `);
        await queryRunner.query(`CREATE TYPE "public"."audit_logs_operation_enum" AS ENUM('CREATE', 'UPDATE', 'DELETE')`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" SERIAL NOT NULL, "entity_name" character varying(100) NOT NULL, "entity_id" character varying(100) NOT NULL, "operation" "public"."audit_logs_operation_enum" NOT NULL, "user_id" integer, "changes" jsonb NOT NULL, "metadata" jsonb, "logged_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4057c4849108f6d6ccb77a4e91" ON "audit_logs" ("entity_name") `);
        await queryRunner.query(`CREATE INDEX "IDX_1c56ddf7e5d110ceb2211a9555" ON "audit_logs" ("operation") `);
        await queryRunner.query(`CREATE INDEX "IDX_bd2726fd31b35443f2245b93ba" ON "audit_logs" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_6e8baed0edbeb9f1620f14ca0e" ON "audit_logs" ("logged_at") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_6e8baed0edbeb9f1620f14ca0e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bd2726fd31b35443f2245b93ba"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1c56ddf7e5d110ceb2211a9555"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4057c4849108f6d6ccb77a4e91"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TYPE "public"."audit_logs_operation_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0cea11b3443bee34697606c59c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_52af00fa72eacc23a3a3b14c80"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_70c2c3d40d9f661ac502de5134"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_10d65a4fb56f62db29ed1b1459"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8fc5bf83f19e36b61a21f1fd26"`);
        await queryRunner.query(`DROP TABLE "logs"`);
        await queryRunner.query(`DROP TYPE "public"."logs_level_enum"`);
    }

}
