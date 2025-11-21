import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("mailing_list", (table) => {
    table.increments("id").primary();
    table.string("email", 120).notNullable().unique();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("mailing_list");
}
