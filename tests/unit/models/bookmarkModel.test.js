import { Model } from 'objection';
import knex from '../../../src/config/db.js';
import {
  default as Article,
  default as Bookmark,
} from '../../../src/models/Bookmark.js';
import User from '../../../src/models/User.js';

Model.knex(knex);

beforeAll(async () => {
  await knex.migrate.latest(); // Ensure DB schema is up to date
});

afterEach(async () => {
  await knex('user_bookmarks').del();
  await knex('articles').del();
  await knex('users').del();
});

afterAll(async () => {
  await knex.destroy();
});

describe('Bookmark Model', () => {
  it('should create a bookmark entry', async () => {
    // Arrange: Insert user and article
    const user = await User.query().insert({
      username: 'testuser',
      email: 'test@example.com',
    });
    const article = await Article.query().insert({
      title: 'SpaceX Launches Starship',
      url: 'https://spacex.com/news',
    });

    // Act: Create a bookmark
    const bookmark = await Bookmark.query().insert({
      user_id: user.id,
      article_id: article.id,
    });

    // Assert: Check if bookmark is saved
    const storedBookmark = await Bookmark.query().findById(bookmark.id);
    expect(storedBookmark).not.toBeNull();
    expect(storedBookmark.user_id).toBe(user.id);
    expect(storedBookmark.article_id).toBe(article.id);
    expect(storedBookmark.bookmarked_at).toBeDefined();
  });

  it('should enforce unique user-article bookmark constraint', async () => {
    // Arrange: Insert user and article
    const user = await User.query().insert({
      username: 'uniqueuser',
      email: 'unique@example.com',
    });
    const article = await Article.query().insert({
      title: 'NASA Discovers Exoplanet',
      url: 'https://nasa.gov/news',
    });

    // Act: Insert the same bookmark twice
    await Bookmark.query().insert({ user_id: user.id, article_id: article.id });

    // Assert: Second insert should fail due to unique constraint
    await expect(
      Bookmark.query().insert({ user_id: user.id, article_id: article.id })
    ).rejects.toThrow(/duplicate key value violates unique constraint/);
  });

  it('should delete bookmarks when the associated user is deleted', async () => {
    // Arrange: Insert user, article, and bookmark
    const user = await User.query().insert({
      username: 'deleteuser',
      email: 'delete@example.com',
    });
    const article = await Article.query().insert({
      title: 'AI Breakthrough',
      url: 'https://technews.com/ai',
    });
    const bookmark = await Bookmark.query().insert({
      user_id: user.id,
      article_id: article.id,
    });

    // Act: Delete the user
    await user.$query().delete();

    // Assert: Bookmark should also be deleted
    const storedBookmark = await Bookmark.query().findById(bookmark.id);
    expect(storedBookmark).toBeNull();
  });

  it('should delete bookmarks when the associated article is deleted', async () => {
    // Arrange: Insert user, article, and bookmark
    const user = await User.query().insert({
      username: 'keepuser',
      email: 'keep@example.com',
    });
    const article = await Article.query().insert({
      title: 'Quantum Computing Advances',
      url: 'https://science.com/quantum',
    });
    const bookmark = await Bookmark.query().insert({
      user_id: user.id,
      article_id: article.id,
    });

    // Act: Delete the article
    await article.$query().delete();

    // Assert: Bookmark should also be deleted
    const storedBookmark = await Bookmark.query().findById(bookmark.id);
    expect(storedBookmark).toBeNull();
  });

  it('should fetch bookmarked articles with user & article details using withGraphFetched()', async () => {
    // Arrange: Insert user and article
    const user = await User.query().insert({
      username: 'fetchuser',
      email: 'fetch@example.com',
    });
    const article = await Article.query().insert({
      title: 'Mars Rover Discovers Ice',
      url: 'https://marsnews.com/rover',
    });

    await Bookmark.query().insert({ user_id: user.id, article_id: article.id });

    // Act: Fetch the bookmark with related user & article
    const bookmarkWithRelations = await Bookmark.query()
      .withGraphFetched('[user, article]')
      .where('user_id', user.id)
      .first();

    // Assert: Ensure relations are loaded correctly
    expect(bookmarkWithRelations).not.toBeNull();
    expect(bookmarkWithRelations.user.id).toBe(user.id);
    expect(bookmarkWithRelations.article.id).toBe(article.id);
    expect(bookmarkWithRelations.article.title).toBe(
      'Mars Rover Discovers Ice'
    );
  });
});
