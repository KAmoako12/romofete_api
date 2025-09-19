import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTableIfNotExists("transactions", (table) => {
        table.increments("id").primary();
        table.integer("order_id").unsigned().notNullable();
        table.decimal("amount", 10, 2).notNullable();
        table.string("status", 50).notNullable().defaultTo("pending");
        table.string("reference", 100).notNullable().unique();

        // Foreign key constraint
        table.foreign("order_id").references("id").inTable("orders").onDelete("CASCADE");

        // common fields
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("deleted_at").nullable();
        table.boolean("is_deleted").notNullable().defaultTo(false);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("transactions");
}
