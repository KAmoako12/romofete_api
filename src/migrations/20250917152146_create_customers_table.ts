import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("customers", (table) => {
        table.increments("id").primary();
        table.string("first_name", 80).nullable();
        table.string("last_name", 80).nullable();
        table.string("phone", 20).nullable();
        table.string("address", 255).nullable();
        table.string("city", 80).nullable();
        table.string("state", 80).nullable();
        table.string("zip_code", 20).nullable();
        table.string("country", 80).nullable();
        table.string("email", 120).notNullable().unique();
        table.string("password", 120).notNullable();
        table.boolean("is_active").notNullable().defaultTo(true);

        // common fields
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("deleted_at").nullable();
        table.boolean("is_deleted").notNullable().defaultTo(false);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("customers");
}
