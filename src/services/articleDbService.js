import db from '../config/db.js';
import logger from '../loaders/logger.js';

/**
 * Search for articles in the database.
 * @param {string} query - The search keyword(s).
 * @returns {Promise<Object[]>} Articles from the DB.
 */
export async function searchArticlesInDB(query) {
  if (!query) {
    throw new Error('Query is required for searching articles.');
  }
  try {
    return await db('articles')
      .where('title', 'ILIKE', `%${query}%`)
      .orWhere('description', 'ILIKE', `%${query}%`)
      .orWhere('content', 'ILIKE', `%${query}%`)
      .orderBy('published_at', 'desc')
      .limit(10);
  } catch (error) {
    logger.error(`❌ Error searching articles in DB: ${error.message}`);
    throw error;
  }
}

/**
 * Store articles in the database (avoiding duplicates).
 * @param {Object[]} articles - Articles to store.
 */
export async function storeArticlesInDB(apiResponse) {
  const articles = apiResponse.articles;

  if (!articles || !Array.isArray(articles) || articles.length === 0) {
    logger.info('📭 No articles provided for insertion.');
    return;
  }

  try {
    const latestPublishedAt = await db('articles')
      .max('published_at as maxPublishedAt')
      .first()
      .then((res) =>
        res?.maxPublishedAt ? new Date(res.maxPublishedAt) : null
      );

    const newArticles = filterNewArticles(articles, latestPublishedAt).map(
      formatArticle
    );

    if (!newArticles.length) {
      logger.info('📭 No new articles to insert.');
      return;
    }

    await insertArticles(newArticles);
    logger.info(`✅ Stored ${newArticles.length} new articles.`);
  } catch (error) {
    logger.error(`❌ Error fetching/storing articles: ${error.message}`);
  }
}

/**
 * Filters out articles that are not new (already exist in DB).
 * @param {Object[]} articles - Raw articles from API.
 * @param {Date|null} latestPublishedAt - Latest stored article timestamp.
 * @returns {Object[]} Filtered new articles.
 * @private
 */
function filterNewArticles(articles, latestPublishedAt) {
  return articles.filter(
    (article) =>
      article.url &&
      article.publishedAt &&
      (!latestPublishedAt || new Date(article.publishedAt) > latestPublishedAt)
  );
}

/**
 * Format API articles for database storage.
 * @param {Object} article - Raw article from API.
 * @returns {Object} Formatted article.
 * @private
 */
function formatArticle(article) {
  return {
    title: article.title,
    description: article.description || 'No description available',
    url: article.url,
    url_to_image: article.urlToImage || null,
    published_at: article.publishedAt,
    author_name: article.author || 'Unknown',
    source_name: article.source?.name || 'Unknown',
  };
}

/**
 * Inserts formatted articles into the database.
 * @param {Object[]} articles - Articles to insert.
 * @returns {Promise<void>}
 * @private
 */
function insertArticles(articles) {
  return db('articles').insert(articles).onConflict('url').merge();
}

export default { searchArticlesInDB, storeArticlesInDB };
