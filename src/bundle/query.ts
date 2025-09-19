import { Knex } from "knex";
import { DB } from "../_services/_dbTables";

export class BundleQuery {
  private db: Knex;

  constructor(db: Knex) {
    this.db = db;
  }

  // Create a new bundle
  async createBundle(bundleData: {
    name: string;
    description?: string;
    discount_percentage?: number;
    is_active?: boolean;
  }) {
    const [bundle] = await this.db(DB.Bundles)
      .insert({
        ...bundleData,
        created_at: this.db.fn.now(),
        updated_at: this.db.fn.now()
      })
      .returning("*");
    return bundle;
  }

  // Add products to a bundle
  async addProductsToBundle(bundleId: number, products: Array<{ product_id: number; quantity: number }>) {
    const bundleProducts = products.map(product => ({
      bundle_id: bundleId,
      product_id: product.product_id,
      quantity: product.quantity,
      created_at: this.db.fn.now()
    }));

    return await this.db(DB.BundleProducts)
      .insert(bundleProducts)
      .returning("*");
  }

  // Get bundle by ID with products
  async getBundleById(id: number) {
    const bundle = await this.db(DB.Bundles)
      .where({ id, is_deleted: false })
      .first();

    if (!bundle) return null;

    const products = await this.db(DB.BundleProducts)
      .join(DB.Products, `${DB.BundleProducts}.product_id`, `${DB.Products}.id`)
      .join(DB.ProductTypes, `${DB.Products}.product_type_id`, `${DB.ProductTypes}.id`)
      .where({
        [`${DB.BundleProducts}.bundle_id`]: id,
        [`${DB.BundleProducts}.is_deleted`]: false,
        [`${DB.Products}.is_deleted`]: false
      })
      .select(
        `${DB.BundleProducts}.id as bundle_product_id`,
        `${DB.BundleProducts}.quantity`,
        `${DB.Products}.id as product_id`,
        `${DB.Products}.name as product_name`,
        `${DB.Products}.description as product_description`,
        `${DB.Products}.price as product_price`,
        `${DB.Products}.stock as product_stock`,
        `${DB.Products}.images as product_images`,
        `${DB.ProductTypes}.name as product_type_name`
      );

    return {
      ...bundle,
      products
    };
  }

  // Get all bundles with optional filters
  async getBundles(filters: {
    is_active?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }) {
    const {
      is_active,
      search,
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = filters;

    let query = this.db(DB.Bundles)
      .where({ is_deleted: false });

    // Apply filters
    if (is_active !== undefined) {
      query = query.where({ is_active });
    }

    if (search) {
      query = query.where(function() {
        this.where('name', 'ilike', `%${search}%`)
          .orWhere('description', 'ilike', `%${search}%`);
      });
    }

    // Get total count for pagination
    const totalQuery = query.clone();
    const [{ count }] = await totalQuery.count('* as count');
    const total = parseInt(count as string);

    // Apply pagination and sorting
    const offset = (page - 1) * limit;
    const bundles = await query
      .orderBy(sort_by, sort_order)
      .limit(limit)
      .offset(offset)
      .select('*');

    // Get products for each bundle
    const bundlesWithProducts = await Promise.all(
      bundles.map(async (bundle) => {
        const products = await this.db(DB.BundleProducts)
          .join(DB.Products, `${DB.BundleProducts}.product_id`, `${DB.Products}.id`)
          .where({
            [`${DB.BundleProducts}.bundle_id`]: bundle.id,
            [`${DB.BundleProducts}.is_deleted`]: false,
            [`${DB.Products}.is_deleted`]: false
          })
          .select(
            `${DB.BundleProducts}.quantity`,
            `${DB.Products}.id as product_id`,
            `${DB.Products}.name as product_name`,
            `${DB.Products}.price as product_price`
          );

        return {
          ...bundle,
          products_count: products.length,
          total_value: products.reduce((sum, p) => sum + (p.product_price * p.quantity), 0)
        };
      })
    );

    return {
      data: bundlesWithProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Update bundle
  async updateBundle(id: number, updateData: {
    name?: string;
    description?: string;
    discount_percentage?: number;
    is_active?: boolean;
  }) {
    const [bundle] = await this.db(DB.Bundles)
      .where({ id, is_deleted: false })
      .update({
        ...updateData,
        updated_at: this.db.fn.now()
      })
      .returning("*");
    return bundle;
  }

  // Remove product from bundle
  async removeProductFromBundle(bundleId: number, productId: number) {
    return await this.db(DB.BundleProducts)
      .where({
        bundle_id: bundleId,
        product_id: productId,
        is_deleted: false
      })
      .update({
        is_deleted: true,
        deleted_at: this.db.fn.now()
      });
  }

  // Update product quantity in bundle
  async updateBundleProductQuantity(bundleId: number, productId: number, quantity: number) {
    const [bundleProduct] = await this.db(DB.BundleProducts)
      .where({
        bundle_id: bundleId,
        product_id: productId,
        is_deleted: false
      })
      .update({ quantity })
      .returning("*");
    return bundleProduct;
  }

  // Delete bundle (soft delete)
  async deleteBundle(id: number) {
    // Soft delete the bundle
    await this.db(DB.Bundles)
      .where({ id })
      .update({
        is_deleted: true,
        deleted_at: this.db.fn.now()
      });

    // Soft delete all bundle products
    await this.db(DB.BundleProducts)
      .where({ bundle_id: id })
      .update({
        is_deleted: true,
        deleted_at: this.db.fn.now()
      });

    return true;
  }

  // Get products that are in the same bundles as a given product (for similar products feature)
  async getProductsInSameBundles(productId: number, limit: number = 10) {
    // First, get all bundles that contain the given product
    const bundleIds = await this.db(DB.BundleProducts)
      .where({
        product_id: productId,
        is_deleted: false
      })
      .pluck('bundle_id');

    if (bundleIds.length === 0) {
      return [];
    }

    // Then get all other products in those bundles
    const similarProducts = await this.db(DB.BundleProducts)
      .join(DB.Products, `${DB.BundleProducts}.product_id`, `${DB.Products}.id`)
      .join(DB.ProductTypes, `${DB.Products}.product_type_id`, `${DB.ProductTypes}.id`)
      .whereIn(`${DB.BundleProducts}.bundle_id`, bundleIds)
      .where(`${DB.BundleProducts}.product_id`, '!=', productId)
      .where({
        [`${DB.BundleProducts}.is_deleted`]: false,
        [`${DB.Products}.is_deleted`]: false
      })
      .groupBy(
        `${DB.Products}.id`,
        `${DB.Products}.name`,
        `${DB.Products}.description`,
        `${DB.Products}.price`,
        `${DB.Products}.stock`,
        `${DB.Products}.images`,
        `${DB.ProductTypes}.name`
      )
      .select(
        `${DB.Products}.id`,
        `${DB.Products}.name`,
        `${DB.Products}.description`,
        `${DB.Products}.price`,
        `${DB.Products}.stock`,
        `${DB.Products}.images`,
        `${DB.ProductTypes}.name as product_type_name`
      )
      .count(`${DB.BundleProducts}.bundle_id as shared_bundles_count`)
      .orderBy('shared_bundles_count', 'desc')
      .limit(limit);

    return similarProducts;
  }

  // Check if bundle exists and is not deleted
  async bundleExists(id: number): Promise<boolean> {
    const bundle = await this.db(DB.Bundles)
      .where({ id, is_deleted: false })
      .first();
    return !!bundle;
  }

  // Check if product is already in bundle
  async isProductInBundle(bundleId: number, productId: number): Promise<boolean> {
    const bundleProduct = await this.db(DB.BundleProducts)
      .where({
        bundle_id: bundleId,
        product_id: productId,
        is_deleted: false
      })
      .first();
    return !!bundleProduct;
  }
}
