const request = require("supertest");
const app = require("../../app");
const { connect, closeDatabase, clearDatabase } = require("../setup/testDb");

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

// Tests
describe("POST /api/v1/users/signup", () => {
  test("should create a new user with valid data", async () => {
    const res = await request(app).post("/api/v1/users/signup").send({
      name: "Test User",
      email: "test@test.com",
      password: "password123",
      passwordConfirm: "password123",
      role: "user",
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data.user.email).toBe("test@test.com");
    expect(res.body.data.user.password).toBeUndefined();
  });

  test("should fail when passwords do not match", async () => {
    const res = await request(app).post("/api/v1/users/signup").send({
      name: "Test User",
      email: "test2@test.com",
      password: "password123",
      passwordConfirm: "pass1234",
      role: "user",
    });

    expect(res.status).toBe(400);
  });

  test("should fail with duplicate email", async () => {
    const userData = {
      name: "Test User",
      email: "dupe@test.com",
      password: "password123",
      passwordConfirm: "password123",
      role: "user",
    };

    await request(app).post("/api/v1/users/signup").send(userData);
    const res = await request(app).post("/api/v1/users/signup").send(userData);

    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/users/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/v1/users/signup").send({
      name: "Login Tester",
      email: "login@test.com",
      password: "password123",
      passwordConfirm: "password123",
      role: "user",
    });
  });

  test("should login with correct credentials", async () => {
    const res = await request(app).post("/api/v1/users/login").send({
      email: "login@test.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test("should fail with wrong password", async () => {
    const res = await request(app).post("/api/v1/users/login").send({
      email: "login@test.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
  });

  test("should fail with non-existent email", async () => {
    const res = await request(app).post("/api/v1/users/login").send({
      email: "nobody@test.com",
      password: "password123",
    });

    expect(res.status).toBe(401);
  });
});
