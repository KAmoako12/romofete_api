import { Knex } from "knex";
import { DB } from "../_services/_dbTables";
import { Database } from "../_services/databaseService";
import { CreateProductTypeRequest, UpdateProductTypeRequest } from "../_services/modelTypes";

export namespace Query {
  const knex = Database.getDBInstance();

  export async function getProductTypeById(id: number) {
    return knex(DB.ProductTypes).where({ id, is_deleted: false }).first();
  }

  export async function getProductTypeByName(name: string) {
    return knex(DB.ProductTypes).where("name", name).where("is_deleted", false).first();
  }

  export async function createProductType(data: CreateProductTypeRequest) {
    return knex(DB.ProductTypes).insert(data as any).returning("*");
  }

  export async function updateProductType(id: number, updates: UpdateProductTypeRequest) {
    return knex(DB.ProductTypes).where({ id, is_deleted: false }).update(updates as any).returning("*");
  }

  export async function deleteProductType(id: number) {
    return knex(DB.ProductTypes)
      .where({ id, is_deleted: false })
      .update({ is_deleted: true, deleted_at: new Date() })
      .returning("*");
  }

  export async function listProductTypes() {
    return knex(DB.ProductTypes)
      .where({ is_deleted: false })
      .select("id", "name", "allowed_types", "created_at");
  }
}
