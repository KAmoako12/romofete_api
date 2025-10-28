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
