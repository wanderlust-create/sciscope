import db from '../config/db.js';
import logger from '../loaders/logger.js';

/**
 * Retrieves a single article from the database by ID.
 * @param {number} id - The article ID.
 * @returns {Promise<Object|null>} - The article or null if not found.
 */
export async function getArticleById(id) {
  try {
    const article = await db('articles').where({ id }).first();
    return article || null;
  } catch (error) {
    logger.error(`❌ Error fetching article by ID: ${error.message}`, {
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Fetches recent articles from the database with optional age filtering and in-memory pagination.
 * @param {number|null} maxAgeHours - Maximum age of articles in hours (null for no filter).
 * @param {number} page - The requested page number.
 * @param {number} limit - The number of articles per page.
 * @returns {Promise<Object>} - Paginated recent articles.
 */
export async function fetchRecentArticles(
  maxAgeHours = null,
  page = 1,
  limit = 10
) {
  try {
    // Fetch ALL matching articles in one DB call
    let query = db('articles').orderBy('published_at', 'desc');

    if (maxAgeHours) {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - maxAgeHours);
      query = query.where('published_at', '>=', cutoffTime);
    }

    const allResults = await query;

    // Cap total results at 100
    const totalResults = allResults.length;
    const cappedTotal = Math.min(totalResults, 100);

    // Paginate results in-memory
    const validPage = Math.max(1, parseInt(page, 10) || 1);
    const validLimit = Math.max(1, parseInt(limit, 10) || 10);
    const offset = (validPage - 1) * validLimit;

    const paginatedResults = allResults.slice(offset, offset + validLimit);

    return {
      total_count: cappedTotal,
      total_pages: Math.ceil(cappedTotal / validLimit),
      current_page: validPage,
      articles: paginatedResults,
    };
  } catch (error) {
    logger.error(`❌ Error fetching recent articles: ${error.message}`, {
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Searches for articles in the database using a case-insensitive match.
 * @param {string} keyword - The search keyword(s).
 * @param {number} page - Page number for pagination.
 * @param {number} limit - Number of articles per page.
 * @returns {Promise<Object>} - Paginated search results.
 */
export async function searchArticlesInDB(keyword, page = 1, limit = 10) {
  if (!keyword) {
    throw new Error('Keyword is required for searching articles.');
  }

  try {
    // Fetch ALL matching articles
    const allResults = await db('articles')
      .where('title', 'ILIKE', `%${keyword}%`)
      .orWhere('description', 'ILIKE', `%${keyword}%`)
      .orWhere('content', 'ILIKE', `%${keyword}%`)
      .orderBy('published_at', 'desc');

    // Cap total results at 100
    const totalResults = allResults.length;
    const cappedTotal = Math.min(totalResults, 100);

    // Paginate results in-memory
    const validPage = Math.max(1, parseInt(page, 10) || 1);
    const validLimit = Math.max(1, parseInt(limit, 10) || 10);
    const offset = (validPage - 1) * validLimit;

    const paginatedResults = allResults.slice(offset, offset + validLimit);

    return {
      total_count: cappedTotal,
      total_pages: Math.ceil(cappedTotal / validLimit),
      current_page: validPage,
      articles: paginatedResults,
    };
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

export default {
  searchArticlesInDB,
  storeArticlesInDB,
  getArticleById,
  fetchRecentArticles,
};
