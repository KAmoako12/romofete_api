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
      .first();
  }

  export async function createHomepageSettings(data: CreateHomepageSettingsRequest) {
    return knex(DB.HomepageSettings)
      .insert(data as any)
      .returning("*");
  }

  export async function updateHomepageSettings(id: number, updates: UpdateHomepageSettingsRequest) {
    return knex(DB.HomepageSettings)
      .where({ id, is_deleted: false })
      .update(updates as any)
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
        "created_at"
      );
  }
}
