import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTableIfNotExists("pricing_config", (table) => {
        table.increments("id").primary();
        table.decimal("min_price", 10, 2).notNullable().defaultTo(0);
        table.decimal("max_price", 10, 2).nullable();
        table.integer("product_type_id").unsigned().nullable();
        table.foreign("product_type_id").references("id").inTable("product_types");

        // common fields
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("deleted_at").nullable();
        table.boolean("is_deleted").notNullable().defaultTo(false);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("pricing_config");
}
