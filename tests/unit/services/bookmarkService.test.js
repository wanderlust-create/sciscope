// tests/unit/services/bookmarkService.test.js
import knex from '../../../src/config/db.js';
import Article from '../../../src/models/Article.js';
import User from '../../../src/models/User.js';
import * as service from '../../../src/services/bookmarkService.js';

let user, article1, article2;

beforeAll(async () => {
  await knex.migrate.latest();
  await knex.seed.run();

  user = await User.query().whereNotNull('password_hash').first();
  const articles = await Article.query().limit(2);
  article1 = articles[0];
  article2 = articles[1];
});

afterAll(async () => {
  await knex.destroy();
});

describe('🔖 bookmarkService', () => {
  it('creates a new bookmark', async () => {
    const result = await service.createBookmark(user.id, article1.id);

    expect(result).toHaveProperty('user_id', user.id);
    expect(result).toHaveProperty('article_id', article1.id);
  });

  it('prevents duplicate bookmarks', async () => {
    await expect(service.createBookmark(user.id, article1.id)).rejects.toThrow(
      /already bookmarked/
    );
  });

  it('fetches paginated bookmarks', async () => {
    const { bookmarks, total } = await service.getBookmarks(user.id, 1, 10);

    expect(Array.isArray(bookmarks)).toBe(true);
    expect(typeof total).toBe('number');
  });

  it('deletes a bookmark', async () => {
    const newBookmark = await service.createBookmark(user.id, article2.id);
    const success = await service.deleteBookmark(newBookmark.id, user.id);

    expect(success).toBe(true);
  });

  it('returns false when deleting a non-existent or unauthorized bookmark', async () => {
    const result = await service.deleteBookmark(99999, user.id);
    expect(result).toBe(false);
  });
});
