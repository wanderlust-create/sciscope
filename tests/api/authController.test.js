import bcrypt from "bcrypt";
import request from "supertest";
import db from "../../src/config/db.js";
import createServer from "../../src/loaders/server.js";
import User from "../../src/models/User.js";

const app = createServer();

beforeAll(async () => {
  await db.migrate.latest();
});

afterAll(async () => {
  await db.destroy();
});

describe("Authentication Controller", () => {
  beforeEach(async () => {
    await db("users").del();
  });

  // 🔹 Email & Password Signup
  test("should sign up a user with email & password", async () => {
    const res = await request(app).post("/api/v1/auth/signup").send({
      username: "testuser",
      email: "test@example.com",
      password: "securepassword123",
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("message", "Signup successful!");
    expect(res.body).toHaveProperty("token");
  });

  // 🔹 Email & Password Signup - Duplicate Email
  test("should return 409 if email is already registered", async () => {
    await User.query().insert({
      username: "existinguser",
      email: "duplicate@example.com",
      password_hash: "hashedpassword",
    });

    const res = await request(app).post("/api/v1/auth/signup").send({
      username: "newuser",
      email: "duplicate@example.com",
      password: "securepassword123",
    });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty(
      "error",
      "Email or username already in use"
    );
  });

  // 🔹 Email & Password Login
  test("should log in a user with valid credentials", async () => {
    const hashedPassword = await bcrypt.hash("securepassword123", 10);
    await User.query().insert({
      username: "testuser",
      email: "login@example.com",
      password_hash: hashedPassword,
    });

    const res = await request(app).post("/api/v1/auth/login").send({
      email: "login@example.com",
      password: "securepassword123",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  // 🔹 Email & Password Login - Invalid Password
  test("should return 401 for invalid password", async () => {
    const hashedPassword = await bcrypt.hash("securepassword123", 10);
    await User.query().insert({
      username: "testuser",
      email: "invalidpass@example.com",
      password_hash: hashedPassword,
    });

    const res = await request(app).post("/api/v1/auth/login").send({
      email: "invalidpass@example.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "Invalid credentials");
  });

  // 🔹 OAuth Signup/Login
  test("should sign up or log in a user using OAuth", async () => {
    const res = await request(app).post("/api/v1/auth/oauth").send({
      provider: "google",
      oauth_id: "google-12345",
      email: "oauth@example.com",
      username: "oauthuser",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  // 🔹 OAuth Login - Existing User
  test("should log in an existing OAuth user", async () => {
    await User.query().insert({
      username: "oauthuser",
      email: "oauth@example.com",
      oauth_provider: "google",
      oauth_id: "google-12345",
    });

    const res = await request(app).post("/api/v1/auth/oauth").send({
      provider: "google",
      oauth_id: "google-12345",
      email: "oauth@example.com",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
  });
});
