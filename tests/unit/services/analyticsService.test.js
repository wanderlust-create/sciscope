import createServer from '../../../src/loaders/server.js';
import db from '../../../src/config/db.js';
import analyticsService from '../../../src/services/analyticsService.js';
import cacheService from '../../../src/services/cacheService.js';
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

describe('🔎 Bookmark Analytics Queries (with Caching)', () => {
  beforeEach(() => {
    cacheService.flushCache(); // Clear cache before each test
  });

  /** ✅ Most Bookmarked Articles Tests */
  it('should return paginated results & cache full set of top 50 articles', async () => {
    const page = 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    const articles = await analyticsService.getMostBookmarkedArticles(
      page,
      limit
    );

    expect(articles).toBeInstanceOf(Array);
    expect(articles.length).toBeLessThanOrEqual(limit);

    // Ensure descending order
    for (let i = 1; i < articles.length; i++) {
      expect(Number(articles[i - 1].bookmark_count)).toBeGreaterThanOrEqual(
        Number(articles[i].bookmark_count)
      );
    }

    // ✅ Cached value should be the full top 50
    const cached = cacheService.getCache(MOST_BOOKMARKED_CACHE_KEY);
    expect(cached).toBeInstanceOf(Array);
    expect(cached.length).toBeGreaterThanOrEqual(limit);

    // ✅ Returned page should match the slice from cached data
    const expectedSlice = cached.slice(offset, offset + limit);
    expect(articles).toEqual(expectedSlice);
  });

  it('should return cached results when already set', async () => {
    const mockData = Array.from({ length: 50 }, (_, i) => ({
      article_id: i + 1,
      title: `Cached Article ${i + 1}`,
      bookmark_count: 100 - i,
    }));
    cacheService.setCache(MOST_BOOKMARKED_CACHE_KEY, mockData, 600);

    const page = 1;
    const limit = 5;
    const result = await analyticsService.getMostBookmarkedArticles(
      page,
      limit
    );
    const expectedSlice = mockData.slice(0, limit);

    expect(result).toEqual(expectedSlice);
  });

  /** ✅ Top Bookmarking Users Tests */
  it('should return paginated top users & cache full top 50', async () => {
    const page = 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    const users = await analyticsService.getTopBookmarkingUsers(page, limit);
    expect(users).toBeInstanceOf(Array);
    expect(users.length).toBeLessThanOrEqual(limit);

    for (let i = 1; i < users.length; i++) {
      expect(Number(users[i - 1].bookmark_count)).toBeGreaterThanOrEqual(
        Number(users[i].bookmark_count)
      );
    }

    const cached = cacheService.getCache(TOP_BOOKMARKING_USERS_CACHE_KEY);
    expect(cached).toBeInstanceOf(Array);
    expect(cached.length).toBeGreaterThanOrEqual(limit);

    const expectedSlice = cached.slice(offset, offset + limit);
    expect(users).toEqual(expectedSlice);
  });

  it('should return cached top users when already set', async () => {
    const mockUsers = Array.from({ length: 50 }, (_, i) => ({
      user_id: i + 1,
      username: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      bookmark_count: 50 - i,
    }));
    cacheService.setCache(TOP_BOOKMARKING_USERS_CACHE_KEY, mockUsers, 600);

    const page = 2;
    const limit = 10;
    const expected = mockUsers.slice(10, 20);

    const result = await analyticsService.getTopBookmarkingUsers(page, limit);
    expect(result).toEqual(expected);
  });

  /** ✅ Cache Expiration & Regeneration */
  it('should fetch fresh data after cache expires', async () => {
    const oldData = Array.from({ length: 50 }, (_, i) => ({
      article_id: i + 1,
      title: `Old Cached Article ${i + 1}`,
      bookmark_count: 1,
    }));
    cacheService.setCache(MOST_BOOKMARKED_CACHE_KEY, oldData, 1);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const fresh = await analyticsService.getMostBookmarkedArticles(1, 5);
    expect(fresh).not.toEqual(oldData.slice(0, 5));
  });
});
