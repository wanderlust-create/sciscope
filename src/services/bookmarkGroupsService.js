import BookmarkGroup from '../models/BookmarkGroup.js';
import db from '../config/db.js';
import logger from '../loaders/logger.js';

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
    .where({ userId, group_name: groupName })
    .first();
  if (existing) {
    logger.warn(
      `🚫 Duplicate group creation attempt by user ${userId}: "${groupName}"`
    );
    throw new Error('Bookmark group already exists.');
  }
  const newGroup = await BookmarkGroup.query().insert({
    userId,
    group_name: groupName,
  });

  logger.info(
    `✅ Created new bookmark group [${newGroup.id}] for user ${userId}`
  );
  return newGroup;
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
  const group = await BookmarkGroup.query()
    .where({ id: groupId, user_id: userId })
    .withGraphFetched('bookmarks.article')
    .first();

  if (!group) {
    logger.warn(
      `❌ User ${userId} attempted to access unauthorized or missing group ${groupId}`
    );
  } else {
    logger.info(
      `📚 Retrieved group ${groupId} with articles for user ${userId}`
    );
  }

  return group;
}

export async function findGroupByIdAndUser(groupId, userId) {
  return BookmarkGroup.query().findOne({ id: groupId, user_id: userId });
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
    logger.warn(
      `⚠️ Duplicate name "${newName}" for user ${userId} while updating group ${groupId}`
    );
    throw new Error('Group name already in use');
  }

  const group = await BookmarkGroup.query()
    .findById(groupId)
    .where('user_id', userId);

  if (!group) {
    logger.warn(
      `❌ Unauthorized group update attempt by user ${userId} on group ${groupId}`
    );
    throw new Error('Bookmark group not found or unauthorized');
  }
  const updated = await group.$query().patchAndFetch({ group_name: newName });
  logger.info(
    `✏️ Updated group ${groupId} name to "${newName}" by user ${userId}`
  );
  return updated;
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
    logger.warn(
      `❌ Unauthorized delete attempt by user ${userId} on group ${groupId}`
    );
    throw new Error('Bookmark group not found or unauthorized.');
  }

  await group.$query().delete();
  logger.info(`🗑️ Deleted group ${groupId} for user ${userId}`);
  return { success: true };
}

/**
 * Assigns a bookmark to a bookmark group (if user owns both).
 *
 * @param {number} userId - ID of the user requesting the group.
 * @param {number} groupId - ID of the bookmark group.
 * @param {number} bookmarkId - ID of the bookmark.
 * @returns {Promise<Object>} Success confirmation or existing assignment.
 * @throws {Error} If the group or bookmark is unauthorized or missing.
 */
export async function addBookmarkToGroup(userId, groupId, bookmarkId) {
  const [group, bookmark] = await Promise.all([
    db('bookmark_groups').where({ id: groupId, user_id: userId }).first(),
    db('user_bookmarks').where({ id: bookmarkId, user_id: userId }).first(),
  ]);

  if (!group || !bookmark) {
    logger.warn(
      `❌ Unauthorized assignment attempt by user ${userId}: group ${groupId}, bookmark ${bookmarkId}`
    );
    throw new Error('Unauthorized or missing group/bookmark');
  }

  const exists = await db('bookmark_group_assignments')
    .where({ bookmark_group_id: groupId, user_bookmark_id: bookmarkId })
    .first();

  if (exists) {
    logger.info(
      `ℹ️ Bookmark ${bookmarkId} already assigned to group ${groupId}`
    );
    return { alreadyAssigned: true };
  }
  await db('bookmark_group_assignments').insert({
    bookmark_group_id: groupId,
    user_bookmark_id: bookmarkId,
  });

  logger.info(
    `➕ Bookmark ${bookmarkId} assigned to group ${groupId} by user ${userId}`
  );
  return { success: true };
}

export async function isBookmarkInGroup(bookmarkId, groupId) {
  return await db('bookmark_group_assignments')
    .where({
      user_bookmark_id: bookmarkId,
      bookmark_group_id: groupId,
    })
    .first();
}

/**
 * Removes a bookmark from a group (if user owns both).
 *
 * @param {number} userId - ID of the user requesting the group.
 * @param {number} groupId - ID of the bookmark group.
 * @param {number} bookmarkId - ID of the bookmark.
 * @returns {Promise<Object>} Success confirmation.
 * @throws {Error} If the group or bookmark is unauthorized or missing.
 */
export async function removeBookmarkFromGroup(userId, groupId, bookmarkId) {
  const [group, bookmark] = await Promise.all([
    db('bookmark_groups').where({ id: groupId, user_id: userId }).first(),
    db('user_bookmarks').where({ id: bookmarkId, user_id: userId }).first(),
  ]);

  if (!group || !bookmark) {
    logger.warn(
      `❌ Unauthorized removal attempt by user ${userId}: group ${groupId}, bookmark ${bookmarkId}`
    );
    throw new Error('Unauthorized or missing group/bookmark');
  }

  await db('bookmark_group_assignments')
    .where({
      bookmark_group_id: groupId,
      user_bookmark_id: bookmarkId,
    })
    .del();

  logger.info(
    `➖ Bookmark ${bookmarkId} removed from group ${groupId} by user ${userId}`
  );
  return { success: true };
}
