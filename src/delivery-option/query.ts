import { Knex } from "knex";
import { DB } from "../_services/_dbTables";
import { Database } from "../_services/databaseService";
import { CreateDeliveryOptionRequest, UpdateDeliveryOptionRequest } from "../_services/modelTypes";

export namespace Query {
    const knex = Database.getDBInstance();

    export async function getDeliveryOptionById(id: number) {
        return knex(DB.DeliveryOptions).where({ id, is_deleted: false }).first();
    }

    export async function getDeliveryOptionByName(name: string) {
        return knex(DB.DeliveryOptions).where('name', name).where('is_deleted', false).first();
    }

    export async function createDeliveryOption(deliveryOption: CreateDeliveryOptionRequest) {
        return knex(DB.DeliveryOptions).insert(deliveryOption as any).returning('*');
    }

    export async function updateDeliveryOption(id: number, updates: UpdateDeliveryOptionRequest) {
        return knex(DB.DeliveryOptions).where({ id, is_deleted: false }).update(updates as any).returning('*');
    }

    export async function deleteDeliveryOption(id: number) {
        return knex(DB.DeliveryOptions).where({ id, is_deleted: false }).update({ is_deleted: true, deleted_at: new Date() }).returning('*');
    }

    export async function listDeliveryOptions() {
        return knex(DB.DeliveryOptions).where({ is_deleted: false }).select(
            'id',
            'name',
            'amount',
            'created_at'
        );
    }
}
