// knex.d.ts - TypeScript typings for Knex tables

import type { Knex } from "knex";
import { DB } from "./src/_services/_dbTables";
import { 
  User, 
  Product, 
  ProductType, 
  Order, 
  OrderItem, 
  Transaction, 
  DeliveryOption, 
  Bundle, 
  BundleProduct 
} from "./src/_services/modelTypes";

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  password: string;
  is_active: boolean;
  created_at: Date;
  deleted_at: Date | null;
  is_deleted: boolean;
}

export { User };

declare module "knex/types/tables" {
  interface Tables {
    [DB.Users]: User;
    [DB.Customers]: Customer;
    [DB.ProductTypes]: ProductType;
    [DB.Products]: Product;
    [DB.Orders]: Order;
    [DB.OrderItems]: OrderItem;
    [DB.Transactions]: Transaction;
    [DB.DeliveryOptions]: DeliveryOption;
    [DB.Bundles]: Bundle;
    [DB.BundleProducts]: BundleProduct;
  }
}
