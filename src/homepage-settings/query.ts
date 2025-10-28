import { Knex } from "knex";
import { DB } from "../_services/_dbTables";
import { Database } from "../_services/databaseService";
import {
  CreateHomepageSettingsRequest,
  UpdateHomepageSettingsRequest,
} from "../_services/modelTypes";

export namespace Query {
  const knex = Database.getDBInstance();

  export async function getHomepageSettingsById(id: number) {
    return knex(DB.HomepageSettings)
      .where({ id, is_deleted: false })
      .first(
        "id",
        "section_title",
        "section_position",
        "is_active",
        "section_images",
        "product_ids",
        "created_at"
      );
  }

  export async function createHomepageSettings(data: CreateHomepageSettingsRequest) {
    // Ensure product_ids is set to null if not provided (for DB compatibility)
    const insertData = { ...data, product_ids: data.product_ids ?? null };
    return knex(DB.HomepageSettings)
      .insert(insertData as any)
      .returning("*");
  }

  export async function updateHomepageSettings(id: number, updates: UpdateHomepageSettingsRequest) {
    // Ensure product_ids is set to null if explicitly set to undefined
    const updateData = { ...updates };
    if ("product_ids" in updates && updates.product_ids === undefined) {
      updateData.product_ids = null;
    }
    return knex(DB.HomepageSettings)
      .where({ id, is_deleted: false })
      .update(updateData as any)
      .returning("*");
  }

  // Hard delete as per requirements
  export async function deleteHomepageSettings(id: number) {
    return knex(DB.HomepageSettings)
      .where({ id })
      .del();
  }

  export async function listHomepageSettings(isActive?: boolean) {
    const query = knex(DB.HomepageSettings)
      .where({ is_deleted: false });

    if (isActive !== undefined) {
      query.andWhere({ is_active: isActive });
    }

    return query
      .orderBy("section_position", "asc")
      .select(
        "id",
        "section_title",
        "section_position",
        "is_active",
        "section_images",
        "product_ids",
        "created_at"
      );
  }
}
