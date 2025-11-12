import { Knex } from "knex";
import { DB } from "../_services/_dbTables";
import { Database } from "../_services/databaseService";
import { CreateOrderRequest, UpdateOrderRequest, CreateOrderItemRequest } from "../_services/modelTypes";

export interface OrderFilters {
  user_id?: number;
  status?: string;
  payment_status?: string;
  customer_email?: string;
  date_from?: string;
  date_to?: string;
  admin_user_id?: number; // Filter orders containing products created by this admin
}

export interface OrderPaginationOptions {
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'total_price' | 'status' | 'payment_status';
  sort_order?: 'asc' | 'desc';
}

export namespace Query {
    const knex = Database.getDBInstance();

    export async function getOrderById(id: number) {
        return knex(DB.Orders)
            .leftJoin(DB.DeliveryOptions, `${DB.Orders}.delivery_option_id`, `${DB.DeliveryOptions}.id`)
            .leftJoin(DB.Users, `${DB.Orders}.user_id`, `${DB.Users}.id`)
            .where({ [`${DB.Orders}.id`]: id, [`${DB.Orders}.is_deleted`]: false })
            .select(
                `${DB.Orders}.*`,
                `${DB.DeliveryOptions}.name as delivery_option_name`,
                `${DB.DeliveryOptions}.amount as delivery_option_amount`,
                `${DB.Users}.username as user_username`,
                `${DB.Users}.email as user_email`
            )
            .first();
    }

    export async function getOrderByReference(reference: string) {
        return knex(DB.Orders)
            .leftJoin(DB.DeliveryOptions, `${DB.Orders}.delivery_option_id`, `${DB.DeliveryOptions}.id`)
            .where({ [`${DB.Orders}.reference`]: reference, [`${DB.Orders}.is_deleted`]: false })
            .select(
                `${DB.Orders}.*`,
                `${DB.DeliveryOptions}.name as delivery_option_name`,
                `${DB.DeliveryOptions}.amount as delivery_option_amount`
            )
            .first();
    }

    export async function createOrder(orderData: any) {
        return knex(DB.Orders).insert(orderData as any).returning('*');
    }

    export async function updateOrder(id: number, updates: UpdateOrderRequest) {
        return knex(DB.Orders).where({ id, is_deleted: false }).update(updates as any).returning('*');
    }

    export async function deleteOrder(id: number) {
        const order = await getOrderById(id);
        if (!order) {
            throw new Error('Order not found');
        }
        
        // Generate random string to append to unique fields
        const randomSuffix = `_deleted_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        return knex(DB.Orders).where({ id, is_deleted: false }).update({ 
            is_deleted: true, 
            deleted_at: new Date(),
            reference: (order as any).reference + randomSuffix
        }).returning('*');
    }

    export async function listOrders(filters: OrderFilters = {}, pagination: OrderPaginationOptions = {}) {
        const {
            user_id,
            status,
            payment_status,
            customer_email,
            date_from,
            date_to,
            admin_user_id
        } = filters;

        const {
            page = 1,
            limit = 20,
            sort_by = 'created_at',
            sort_order = 'desc'
        } = pagination;

        const offset = (page - 1) * limit;

        let query = knex(DB.Orders)
            .leftJoin(DB.DeliveryOptions, `${DB.Orders}.delivery_option_id`, `${DB.DeliveryOptions}.id`)
            .leftJoin(DB.Users, `${DB.Orders}.user_id`, `${DB.Users}.id`)
            .where(`${DB.Orders}.is_deleted`, false);

        // Filter orders by admin's products (for role-based access control)
        if (admin_user_id) {
            query = query
                .join(DB.OrderItems, `${DB.Orders}.id`, `${DB.OrderItems}.order_id`)
                .join(DB.Products, `${DB.OrderItems}.product_id`, `${DB.Products}.id`)
                .where(`${DB.Products}.created_by`, admin_user_id)
                .where(`${DB.OrderItems}.is_deleted`, false)
                .where(`${DB.Products}.is_deleted`, false)
                .distinct(`${DB.Orders}.id`);
        }

        // Apply filters
        if (user_id) {
            query = query.where(`${DB.Orders}.user_id`, user_id);
        }

        if (status) {
            query = query.where(`${DB.Orders}.status`, status);
        }

        if (payment_status) {
            query = query.where(`${DB.Orders}.payment_status`, payment_status);
        }

        if (customer_email) {
            query = query.where(`${DB.Orders}.customer_email`, 'ilike', `%${customer_email}%`);
        }

        if (date_from) {
            query = query.where(`${DB.Orders}.created_at`, '>=', date_from);
        }

        if (date_to) {
            query = query.where(`${DB.Orders}.created_at`, '<=', date_to);
        }

        // Get total count for pagination
        const countQuery = query.clone().clearSelect().clearOrder().count('* as total');
        const [{ total }] = await countQuery;

        // Apply sorting and pagination
        query = query
            .select(
                `${DB.Orders}.*`,
                `${DB.DeliveryOptions}.name as delivery_option_name`,
                `${DB.Users}.username as user_username`,
                `${DB.Users}.email as user_email`
            )
            .orderBy(`${DB.Orders}.${sort_by}`, sort_order)
            .limit(limit)
            .offset(offset);

        const orders = await query;

        return {
            orders,
            pagination: {
                page,
                limit,
                total: parseInt(total as string),
                pages: Math.ceil(parseInt(total as string) / limit)
            }
        };
    }

    export async function getOrderItems(orderId: number) {
        return knex(DB.OrderItems)
            .leftJoin(DB.Products, `${DB.OrderItems}.product_id`, `${DB.Products}.id`)
            .leftJoin(DB.ProductTypes, `${DB.Products}.product_type_id`, `${DB.ProductTypes}.id`)
            .where({ [`${DB.OrderItems}.order_id`]: orderId, [`${DB.OrderItems}.is_deleted`]: false })
            .select(
                `${DB.OrderItems}.*`,
                `${DB.Products}.name as product_name`,
                `${DB.Products}.description as product_description`,
                `${DB.Products}.images as product_images`,
                `${DB.ProductTypes}.name as product_type_name`
            );
    }

    export async function createOrderItem(orderItem: CreateOrderItemRequest) {
        return knex(DB.OrderItems).insert(orderItem as any).returning('*');
    }

    export async function createOrderItems(orderItems: CreateOrderItemRequest[]) {
        return knex(DB.OrderItems).insert(orderItems as any).returning('*');
    }

    export async function getOrdersByUser(userId: number, limit: number = 10) {
        return knex(DB.Orders)
            .leftJoin(DB.DeliveryOptions, `${DB.Orders}.delivery_option_id`, `${DB.DeliveryOptions}.id`)
            .where({
                [`${DB.Orders}.user_id`]: userId,
                [`${DB.Orders}.is_deleted`]: false
            })
            .select(
                `${DB.Orders}.*`,
                `${DB.DeliveryOptions}.name as delivery_option_name`
            )
            .orderBy(`${DB.Orders}.created_at`, 'desc')
            .limit(limit);
    }

    export async function getOrdersByStatus(status: string, limit: number = 50) {
        return knex(DB.Orders)
            .leftJoin(DB.DeliveryOptions, `${DB.Orders}.delivery_option_id`, `${DB.DeliveryOptions}.id`)
            .where({
                [`${DB.Orders}.status`]: status,
                [`${DB.Orders}.is_deleted`]: false
            })
            .select(
                `${DB.Orders}.*`,
                `${DB.DeliveryOptions}.name as delivery_option_name`
            )
            .orderBy(`${DB.Orders}.created_at`, 'desc')
            .limit(limit);
    }

    export async function getOrdersByPaymentStatus(paymentStatus: string, limit: number = 50) {
        return knex(DB.Orders)
            .leftJoin(DB.DeliveryOptions, `${DB.Orders}.delivery_option_id`, `${DB.DeliveryOptions}.id`)
            .where({
                [`${DB.Orders}.payment_status`]: paymentStatus,
                [`${DB.Orders}.is_deleted`]: false
            })
            .select(
                `${DB.Orders}.*`,
                `${DB.DeliveryOptions}.name as delivery_option_name`
            )
            .orderBy(`${DB.Orders}.created_at`, 'desc')
            .limit(limit);
    }

    export async function updateOrderPaymentStatus(orderId: number, paymentStatus: string, paymentReference?: string) {
        const updates: any = { payment_status: paymentStatus };
        if (paymentReference) {
            updates.payment_reference = paymentReference;
        }
        
        return knex(DB.Orders)
            .where({ id: orderId, is_deleted: false })
            .update(updates)
            .returning('*');
    }

    export async function getOrderStats() {
        const stats = await knex(DB.Orders)
            .where('is_deleted', false)
            .select(
                knex.raw('COUNT(*) as total_orders'),
                knex.raw('COUNT(CASE WHEN payment_status = ? THEN 1 END) as pending_payments', ['pending']),
                knex.raw('COUNT(CASE WHEN payment_status = ? THEN 1 END) as completed_payments', ['completed']),
                knex.raw('COUNT(CASE WHEN status = ? THEN 1 END) as pending_orders', ['pending']),
                knex.raw('COUNT(CASE WHEN status = ? THEN 1 END) as processing_orders', ['processing']),
                knex.raw('COUNT(CASE WHEN status = ? THEN 1 END) as completed_orders', ['completed']),
                knex.raw('SUM(CASE WHEN payment_status = ? THEN total_price ELSE 0 END) as total_revenue', ['completed'])
            )
            .first();

        return stats;
    }

    export async function generateOrderReference(): Promise<string> {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `ORD-${timestamp}-${random}`;
    }
}
