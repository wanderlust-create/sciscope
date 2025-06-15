import { Model } from 'objection';
import knex from '../../../src/config/db.js';
import BookmarkGroup from '../../../src/models/BookmarkGroup.js';
import User from '../../../src/models/User.js';

Model.knex(knex);

let user;

beforeEach(async () => {
  await knex('bookmark_groups').del();
  await knex('users').del();

  user = await User.query().insert({
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: 'hashedPassword123!',
  });
});

afterAll(async () => {
  await knex.destroy();
});

describe('BookmarkGroup Model', () => {
  it('should create a bookmark group', async () => {
    const group = await BookmarkGroup.query().insert({
      userId: user.id,
      groupName: 'Astrobiology',
    });

    const storedGroup = await BookmarkGroup.query().findById(group.id);
    expect(storedGroup).not.toBeNull();
    expect(storedGroup.groupName).toBe('Astrobiology');
    expect(storedGroup.userId).toBe(user.id);
  });

  it('should update a bookmark group name', async () => {
    const group = await BookmarkGroup.query().insert({
      userId: user.id,
      groupName: 'Old Name',
    });

    await group.$query().patch({ groupName: 'New Name' });

    const updatedGroup = await BookmarkGroup.query().findById(group.id);
    expect(updatedGroup.groupName).toBe('New Name');
  });

  it('should delete a bookmark group', async () => {
    const group = await BookmarkGroup.query().insert({
      userId: user.id,
      groupName: 'To Be Deleted',
    });

    await group.$query().delete();

    const storedGroup = await BookmarkGroup.query().findById(group.id);
    expect(storedGroup).toBeUndefined();
  });
});
