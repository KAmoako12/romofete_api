import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("bundles", (table) => {
        table.increments("id").primary();
        table.string("name", 200).notNullable();
        table.text("description").nullable();
        table.decimal("discount_percentage", 5, 2).nullable(); // Optional discount for the bundle
        table.boolean("is_active").notNullable().defaultTo(true);

        // common fields
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
        table.timestamp("deleted_at").nullable();
        table.boolean("is_deleted").notNullable().defaultTo(false);

        // Indexes
        table.index("name");
        table.index("is_active");
        table.index("is_deleted");
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("bundles");
}
