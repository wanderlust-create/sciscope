import knex from '../../../src/config/db.js';
import * as service from '../../../src/services/bookmarkGroupsService.js';
import BookmarkGroup from '../../../src/models/BookmarkGroup.js';
import User from '../../../src/models/User.js';

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
