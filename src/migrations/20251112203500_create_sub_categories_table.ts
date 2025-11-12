import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("sub_categories", (table) => {
    table.increments("id").primary();
    table.string("name", 100).notNullable();
    table
      .integer("product_type_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("product_types")
      .onDelete("CASCADE");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();
    table.boolean("is_deleted").defaultTo(false);
    
    // Index for faster lookups by product_type_id
    table.index("product_type_id");
    table.index("is_deleted");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("sub_categories");
}
