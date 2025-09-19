import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("username", 80).notNullable().unique();
    table.string("email", 120).notNullable().unique();
    table.string("password", 120).notNullable();
    table.string("role", 20).notNullable();
    table.boolean("is_active").notNullable().defaultTo(true);

    // common fields
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();
    table.boolean("is_deleted").notNullable().defaultTo(false);
  });

}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("users");
}

