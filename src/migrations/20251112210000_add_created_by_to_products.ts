import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.table("products", (table) => {
        table.integer("created_by").unsigned().nullable();
        table.foreign("created_by").references("id").inTable("users").onDelete("SET NULL");
        table.index("created_by"); // Add index for faster filtering
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.table("products", (table) => {
        table.dropForeign(["created_by"]);
        table.dropIndex(["created_by"]);
        table.dropColumn("created_by");
    });
}
