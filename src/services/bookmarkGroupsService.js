import BookmarkGroup from '../models/BookmarkGroup.js';

/**
 * Creates a new bookmark group for the specified user.
 *
 * @param {number} userId - ID of the user creating the group.
 * @param {string} groupName - Name of the new bookmark group.
 * @returns {Promise<Object>} The created bookmark group.
 * @throws {Error} If a group with the same name already exists.
 */
export async function createBookmarkGroup(userId, groupName) {
  const existing = await BookmarkGroup.query()
    .where({ user_id: userId, group_name: groupName })
    .first();

  if (existing) {
    throw new Error('Bookmark group already exists.');
  }

  return await BookmarkGroup.query().insert({
    user_id: userId,
    group_name: groupName,
  });
}

/**
 * Retrieves all bookmark groups belonging to a specific user.
 *
 * @param {number} userId - ID of the user whose groups to fetch.
 * @returns {Promise<Object[]>} List of bookmark groups.
 */
export async function getUserBookmarkGroups(userId) {
  return await BookmarkGroup.query().where({ user_id: userId });
}

/**
 * Retrieves a single bookmark group along with its bookmarks and related articles.
 *
 * @param {number} userId - ID of the user requesting the group.
 * @param {number} groupId - ID of the bookmark group.
 * @returns {Promise<Object|null>} The bookmark group with bookmarks and articles, or null if not found.
 */
export async function getBookmarkGroupWithArticles(userId, groupId) {
  return await BookmarkGroup.query()
    .where({ id: groupId, user_id: userId })
    .withGraphFetched('bookmarks.article')
    .first();
}

/**
 * Updates the name of a bookmark group for a specific user.
 *
 * @param {number} userId - ID of the user who owns the group.
 * @param {number} groupId - ID of the group to update.
 * @param {string} newName - New name for the group.
 * @returns {Promise<Object>} The updated bookmark group.
 * @throws {Error} If a group with the same name already exists or the group is unauthorized.
 */
export async function updateBookmarkGroup(userId, groupId, newName) {
  const duplicate = await BookmarkGroup.query()
    .where({ user_id: userId, group_name: newName })
    .whereNot('id', groupId)
    .first();

  if (duplicate) {
    throw new Error('Group name already in use');
  }

  const group = await BookmarkGroup.query()
    .findById(groupId)
    .where('user_id', userId);

  if (!group) {
    throw new Error('Bookmark group not found or unauthorized');
  }

  return await group.$query().patchAndFetch({ group_name: newName });
}

/**
 * Deletes a bookmark group belonging to a user.
 *
 * @param {number} userId - ID of the user attempting deletion.
 * @param {number} groupId - ID of the group to delete.
 * @returns {Promise<Object>} Success confirmation.
 * @throws {Error} If the group is not found or unauthorized.
 */
export async function deleteBookmarkGroup(userId, groupId) {
  const group = await BookmarkGroup.query()
    .findById(groupId)
    .where('user_id', userId);

  if (!group) {
    throw new Error('Bookmark group not found or unauthorized.');
  }

  await group.$query().delete();
  return { success: true };
}
