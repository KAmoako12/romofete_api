import type { Knex } from "knex";
import bcrypt from "bcrypt";


const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"; // Default password if not set
if (!ADMIN_EMAIL || !ADMIN_USERNAME) {
  throw new Error("ADMIN_EMAIL and ADMIN_USERNAME must be set in environment variables");
}
const ADMIN_ROLE: "superAdmin" | "admin" = "superAdmin";
const SALT_ROUNDS = 10;

export async function up(knex: Knex): Promise<void> {
  // Ensure the users table exists (it should from the init migration).
  // Insert the default admin user only if not already present.
  const existing = await knex("users")
    .where((qb) => {
      qb.where({ email: ADMIN_EMAIL }).orWhere({ username: ADMIN_USERNAME });
    })
    .first();

  if (!existing) {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
    await knex("users").insert({
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      password: hashed,
      role: ADMIN_ROLE,
      is_active: true,
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  // Remove the default admin user by email
  await knex("users").where({ email: ADMIN_EMAIL }).del();
}
