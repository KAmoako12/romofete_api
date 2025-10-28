import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("homepage_settings", (table) => {
    table.specificType("product_ids", "integer[]").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("homepage_settings", (table) => {
    table.dropColumn("product_ids");
  });
}
