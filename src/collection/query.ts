import { Knex } from "knex";
import { DB } from "../_services/_dbTables";
import { Collection, CollectionProduct } from "../_services/modelTypes";

export class CollectionQuery {
  private db: Knex;

  constructor(db: Knex) {
    this.db = db;
  }

  // Create a new collection
  async createCollection(collectionData: {
    name: string;
    description?: string;
    is_active?: boolean;
  }): Promise<Collection> {
    const insertData: any = {
      ...collectionData,
      created_at: this.db.fn.now(),
      updated_at: this.db.fn.now()
    };

    const [collection] = await this.db<Collection>(DB.Collections)
      .insert(insertData)
      .returning("*");
    return collection as Collection;
  }

  // Add products to a collection
  async addProductsToCollection(collectionId: number, products: Array<{ product_id: number; position?: number }>): Promise<CollectionProduct[]> {
    const rows = products.map((p) => ({
      collection_id: collectionId,
      product_id: p.product_id,
      position: typeof p.position === "number" ? p.position : 0,
      created_at: this.db.fn.now()
    }));

    const result = await this.db<CollectionProduct>(DB.CollectionProducts)
      .insert(rows)
      .returning("*");
    return result as CollectionProduct[];
  }

  // Get collection by ID with products
  async getCollectionById(id: number) {
    const collection = await this.db(DB.Collections)
      .where({ id, is_deleted: false })
      .first();

    if (!collection) return null;

    const products = await this.db(DB.CollectionProducts)
      .join(DB.Products, `${DB.CollectionProducts}.product_id`, `${DB.Products}.id`)
      .join(DB.ProductTypes, `${DB.Products}.product_type_id`, `${DB.ProductTypes}.id`)
      .where({
        [`${DB.CollectionProducts}.collection_id`]: id,
        [`${DB.CollectionProducts}.is_deleted`]: false,
        [`${DB.Products}.is_deleted`]: false
      })
      .select(
        `${DB.CollectionProducts}.id as collection_product_id`,
        `${DB.CollectionProducts}.position`,
        `${DB.Products}.id as product_id`,
        `${DB.Products}.name as product_name`,
        `${DB.Products}.description as product_description`,
        `${DB.Products}.price as product_price`,
        `${DB.Products}.stock as product_stock`,
        `${DB.Products}.images as product_images`,
        `${DB.ProductTypes}.name as product_type_name`
      )
      .orderBy(`${DB.CollectionProducts}.position`, "asc")
      .orderBy(`${DB.Products}.created_at`, "desc");

    return {
      ...collection,
      products
    };
  }

  // List collections with filters and pagination
  async getCollections(filters: {
    is_active?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: "asc" | "desc";
  }) {
    const {
      is_active,
      search,
      page = 1,
      limit = 20,
      sort_by = "created_at",
      sort_order = "desc"
    } = filters;

    let query = this.db(DB.Collections).where({ is_deleted: false });

    if (typeof is_active === "boolean") {
      query = query.where({ is_active });
    }

    if (search) {
      query = query.where(function () {
        this.where("name", "ilike", `%${search}%`).orWhere(
          "description",
          "ilike",
          `%${search}%`
        );
      });
    }

    // Count
    const totalRow = await query.clone().count<{ count: string }[]>("* as count");
    const total = parseInt(totalRow[0]?.count || "0");

    const offset = (page - 1) * limit;
    const collections = await query
      .orderBy(sort_by, sort_order)
      .limit(limit)
      .offset(offset)
      .select("*");

    // Attach counts
    const withStats = await Promise.all(
      collections.map(async (c) => {
        const products = await this.db(DB.CollectionProducts)
          .join(DB.Products, `${DB.CollectionProducts}.product_id`, `${DB.Products}.id`)
          .where({
            [`${DB.CollectionProducts}.collection_id`]: c.id,
            [`${DB.CollectionProducts}.is_deleted`]: false,
            [`${DB.Products}.is_deleted`]: false
          })
          .select(
            `${DB.CollectionProducts}.position`,
            `${DB.Products}.id as product_id`,
            `${DB.Products}.name as product_name`,
            `${DB.Products}.price as product_price`
          );

        return {
          ...c,
          products_count: products.length,
          // aggregate total value; position doesn't affect value
          total_value: products.reduce((sum: number, p: any) => sum + parseFloat(p.product_price), 0)
        };
      })
    );

    return {
      data: withStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Update collection
  async updateCollection(id: number, updates: { name?: string; description?: string; is_active?: boolean }): Promise<Collection> {
    const payload: any = { ...updates, updated_at: this.db.fn.now() };
    const [row] = await this.db<Collection>(DB.Collections)
      .where({ id, is_deleted: false })
      .update(payload)
      .returning("*");
    return row as Collection;
  }

  // Soft delete collection and its mapping rows
  async deleteCollection(id: number) {
    const deletion = { is_deleted: true, deleted_at: this.db.fn.now() };

    await this.db(DB.Collections).where({ id } as any).update(deletion);
    await this.db(DB.CollectionProducts).where({ collection_id: id } as any).update(deletion);
    return true;
  }

  // Remove a product from a collection (soft delete mapping row)
  async removeProductFromCollection(collectionId: number, productId: number) {
    const deletion = { is_deleted: true, deleted_at: this.db.fn.now() };
    return this.db(DB.CollectionProducts)
      .where({ collection_id: collectionId, product_id: productId, is_deleted: false } as any)
      .update(deletion);
  }

  // Update product position in collection
  async updateCollectionProductPosition(collectionId: number, productId: number, position: number): Promise<CollectionProduct> {
    const [row] = await this.db<CollectionProduct>(DB.CollectionProducts)
      .where({ collection_id: collectionId, product_id: productId, is_deleted: false } as any)
      .update({ position })
      .returning("*");
    return row as CollectionProduct;
  }

  // Exists helpers
  async collectionExists(id: number): Promise<boolean> {
    const row = await this.db(DB.Collections).where({ id, is_deleted: false }).first();
    return !!row;
  }

  async isProductInCollection(collectionId: number, productId: number): Promise<boolean> {
    const row = await this.db(DB.CollectionProducts)
      .where({ collection_id: collectionId, product_id: productId, is_deleted: false } as any)
      .first();
    return !!row;
  }
}
