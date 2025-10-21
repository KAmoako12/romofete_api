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
    const productType = await getProductTypeById(id);
    if (!productType) {
      throw new Error('Product type not found');
    }
    
    // Generate random string to append to unique fields
    const randomSuffix = `_deleted_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    return knex(DB.ProductTypes)
      .where({ id, is_deleted: false })
      .update({ 
        is_deleted: true, 
        deleted_at: new Date(),
        name: (productType as any).name + randomSuffix
      })
      .returning("*");
  }

  export async function listProductTypes(filters: any = {}, pagination: any = {}) {
    const {
      search,
      occasion,
      minPrice,
      maxPrice
    } = filters;

    const {
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = pagination;

    const offset = (page - 1) * limit;

    let query = knex(DB.ProductTypes).where({ is_deleted: false });

    // Apply search filter
    if (search) {
      query = query.where('name', 'ilike', `%${search}%`);
    }

    // Apply occasion filter
    if (occasion) {
      query = query.where(function() {
        // Search in product type name and allowed_types
        this.where('name', 'ilike', `%${occasion}%`)
          .orWhereRaw(`CAST(allowed_types AS TEXT) ILIKE ?`, [`%${occasion}%`])
          // OR search for product types that have products with matching occasion in metadata
          .orWhereExists(
            knex.select('*')
              .from(DB.Products)
              .whereRaw(`${DB.Products}.product_type_id = ${DB.ProductTypes}.id`)
              .andWhere(`${DB.Products}.is_deleted`, false)
              .andWhereRaw(`${DB.Products}.extra_properties ->> 'occasion' ILIKE ?`, [`%${occasion}%`])
          );
      });
    }

    // Apply price range filter - find product types that have products in this price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      query = query.whereExists(
        knex.select('*')
          .from(DB.Products)
          .whereRaw(`${DB.Products}.product_type_id = ${DB.ProductTypes}.id`)
          .andWhere(`${DB.Products}.is_deleted`, false)
          .modify((subQuery) => {
            if (minPrice !== undefined) {
              subQuery.where(`${DB.Products}.price`, '>=', minPrice);
            }
            if (maxPrice !== undefined) {
              subQuery.where(`${DB.Products}.price`, '<=', maxPrice);
            }
          })
      );
    }

    // Get total count for pagination
    const countQuery = query.clone().count<{ total: string }[]>('* as total');
    const [{ total }] = await countQuery;

    // Apply sorting and pagination
    const product_types = await query
      .select("id", "name", "allowed_types", "created_at")
      .orderBy(sort_by, sort_order)
      .limit(limit)
      .offset(offset);

    console.log(product_types);

    return {
      product_types,
      pagination: {
        page,
        limit,
        total: parseInt(total as string),
        pages: Math.ceil(parseInt(total as string) / limit)
      }
    };
  }
}
