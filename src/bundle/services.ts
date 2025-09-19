import { Knex } from "knex";
import { BundleQuery } from "./query";
import { Query as ProductQuery } from "../product/query";

export class BundleService {
  private bundleQuery: BundleQuery;

  constructor(db: Knex) {
    this.bundleQuery = new BundleQuery(db);
  }

  // Create a new bundle with products
  async createBundle(bundleData: {
    name: string;
    description?: string;
    discount_percentage?: number;
    is_active?: boolean;
    products: Array<{ product_id: number; quantity: number }>;
  }) {
    try {
      // Validate that all products exist
      for (const product of bundleData.products) {
        const productExists = await ProductQuery.getProductById(product.product_id);
        if (!productExists) {
          throw new Error(`Product with ID ${product.product_id} does not exist`);
        }
      }

      // Create the bundle
      const { products, ...bundleInfo } = bundleData;
      const bundle = await this.bundleQuery.createBundle(bundleInfo);

      // Add products to the bundle
      await this.bundleQuery.addProductsToBundle(bundle.id, products);

      // Return the complete bundle with products
      return await this.bundleQuery.getBundleById(bundle.id);
    } catch (error) {
      throw new Error(`Failed to create bundle: ${(error as Error).message}`);
    }
  }

  // Get bundle by ID
  async getBundleById(id: number) {
    const bundle = await this.bundleQuery.getBundleById(id);
    if (!bundle) {
      throw new Error("Bundle not found");
    }
    return bundle;
  }

  // Get all bundles with filters
  async getBundles(filters: {
    is_active?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }) {
    return await this.bundleQuery.getBundles(filters);
  }

  // Update bundle information
  async updateBundle(id: number, updateData: {
    name?: string;
    description?: string;
    discount_percentage?: number;
    is_active?: boolean;
  }) {
    try {
      const bundleExists = await this.bundleQuery.bundleExists(id);
      if (!bundleExists) {
        throw new Error("Bundle not found");
      }

      const updatedBundle = await this.bundleQuery.updateBundle(id, updateData);
      if (!updatedBundle) {
        throw new Error("Failed to update bundle");
      }

      return await this.bundleQuery.getBundleById(id);
    } catch (error) {
      throw new Error(`Failed to update bundle: ${(error as Error).message}`);
    }
  }

  // Add a product to an existing bundle
  async addProductToBundle(bundleId: number, productData: { product_id: number; quantity: number }) {
    try {
      const bundleExists = await this.bundleQuery.bundleExists(bundleId);
      if (!bundleExists) {
        throw new Error("Bundle not found");
      }

      const productExists = await ProductQuery.getProductById(productData.product_id);
      if (!productExists) {
        throw new Error("Product not found");
      }

      const isProductInBundle = await this.bundleQuery.isProductInBundle(bundleId, productData.product_id);
      if (isProductInBundle) {
        throw new Error("Product is already in this bundle");
      }

      await this.bundleQuery.addProductsToBundle(bundleId, [productData]);
      return await this.bundleQuery.getBundleById(bundleId);
    } catch (error) {
      throw new Error(`Failed to add product to bundle: ${(error as Error).message}`);
    }
  }

  // Add multiple products to a bundle
  async bulkAddProductsToBundle(bundleId: number, products: Array<{ product_id: number; quantity: number }>) {
    try {
      const bundleExists = await this.bundleQuery.bundleExists(bundleId);
      if (!bundleExists) {
        throw new Error("Bundle not found");
      }

      // Validate all products exist and are not already in the bundle
      for (const product of products) {
        const productExists = await ProductQuery.getProductById(product.product_id);
        if (!productExists) {
          throw new Error(`Product with ID ${product.product_id} does not exist`);
        }

        const isProductInBundle = await this.bundleQuery.isProductInBundle(bundleId, product.product_id);
        if (isProductInBundle) {
          throw new Error(`Product with ID ${product.product_id} is already in this bundle`);
        }
      }

      await this.bundleQuery.addProductsToBundle(bundleId, products);
      return await this.bundleQuery.getBundleById(bundleId);
    } catch (error) {
      throw new Error(`Failed to add products to bundle: ${(error as Error).message}`);
    }
  }

  // Remove a product from a bundle
  async removeProductFromBundle(bundleId: number, productId: number) {
    try {
      const bundleExists = await this.bundleQuery.bundleExists(bundleId);
      if (!bundleExists) {
        throw new Error("Bundle not found");
      }

      const isProductInBundle = await this.bundleQuery.isProductInBundle(bundleId, productId);
      if (!isProductInBundle) {
        throw new Error("Product is not in this bundle");
      }

      await this.bundleQuery.removeProductFromBundle(bundleId, productId);
      return await this.bundleQuery.getBundleById(bundleId);
    } catch (error) {
      throw new Error(`Failed to remove product from bundle: ${(error as Error).message}`);
    }
  }

  // Update product quantity in a bundle
  async updateBundleProductQuantity(bundleId: number, productId: number, quantity: number) {
    try {
      const bundleExists = await this.bundleQuery.bundleExists(bundleId);
      if (!bundleExists) {
        throw new Error("Bundle not found");
      }

      const isProductInBundle = await this.bundleQuery.isProductInBundle(bundleId, productId);
      if (!isProductInBundle) {
        throw new Error("Product is not in this bundle");
      }

      await this.bundleQuery.updateBundleProductQuantity(bundleId, productId, quantity);
      return await this.bundleQuery.getBundleById(bundleId);
    } catch (error) {
      throw new Error(`Failed to update product quantity in bundle: ${(error as Error).message}`);
    }
  }

  // Delete a bundle
  async deleteBundle(id: number) {
    try {
      const bundleExists = await this.bundleQuery.bundleExists(id);
      if (!bundleExists) {
        throw new Error("Bundle not found");
      }

      await this.bundleQuery.deleteBundle(id);
      return { message: "Bundle deleted successfully" };
    } catch (error) {
      throw new Error(`Failed to delete bundle: ${(error as Error).message}`);
    }
  }

  // Get products that are in the same bundles as a given product (for similar products feature)
  async getProductsInSameBundles(productId: number, limit: number = 10) {
    try {
      const productExists = await ProductQuery.getProductById(productId);
      if (!productExists) {
        throw new Error("Product not found");
      }

      return await this.bundleQuery.getProductsInSameBundles(productId, limit);
    } catch (error) {
      throw new Error(`Failed to get similar products: ${(error as Error).message}`);
    }
  }

  // Calculate bundle total price with discount
  async calculateBundlePrice(bundleId: number) {
    try {
      const bundle = await this.bundleQuery.getBundleById(bundleId);
      if (!bundle) {
        throw new Error("Bundle not found");
      }

      const totalPrice = bundle.products.reduce((sum: number, product: any) => {
        return sum + (parseFloat(product.product_price) * product.quantity);
      }, 0);

      let finalPrice = totalPrice;
      const discountPercentage = (bundle as any).discount_percentage ? parseFloat((bundle as any).discount_percentage) : 0;
      if (discountPercentage && discountPercentage > 0) {
        const discountAmount = (totalPrice * discountPercentage) / 100;
        finalPrice = totalPrice - discountAmount;
      }

      return {
        bundle_id: bundleId,
        original_price: totalPrice,
        discount_percentage: discountPercentage,
        discount_amount: totalPrice - finalPrice,
        final_price: finalPrice,
        products_count: bundle.products.length
      };
    } catch (error) {
      throw new Error(`Failed to calculate bundle price: ${(error as Error).message}`);
    }
  }

  // Get bundle statistics
  async getBundleStats() {
    try {
      const allBundles = await this.bundleQuery.getBundles({ limit: 1000 });
      
      const stats = {
        total_bundles: allBundles.data.length,
        active_bundles: allBundles.data.filter((b: any) => b.is_active).length,
        inactive_bundles: allBundles.data.filter((b: any) => !b.is_active).length,
        average_products_per_bundle: allBundles.data.length > 0 
          ? allBundles.data.reduce((sum: number, b: any) => sum + b.products_count, 0) / allBundles.data.length 
          : 0,
        total_bundle_value: allBundles.data.reduce((sum: number, b: any) => sum + b.total_value, 0)
      };

      return stats;
    } catch (error) {
      throw new Error(`Failed to get bundle statistics: ${(error as Error).message}`);
    }
  }
}
