import logger from '../loaders/logger.js';
import * as bookmarkGroupsService from '../services/bookmarkGroupsService.js';

/**
 * Fetches all bookmark groups for the logged-in user.
 *
 * @param {Object} req - Express request object with pagination query (expects `req.user.id`).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
export async function getBookmarkGroups(req, res) {
  try {
    const userId = req.user.id;
    const groups = await bookmarkGroupsService.getUserBookmarkGroups(userId);
    res.status(200).json(groups);
  } catch (error) {
    logger.error(`❌ Error fetching bookmark groups: ${error.message}`, {
      stack: error.stack,
    });
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Fetches a single bookmark group (with bookmarks and articles) for the logged-in user.
 *
 * @param {Object} req - Express request object with pagination query (expects `req.user.id` and `req.params.id`).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
export async function getBookmarkGroupWithArticles(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const group = await bookmarkGroupsService.getBookmarkGroupWithArticles(
      userId,
      id
    );

    if (!group) {
      return res.status(404).json({ error: 'Group not found or unauthorized' });
    }

    res.status(200).json(group);
  } catch (error) {
    logger.error(`❌ Error fetching group with articles: ${error.message}`, {
      stack: error.stack,
    });
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Creates a new bookmark group for the logged-in user.
 *
 * @param {Object} req - Express request object with pagination query (expects `req.user.id` and `req.body.group_name`).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
export async function createBookmarkGroup(req, res) {
  try {
    const userId = req.user.id;
    const { group_name } = req.body;

    if (!group_name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const group = await bookmarkGroupsService.createBookmarkGroup(
      userId,
      group_name
    );

    res.status(201).json(group);
  } catch (error) {
    logger.error(`❌ Error creating bookmark group: ${error.message}`, {
      stack: error.stack,
    });

    if (error.message.includes('already exists')) {
      return res
        .status(400)
        .json({ error: 'Bookmark group with that name already exists' });
    }

    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Updates the name of an existing bookmark group for the logged-in user.
 *
 * @param {Object} req - Express request object with pagination query (expects `req.user.id`, `req.params.id`, and `req.body.group_name`).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
export async function updateBookmarkGroup(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { group_name } = req.body;

    if (!group_name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const updated = await bookmarkGroupsService.updateBookmarkGroup(
      userId,
      id,
      group_name
    );

    res.status(200).json(updated);
  } catch (error) {
    logger.error(`❌ Error updating bookmark group: ${error.message}`, {
      stack: error.stack,
    });

    if (
      error.message.includes('unauthorized') ||
      error.message.includes('not found')
    ) {
      return res.status(404).json({ error: 'Group not found or unauthorized' });
    }

    if (error.message.includes('already in use')) {
      return res.status(400).json({ error: 'Group name already exists' });
    }

    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Deletes a bookmark group for the logged-in user.
 *
 * @param {Object} req - Express request object with pagination query (expects `req.user.id` and `req.params.id`).
 * @param {Object} res - Express response object.
 * @returns {Promise<void>}
 */
export async function deleteBookmarkGroup(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Group ID is required' });
    }

    await bookmarkGroupsService.deleteBookmarkGroup(userId, id);

    res.status(204).send();
  } catch (error) {
    logger.error(`❌ Error deleting bookmark group: ${error.message}`, {
      stack: error.stack,
    });

    if (
      error.message.includes('not found') ||
      error.message.includes('unauthorized')
    ) {
      return res.status(404).json({ error: 'Group not found or unauthorized' });
    }

    res.status(500).json({ error: 'Internal Server Error' });
  }
}
export async function addBookmarkToGroup(req, res) {
  try {
    const userId = req.user.id;
    const { groupId, bookmarkId } = req.params;

    const result = await bookmarkGroupsService.addBookmarkToGroup(
      userId,
      groupId,
      bookmarkId
    );

    if (result.alreadyAssigned) {
      return res.status(400).json({ error: 'Bookmark already in this group' });
    }

    res.status(201).json({ message: 'Bookmark added to group' });
  } catch (error) {
    logger.error(`❌ Add bookmark to group failed: ${error.message}`, {
      stack: error.stack,
    });
    res.status(400).json({ error: error.message });
  }
}

export async function removeBookmarkFromGroup(req, res) {
  try {
    const userId = req.user.id;
    const { groupId, bookmarkId } = req.params;

    await bookmarkGroupsService.removeBookmarkFromGroup(
      userId,
      groupId,
      bookmarkId
    );

    res.status(204).send();
  } catch (error) {
    logger.error(`❌ Remove bookmark from group failed: ${error.message}`, {
      stack: error.stack,
    });
    res.status(400).json({ error: error.message });
  }
}

export default {
  getBookmarkGroups,
  getBookmarkGroupWithArticles,
  createBookmarkGroup,
  updateBookmarkGroup,
  deleteBookmarkGroup,
  addBookmarkToGroup,
  removeBookmarkFromGroup,
};
