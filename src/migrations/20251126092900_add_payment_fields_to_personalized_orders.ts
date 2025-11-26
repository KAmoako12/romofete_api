import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("personalized_orders", (table) => {
        // Add customer email for payment processing
        table.string("customer_email", 255).nullable();
        table.string("customer_phone", 50).nullable();
        table.string("customer_name", 255).nullable();
        
        // Add payment tracking fields
        table.string("payment_status", 50).notNullable().defaultTo("pending");
        table.string("payment_reference", 255).nullable();
        table.string("reference", 255).notNullable().unique();
        
        // Add delivery address
        table.text("delivery_address").nullable();
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
