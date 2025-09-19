import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("order_items", (table) => {
        table.increments("id").primary();
        table.integer("order_id").unsigned().notNullable();
        table.integer("product_id").unsigned().notNullable();
        table.integer("quantity").notNullable();
        table.decimal("price", 10, 2).notNullable(); // Price at time of order

        // Foreign key constraints
        table.foreign("order_id").references("id").inTable("orders").onDelete("CASCADE");
        table.foreign("product_id").references("id").inTable("products").onDelete("RESTRICT");

        // common fields
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("deleted_at").nullable();
        table.boolean("is_deleted").notNullable().defaultTo(false);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("order_items");
}
