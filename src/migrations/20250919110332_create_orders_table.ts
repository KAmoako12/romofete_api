import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTableIfNotExists("orders", (table) => {
        table.increments("id").primary();
        table.integer("user_id").unsigned().nullable(); // Can be null for guest orders
        table.integer("quantity").notNullable();
        table.decimal("total_price", 10, 2).notNullable();
        table.string("status", 50).notNullable().defaultTo("pending");
        table.string("reference", 100).notNullable().unique();

        // Foreign key constraint (optional for guest orders)
        table.foreign("user_id").references("id").inTable("users").onDelete("SET NULL");

        // common fields
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("deleted_at").nullable();
        table.boolean("is_deleted").notNullable().defaultTo(false);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("orders");
}
