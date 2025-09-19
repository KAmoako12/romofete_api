import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("orders", (table) => {
        table.integer("delivery_option_id").unsigned().nullable();
        table.decimal("delivery_cost", 10, 2).nullable();
        table.decimal("subtotal", 10, 2).notNullable().defaultTo(0);
        table.string("payment_status", 50).notNullable().defaultTo("pending");
        table.string("payment_reference", 100).nullable();
        table.text("delivery_address").nullable();
        table.string("customer_email", 120).nullable();
        table.string("customer_phone", 20).nullable();
        table.string("customer_name", 160).nullable();

        // Foreign key constraint for delivery option
        table.foreign("delivery_option_id").references("id").inTable("delivery_options").onDelete("SET NULL");
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable("orders", (table) => {
        table.dropForeign(["delivery_option_id"]);
        table.dropColumn("delivery_option_id");
        table.dropColumn("delivery_cost");
        table.dropColumn("subtotal");
        table.dropColumn("payment_status");
        table.dropColumn("payment_reference");
        table.dropColumn("delivery_address");
        table.dropColumn("customer_email");
        table.dropColumn("customer_phone");
        table.dropColumn("customer_name");
    });
}
