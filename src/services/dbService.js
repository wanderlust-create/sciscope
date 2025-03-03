import db from '../config/db.js';
import logger from '../loaders/logger.js';

/**
 * Retrieves recent articles from the database, optionally filtering by age.
 * @param {number} [maxAgeHours] - Optional: Maximum article age in hours.
 * @param {number} [limit=10] - Optional: Number of articles to return (default: 10).
 * @returns {Promise<Object[]>} - List of recent articles.
 */
export async function fetchRecentArticles(maxAgeHours = null, limit = 10) {
  try {
    let query = db('articles').orderBy('published_at', 'desc').limit(limit);

    if (maxAgeHours) {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - maxAgeHours);
      query = query.where('published_at', '>=', cutoffTime);
    }

    return await query;
  } catch (error) {
    logger.error(`❌ Error fetching recent articles: ${error.message}`, {
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Searches for articles in the database using a case-insensitive match.
 * @param {string} query - The search keyword(s).
 * @returns {Promise<Object[]>} - List of matching articles from the database.
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
 * Stores new articles in the database, ensuring no duplicates.
 * @param {Object} apiResponse - The response from the news API.
 */
export async function storeArticlesInDB(apiResponse) {
  const articles = apiResponse.articles;
  if (!articles || !Array.isArray(articles) || articles.length === 0) {
    logger.info('📭 No articles provided for insertion.');
    return;
  }

  try {
    // Retrieve the latest stored article's published date to prevent duplicate insertions
    const latestPublishedAt = await db('articles')
      .max('published_at as maxPublishedAt')
      .first()
      .then((res) =>
        res?.maxPublishedAt ? new Date(res.maxPublishedAt) : null
      );

    // Filter out older articles and format new ones
    const newArticles = filterNewArticles(articles, latestPublishedAt).map(
      formatArticle
    );

    if (!newArticles.length) {
      logger.info('📭 No new articles to insert.');
      return;
    }

    // Insert new articles into the database
    await insertArticles(newArticles);
    logger.info(`✅ Stored ${newArticles.length} new articles.`);
  } catch (error) {
    logger.error(`❌ Error fetching/storing articles: ${error.message}`);
  }
}

/**
 * Filters out articles that are already stored in the database.
 * @param {Object[]} articles - Raw articles from the API.
 * @param {Date|null} latestPublishedAt - Timestamp of the most recent stored article.
 * @returns {Object[]} - A list of new articles to store.
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
 * Formats API response articles to match the database schema.
 * @param {Object} article - Raw article from the API.
 * @returns {Object} - A formatted article ready for insertion.
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
 * Inserts new articles into the database while preventing duplicate URLs.
 * @param {Object[]} articles - Articles to insert.
 * @returns {Promise<void>}
 * @private
 */
function insertArticles(articles) {
  return db('articles').insert(articles).onConflict('url').merge();
}

export default { searchArticlesInDB, storeArticlesInDB };
