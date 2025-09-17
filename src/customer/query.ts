import { Knex } from "knex";
import { DB } from "../_services/_dbTables";
import { Database } from "../_services/databaseService";

export namespace Query {
    const knex = Database.getDBInstance();

    export async function getCustomerById(id: number) {
        return knex(DB.Customers).where({ id, is_deleted: false }).first();
    }

    export async function getCustomerByEmail(email: string) {
        return knex(DB.Customers).where({ email, is_deleted: false }).first();
    }

    export async function createCustomer(customer: {
        first_name?: string;
        last_name?: string;
        phone?: string;
        address?: string;
        city?: string;
        state?: string;
        zip_code?: string;
        country?: string;
        email: string;
        password: string;
    }) {
        return knex(DB.Customers).insert(customer).returning('*');
    }

    export async function updateCustomer(id: number, updates: Partial<{
        first_name: string;
        last_name: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        zip_code: string;
        country: string;
        email: string;
        password: string;
        is_active: boolean;
    }>) {
        return knex(DB.Customers).where({ id, is_deleted: false }).update(updates).returning('*');
    }

    export async function deleteCustomer(id: number) {
        return knex(DB.Customers).where({ id, is_deleted: false }).update({ 
            is_deleted: true, 
            deleted_at: new Date() 
        }).returning('*');
    }

    export async function listCustomers() {
        return knex(DB.Customers).where({ is_deleted: false }).select(
            'id',
            'first_name',
            'last_name',
            'phone',
            'address',
            'city',
            'state',
            'zip_code',
            'country',
            'email',
            'is_active',
            'created_at'
        );
    }
}
