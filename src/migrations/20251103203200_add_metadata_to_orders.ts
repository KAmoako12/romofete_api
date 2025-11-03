import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("orders", (table) => {
        table.jsonb("metadata").nullable().comment("Flexible metadata field for client-specific data");
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable("orders", (table) => {
        table.dropColumn("metadata");
    });
}
