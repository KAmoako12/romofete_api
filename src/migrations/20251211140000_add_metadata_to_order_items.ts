import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("order_items", (table) => {
        table.jsonb("metadata").nullable().comment("Flexible metadata field for item-specific data like customizations");
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable("order_items", (table) => {
        table.dropColumn("metadata");
    });
}
