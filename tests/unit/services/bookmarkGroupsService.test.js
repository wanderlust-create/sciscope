import knex from '../../../src/config/db.js';
import * as service from '../../../src/services/bookmarkGroupsService.js';
import BookmarkGroup from '../../../src/models/BookmarkGroup.js';
import User from '../../../src/models/User.js';
import Bookmark from '../../../src/models/Bookmark.js';
import Article from '../../../src/models/Article.js';

let user;

beforeAll(async () => {
  await knex.migrate.latest();
  await knex.seed.run();

  user = await User.query().whereNotNull('password_hash').first();
});

afterAll(async () => {
  await knex.destroy();
});

describe('bookmarkGroupsService', () => {
  it('creates a bookmark group', async () => {
    const group = await service.createBookmarkGroup(user.id, 'Test Group');
    expect(group).toHaveProperty('id');
    expect(group).toHaveProperty('group_name', 'Test Group');
  });

  it('throws error if group name already exists', async () => {
    await service.createBookmarkGroup(user.id, 'Existing Group');

    await expect(
      service.createBookmarkGroup(user.id, 'Existing Group')
    ).rejects.toThrow('already exists');
  });

  it('fetches all groups for a user', async () => {
    const groups = await service.getUserBookmarkGroups(user.id);
    expect(Array.isArray(groups)).toBe(true);
    expect(groups.length).toBeGreaterThan(0);
  });

  it('gets a group with bookmarks and articles', async () => {
    const group = await BookmarkGroup.query()
      .where({ user_id: user.id })
      .first();
    const result = await service.getBookmarkGroupWithArticles(
      user.id,
      group.id
    );
    expect(result).toHaveProperty('bookmarks');
  });

  it('updates a group name', async () => {
    const group = await BookmarkGroup.query().insert({
      user_id: user.id,
      group_name: 'To Rename',
    });

    const updated = await service.updateBookmarkGroup(
      user.id,
      group.id,
      'Renamed'
    );
    expect(updated.group_name).toBe('Renamed');
  });

  it('deletes a group', async () => {
    const group = await BookmarkGroup.query().insert({
      user_id: user.id,
      group_name: 'To Delete',
    });

    const result = await service.deleteBookmarkGroup(user.id, group.id);
    expect(result).toEqual({ success: true });
  });
});
describe('📎 Bookmark ↔ Bookmark Group Assignment Logic', () => {
  let user, group, article1, article2, bookmark1, bookmark2;

  beforeAll(async () => {
    await knex.migrate.latest();
    await knex.seed.run();

    user = await User.query().whereNotNull('password_hash').first();

    group = await service.createBookmarkGroup(user.id, 'Test Group');

    article1 = await Article.query().insert({
      title: 'Fresh Article 1',
      url: 'https://example.com/article-1',
      published_at: new Date().toISOString(),
    });

    article2 = await Article.query().insert({
      title: 'Fresh Article 2',
      url: 'https://example.com/article-2',
      published_at: new Date().toISOString(),
    });

    bookmark1 = await Bookmark.query().insert({
      user_id: user.id,
      article_id: article1.id,
    });

    bookmark2 = await Bookmark.query().insert({
      user_id: user.id,
      article_id: article2.id,
    });

    // Pre-assign one bookmark to test duplicate removal
    await service.addBookmarkToGroup(user.id, group.id, bookmark2.id);
  });

  it('adds a bookmark to a group', async () => {
    const result = await service.addBookmarkToGroup(
      user.id,
      group.id,
      bookmark1.id
    );

    expect(result).toHaveProperty('success', true);
    const assignments = await knex('bookmark_group_assignments').where({
      user_bookmark_id: bookmark1.id,
      bookmark_group_id: group.id,
    });

    expect(assignments.length).toBe(1);
  });

  it('prevents duplicate group assignment', async () => {
    const result = await service.addBookmarkToGroup(
      user.id,
      group.id,
      bookmark2.id
    );
    expect(result).toHaveProperty('alreadyAssigned', true);
  });

  it('removes a bookmark from a group', async () => {
    const result = await service.removeBookmarkFromGroup(
      user.id,
      group.id,
      bookmark1.id
    );
    expect(result).toHaveProperty('success', true);
  });

  it('throws if user does not own group or bookmark', async () => {
    expect.assertions(2);

    await expect(
      service.addBookmarkToGroup(9999, group.id, bookmark1.id)
    ).rejects.toThrow('Unauthorized');

    await expect(
      service.removeBookmarkFromGroup(9999, group.id, bookmark1.id)
    ).rejects.toThrow('Unauthorized');
  });
});
