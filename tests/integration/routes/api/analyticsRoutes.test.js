import request from 'supertest';
import createServer from '../../../../src/loaders/server.js';
import db from '../../../../src/config/db.js';
import cacheService from '../../../../src/services/cacheService.js';
import { execSync } from 'child_process';

const app = createServer();
let server;

// ✅ Use a clean, explicit flag for controlling seed behavior
const shouldSeed = process.env.SKIP_DB_RESET !== 'true';

const MOST_BOOKMARKED_CACHE_KEY = 'most_bookmarked_articles';
const TOP_BOOKMARKING_USERS_CACHE_KEY = 'top_bookmarking_users';

beforeAll(async () => {
  server = app.listen(8080);

  if (shouldSeed) {
    console.log('🚀 Seeding large test database for analytics tests...');
    execSync('NODE_ENV=test node scripts/resetAndSeedTestDatabase.js', {
      stdio: 'inherit',
    });
  } else {
    console.log('⚡️ Skipping DB seed (using previously seeded data)');
  }
});

beforeEach(() => {
  cacheService.flushCache();
});

afterAll(async () => {
  const currentDb = await db.raw('SELECT current_database();');
  console.log(
    `🛑 Closing DB connection to: ${currentDb.rows[0].current_database}`
  );
  await db.destroy();

  if (server) {
    await new Promise((resolve) => server.close(resolve));
    console.log('✅ Server closed.');
  }
});

describe('📊 GET /api/analytics/most-bookmarked', () => {
  it('returns top bookmarked articles with correct structure and pagination', async () => {
    const res = await request(app).get(
      '/api/v1/analytics/most-bookmarked-articles?limit=5&page=1'
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('results');
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results.length).toBeLessThanOrEqual(5);

    const first = res.body.results[0];
    expect(first).toHaveProperty('article_id');
    expect(first).toHaveProperty('title');
    expect(first).toHaveProperty('bookmark_count');

    // Ensure descending order
    for (let i = 1; i < res.body.results.length; i++) {
      expect(
        Number(res.body.results[i - 1].bookmark_count)
      ).toBeGreaterThanOrEqual(Number(res.body.results[i].bookmark_count));
    }
  });

  it('uses cached results after first request', async () => {
    const page = 1;
    const limit = 3;
    const offset = (page - 1) * limit;

    // 🔹 First request populates the cache
    const firstRes = await request(app).get(
      `/api/v1/analytics/most-bookmarked-articles?limit=${limit}&page=${page}`
    );
    expect(firstRes.statusCode).toBe(200);

    // 🔹 Check that the cache now exists and is full
    const cached = cacheService.getCache(MOST_BOOKMARKED_CACHE_KEY);
    expect(cached).toBeInstanceOf(Array);
    expect(cached.length).toBeGreaterThan(limit);
    expect(cached.length).toBeLessThanOrEqual(50);

    // 🔹 First response should match the first page from cached results
    const expectedSlice = cached.slice(offset, offset + limit);
    expect(firstRes.body.results).toEqual(expectedSlice);

    // 🔹 Second request should return the same slice
    const secondRes = await request(app).get(
      `/api/v1/analytics/most-bookmarked-articles?limit=${limit}&page=${page}`
    );
    expect(secondRes.statusCode).toBe(200);
    expect(secondRes.body.results).toEqual(expectedSlice);
  });

  it('returns paginated results on different pages', async () => {
    const res1 = await request(app).get(
      '/api/v1/analytics/most-bookmarked-articles?page=1&limit=2'
    );
    const res2 = await request(app).get(
      '/api/v1/analytics/most-bookmarked-articles?page=2&limit=2'
    );
    expect(res1.body.results.length).toBeGreaterThan(0);
    expect(res2.body.results.length).toBeGreaterThan(0);
    expect(res1.body.results[0].article_id).not.toEqual(
      res2.body.results[0].article_id
    );
  });
});

describe('📊 GET /api/analytics/top-bookmarking-users', () => {
  it('returns top users with correct structure and pagination', async () => {
    const res = await request(app).get(
      '/api/v1/analytics/top-bookmarking-users?limit=5&page=1'
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('results');
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results.length).toBeLessThanOrEqual(5);

    const first = res.body.results[0];
    expect(first).toHaveProperty('user_id');
    expect(first).toHaveProperty('username');
    expect(first).toHaveProperty('bookmark_count');

    for (let i = 1; i < res.body.results.length; i++) {
      expect(
        Number(res.body.results[i - 1].bookmark_count)
      ).toBeGreaterThanOrEqual(Number(res.body.results[i].bookmark_count));
    }
  });

  it('uses cached results after first request', async () => {
    const page = 1;
    const limit = 3;
    const offset = (page - 1) * limit;

    // 🔹 First request populates the cache
    const firstRes = await request(app).get(
      `/api/v1/analytics/top-bookmarking-users?limit=${limit}&page=${page}`
    );
    expect(firstRes.statusCode).toBe(200);

    // 🔹 Check that the cache now exists and is full
    const cached = cacheService.getCache(TOP_BOOKMARKING_USERS_CACHE_KEY);
    expect(cached).toBeInstanceOf(Array);
    expect(cached.length).toBeGreaterThan(limit);
    expect(cached.length).toBeLessThanOrEqual(50);

    // 🔹 First response should match the first page from cached results
    const expectedSlice = cached.slice(offset, offset + limit);
    expect(firstRes.body.results).toEqual(expectedSlice);

    // 🔹 Second request should return the same slice
    const secondRes = await request(app).get(
      `/api/v1/analytics/top-bookmarking-users?limit=${limit}&page=${page}`
    );
    expect(secondRes.statusCode).toBe(200);
    expect(secondRes.body.results).toEqual(expectedSlice);
  });

  it('returns paginated results on different pages', async () => {
    const res1 = await request(app).get(
      '/api/v1/analytics/top-bookmarking-users?page=1&limit=2'
    );
    const res2 = await request(app).get(
      '/api/v1/analytics/top-bookmarking-users?page=2&limit=2'
    );
    expect(res1.body.results.length).toBeGreaterThan(0);
    expect(res2.body.results.length).toBeGreaterThan(0);
    expect(res1.body.results[0].user_id).not.toEqual(
      res2.body.results[0].user_id
    );
  });
});
