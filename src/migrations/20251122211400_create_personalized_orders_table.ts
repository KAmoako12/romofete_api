import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTableIfNotExists("personalized_orders", (table) => {
        table.increments("id").primary();
        table.text("custom_message").notNullable();
        table.json("selected_colors").nullable();
        table.string("product_type", 100).notNullable();
        table.json("metadata").nullable();
        table.decimal("amount", 10, 2).nullable();
        table.string("order_status", 50).notNullable().defaultTo("pending");
        table.string("delivery_status", 50).notNullable().defaultTo("pending");

        // Common fields
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
        table.timestamp("deleted_at").nullable();
        table.boolean("is_deleted").notNullable().defaultTo(false);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("personalized_orders");
}
