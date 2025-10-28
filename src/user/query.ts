import { Knex } from "knex";
import { DB } from "../_services/_dbTables";
import { Database } from "../_services/databaseService";


export namespace Query {
    const knex = Database.getDBInstance();

    export async function getUserById(id: number) {
        return knex(DB.Users).where({ id, is_deleted: false }).first();
    }

    export async function getUserByUsername(username: string) {
        return knex(DB.Users).where({ username, is_deleted: false }).first();
    }

    export async function createUser(user: { username: string; email: string; password: string; role: string; phone?: string; }) {
        return knex(DB.Users).insert(user).returning('*');
    }

    export async function updateUser(id: number, updates: Partial<{ username: string; email: string; password: string; role: string; is_active: boolean; }>) {
        return knex(DB.Users).where({ id, is_deleted: false }).update(updates).returning('*');
    }

    export async function deleteUser(id: number) {
        const user = await getUserById(id);
        if (!user) {
            throw new Error('User not found');
        }
        
        // Generate random string to append to unique fields
        const randomSuffix = `_deleted_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        return knex(DB.Users).where({ id, is_deleted: false }).update({ 
            is_deleted: true, 
            deleted_at: new Date(),
            username: (user as any).username + randomSuffix,
            email: (user as any).email + randomSuffix
        }).returning('*');
    }

    export async function listUsers() {
        return knex(DB.Users).where({ is_deleted: false }).select(
            'id',
            'username',
            'email',
            'role',
            'is_active as isActive'
        );
    }

}
