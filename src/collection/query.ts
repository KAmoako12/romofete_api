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
    image?: string[];
  }): Promise<Collection> {
    const insertData: any = {
      ...collectionData,
      image: collectionData.image ? JSON.stringify(collectionData.image) : null,
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
    occasion?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: "asc" | "desc";
  }) {
    const {
      is_active,
      search,
      occasion,
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

    if (occasion) {
      const self = this;
      query = query.where(function () {
        // Search collections that have a product_type_id matching the occasion
        this.whereExists(
          self.db.select('*')
            .from(DB.ProductTypes)
            .whereRaw(`${DB.ProductTypes}.id = ${DB.Collections}.product_type_id`)
            .andWhere(function () {
              this.where(`${DB.ProductTypes}.name`, 'ilike', `%${occasion}%`)
                .orWhereRaw(`CAST(${DB.ProductTypes}.allowed_types AS TEXT) ILIKE ?`, [`%${occasion}%`]);
            })
        )
        // OR search collections that contain products with product_types OR product metadata matching the occasion
        .orWhereExists(
          self.db.select('*')
            .from(DB.CollectionProducts)
            .join(DB.Products, `${DB.CollectionProducts}.product_id`, `${DB.Products}.id`)
            .join(DB.ProductTypes, `${DB.Products}.product_type_id`, `${DB.ProductTypes}.id`)
            .whereRaw(`${DB.CollectionProducts}.collection_id = ${DB.Collections}.id`)
            .andWhere(`${DB.CollectionProducts}.is_deleted`, false)
            .andWhere(`${DB.Products}.is_deleted`, false)
            .andWhere(function () {
              // Search in product type name and allowed_types
              this.where(`${DB.ProductTypes}.name`, 'ilike', `%${occasion}%`)
                .orWhereRaw(`CAST(${DB.ProductTypes}.allowed_types AS TEXT) ILIKE ?`, [`%${occasion}%`])
                // Search for specific "occasion" key in product metadata
                .orWhereRaw(`${DB.Products}.extra_properties ->> 'occasion' ILIKE ?`, [`%${occasion}%`]);
            })
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

    // Attach products with full details including images
    const withStats = await Promise.all(
      collections.map(async (c) => {
        const products = await this.db(DB.CollectionProducts)
          .join(DB.Products, `${DB.CollectionProducts}.product_id`, `${DB.Products}.id`)
          .join(DB.ProductTypes, `${DB.Products}.product_type_id`, `${DB.ProductTypes}.id`)
          .where({
            [`${DB.CollectionProducts}.collection_id`]: c.id,
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
            `${DB.Products}.extra_properties as product_extra_properties`,
            `${DB.ProductTypes}.name as product_type_name`
          )
          .orderBy(`${DB.CollectionProducts}.position`, "asc")
          .orderBy(`${DB.Products}.created_at`, "desc");

        return {
          ...c,
          products,
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
  async updateCollection(id: number, updates: { 
    name?: string; 
    description?: string; 
    image?: string[]; 
    product_type_id?: number; 
    is_active?: boolean 
  }): Promise<Collection> {
    const payload: any = { ...updates, updated_at: this.db.fn.now() };
    
    // Handle image array serialization
    if (updates.image !== undefined) {
      payload.image = JSON.stringify(updates.image);
    }
    
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

  // Replace all products in a collection (complete overwrite)
  async replaceCollectionProducts(collectionId: number, products: Array<{ product_id: number; position?: number }>): Promise<CollectionProduct[]> {
    // Start a transaction to ensure data consistency
    return await this.db.transaction(async (trx) => {
      // First, soft delete all existing products in the collection
      const deletion = { is_deleted: true, deleted_at: this.db.fn.now() };
      await trx(DB.CollectionProducts)
        .where({ collection_id: collectionId, is_deleted: false } as any)
        .update(deletion);

      // If no products provided, just return empty array
      if (products.length === 0) {
        return [];
      }

      // Then, add all new products
      const rows = products.map((p) => ({
        collection_id: collectionId,
        product_id: p.product_id,
        position: typeof p.position === "number" ? p.position : 0,
        created_at: this.db.fn.now()
      }));

      const result = await trx<CollectionProduct>(DB.CollectionProducts)
        .insert(rows)
        .returning("*");
      
      return result as CollectionProduct[];
    });
  }
}
