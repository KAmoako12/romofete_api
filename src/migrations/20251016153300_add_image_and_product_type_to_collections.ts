import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("collections", (table) => {
    table.string("image", 500).nullable();
    table.integer("product_type_id").unsigned().nullable();
    
    // Add foreign key constraint to product_types table
    table.foreign("product_type_id").references("id").inTable("product_types");
    
    // Add index for better query performance
    table.index("product_type_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("collections", (table) => {
    table.dropForeign(["product_type_id"]);
    table.dropIndex(["product_type_id"]);
    table.dropColumn("image");
    table.dropColumn("product_type_id");
  });
}
