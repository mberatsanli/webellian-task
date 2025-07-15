import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCatalogsTable1752536542732 implements MigrationInterface {
  name = 'CreateCatalogsTable1752536542732';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "catalog"
       (
         "id"          integer PRIMARY KEY AUTOINCREMENT NOT NULL,
         "name"        varchar  NOT NULL,
         "description" text,
         "created_at"  datetime NOT NULL DEFAULT (datetime('now')),
         "updated_at"  datetime NOT NULL DEFAULT (datetime('now')),
         CONSTRAINT "UQ_408ad15a08984a8e9b0619ee3e5" UNIQUE ("name")
       )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "catalog"`);
  }
}
