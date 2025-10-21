import { Knex } from "knex";
import { DB } from "../_services/_dbTables";
import { Database } from "../_services/databaseService";
import { CreatePricingConfigRequest, UpdatePricingConfigRequest } from "../_services/modelTypes";

export namespace Query {
    const knex = Database.getDBInstance();

    export async function getPricingConfigById(id: number) {
        return knex(DB.PricingConfig).where({ id, is_deleted: false }).first();
    }

    export async function createPricingConfig(pricingConfig: CreatePricingConfigRequest) {
        return knex(DB.PricingConfig).insert(pricingConfig as any).returning('*');
    }

    export async function updatePricingConfig(id: number, updates: UpdatePricingConfigRequest) {
        return knex(DB.PricingConfig).where({ id, is_deleted: false }).update(updates as any).returning('*');
    }

    export async function deletePricingConfig(id: number) {
        return knex(DB.PricingConfig).where({ id, is_deleted: false }).update({ 
            is_deleted: true, 
            deleted_at: new Date()
        }).returning('*');
    }

    export async function listPricingConfigs(productTypeId?: number) {
        const query = knex(DB.PricingConfig).where({ is_deleted: false });
        
        if (productTypeId !== undefined) {
            query.where({ product_type_id: productTypeId });
        }
        
        return query.select(
            'id',
            'min_price',
            'max_price',
            'product_type_id',
            'created_at'
        );
    }
}
