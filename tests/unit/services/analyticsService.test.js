import knex from '../../../src/config/db.js';
import analyticsService from '../../../src/services/analyticsService.js';
import cacheService from '../../../src/services/cacheService.js';
import { execSync } from 'child_process';

const MOST_BOOKMARKED_CACHE_KEY = 'most_bookmarked_articles_page1_limit5';
const TOP_BOOKMARKING_USERS_CACHE_KEY = 'top_bookmarking_users_page1_limit5';

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
    const articles = await analyticsService.getMostBookmarkedArticles(1, 5);

    expect(articles).toBeInstanceOf(Array);
    expect(articles.length).toBeGreaterThan(0);

    for (let i = 1; i < articles.length; i++) {
      expect(Number(articles[i - 1].bookmark_count)).toBeGreaterThanOrEqual(
        Number(articles[i].bookmark_count)
      );
    }

    const cachedArticles = cacheService.getCache(MOST_BOOKMARKED_CACHE_KEY);
    expect(cachedArticles).toEqual(articles);
  });

  it('should return cached results for most bookmarked articles', async () => {
    const mockData = [
      { article_id: 1, title: 'Cached Article', bookmark_count: 99 },
    ];
    cacheService.setCache(MOST_BOOKMARKED_CACHE_KEY, mockData, 600);

    const articles = await analyticsService.getMostBookmarkedArticles(1, 5);
    expect(articles).toEqual(mockData);
  });

  /** ✅ Top Bookmarking Users Tests */
  it('should return the top bookmarking users in descending order & cache the result', async () => {
    const users = await analyticsService.getTopBookmarkingUsers(1, 5);

    expect(users).toBeInstanceOf(Array);
    expect(users.length).toBeGreaterThan(0);

    for (let i = 1; i < users.length; i++) {
      expect(Number(users[i - 1].bookmark_count)).toBeGreaterThanOrEqual(
        Number(users[i].bookmark_count)
      );
    }

    const cachedUsers = cacheService.getCache(TOP_BOOKMARKING_USERS_CACHE_KEY);
    expect(cachedUsers).toEqual(users);
  });

  it('should return cached results for top bookmarking users', async () => {
    const mockData = [
      { user_id: 2, username: 'Cached User', bookmark_count: 42 },
    ];
    cacheService.setCache(TOP_BOOKMARKING_USERS_CACHE_KEY, mockData, 600);

    const users = await analyticsService.getTopBookmarkingUsers(1, 5);
    expect(users).toEqual(mockData);
  });

  /** ✅ Cache Expiration & Regeneration */
  it('should fetch fresh data after cache expires', async () => {
    const oldData = [
      { article_id: 3, title: 'Old Cached Article', bookmark_count: 1 },
    ];
    cacheService.setCache(MOST_BOOKMARKED_CACHE_KEY, oldData, 1);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const articles = await analyticsService.getMostBookmarkedArticles(1, 5);
    expect(articles).not.toEqual(oldData);
  });
});
