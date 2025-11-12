import { DB } from "../_services/_dbTables";
import { Database } from "../_services/databaseService";
import { CreateSubCategoryRequest, UpdateSubCategoryRequest } from "../_services/modelTypes";

export namespace Query {
  const knex = Database.getDBInstance();

  export async function getSubCategoryById(id: number) {
    return knex(DB.SubCategories).where({ id, is_deleted: false }).first();
  }

  export async function getSubCategoryByNameAndProductType(name: string, product_type_id: number) {
    return knex(DB.SubCategories)
      .where({ name, product_type_id, is_deleted: false })
      .first();
  }

  export async function createSubCategory(data: CreateSubCategoryRequest) {
    return knex(DB.SubCategories).insert(data as any).returning("*");
  }

  export async function updateSubCategory(id: number, updates: UpdateSubCategoryRequest) {
    return knex(DB.SubCategories).where({ id, is_deleted: false }).update(updates as any).returning("*");
  }

  export async function deleteSubCategory(id: number) {
    const subCategory = await getSubCategoryById(id);
    if (!subCategory) {
      throw new Error('Sub-category not found');
    }
    
    // Generate random string to append to unique fields (in case there's a unique constraint in the future)
    const randomSuffix = `_deleted_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    return knex(DB.SubCategories)
      .where({ id, is_deleted: false })
      .update({ 
        is_deleted: true, 
        deleted_at: new Date(),
        name: (subCategory as any).name + randomSuffix
      })
      .returning("*");
  }

  export async function listSubCategories(filters: any = {}, pagination: any = {}) {
    const {
      search,
      product_type_id
    } = filters;

    const {
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = pagination;

    const offset = (page - 1) * limit;

    let query = knex(DB.SubCategories).where({ is_deleted: false });

    // Apply search filter
    if (search) {
      query = query.where('name', 'ilike', `%${search}%`);
    }

    // Apply product_type_id filter
    if (product_type_id) {
      query = query.where({ product_type_id });
    }

    // Get total count for pagination
    const countQuery = query.clone().count<{ total: string }[]>('* as total');
    const [{ total }] = await countQuery;

    // Apply sorting and pagination
    const sub_categories = await query
      .select("id", "name", "product_type_id", "created_at")
      .orderBy(sort_by, sort_order)
      .limit(limit)
      .offset(offset);

    return {
      sub_categories,
      pagination: {
        page,
        limit,
        total: parseInt(total as string),
        pages: Math.ceil(parseInt(total as string) / limit)
      }
    };
  }
}
