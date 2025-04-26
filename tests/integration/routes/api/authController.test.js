import request from 'supertest';
import db from '../../../../src/config/db.js';
import createServer from '../../../../src/loaders/server.js';

const app = createServer();

beforeAll(async () => {
  await db.migrate.latest();
  await db.seed.run();
});

afterEach(async () => {
  await db('blacklisted_tokens').del(); // Clear blacklisted tokens to avoid conflicts
});

afterAll(async () => {
  await db.destroy();
}, 10000);

describe('Authentication Controller', () => {
  test('should sign up a user with email & password', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({
      username: 'newTestUser',
      email: 'newTestUser@example.com',
      password: 'securepassword123',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Signup successful!');
    expect(res.body).toHaveProperty('token');
  });

  test('should return 400 if required signup fields are missing', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({
      username: 'testuser',
      // missing email
      password: 'password123',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'All fields are required'); // or whatever your error says
  });

  test('should return 409 if email is already registered', async () => {
    const seededUser = await db('users').first(); // Get the first seeded user

    expect(seededUser).toBeDefined();

    const res = await request(app).post('/api/v1/auth/signup').send({
      username: 'anotherUser',
      email: seededUser.email,
      password: 'securepassword123',
    });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty(
      'error',
      'Email or username already in use'
    );
  });

  test('should log in a user with valid credentials', async () => {
    // ✅ Fetch a user with a password (not an OAuth user)
    const seededUser = await db('users').whereNotNull('password_hash').first();

    // ✅ Ensure a valid user exists
    expect(seededUser).toBeDefined();

    const res = await request(app).post('/api/v1/auth/login').send({
      email: seededUser.email,
      password: 'Password123!', // 🔹 The password used in the seed data
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('should return 401 for invalid password', async () => {
    const seededUser = await db('users').whereNotNull('password_hash').first();

    expect(seededUser).toBeDefined();
    const res = await request(app).post('/api/v1/auth/login').send({
      email: seededUser.email,
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid credentials');
  });

  test('should create and login a new OAuth user, returning a token', async () => {
    const res = await request(app).post('/api/v1/auth/oauth').send({
      provider: 'google',
      oauthId: 'new-oauth-id',
      email: 'new-oauth-user@example.com',
      username: 'newoauthuser',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
  });

  test('should log in an existing OAuth userr, returning a token', async () => {
    const res = await request(app).post('/api/v1/auth/oauth').send({
      provider: 'google',
      oauthId: 'existing-oauth-id', // ✅ Match seed data
      email: 'oauthuser@example.com',
      username: 'oauthuser',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('should log out a user and blacklist the token', async () => {
    const seededUser = await db('users').whereNotNull('password_hash').first();
    expect(seededUser).toBeDefined();

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: seededUser.email,
      password: 'Password123!',
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('token');
    const token = loginRes.body.token;

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body).toHaveProperty('message', 'Logout successful');

    // ✅ Check if token is blacklisted
    const blacklistedToken = await db('blacklisted_tokens')
      .where({ token })
      .first();
    expect(blacklistedToken).toBeDefined();

    // ✅ Ensure token can't be reused
    const protectedRes = await request(app)
      .get('/api/v1/protected-route')
      .set('Authorization', `Bearer ${token}`);

    expect(protectedRes.status).toBe(401);
    expect(protectedRes.body).toHaveProperty('error', 'Token has been revoked');
  });
});
