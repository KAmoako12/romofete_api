import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("homepage_settings", (table) => {
    table.string("section_name").notNullable().unique();
    table.string("section_description").notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("homepage_settings", (table) => {
    table.dropColumn("section_name");
    table.dropColumn("section_description");
  });
}
