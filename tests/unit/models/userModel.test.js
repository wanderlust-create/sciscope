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
    await db("users").del(); // Clear users table before each test
  });

  test("should require email and username", async () => {
    await expect(
      User.query().insert({ password_hash: "password123" })
    ).rejects.toThrow();
    await expect(
      User.query().insert({ username: "testuser" })
    ).rejects.toThrow();
  });

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
      })
    ).rejects.toThrow(/unique constraint "users_email_unique"/);
  });

  test("should hash the password before saving", async () => {
    const user = await User.query().insert({
      username: "secureuser",
      email: "secure@example.com",
      password_hash: await bcrypt.hash("securepass", 10),
    });

    const dbUser = await db("users")
      .where({ email: "secure@example.com" })
      .first();
    expect(dbUser.password_hash).not.toBe("securepass"); // Ensure password is hashed
  });

  test("should allow OAuth users to sign up without a password", async () => {
    const user = await User.query().insert({
      username: "oauthuser",
      email: "oauth@example.com",
      oauth_provider: "google",
      oauth_id: "12345",
    });

    expect(user.oauth_provider).toBe("google");
    expect(user.oauth_id).toBe("12345");
    expect(user.password_hash).toBeNull();
  });
});
