import knex from '../../../src/config/db.js';
import analyticsService from '../../../src/services/analyticsService.js';
import { execSync } from 'child_process';

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

describe('🔎 Bookmark Analytics Queries', () => {
  it('should return the most bookmarked articles in descending order', async () => {
    const topArticles = await analyticsService.getMostBookmarkedArticles(5);

    expect(topArticles).toBeInstanceOf(Array);
    expect(topArticles.length).toBeGreaterThan(0);

    // ✅ Ensure articles are sorted by bookmark count
    for (let i = 1; i < topArticles.length; i++) {
      expect(Number(topArticles[i - 1].bookmark_count)).toBeGreaterThanOrEqual(
        Number(topArticles[i].bookmark_count)
      );
    }
  });

  it('should return the most active users in descending order', async () => {
    const activeUsers = await analyticsService.getMostActiveUsers(5);

    expect(activeUsers).toBeInstanceOf(Array);
    expect(activeUsers.length).toBeGreaterThan(0);

    // ✅ Ensure users are sorted by bookmark count
    for (let i = 1; i < activeUsers.length; i++) {
      expect(Number(activeUsers[i - 1].bookmark_count)).toBeGreaterThanOrEqual(
        Number(activeUsers[i].bookmark_count)
      );
    }
  });
});
