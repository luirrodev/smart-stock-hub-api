import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateFieldImageOnBrandTable1753030266490 implements MigrationInterface {
    name = 'UpdateFieldImageOnBrandTable1753030266490'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "brands" ALTER COLUMN "image" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "brands" ALTER COLUMN "image" SET NOT NULL`);
    }

}
