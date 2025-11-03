import request from 'supertest';
import { createApp } from '../index';
import { Database } from '../src/_services/databaseService';
import { DB } from '../src/_services/_dbTables';

// Set NODE_ENV to test to ensure we use the test database configuration
process.env.NODE_ENV = 'test';

describe('Product Type E2E Tests', () => {
  let app: any;
  let authToken: string;
  let adminUserId: number;
  let testDb: any;

  beforeAll(async () => {
    // Create app instance for testing
    app = createApp();
    
    // Get test database instance
    testDb = Database.getDBTestInstance();
    
    // Run migrations on test database
    await testDb.migrate.latest();
    
    // Get admin user credentials
    const adminUser = await testDb(DB.Users).where({ role: 'admin' }).first();
    if (adminUser) {
      adminUserId = adminUser.id;

      // Login to get auth token
      const loginRes = await request(app)
        .post('/users/login')
        .send({
          email: adminUser.email,
          password: 'Admin@123' // Default password from migration
        });

      authToken = loginRes.body.token;
    }
  });

  afterAll(async () => {
    // Clean up database connections
    await Database.closeTestConnection();
  });

  describe('DELETE /api/product-types/:id - Cascade Delete', () => {
    it('should delete all products when product type is deleted', async () => {
      // Step 1: Create a product type
      const productTypeRes = await request(app)
        .post('/product-types')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Cascade Test Type',
          allowed_types: ['test1', 'test2']
        });

      expect(productTypeRes.status).toBe(201);
      const productTypeId = productTypeRes.body.id;

      // Step 2: Create multiple products with this product type
      const product1Res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Product 1',
          price: 100,
          stock: 10,
          product_type_id: productTypeId,
          description: 'Test product 1'
        });

      expect(product1Res.status).toBe(201);
      const product1Id = product1Res.body.id;

      const product2Res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Product 2',
          price: 200,
          stock: 20,
          product_type_id: productTypeId,
          description: 'Test product 2'
        });

      expect(product2Res.status).toBe(201);
      const product2Id = product2Res.body.id;

      // Step 3: Verify products exist and are not deleted
      const checkProduct1 = await testDb(DB.Products)
        .where({ id: product1Id })
        .first();
      expect(checkProduct1).toBeDefined();
      expect(checkProduct1.is_deleted).toBe(false);

      const checkProduct2 = await testDb(DB.Products)
        .where({ id: product2Id })
        .first();
      expect(checkProduct2).toBeDefined();
      expect(checkProduct2.is_deleted).toBe(false);

      // Step 4: Delete the product type
      const deleteRes = await request(app)
        .delete(`/product-types/${productTypeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteRes.status).toBe(200);

      // Step 5: Verify product type is soft deleted
      const deletedProductType = await testDb(DB.ProductTypes)
        .where({ id: productTypeId })
        .first();
      expect(deletedProductType).toBeDefined();
      expect(deletedProductType.is_deleted).toBe(true);
      expect(deletedProductType.deleted_at).toBeDefined();

      // Step 6: Verify all products are cascade deleted (soft deleted)
      const deletedProduct1 = await testDb(DB.Products)
        .where({ id: product1Id })
        .first();
      expect(deletedProduct1).toBeDefined();
      expect(deletedProduct1.is_deleted).toBe(true);
      expect(deletedProduct1.deleted_at).toBeDefined();

      const deletedProduct2 = await testDb(DB.Products)
        .where({ id: product2Id })
        .first();
      expect(deletedProduct2).toBeDefined();
      expect(deletedProduct2.is_deleted).toBe(true);
      expect(deletedProduct2.deleted_at).toBeDefined();

      // Step 7: Verify products don't show up in API queries
      const getProduct1Res = await request(app)
        .get(`/products/${product1Id}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(getProduct1Res.status).toBe(404);

      const getProduct2Res = await request(app)
        .get(`/products/${product2Id}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(getProduct2Res.status).toBe(404);
    });

    it('should handle deletion of product type with no products', async () => {
      // Create a product type without any products
      const productTypeRes = await request(app)
        .post('/product-types')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Empty Product Type',
          allowed_types: ['test']
        });

      expect(productTypeRes.status).toBe(201);
      const productTypeId = productTypeRes.body.id;

      // Delete the product type
      const deleteRes = await request(app)
        .delete(`/product-types/${productTypeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteRes.status).toBe(200);

      // Verify product type is soft deleted
      const deletedProductType = await testDb(DB.ProductTypes)
        .where({ id: productTypeId })
        .first();
      expect(deletedProductType).toBeDefined();
      expect(deletedProductType.is_deleted).toBe(true);
    });

    it('should return 404 when trying to delete non-existent product type', async () => {
      const deleteRes = await request(app)
        .delete('/product-types/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteRes.status).toBe(404);
    });
  });
});
