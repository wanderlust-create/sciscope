import knex from '../../src/config/db.js';
import Bookmark from '../../src/models/Bookmark.js';
import User from '../../src/models/User.js';
import Article from '../../src/models/Article.js';

async function debugRelations() {
  try {
    const allUsers = await User.query();
    const allArticles = await Article.query();
    const allBookmarks = await Bookmark.query();

    console.log('🔹 All Users:', allUsers);
    console.log('🔹 All Articles:', allArticles);
    console.log('🔹 All Bookmarks:', allBookmarks);

    const bookmarkWithRelations = await Bookmark.query()
      .withGraphFetched('[user, article]')
      .first();

    console.log('🔹 Bookmark with Relations:', bookmarkWithRelations);
  } catch (error) {
    console.error('❌ Error fetching relations:', error);
  } finally {
    await knex.destroy();
  }
}

debugRelations();
