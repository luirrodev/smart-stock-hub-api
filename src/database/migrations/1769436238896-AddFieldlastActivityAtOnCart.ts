import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldlastActivityAtOnCart1769436238896 implements MigrationInterface {
    name = 'AddFieldlastActivityAtOnCart1769436238896'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "carts" ADD "last_activity_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "carts" DROP COLUMN "last_activity_at"`);
    }

}
