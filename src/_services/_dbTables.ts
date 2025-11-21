// src/_services/_dbTables.ts

export const DB = {
  HomepageSettings: "homepage_settings",
  Users: "users",
  Customers: "customers",
  ProductTypes: "product_types",
  SubCategories: "sub_categories",
  Products: "products",
  Orders: "orders",
  OrderItems: "order_items",
  Transactions: "transactions",
  DeliveryOptions: "delivery_options",
  Bundles: "bundles",
  BundleProducts: "bundle_products",
  Collections: "collections",
  CollectionProducts: "collection_products",
  PricingConfig: "pricing_config",
  MailingList: "mailing_list"
};

// Individual exports for convenience
export const MAILING_LIST = DB.MailingList;
