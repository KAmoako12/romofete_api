import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTableIfNotExists("homepage_settings", (table) => {
        table.increments("id").primary();
        table.string("section_title").notNullable();
        table.integer("section_position").notNullable();
        table.boolean("is_active").notNullable().defaultTo(true);
        table.specificType("section_images", "text[]").notNullable().defaultTo('{}');
        // common fields
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("deleted_at").nullable();
        table.boolean("is_deleted").notNullable().defaultTo(false);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("homepage_settings");
}
