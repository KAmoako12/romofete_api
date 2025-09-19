import { Knex } from "knex";
import { DB } from "../_services/_dbTables";
import { Database } from "../_services/databaseService";
import { CreateProductRequest, UpdateProductRequest } from "../_services/modelTypes";

export interface ProductFilters {
  product_type_id?: number;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort_by?: 'name' | 'price' | 'created_at' | 'stock' | 'product_type_name';
  sort_order?: 'asc' | 'desc';
}

export namespace Query {
    const knex = Database.getDBInstance();

    export async function getProductById(id: number) {
        return knex(DB.Products)
            .leftJoin(DB.ProductTypes, `${DB.Products}.product_type_id`, `${DB.ProductTypes}.id`)
            .where({ [`${DB.Products}.id`]: id, [`${DB.Products}.is_deleted`]: false })
            .select(
                `${DB.Products}.*`,
                `${DB.ProductTypes}.name as product_type_name`,
                `${DB.ProductTypes}.allowed_types as product_type_allowed_types`
            )
            .first();
    }

    export async function getProductByName(name: string) {
        return knex(DB.Products).where({ name, is_deleted: false } as any).first();
    }

    export async function createProduct(product: CreateProductRequest) {
        return knex(DB.Products).insert(product as any).returning('*');
    }

    export async function updateProduct(id: number, updates: UpdateProductRequest) {
        return knex(DB.Products).where({ id, is_deleted: false }).update(updates as any).returning('*');
    }

    export async function deleteProduct(id: number) {
        return knex(DB.Products).where({ id, is_deleted: false }).update({ is_deleted: true, deleted_at: new Date() }).returning('*');
    }

    export async function listProducts(filters: ProductFilters = {}, pagination: PaginationOptions = {}) {
        const {
            product_type_id,
            min_price,
            max_price,
            in_stock,
            search
        } = filters;

        const {
            page = 1,
            limit = 20,
            sort_by = 'created_at',
            sort_order = 'desc'
        } = pagination;

        const offset = (page - 1) * limit;

        let query = knex(DB.Products)
            .leftJoin(DB.ProductTypes, `${DB.Products}.product_type_id`, `${DB.ProductTypes}.id`)
            .where(`${DB.Products}.is_deleted`, false);

        // Apply filters
        if (product_type_id) {
            query = query.where(`${DB.Products}.product_type_id`, product_type_id);
        }

        if (min_price !== undefined) {
            query = query.where(`${DB.Products}.price`, '>=', min_price);
        }

        if (max_price !== undefined) {
            query = query.where(`${DB.Products}.price`, '<=', max_price);
        }

        if (in_stock === true) {
            query = query.where(`${DB.Products}.stock`, '>', 0);
        } else if (in_stock === false) {
            query = query.where(`${DB.Products}.stock`, '<=', 0);
        }

        if (search) {
            query = query.where(function() {
                this.where(`${DB.Products}.name`, 'ilike', `%${search}%`)
                    .orWhere(`${DB.Products}.description`, 'ilike', `%${search}%`)
                    .orWhere(`${DB.ProductTypes}.name`, 'ilike', `%${search}%`);
            });
        }

        // Get total count for pagination
        const countQuery = query.clone().clearSelect().clearOrder().count('* as total');
        const [{ total }] = await countQuery;

        // Apply sorting and pagination
        const sortColumn = sort_by === 'product_type_name' ? `${DB.ProductTypes}.name` : `${DB.Products}.${sort_by}`;
        query = query
            .select(
                `${DB.Products}.*`,
                `${DB.ProductTypes}.name as product_type_name`
            )
            .orderBy(sortColumn, sort_order)
            .limit(limit)
            .offset(offset);

        const products = await query;

        return {
            products,
            pagination: {
                page,
                limit,
                total: parseInt(total as string),
                pages: Math.ceil(parseInt(total as string) / limit)
            }
        };
    }

    export async function getFeaturedProducts(limit: number = 10) {
        return knex(DB.Products)
            .leftJoin(DB.ProductTypes, `${DB.Products}.product_type_id`, `${DB.ProductTypes}.id`)
            .where(`${DB.Products}.is_deleted`, false)
            .where(`${DB.Products}.stock`, '>', 0)
            .select(
                `${DB.Products}.*`,
                `${DB.ProductTypes}.name as product_type_name`
            )
            .orderBy(`${DB.Products}.created_at`, 'desc')
            .limit(limit);
    }

    export async function getProductsByType(productTypeId: number, limit: number = 20) {
        return knex(DB.Products)
            .leftJoin(DB.ProductTypes, `${DB.Products}.product_type_id`, `${DB.ProductTypes}.id`)
            .where({
                [`${DB.Products}.product_type_id`]: productTypeId,
                [`${DB.Products}.is_deleted`]: false
            })
            .select(
                `${DB.Products}.*`,
                `${DB.ProductTypes}.name as product_type_name`
            )
            .orderBy(`${DB.Products}.created_at`, 'desc')
            .limit(limit);
    }

    export async function updateProductStock(id: number, quantity: number, operation: 'increase' | 'decrease') {
        const product = await getProductById(id);
        if (!product) {
            throw new Error('Product not found');
        }

        const currentStock = product.stock;
        let newStock: number;

        if (operation === 'increase') {
            newStock = currentStock + quantity;
        } else {
            newStock = Math.max(0, currentStock - quantity);
        }

        return knex(DB.Products)
            .where({ id, is_deleted: false })
            .update({ stock: newStock })
            .returning('*');
    }

    export async function checkProductAvailability(id: number, requestedQuantity: number) {
        const product = await knex(DB.Products)
            .where({ id, is_deleted: false })
            .select('stock')
            .first();

        if (!product) {
            return { available: false, reason: 'Product not found' };
        }

        if (product.stock < requestedQuantity) {
            return { 
                available: false, 
                reason: 'Insufficient stock',
                available_stock: product.stock
            };
        }

        return { available: true, available_stock: product.stock };
    }

    export async function getLowStockProducts(threshold: number = 10) {
        return knex(DB.Products)
            .leftJoin(DB.ProductTypes, `${DB.Products}.product_type_id`, `${DB.ProductTypes}.id`)
            .where(`${DB.Products}.is_deleted`, false)
            .where(`${DB.Products}.stock`, '<=', threshold)
            .where(`${DB.Products}.stock`, '>', 0)
            .select(
                `${DB.Products}.*`,
                `${DB.ProductTypes}.name as product_type_name`
            )
            .orderBy(`${DB.Products}.stock`, 'asc');
    }
}
