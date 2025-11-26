import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // 1) Add columns, but keep `reference` nullable first
  await knex.schema.alterTable("personalized_orders", (table) => {
    table.string("customer_email", 255).nullable();
    table.string("customer_phone", 50).nullable();
    table.string("customer_name", 255).nullable();

    table.string("payment_status", 50).notNullable().defaultTo("pending");
    table.string("payment_reference", 255).nullable();

    // TEMP: nullable, will enforce NOT NULL + UNIQUE after backfill
    table.string("reference", 255).nullable();

    table.text("delivery_address").nullable();
  });

  // 2) Backfill existing rows with some reference value
  // Adjust this logic to whatever you want your reference to look like
  await knex("personalized_orders")
    .whereNull("reference")
    .update({
      reference: knex.raw(
        `"personalized_orders"."id"::text` // e.g. just use the id as reference
      ),
    });

  // 3) Enforce NOT NULL + UNIQUE on reference
  await knex.schema.alterTable("personalized_orders", (table) => {
    table.string("reference", 255).notNullable().unique().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("personalized_orders", (table) => {
    table.dropColumn("customer_email");
    table.dropColumn("customer_phone");
    table.dropColumn("customer_name");
    table.dropColumn("payment_status");
    table.dropColumn("payment_reference");
    table.dropColumn("reference");
    table.dropColumn("delivery_address");
  });
}
