const request = require("supertest");
const app = require("../../app");
const User = require("../../models/userModel");
const Tour = require("../../models/tourModel");
const { connect, closeDatabase, clearDatabase } = require("../setup/testDb");

let adminToken;
let userToken;

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

// Helper: create a user with a given role and return a valid JWT
const createUserAndLogin = async (role = "user") => {
  await request(app)
    .post("/api/v1/users/signup")
    .send({
      name: "Test User",
      email: `${role}@test.com`,
      password: "password123",
      passwordConfirm: "password123",
    });

  await User.findOneAndUpdate({ email: `${role}@test.com` }, { role });

  const res = await request(app)
    .post("/api/v1/users/login")
    .send({
      email: `${role}@test.com`,
      password: "password123",
    });

  return res.body.token;
};

beforeEach(async () => {
  adminToken = await createUserAndLogin("admin");
  userToken = await createUserAndLogin("user");
});

describe("GET /api/v1/tours", () => {
  test("should return all tours", async () => {
    await Tour.create({
      name: "Test Tour",
      duration: 5,
      maxGroupSize: 10,
      difficulty: "easy",
      price: 500,
      summary: "A test tour",
      imageCover: "test.jpg",
      startLocation: {
        type: "Point",
        coordinates: [-118.113491, 34.111745],
        address: "Test Address",
        description: "Test Location",
      },
    });

    const res = await request(app).get("/api/v1/tours");

    expect(res.status).toBe(200);
    expect(res.body.results).toBe(1);
    expect(res.body.data.data[0].name).toBe("Test Tour");
  });

  test("should return empty array when no tours exist", async () => {
    const res = await request(app).get("/api/v1/tours");

    expect(res.status).toBe(200);
    expect(res.body.results).toBe(0);
  });
});

describe("GET /api/v1/tours/:id", () => {
  test("should return a single tour by valid ID", async () => {
    const tour = await Tour.create({
      name: "Solo Tour",
      duration: 3,
      maxGroupSize: 5,
      difficulty: "medium",
      price: 300,
      summary: "Solo test",
      imageCover: "solo.jpg",
      startLocation: {
        type: "Point",
        coordinates: [-118.113491, 34.111745],
        address: "Test Address",
        description: "Test Location",
      },
    });

    const res = await request(app).get(`/api/v1/tours/${tour._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.data.name).toBe("Solo Tour");
  });

  test("should return 404 for a non-existent ID", async () => {
    const fakeId = "64a1b2c3d4e5f6a7b8c9d0e1";
    const res = await request(app).get(`/api/v1/tours/${fakeId}`);

    expect(res.status).toBe(404);
  });

  test("should return 500 for a malformed ID", async () => {
    const res = await request(app).get("/api/v1/tours/not-a-valid-id");

    expect(res.status).toBe(500);
  });
});

describe("POST /api/v1/tours", () => {
  const newTour = {
    name: "New Adventure",
    duration: 7,
    maxGroupSize: 15,
    difficulty: "difficult",
    price: 999,
    summary: "An epic adventure",
    imageCover: "adventure.jpg",
    startLocation: {
      type: "Point",
      coordinates: [-118.113491, 34.111745],
      address: "Test Address",
      description: "Test Location",
    },
  };

  test("should allow admin to create a tour", async () => {
    const res = await request(app)
      .post("/api/v1/tours")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(newTour);

    expect(res.status).toBe(201);
    expect(res.body.data.data.name).toBe("New Adventure");
  });

  test("should reject creation from a regular user", async () => {
    const res = await request(app)
      .post("/api/v1/tours")
      .set("Authorization", `Bearer ${userToken}`)
      .send(newTour);

    expect(res.status).toBe(403);
  });

  test("should reject creation with no auth token", async () => {
    const res = await request(app).post("/api/v1/tours").send(newTour);

    expect(res.status).toBe(401);
  });

  test("should reject creation missing required fields", async () => {
    const res = await request(app)
      .post("/api/v1/tours")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Incomplete Tour" });

    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/v1/tours/:id", () => {
  test("should allow admin to update a tour", async () => {
    const tour = await Tour.create({
      name: "Old Name",
      duration: 4,
      maxGroupSize: 8,
      difficulty: "easy",
      price: 400,
      summary: "Old summary",
      imageCover: "old.jpg",
      startLocation: {
        type: "Point",
        coordinates: [-118.113491, 34.111745],
        address: "Test Address",
        description: "Test Location",
      },
    });

    const res = await request(app)
      .patch(`/api/v1/tours/${tour._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Updated Name" });

    expect(res.status).toBe(200);
    expect(res.body.data.data.name).toBe("Updated Name");
  });

  test("should reject update from a regular user", async () => {
    const tour = await Tour.create({
      name: "Protected Tour",
      duration: 4,
      maxGroupSize: 8,
      difficulty: "easy",
      price: 400,
      summary: "summary",
      imageCover: "img.jpg",
      startLocation: {
        type: "Point",
        coordinates: [-118.113491, 34.111745],
        address: "Test Address",
        description: "Test Location",
      },
    });

    const res = await request(app)
      .patch(`/api/v1/tours/${tour._id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Hacked Name" });

    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/v1/tours/:id", () => {
  test("should allow admin to delete a tour", async () => {
    const tour = await Tour.create({
      name: "Doomed Tour",
      duration: 2,
      maxGroupSize: 4,
      difficulty: "easy",
      price: 100,
      summary: "summary",
      imageCover: "img.jpg",
      startLocation: {
        type: "Point",
        coordinates: [-118.113491, 34.111745],
        address: "Test Address",
        description: "Test Location",
      },
    });

    const res = await request(app)
      .delete(`/api/v1/tours/${tour._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(204);

    const check = await Tour.findById(tour._id);
    expect(check).toBeNull();
  });

  test("should reject delete from a regular user", async () => {
    const tour = await Tour.create({
      name: "Safe Tour",
      duration: 2,
      maxGroupSize: 4,
      difficulty: "easy",
      price: 100,
      summary: "summary",
      imageCover: "img.jpg",
      startLocation: {
        type: "Point",
        coordinates: [-118.113491, 34.111745],
        address: "Test Address",
        description: "Test Location",
      },
    });

    const res = await request(app)
      .delete(`/api/v1/tours/${tour._id}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });
});
