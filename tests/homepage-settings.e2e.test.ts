import request from "supertest";
import { createApp } from "../index";
import { Database } from "../src/_services/databaseService";

process.env.NODE_ENV = 'test';

describe("Homepage Settings Endpoints E2E", () => {
  let app: any;
  let testDb: any;
  let authToken: string;
  let createdId: number;

  const adminUser = {
    username: "adminhs",
    email: "adminhs@example.com",
    password: "TestPass123!",
    role: "admin"
  };

  beforeAll(async () => {
    app = createApp();
    testDb = Database.getDBTestInstance();
    await testDb.migrate.latest();
    await testDb("users").truncate();
    await testDb("homepage_settings").truncate();

    // Create admin user
    const res = await request(app)
      .post("/users")
      .send(adminUser)
      .expect(201);

    // Login as admin
    const loginRes = await request(app)
      .post("/users/login")
      .send({ username: adminUser.username, password: adminUser.password })
      .expect(200);

    authToken = loginRes.body.token;
  });

  afterAll(async () => {
    await Database.closeTestConnection();
  });

  beforeEach(async () => {
    await testDb("homepage_settings").truncate();
  });

  const testData = {
    section_title: "Featured Products",
    section_position: 1,
    is_active: true,
    section_images: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
  };

  // Helper to create a product and return its id
  async function createTestProduct(name = "Test Product", price = "10.00") {
    const [id] = await testDb("products").insert({
      name,
      description: "desc",
      price,
      stock: 10,
      product_type_id: 1,
      images: JSON.stringify([]),
      extra_properties: JSON.stringify({}),
      created_at: new Date(),
      is_deleted: false
    }).returning("id");
    return typeof id === "object" && id.id ? id.id : id;
  }

  it("should create a new homepage setting", async () => {
    const res = await request(app)
      .post("/homepage-settings")
      .set("Authorization", `Bearer ${authToken}`)
      .send(testData)
      .expect(201);

    expect(res.body).toHaveProperty("id");
    expect(res.body.section_title).toBe(testData.section_title);
    expect(res.body.section_position).toBe(testData.section_position);
    expect(res.body.is_active).toBe(true);
    expect(Array.isArray(res.body.section_images)).toBe(true);
    createdId = res.body.id;
  });

  it("should create a homepage setting with product_ids and return products in GET", async () => {
    // Create two products
    const productId1 = await createTestProduct("Product A", "12.00");
    const productId2 = await createTestProduct("Product B", "15.00");

    // Create homepage setting with product_ids
    const createRes = await request(app)
      .post("/homepage-settings")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ ...testData, product_ids: [productId1, productId2] })
      .expect(201);

    const id = createRes.body.id;

    // GET by id
    const getRes = await request(app)
      .get(`/homepage-settings/${id}`)
      .expect(200);

    expect(getRes.body).toHaveProperty("products");
    expect(Array.isArray(getRes.body.products)).toBe(true);
    expect(getRes.body.products.length).toBe(2);
    expect(getRes.body.products[0]).toHaveProperty("id", productId1);
    expect(getRes.body.products[1]).toHaveProperty("id", productId2);

    // GET all
    const listRes = await request(app)
      .get("/homepage-settings")
      .expect(200);

    const found = listRes.body.data.find((h: any) => h.id === id);
    expect(found).toBeDefined();
    expect(Array.isArray(found.products)).toBe(true);
    expect(found.products.length).toBe(2);
  });

  it("should get the created homepage setting by id", async () => {
    // Create first
    const createRes = await request(app)
      .post("/homepage-settings")
      .set("Authorization", `Bearer ${authToken}`)
      .send(testData)
      .expect(201);

    const id = createRes.body.id;

    const res = await request(app)
      .get(`/homepage-settings/${id}`)
      .expect(200);

    expect(res.body).toHaveProperty("id", id);
    expect(res.body.section_title).toBe(testData.section_title);
  });

  it("should list homepage settings (ordered by section_position)", async () => {
    // Create two
    await request(app)
      .post("/homepage-settings")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ ...testData, section_position: 2 })
      .expect(201);

    await request(app)
      .post("/homepage-settings")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ ...testData, section_position: 1 })
      .expect(201);

    const res = await request(app)
      .get("/homepage-settings")
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body[0].section_position).toBe(1);
    expect(res.body[1].section_position).toBe(2);
  });

  it("should update a homepage setting", async () => {
    // Create first
    const createRes = await request(app)
      .post("/homepage-settings")
      .set("Authorization", `Bearer ${authToken}`)
      .send(testData)
      .expect(201);

    const id = createRes.body.id;

    const updateData = { section_title: "Updated Title", is_active: false };
    const res = await request(app)
      .put(`/homepage-settings/${id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(updateData)
      .expect(200);

    expect(res.body.section_title).toBe(updateData.section_title);
    expect(res.body.is_active).toBe(false);
  });

  it("should hard delete a homepage setting", async () => {
    // Create first
    const createRes = await request(app)
      .post("/homepage-settings")
      .set("Authorization", `Bearer ${authToken}`)
      .send(testData)
      .expect(201);

    const id = createRes.body.id;

    await request(app)
      .delete(`/homepage-settings/${id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    // Should not be found
    await request(app)
      .get(`/homepage-settings/${id}`)
      .expect(404);
  });

  it("should not allow unauthenticated create", async () => {
    await request(app)
      .post("/homepage-settings")
      .send(testData)
      .expect(401);
  });

  it("should return 400 for invalid input", async () => {
    await request(app)
      .post("/homepage-settings")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ section_title: "", section_position: -1 })
      .expect(400);
  });
});
