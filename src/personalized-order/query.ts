// This file defines database queries for Personalized Orders operations.
import { Database } from "../_services/databaseService";
import { PERSONALIZED_ORDERS } from "../_services/_dbTables";
import { 
  PersonalizedOrder, 
  CreatePersonalizedOrderRequest, 
  UpdatePersonalizedOrderRequest 
} from "../_services/modelTypes";

const db = Database.getDBInstance;

export class Query {
  static async createPersonalizedOrder(data: CreatePersonalizedOrderRequest) {
    const orderData: any = {
      custom_message: data.custom_message,
      selected_colors: data.selected_colors ? JSON.stringify(data.selected_colors) : null,
      product_type: data.product_type,
      metadata: data.metadata || null,
      amount: data.amount || null
    };

    const [order] = await db()(PERSONALIZED_ORDERS).insert(orderData).returning("*");
    return order;
  }

  static async getPersonalizedOrderById(id: number): Promise<any> {
    return db()(PERSONALIZED_ORDERS)
      .where({ id, is_deleted: false })
      .first();
  }

  static async getAllPersonalizedOrders(filters: any = {}) {
    const query = db()(PERSONALIZED_ORDERS).where({ is_deleted: false });

    // Apply filters
    if (filters.order_status) {
      query.where("order_status", filters.order_status);
    }
    if (filters.delivery_status) {
      query.where("delivery_status", filters.delivery_status);
    }
    if (filters.product_type) {
      query.where("product_type", filters.product_type);
    }
    if (filters.date_from) {
      query.where("created_at", ">=", filters.date_from);
    }
    if (filters.date_to) {
      query.where("created_at", "<=", filters.date_to);
    }

    // Sorting
    const sortBy =  "created_at";
    const sortOrder = "desc";
    query.orderBy(sortBy, sortOrder);

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const [data, countResult] = await Promise.all([
      query.clone().limit(limit).offset(offset),
      query.clone().clearOrder().count("* as count").first()
    ]);

    const total = countResult ? Number((countResult as any).count) : 0;

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async updatePersonalizedOrder(id: number, data: UpdatePersonalizedOrderRequest) {
    const updateData: any = {};

    if (data.custom_message !== undefined) {
      updateData.custom_message = data.custom_message;
    }
    if (data.selected_colors !== undefined) {
      updateData.selected_colors = data.selected_colors || null;
    }
    if (data.product_type !== undefined) {
      updateData.product_type = data.product_type;
    }
    if (data.metadata !== undefined) {
      updateData.metadata = data.metadata || null;
    }
    if (data.amount !== undefined) {
      updateData.amount = data.amount;
    }
    if (data.order_status !== undefined) {
      updateData.order_status = data.order_status;
    }
    if (data.delivery_status !== undefined) {
      updateData.delivery_status = data.delivery_status;
    }

    updateData.updated_at = db().fn.now();

    const [updated] = await db()(PERSONALIZED_ORDERS)
      .where({ id, is_deleted: false })
      .update(updateData)
      .returning("*");

    return updated;
  }

  static async deletePersonalizedOrder(id: number) {
    const [deleted] = await db()(PERSONALIZED_ORDERS)
      .where({ id })
      .update({ is_deleted: true, deleted_at: db().fn.now() })
      .returning("*");

    return deleted;
  }
}
