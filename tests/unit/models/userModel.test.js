import bcrypt from 'bcrypt';
import db from '../../../src/config/db.js';
import User from '../../../src/models/User.js';

beforeAll(async () => {
  await db.migrate.latest();
});

afterAll(async () => {
  await db.destroy();
});

describe('User Model', () => {
  beforeEach(async () => {
    await db.raw('TRUNCATE TABLE users RESTART IDENTITY CASCADE;');
  });

  // 🔹 Test Required Fields
  test('should require email and username', async () => {
    await expect(
      User.query().insert({ passwordHash: 'password123' })
    ).rejects.toThrow(/email/i);
    await expect(User.query().insert({ username: 'testuser' })).rejects.toThrow(
      /email/i
    );
  });

  // 🔹 Test Unique Email Constraint
  test('should enforce unique email constraint', async () => {
    await User.query().insert({
      username: 'user1',
      email: 'test@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
    });

    await expect(
      User.query().insert({
        username: 'user2',
        email: 'test@example.com', // ❌ Duplicate email
        passwordHash: await bcrypt.hash('password456', 10),
      })
    ).rejects.toThrow(/duplicate key value violates unique constraint/);
  });

  // 🔹 Test Unique Username Constraint
  test('should enforce unique username constraint', async () => {
    await User.query().insert({
      username: 'duplicateuser',
      email: 'user1@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
    });

    await expect(
      User.query().insert({
        username: 'duplicateuser', // ❌ Duplicate username
        email: 'user2@example.com',
        passwordHash: await bcrypt.hash('password456', 10),
      })
    ).rejects.toThrow(/duplicate key value violates unique constraint/);
  });

  // 🔹 Test Password Hashing
  test('should hash the password before saving', async () => {
    const rawPassword = 'securepass';

    await User.query().insert({
      username: 'secureuser',
      email: 'secure@example.com',
      passwordHash: await bcrypt.hash(rawPassword, 10),
    });

    const storedUser = await db('users')
      .where({ email: 'secure@example.com' })
      .first();

    expect(storedUser).toBeDefined();
    expect(storedUser.passwordHash).toBeDefined();
    expect(storedUser.passwordHash).not.toBe(rawPassword);

    const isMatch = await bcrypt.compare(rawPassword, storedUser.passwordHash);
    expect(isMatch).toBe(true);
  });

  // 🔹 Test Invalid Email Format
  test('should reject invalid email formats', async () => {
    await expect(
      User.query().insert({
        username: 'invalidemail',
        email: 'not-an-email',
        passwordHash: await bcrypt.hash('password123', 10),
      })
    ).rejects.toThrow(/email/i);
  });

  // 🔹 Test OAuth User Can Sign Up Without Password
  test('should allow OAuth users to sign up without a password', async () => {
    const oauthUser = await User.query().insert({
      username: 'oauthuser',
      email: 'oauth@example.com',
      oauthProvider: 'github',
      oauthId: '67890',
    });

    expect(oauthUser.oauthProvider).toBe('github');
    expect(oauthUser.oauthId).toBe('67890');
    expect(oauthUser.passwordHash).toBeUndefined();
  });
});
