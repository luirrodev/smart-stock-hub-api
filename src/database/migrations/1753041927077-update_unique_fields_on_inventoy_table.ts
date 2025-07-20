import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUniqueFieldsOnInventoyTable1753041927077 implements MigrationInterface {
    name = 'UpdateUniqueFieldsOnInventoyTable1753041927077'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c314fcb7ec8da880f6e432c881" ON "inventories" ("product_id", "warehouse_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_c314fcb7ec8da880f6e432c881"`);
    }

}
