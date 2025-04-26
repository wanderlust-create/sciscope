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
  article1 = await Article.query().insert({
    title: 'New Article 1',
    url: 'https://example.com/new-article-1',
    published_at: new Date().toISOString(),
  });

  article2 = await Article.query().insert({
    title: 'New Article 2',
    url: 'https://example.com/new-article-2',
    published_at: new Date().toISOString(),
  });
});

afterAll(async () => {
  await knex.destroy();
});

describe('🔖 bookmarkService', () => {
  it('creates a new bookmark', async () => {
    const result = await service.createBookmark(user.id, article1.id);

    expect(result).toHaveProperty('userId', user.id);
    expect(result).toHaveProperty('articleId', article1.id);
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
