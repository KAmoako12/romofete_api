import request from "supertest";
import { createApp } from "../index";
import { Database } from "../src/_services/databaseService";

// Set NODE_ENV to test to ensure we use the test database configuration
process.env.NODE_ENV = 'test';

describe("User Endpoints E2E", () => {
  let app: any;
  let testDb: any;

  beforeAll(async () => {
    // Create app instance for testing
    app = createApp();
    
    // Get test database instance
    testDb = Database.getDBTestInstance();
    
    // Run migrations on test database
    await testDb.migrate.latest();
    
    // Clean up any existing test data
    await testDb("users").truncate();
  });

  afterAll(async () => {
    // Clean up database connections
    await Database.closeTestConnection();
  });

  beforeEach(async () => {
    // Clean up before each test
    await testDb("users").truncate();
  });
  let createdUserId: number;
  let authToken: string;
  const testUser = {
    username: "e2euser",
    email: "e2euser@example.com",
    password: "e2eTestPass123",
    role: "admin"
  };

  it("should create a new user", async () => {
    const res = await request(app)
      .post("/users")
      .send(testUser)
      .expect(201);

    expect(res.body).toHaveProperty("id");
    expect(res.body.username).toBe(testUser.username);
    expect(res.body.email).toBe(testUser.email);
    expect(res.body.role).toBe(testUser.role);
    expect(res.body).not.toHaveProperty("password");
    createdUserId = res.body.id;
  });

  it("should login with correct credentials", async () => {
    const res = await request(app)
      .post("/users/login")
      .send({ username: testUser.username, password: testUser.password })
      .expect(200);

    expect(res.body).toHaveProperty("user");
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.username).toBe(testUser.username);
    expect(res.body.user).not.toHaveProperty("password");
    expect(typeof res.body.token).toBe("string");
    authToken = res.body.token;
  });

  it("should get the created user by id", async () => {
    const res = await request(app)
      .get(`/users/${createdUserId}`)
      .expect(200);

    expect(res.body).toHaveProperty("id", createdUserId);
    expect(res.body.username).toBe(testUser.username);
    expect(res.body).not.toHaveProperty("password");
  });

  it("should list users and include the created user", async () => {
    const res = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find((u: any) => u.id === createdUserId);
    expect(found).toBeDefined();
    expect(found.username).toBe(testUser.username);
  });

  it("should delete the created user", async () => {
    const res = await request(app)
      .delete(`/users/${createdUserId}`)
      .expect(200);

    expect(res.body).toHaveProperty("message", "User deleted");
    expect(res.body.user).toHaveProperty("id", createdUserId);
  });

  it("should not login with deleted user", async () => {
    await request(app)
      .post("/users/login")
      .send({ username: testUser.username, password: testUser.password })
      .expect(401);
  });
});
