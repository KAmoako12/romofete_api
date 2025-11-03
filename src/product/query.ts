import { Knex } from "knex";
import { DB } from "../_services/_dbTables";
import { Database } from "../_services/databaseService";
import { CreateProductRequest, UpdateProductRequest } from "../_services/modelTypes";

export interface ProductFilters {
  product_type_id?: number;
  minPrice?: number;
  maxPrice?: number;
  in_stock?: boolean;
  search?: string;
  occasion?: string;
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

    export async function deleteProductsByProductTypeId(productTypeId: number, trx?: Knex.Transaction) {
        const query = trx ? trx(DB.Products) : knex(DB.Products);
        return query
            .where({ product_type_id: productTypeId, is_deleted: false })
            .update({ is_deleted: true, deleted_at: new Date() })
            .returning('*');
    }

    export async function listProducts(filters: ProductFilters = {}, pagination: PaginationOptions = {}) {
        const {
            product_type_id,
            minPrice,
            maxPrice,
            in_stock,
            search,
            occasion
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

        if (minPrice !== undefined) {
            query = query.where(`${DB.Products}.price`, '>=', minPrice);
        }

        if (maxPrice !== undefined) {
            query = query.where(`${DB.Products}.price`, '<=', maxPrice);
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

        if (occasion) {
            query = query.where(function() {
                // Search in product type name and allowed_types
                this.where(`${DB.ProductTypes}.name`, 'ilike', `%${occasion}%`)
                    .orWhereRaw(`CAST(${DB.ProductTypes}.allowed_types AS TEXT) ILIKE ?`, [`%${occasion}%`])
                    // Search for specific "occasion" key in product metadata
                    .orWhereRaw(`${DB.Products}.extra_properties ->> 'occasion' ILIKE ?`, [`%${occasion}%`]);
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

    export async function getFeaturedProducts(limit: number = 10, filters: Omit<ProductFilters, 'search'> = {}) {
        const { minPrice, maxPrice, occasion } = filters;
        
        let query = knex(DB.Products)
            .leftJoin(DB.ProductTypes, `${DB.Products}.product_type_id`, `${DB.ProductTypes}.id`)
            .where(`${DB.Products}.is_deleted`, false)
            .where(`${DB.Products}.stock`, '>', 0);

        // Apply price filters
        if (minPrice !== undefined) {
            query = query.where(`${DB.Products}.price`, '>=', minPrice);
        }

        if (maxPrice !== undefined) {
            query = query.where(`${DB.Products}.price`, '<=', maxPrice);
        }

        // Apply occasion filter
        if (occasion) {
            query = query.where(function() {
                this.where(`${DB.ProductTypes}.name`, 'ilike', `%${occasion}%`)
                    .orWhereRaw(`CAST(${DB.ProductTypes}.allowed_types AS TEXT) ILIKE ?`, [`%${occasion}%`])
                    .orWhereRaw(`${DB.Products}.extra_properties ->> 'occasion' ILIKE ?`, [`%${occasion}%`]);
            });
        }

        return query
            .select(
                `${DB.Products}.*`,
                `${DB.ProductTypes}.name as product_type_name`
            )
            .orderBy(`${DB.Products}.created_at`, 'desc')
            .limit(limit);
    }

    export async function getProductsByType(productTypeId: number, limit: number = 20, filters: Omit<ProductFilters, 'search' | 'product_type_id'> = {}) {
        const { minPrice, maxPrice, occasion, in_stock } = filters;
        
        let query = knex(DB.Products)
            .leftJoin(DB.ProductTypes, `${DB.Products}.product_type_id`, `${DB.ProductTypes}.id`)
            .where({
                [`${DB.Products}.product_type_id`]: productTypeId,
                [`${DB.Products}.is_deleted`]: false
            });

        // Apply stock filter
        if (in_stock === true) {
            query = query.where(`${DB.Products}.stock`, '>', 0);
        } else if (in_stock === false) {
            query = query.where(`${DB.Products}.stock`, '<=', 0);
        }

        // Apply price filters
        if (minPrice !== undefined) {
            query = query.where(`${DB.Products}.price`, '>=', minPrice);
        }

        if (maxPrice !== undefined) {
            query = query.where(`${DB.Products}.price`, '<=', maxPrice);
        }

        // Apply occasion filter
        if (occasion) {
            query = query.where(function() {
                this.where(`${DB.ProductTypes}.name`, 'ilike', `%${occasion}%`)
                    .orWhereRaw(`CAST(${DB.ProductTypes}.allowed_types AS TEXT) ILIKE ?`, [`%${occasion}%`])
                    .orWhereRaw(`${DB.Products}.extra_properties ->> 'occasion' ILIKE ?`, [`%${occasion}%`]);
            });
        }

        return query
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
            .update({ stock: newStock } as any)
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

    export async function getLowStockProducts(threshold: number = 10, filters: Omit<ProductFilters, 'search' | 'in_stock'> = {}) {
        const { minPrice, maxPrice, occasion, product_type_id } = filters;
        
        let query = knex(DB.Products)
            .leftJoin(DB.ProductTypes, `${DB.Products}.product_type_id`, `${DB.ProductTypes}.id`)
            .where(`${DB.Products}.is_deleted`, false)
            .where(`${DB.Products}.stock`, '<=', threshold)
            .where(`${DB.Products}.stock`, '>', 0);

        // Apply product type filter
        if (product_type_id) {
            query = query.where(`${DB.Products}.product_type_id`, product_type_id);
        }

        // Apply price filters
        if (minPrice !== undefined) {
            query = query.where(`${DB.Products}.price`, '>=', minPrice);
        }

        if (maxPrice !== undefined) {
            query = query.where(`${DB.Products}.price`, '<=', maxPrice);
        }

        // Apply occasion filter
        if (occasion) {
            query = query.where(function() {
                this.where(`${DB.ProductTypes}.name`, 'ilike', `%${occasion}%`)
                    .orWhereRaw(`CAST(${DB.ProductTypes}.allowed_types AS TEXT) ILIKE ?`, [`%${occasion}%`])
                    .orWhereRaw(`${DB.Products}.extra_properties ->> 'occasion' ILIKE ?`, [`%${occasion}%`]);
            });
        }

        return query
            .select(
                `${DB.Products}.*`,
                `${DB.ProductTypes}.name as product_type_name`
            )
            .orderBy(`${DB.Products}.stock`, 'asc');
    }

    export async function getSimilarProducts(productId: number, limit: number = 10, filters: Omit<ProductFilters, 'search'> = {}) {
        // First get the target product to understand its characteristics
        const targetProduct = await getProductById(productId);
        if (!targetProduct) {
            throw new Error('Product not found');
        }

        const { minPrice, maxPrice, occasion, product_type_id, in_stock } = filters;

        // Extract occasions from the target product
        const targetOccasion = targetProduct.extra_properties?.occasion;
        const targetAllowedTypes = targetProduct.product_type_allowed_types || [];
        
        // Find similar products based on:
        // 1. Same occasion(s) - products that can be used for the same occasions (highest priority)
        // 2. Same product type
        // 3. Similar price range (within 20% of the target product's price)
        // 4. Exclude the target product itself
        // 5. Apply additional filters
        
        const targetPrice = parseFloat(targetProduct.price);
        const priceRangeMin = targetPrice * 0.8; // 20% below
        const priceRangeMax = targetPrice * 1.2; // 20% above

        let query = knex(DB.Products)
            .leftJoin(DB.ProductTypes, `${DB.Products}.product_type_id`, `${DB.ProductTypes}.id`)
            .where(`${DB.Products}.is_deleted`, false)
            .where(`${DB.Products}.id`, '!=', productId);

        // Apply stock filter (default to in-stock unless specified otherwise)
        if (in_stock !== false) {
            query = query.where(`${DB.Products}.stock`, '>', 0);
        }

        // Apply product type filter if specified
        if (product_type_id) {
            query = query.where(`${DB.Products}.product_type_id`, product_type_id);
        }

        // Apply price filters (override similarity price range if specified)
        if (minPrice !== undefined) {
            query = query.where(`${DB.Products}.price`, '>=', minPrice);
        }

        if (maxPrice !== undefined) {
            query = query.where(`${DB.Products}.price`, '<=', maxPrice);
        }

        // Apply occasion filter if explicitly provided
        if (occasion) {
            query = query.where(function() {
                this.where(`${DB.ProductTypes}.name`, 'ilike', `%${occasion}%`)
                    .orWhereRaw(`CAST(${DB.ProductTypes}.allowed_types AS TEXT) ILIKE ?`, [`%${occasion}%`])
                    .orWhereRaw(`${DB.Products}.extra_properties ->> 'occasion' ILIKE ?`, [`%${occasion}%`]);
            });
        }

        // Build similarity score with occasion matching as highest priority
        let similarityScoreSQL = `
            CASE 
                -- Highest priority: Products with matching occasion in extra_properties
                WHEN ${targetOccasion ? `${DB.Products}.extra_properties ->> 'occasion' ILIKE ${knex.raw('?', [`%${targetOccasion}%`])}` : 'FALSE'} THEN 200
                -- High priority: Products with same product type (likely same occasion category)
                WHEN ${DB.Products}.product_type_id = ? THEN 150
        `;

        // Add conditions for matching allowed_types if target has them
        if (targetAllowedTypes && Array.isArray(targetAllowedTypes) && targetAllowedTypes.length > 0) {
            // Check if any of the target's allowed types match the product's allowed types or occasion
            const allowedTypesConditions = targetAllowedTypes.map((type: string) => 
                `(CAST(${DB.ProductTypes}.allowed_types AS TEXT) ILIKE ${knex.raw('?', [`%${type}%`])} OR ${DB.Products}.extra_properties ->> 'occasion' ILIKE ${knex.raw('?', [`%${type}%`])})`
            ).join(' OR ');
            
            similarityScoreSQL += `
                -- Products matching any of the target's allowed occasion types
                WHEN ${allowedTypesConditions} THEN 180
            `;
        }

        similarityScoreSQL += `
                -- Medium priority: Similar price range
                WHEN ${DB.Products}.price BETWEEN ? AND ? THEN 50
                -- Low priority: Other products
                ELSE 10
            END as similarity_score
        `;

        return query
            .select(
                `${DB.Products}.*`,
                `${DB.ProductTypes}.name as product_type_name`,
                `${DB.ProductTypes}.allowed_types as product_type_allowed_types`,
                // Add a similarity score for ordering based on occasions
                knex.raw(similarityScoreSQL, [targetProduct.product_type_id, priceRangeMin, priceRangeMax])
            )
            .orderBy('similarity_score', 'desc')
            .orderBy(`${DB.Products}.created_at`, 'desc')
            .limit(limit);
    }
}
