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

    export async function createUser(user: { username: string; email: string; password: string; role: string; }) {
        return knex(DB.Users).insert(user).returning('*');
    }

    export async function updateUser(id: number, updates: Partial<{ username: string; email: string; password: string; role: string; is_active: boolean; }>) {
        return knex(DB.Users).where({ id, is_deleted: false }).update(updates).returning('*');
    }

    export async function deleteUser(id: number) {
        return knex(DB.Users).where({ id, is_deleted: false }).update({ is_deleted: true, deleted_at: new Date() }).returning('*');
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
