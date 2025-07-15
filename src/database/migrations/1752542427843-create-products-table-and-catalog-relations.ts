import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsTableAndCatalogRelations1752542427843
  implements MigrationInterface
{
  name = 'CreateProductsTableAndCatalogRelations1752542427843';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "product" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "description" text, "price" decimal(10,2) NOT NULL, "stock_quantity" integer NOT NULL DEFAULT (0), "catalog_id" integer, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_22cc43e9a74d7498546e9a63e77" UNIQUE ("name"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_product" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "description" text, "price" decimal(10,2) NOT NULL, "stock_quantity" integer NOT NULL DEFAULT (0), "catalog_id" integer, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_22cc43e9a74d7498546e9a63e77" UNIQUE ("name"), CONSTRAINT "FK_43fc6ce23925dbaa92fea160f71" FOREIGN KEY ("catalog_id") REFERENCES "catalog" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_product"("id", "name", "description", "price", "stock_quantity", "catalog_id", "created_at", "updated_at") SELECT "id", "name", "description", "price", "stock_quantity", "catalog_id", "created_at", "updated_at" FROM "product"`,
    );
    await queryRunner.query(`DROP TABLE "product"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_product" RENAME TO "product"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product" RENAME TO "temporary_product"`,
    );
    await queryRunner.query(
      `CREATE TABLE "product" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "description" text, "price" decimal(10,2) NOT NULL, "stock_quantity" integer NOT NULL DEFAULT (0), "catalog_id" integer, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_22cc43e9a74d7498546e9a63e77" UNIQUE ("name"))`,
    );
    await queryRunner.query(
      `INSERT INTO "product"("id", "name", "description", "price", "stock_quantity", "catalog_id", "created_at", "updated_at") SELECT "id", "name", "description", "price", "stock_quantity", "catalog_id", "created_at", "updated_at" FROM "temporary_product"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_product"`);
    await queryRunner.query(`DROP TABLE "product"`);
  }
}
