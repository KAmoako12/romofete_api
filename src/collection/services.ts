import { Knex } from "knex";
import { CollectionQuery } from "./query";
import { Query as ProductQuery } from "../product/query";

export class CollectionService {
  private query: CollectionQuery;

  constructor(db: Knex) {
    this.query = new CollectionQuery(db);
  }

  // Create a new collection with optional initial products
  async createCollection(collectionData: {
    name: string;
    description?: string;
    is_active?: boolean;
    products?: Array<{ product_id: number; position?: number }>;
  }) {
    try {
      const { products = [], ...info } = collectionData;

      // Validate products if provided
      for (const item of products) {
        const product = await ProductQuery.getProductById(item.product_id);
        if (!product) {
          throw new Error(`Product with ID ${item.product_id} does not exist`);
        }
      }

      const collection = await this.query.createCollection(info);

      if (products.length > 0) {
        await this.query.addProductsToCollection(collection.id, products);
      }

      return await this.query.getCollectionById(collection.id);
    } catch (error) {
      throw new Error(`Failed to create collection: ${(error as Error).message}`);
    }
  }

  // Get collection by ID
  async getCollectionById(id: number) {
    const collection = await this.query.getCollectionById(id);
    if (!collection) {
      throw new Error("Collection not found");
    }
    return collection;
  }

  // List collections
  async getCollections(filters: {
    is_active?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: "asc" | "desc";
  }) {
    return this.query.getCollections(filters);
  }

  // Update collection
  async updateCollection(id: number, updates: { name?: string; description?: string; is_active?: boolean }) {
    try {
      const exists = await this.query.collectionExists(id);
      if (!exists) throw new Error("Collection not found");

      await this.query.updateCollection(id, updates);
      return await this.query.getCollectionById(id);
    } catch (error) {
      throw new Error(`Failed to update collection: ${(error as Error).message}`);
    }
  }

  // Delete collection (soft)
  async deleteCollection(id: number) {
    try {
      const exists = await this.query.collectionExists(id);
      if (!exists) throw new Error("Collection not found");

      await this.query.deleteCollection(id);
      return { message: "Collection deleted successfully" };
    } catch (error) {
      throw new Error(`Failed to delete collection: ${(error as Error).message}`);
    }
  }

  // Add product to collection
  async addProductToCollection(collectionId: number, productData: { product_id: number; position?: number }) {
    try {
      const exists = await this.query.collectionExists(collectionId);
      if (!exists) throw new Error("Collection not found");

      const product = await ProductQuery.getProductById(productData.product_id);
      if (!product) throw new Error("Product not found");

      const already = await this.query.isProductInCollection(collectionId, productData.product_id);
      if (already) throw new Error("Product is already in this collection");

      await this.query.addProductsToCollection(collectionId, [productData]);
      return await this.query.getCollectionById(collectionId);
    } catch (error) {
      throw new Error(`Failed to add product to collection: ${(error as Error).message}`);
    }
  }

  // Bulk add
  async bulkAddProductsToCollection(collectionId: number, products: Array<{ product_id: number; position?: number }>) {
    try {
      const exists = await this.query.collectionExists(collectionId);
      if (!exists) throw new Error("Collection not found");

      for (const item of products) {
        const product = await ProductQuery.getProductById(item.product_id);
        if (!product) throw new Error(`Product with ID ${item.product_id} does not exist`);
        const already = await this.query.isProductInCollection(collectionId, item.product_id);
        if (already) throw new Error(`Product with ID ${item.product_id} is already in this collection`);
      }

      await this.query.addProductsToCollection(collectionId, products);
      return await this.query.getCollectionById(collectionId);
    } catch (error) {
      throw new Error(`Failed to add products to collection: ${(error as Error).message}`);
    }
  }

  // Remove product
  async removeProductFromCollection(collectionId: number, productId: number) {
    try {
      const exists = await this.query.collectionExists(collectionId);
      if (!exists) throw new Error("Collection not found");

      const inCollection = await this.query.isProductInCollection(collectionId, productId);
      if (!inCollection) throw new Error("Product is not in this collection");

      await this.query.removeProductFromCollection(collectionId, productId);
      return await this.query.getCollectionById(collectionId);
    } catch (error) {
      throw new Error(`Failed to remove product from collection: ${(error as Error).message}`);
    }
  }

  // Update position
  async updateCollectionProductPosition(collectionId: number, productId: number, position: number) {
    try {
      const exists = await this.query.collectionExists(collectionId);
      if (!exists) throw new Error("Collection not found");

      const inCollection = await this.query.isProductInCollection(collectionId, productId);
      if (!inCollection) throw new Error("Product is not in this collection");

      await this.query.updateCollectionProductPosition(collectionId, productId, position);
      return await this.query.getCollectionById(collectionId);
    } catch (error) {
      throw new Error(`Failed to update product position: ${(error as Error).message}`);
    }
  }
}
