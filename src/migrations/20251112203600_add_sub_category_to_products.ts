import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("products", (table) => {
    table
      .integer("sub_category_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("sub_categories")
      .onDelete("SET NULL");
    
    // Index for faster lookups by sub_category_id
    table.index("sub_category_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("products", (table) => {
    table.dropColumn("sub_category_id");
  });
}
