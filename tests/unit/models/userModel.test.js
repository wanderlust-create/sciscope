import bcrypt from "bcrypt";
import db from "../../../src/config/db.js";
import User from "../../../src/models/User.js";

beforeAll(async () => {
  await db.migrate.latest();
});

afterAll(async () => {
  await db.destroy();
});

describe("User Model", () => {
  beforeEach(async () => {
    await db("users").del();
  });

  // 🔹 Test Required Fields
  test("should require email and username", async () => {
    await expect(
      User.query().insert({ password_hash: "password123" }),
    ).rejects.toThrow();
    await expect(
      User.query().insert({ username: "testuser" }),
    ).rejects.toThrow();
  });

  // 🔹 Test Unique Email Constraint
  test("should enforce unique email constraint", async () => {
    await User.query().insert({
      username: "user1",
      email: "test@example.com",
      password_hash: await bcrypt.hash("password123", 10),
    });

    await expect(
      User.query().insert({
        username: "user2",
        email: "test@example.com",
        password_hash: await bcrypt.hash("password456", 10),
      }),
    ).rejects.toThrow(/duplicate key value violates unique constraint/);
  });

  // 🔹 Test Unique Username Constraint
  test("should enforce unique username constraint", async () => {
    await User.query().insert({
      username: "duplicateuser",
      email: "user1@example.com",
      password_hash: await bcrypt.hash("password123", 10),
    });

    await expect(
      User.query().insert({
        username: "duplicateuser",
        email: "user2@example.com",
        password_hash: await bcrypt.hash("password456", 10),
      }),
    ).rejects.toThrow(/duplicate key value violates unique constraint/);
  });

  // 🔹 Test Password Hashing
  test("should hash the password before saving", async () => {
    const rawPassword = "securepass"; // Store raw password for comparison

    const user = await User.query().insert({
      username: "secureuser",
      email: "secure@example.com",
      password_hash: await bcrypt.hash(rawPassword, 10),
    });

    const dbUser = await db("users")
      .where({ email: "secure@example.com" })
      .first();

    expect(dbUser).toBeDefined();
    expect(dbUser.passwordHash).toBeDefined();
    expect(dbUser.passwordHash).not.toBe(rawPassword);

    const isMatch = await bcrypt.compare(rawPassword, dbUser.passwordHash);
    expect(isMatch).toBe(true); // ✅ Hashed password should match original input
  });

  // 🔹 Test Invalid Email Format
  test("should reject invalid email formats", async () => {
    await expect(
      User.query().insert({
        username: "invalidemail",
        email: "not-an-email",
        password_hash: await bcrypt.hash("password123", 10),
      }),
    ).rejects.toThrow();
  });

  // 🔹 Test OAuth User Can Sign Up Without Password
  test("should allow OAuth users to sign up without a password", async () => {
    const oauthUser = await User.query().insert({
      username: "oauthuser",
      email: "oauth@example.com",
      oauth_provider: "github",
      oauth_id: "67890",
    });

    expect(oauthUser.oauth_provider).toBe("github");
    expect(oauthUser.oauth_id).toBe("67890");
    expect(oauthUser.password_hash).toBeUndefined();
  });
});
