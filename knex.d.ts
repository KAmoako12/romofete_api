// knex.d.ts - TypeScript typings for Knex tables

import type { Knex } from "knex";
import { DB } from "./src/_services/_dbTables";


export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  deleted_at: Date | null;
  is_deleted: boolean;
}




declare module "knex/types/tables" {
  interface Tables {
    [DB.Users]: User;
  }
}
