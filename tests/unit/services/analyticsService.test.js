import knex from '../../../src/config/db.js';
import analyticsService from '../../../src/services/analyticsService.js';
import cacheService from '../../../src/services/cacheService.js';
import { execSync } from 'child_process';

const MOST_BOOKMARKED_CACHE_KEY = 'most_bookmarked_articles';
const TOP_BOOKMARKING_USERS_CACHE_KEY = 'top_bookmarking_users';

beforeAll(async () => {
  console.log('🚀 Resetting and seeding the test database...');
  execSync('NODE_ENV=test node scripts/resetAndSeedTestDatabase.js', {
    stdio: 'inherit',
  });
});

afterAll(async () => {
  const currentDb = await knex.raw('SELECT current_database();');
  console.log(
    `🛑 Closing connection to: ${currentDb.rows[0].current_database}`
  );
  await knex.destroy();
});

describe('🔎 Bookmark Analytics Queries (with Caching)', () => {
  beforeEach(() => {
    cacheService.flushCache(); // Clear cache before each test
  });

  /** ✅ Most Bookmarked Articles Tests */
  it('should return the most bookmarked articles in descending order & cache the result', async () => {
    const articles = await analyticsService.getMostBookmarkedArticles(5);

    expect(articles).toBeInstanceOf(Array);
    expect(articles.length).toBeGreaterThan(0);

    // ✅ Ensure articles are sorted by bookmark count
    for (let i = 1; i < articles.length; i++) {
      expect(Number(articles[i - 1].bookmark_count)).toBeGreaterThanOrEqual(
        Number(articles[i].bookmark_count)
      );
    }

    // ✅ Cache should now contain the result
    const cachedArticles = cacheService.getCache(MOST_BOOKMARKED_CACHE_KEY);
    expect(cachedArticles).toEqual(articles);
  });

  it('should return cached results for most bookmarked articles', async () => {
    cacheService.setCache(
      MOST_BOOKMARKED_CACHE_KEY,
      [{ id: 1, title: 'Cached Article' }],
      600
    );

    const articles = await analyticsService.getMostBookmarkedArticles(5);
    expect(articles).toEqual([{ id: 1, title: 'Cached Article' }]);
  });

  /** ✅ Top Bookmarking Users Tests */
  it('should return the top bookmarking users in descending order & cache the result', async () => {
    const users = await analyticsService.getTopBookmarkingUsers(5);

    expect(users).toBeInstanceOf(Array);
    expect(users.length).toBeGreaterThan(0);

    // ✅ Ensure users are sorted by bookmark count
    for (let i = 1; i < users.length; i++) {
      expect(Number(users[i - 1].bookmark_count)).toBeGreaterThanOrEqual(
        Number(users[i].bookmark_count)
      );
    }

    // ✅ Cache should now contain the result
    const cachedUsers = cacheService.getCache(TOP_BOOKMARKING_USERS_CACHE_KEY);
    expect(cachedUsers).toEqual(users);
  });

  it('should return cached results for top bookmarking users', async () => {
    cacheService.setCache(
      TOP_BOOKMARKING_USERS_CACHE_KEY,
      [{ id: 2, username: 'Cached User' }],
      600
    );

    const users = await analyticsService.getTopBookmarkingUsers(5);
    expect(users).toEqual([{ id: 2, username: 'Cached User' }]);
  });

  /** ✅ Cache Expiration & Regeneration */
  it('should fetch fresh data after cache expires', async () => {
    cacheService.setCache(
      MOST_BOOKMARKED_CACHE_KEY,
      [{ id: 3, title: 'Old Cached Article' }],
      1
    );
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const articles = await analyticsService.getMostBookmarkedArticles(5);
    expect(articles).not.toEqual([{ id: 3, title: 'Old Cached Article' }]);
  });
});
