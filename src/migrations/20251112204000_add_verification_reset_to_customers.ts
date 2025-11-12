import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("customers", (table) => {
    // Email verification columns
    table.boolean("email_verified").defaultTo(false);
    table.string("verification_code", 6).nullable();
    table.timestamp("verification_code_expires").nullable();
    
    // Password reset columns
    table.string("reset_code", 6).nullable();
    table.timestamp("reset_code_expires").nullable();
    
    // Indexes for faster lookups
    table.index("verification_code");
    table.index("reset_code");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("customers", (table) => {
    table.dropColumn("email_verified");
    table.dropColumn("verification_code");
    table.dropColumn("verification_code_expires");
    table.dropColumn("reset_code");
    table.dropColumn("reset_code_expires");
  });
}
