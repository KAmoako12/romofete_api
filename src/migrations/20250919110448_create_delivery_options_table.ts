import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("delivery_options", (table) => {
        table.increments("id").primary();
        table.string("name", 100).notNullable().unique();
        table.decimal("amount", 10, 2).notNullable();

        // common fields
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("deleted_at").nullable();
        table.boolean("is_deleted").notNullable().defaultTo(false);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("delivery_options");
}
