import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("bundle_products", (table) => {
        table.increments("id").primary();
        table.integer("bundle_id").unsigned().notNullable();
        table.integer("product_id").unsigned().notNullable();
        table.integer("quantity").notNullable().defaultTo(1); // How many of this product in the bundle

        // common fields
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("deleted_at").nullable();
        table.boolean("is_deleted").notNullable().defaultTo(false);

        // Foreign key constraints
        table.foreign("bundle_id").references("id").inTable("bundles").onDelete("CASCADE");
        table.foreign("product_id").references("id").inTable("products").onDelete("CASCADE");

        // Unique constraint to prevent duplicate product in same bundle
        table.unique(["bundle_id", "product_id"]);

        // Indexes
        table.index("bundle_id");
        table.index("product_id");
        table.index("is_deleted");
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("bundle_products");
}
