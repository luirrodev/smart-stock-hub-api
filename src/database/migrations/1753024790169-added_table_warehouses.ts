import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedTableWarehouses1753024790169 implements MigrationInterface {
    name = 'AddedTableWarehouses1753024790169'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "warehouses" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "address" character varying NOT NULL, "code" character varying NOT NULL, "active" boolean NOT NULL DEFAULT true, "manager_id" integer, CONSTRAINT "PK_56ae21ee2432b2270b48867e4be" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "warehouses" ADD CONSTRAINT "FK_6c0a3017732f03feb52e47fad96" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "warehouses" DROP CONSTRAINT "FK_6c0a3017732f03feb52e47fad96"`);
        await queryRunner.query(`DROP TABLE "warehouses"`);
    }

}
