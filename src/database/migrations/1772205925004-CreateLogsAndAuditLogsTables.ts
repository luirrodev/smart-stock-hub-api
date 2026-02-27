import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLogsAndAuditLogsTables1772205925004 implements MigrationInterface {
    name = 'CreateLogsAndAuditLogsTables1772205925004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."logs_level_enum" AS ENUM('log', 'debug', 'warn', 'error')`);
        await queryRunner.query(`CREATE TABLE "logs" ("id" SERIAL NOT NULL, "requestId" uuid NOT NULL, "level" "public"."logs_level_enum" NOT NULL DEFAULT 'log', "message" text NOT NULL, "context" jsonb, "metadata" jsonb, "statusCode" integer, "duration" integer, "ip" character varying(45), "userAgent" text, "userId" integer, "endpoint" character varying(255), "method" character varying(10), "error" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_fb1b805f2f7795de79fa69340ba" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a4cde6e193d0dbfb9521cc4e70" ON "logs" ("requestId") `);
        await queryRunner.query(`CREATE INDEX "IDX_10d65a4fb56f62db29ed1b1459" ON "logs" ("level") `);
        await queryRunner.query(`CREATE INDEX "IDX_a1196a1956403417fe3a034339" ON "logs" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_52af00fa72eacc23a3a3b14c80" ON "logs" ("endpoint") `);
        await queryRunner.query(`CREATE INDEX "IDX_0cea11b3443bee34697606c59c" ON "logs" ("created_at") `);
        await queryRunner.query(`CREATE TYPE "public"."audit_logs_operation_enum" AS ENUM('CREATE', 'UPDATE', 'DELETE')`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" SERIAL NOT NULL, "entityName" character varying(100) NOT NULL, "entityId" character varying(100) NOT NULL, "operation" "public"."audit_logs_operation_enum" NOT NULL, "userId" integer, "changes" jsonb NOT NULL, "metadata" jsonb, "logged_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fb75d9e4b0438ff85e7294ceb8" ON "audit_logs" ("entityName") `);
        await queryRunner.query(`CREATE INDEX "IDX_1c56ddf7e5d110ceb2211a9555" ON "audit_logs" ("operation") `);
        await queryRunner.query(`CREATE INDEX "IDX_cfa83f61e4d27a87fcae1e025a" ON "audit_logs" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_6e8baed0edbeb9f1620f14ca0e" ON "audit_logs" ("logged_at") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_6e8baed0edbeb9f1620f14ca0e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cfa83f61e4d27a87fcae1e025a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1c56ddf7e5d110ceb2211a9555"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fb75d9e4b0438ff85e7294ceb8"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TYPE "public"."audit_logs_operation_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0cea11b3443bee34697606c59c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_52af00fa72eacc23a3a3b14c80"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a1196a1956403417fe3a034339"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_10d65a4fb56f62db29ed1b1459"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a4cde6e193d0dbfb9521cc4e70"`);
        await queryRunner.query(`DROP TABLE "logs"`);
        await queryRunner.query(`DROP TYPE "public"."logs_level_enum"`);
    }

}
