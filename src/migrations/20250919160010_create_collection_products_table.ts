import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTableIfNotExists("collection_products", (table) => {
    table.increments("id").primary();
    table.integer("collection_id").unsigned().notNullable();
    table.integer("product_id").unsigned().notNullable();

    // Optional ordering of products within a collection
    table.integer("position").notNullable().defaultTo(0);

    // common fields
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();
    table.boolean("is_deleted").notNullable().defaultTo(false);

    // Foreign key constraints
    table.foreign("collection_id").references("id").inTable("collections").onDelete("CASCADE");
    table.foreign("product_id").references("id").inTable("products").onDelete("CASCADE");

    // Unique constraint to prevent duplicate product in same collection
    table.unique(["collection_id", "product_id"]);

    // Indexes
    table.index("collection_id");
    table.index("product_id");
    table.index("is_deleted");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("collection_products");
}
