import bcrypt from 'bcrypt';
import request from 'supertest';
import db from '../../../src/config/db.js';
import createServer from '../../../src/loaders/server.js';
import User from '../../../src/models/User.js';

const app = createServer();

beforeAll(async () => {
  await db.migrate.latest();
});

afterEach(async () => {
  await db('users').del();
});

afterAll(async () => {
  await db.destroy();
}, 10000);

describe('Authentication Controller', () => {
  // 🔹 Email & Password Signup
  test('should sign up a user with email & password', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({
      username: 'testuser27',
      email: 'test@example27.com',
      password: 'securepassword123',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Signup successful!');
    expect(res.body).toHaveProperty('token');
  });

  // 🔹 Email & Password Signup - Duplicate Email
  test('should return 409 if email is already registered', async () => {
    await User.query().insert({
      username: 'existinguser',
      email: 'duplicate@example.com',
      password_hash: await bcrypt.hash('securepassword123', 10),
    });

    const res = await request(app).post('/api/v1/auth/signup').send({
      username: 'newuser',
      email: 'duplicate@example.com',
      password: 'securepassword123',
    });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty(
      'error',
      'Email or username already in use'
    );
  });

  // 🔹 Email & Password Login
  test('should log in a user with valid credentials', async () => {
    const hashedPassword = await bcrypt.hash('securepassword123', 10);
    await User.query().insert({
      username: 'testuser',
      email: 'login@example.com',
      password_hash: hashedPassword,
    });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'login@example.com',
      password: 'securepassword123',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  // 🔹 Email & Password Login - Invalid Password
  test('should return 401 for invalid password', async () => {
    const hashedPassword = await bcrypt.hash('securepassword123', 10);
    await User.query().insert({
      username: 'testuser',
      email: 'invalidpass@example.com',
      password_hash: hashedPassword,
    });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'invalidpass@example.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid credentials');
  });

  // 🔹 OAuth Signup/Login
  test('should sign up or log in a user using OAuth', async () => {
    const res = await request(app).post('/api/v1/auth/oauth').send({
      provider: 'google',
      oauth_id: 'google-12345',
      email: 'oauth@example.com',
      username: 'oauthuser',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  // 🔹 OAuth Login - Existing User
  test('should log in an existing OAuth user', async () => {
    await User.query().insert({
      username: 'oauthuser',
      email: 'oauth@example.com',
      oauth_provider: 'google',
      oauth_id: 'google-12345',
    });

    const res = await request(app).post('/api/v1/auth/oauth').send({
      provider: 'google',
      oauth_id: 'google-12345',
      email: 'oauth@example.com',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  // 🔹 Logout & Token Blacklisting
  test('should log out a user and blacklist the token', async () => {
    const signupRes = await request(app).post('/api/v1/auth/signup').send({
      username: 'testuser',
      email: 'test@example.com',
      password: 'securepassword123',
    });

    // ✅ Ensure token was returned
    expect(signupRes.status).toBe(201);
    expect(signupRes.body).toHaveProperty('token');
    const token = signupRes.body.token;

    // ✅ Logout request
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body).toHaveProperty('message', 'Logout successful');

    // ✅ Check if token is blacklisted
    const blacklistedToken = await db('blacklisted_tokens')
      .where({ token })
      .first();
    expect(blacklistedToken).toBeDefined(); // ✅ Ensure token is in the blacklist

    // ✅ Try using the token again on a protected route
    const protectedRes = await request(app)
      .get('/api/v1/protected-route')
      .set('Authorization', `Bearer ${token}`);

    expect(protectedRes.status).toBe(401);
    expect(protectedRes.body).toHaveProperty('error', 'Token has been revoked');
  });
});
