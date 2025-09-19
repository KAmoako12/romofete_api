import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTableIfNotExists("products", (table) => {
        table.increments("id").primary();
        table.string("name", 200).notNullable();
        table.text("description").nullable();
        table.decimal("price", 10, 2).notNullable();
        table.integer("stock").notNullable().defaultTo(0);
        table.integer("product_type_id").unsigned().notNullable();
        table.json("images").nullable(); // JSON field for images array
        table.json("extra_properties").nullable(); // JSON field for extra properties

        // Foreign key constraint
        table.foreign("product_type_id").references("id").inTable("product_types").onDelete("RESTRICT");

        // common fields
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("deleted_at").nullable();
        table.boolean("is_deleted").notNullable().defaultTo(false);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("products");
}
