import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTableIfNotExists("product_types", (table) => {
        table.increments("id").primary();
        table.string("name", 100).notNullable().unique();
        table.json("allowed_types").nullable(); // JSON field for allowed types array

        // common fields
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("deleted_at").nullable();
        table.boolean("is_deleted").notNullable().defaultTo(false);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("product_types");
}
