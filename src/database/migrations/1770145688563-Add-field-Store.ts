import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldStore1770145688563 implements MigrationInterface {
    name = 'AddFieldStore1770145688563'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stores" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "deleted_at"`);
    }

}
