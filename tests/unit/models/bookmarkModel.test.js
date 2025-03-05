import bcrypt from 'bcrypt';
import { Model } from 'objection';
import knex from '../../../src/config/db.js';
import Article from '../../../src/models/Article.js';
import Bookmark from '../../../src/models/Bookmark.js';
import User from '../../../src/models/User.js';

Model.knex(knex);

let user, article;

beforeEach(async () => {
  await knex('user_bookmarks').del();
  await knex('articles').del();
  await knex('users').del();

  // ✅ Create a test user and article once before each test
  user = await User.query().insert({
    username: 'testuser',
    email: 'test@example.com',
    password_hash: await bcrypt.hash('Password123!', 10),
  });

  article = await Article.query().insert({
    title: 'SpaceX Launches Starship',
    url: 'https://spacex.com/news',
    published_at: new Date().toISOString(),
  });
});

afterAll(async () => {
  await knex.destroy();
});

describe('Bookmark Model', () => {
  it('should create a bookmark entry', async () => {
    const bookmark = await Bookmark.query().insert({
      user_id: user.id,
      article_id: article.id,
    });

    const storedBookmark = await Bookmark.query().findById(bookmark.id);
    expect(storedBookmark).not.toBeNull();
    expect(storedBookmark.userId).toBe(user.id);
    expect(storedBookmark.articleId).toBe(article.id);
    expect(storedBookmark.bookmarkedAt).toBeDefined();
  });

  it('should enforce unique user-article bookmark constraint', async () => {
    await Bookmark.query().insert({ user_id: user.id, article_id: article.id });

    await expect(
      Bookmark.query().insert({ user_id: user.id, article_id: article.id })
    ).rejects.toThrow(/duplicate key value violates unique constraint/);
  });

  it('should delete bookmarks when the associated user is deleted', async () => {
    const bookmark = await Bookmark.query().insert({
      user_id: user.id,
      article_id: article.id,
    });

    await user.$query().delete();

    const storedBookmark = await Bookmark.query().findById(bookmark.id);
    expect(storedBookmark).toBeUndefined();
  });

  it('should delete bookmarks when the associated article is deleted', async () => {
    const bookmark = await Bookmark.query().insert({
      user_id: user.id,
      article_id: article.id,
    });

    await article.$query().delete();

    const storedBookmark = await Bookmark.query().findById(bookmark.id);
    expect(storedBookmark).toBeUndefined();
  });

  it('should fetch bookmarked articles with user & article details using withGraphFetched()', async () => {
    await Bookmark.query().insert({
      user_id: user.id,
      article_id: article.id,
    });

    const bookmarkWithRelations = await Bookmark.query()
      .withGraphJoined('[user, article]')
      .first();
    expect(bookmarkWithRelations).not.toBeNull();
    expect(bookmarkWithRelations.user.id).toBe(user.id);
    expect(bookmarkWithRelations.article.id).toBe(article.id);
    expect(bookmarkWithRelations.article.title).toBe(
      'SpaceX Launches Starship'
    );
    expect(bookmarkWithRelations.bookmarkedAt).toBeDefined();
  });
});
