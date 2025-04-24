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
  maxAgeHours = 300, // Default: 12.5 days
  page = 1,
  limit = 10
) {
  try {
    // Calculate cutoff time
    const now = new Date();
    if (isNaN(maxAgeHours) || maxAgeHours <= 0) {
      throw new Error('Invalid maxAgeHours value');
    }

    const cutoffTime = new Date(now.getTime() - maxAgeHours * 60 * 60 * 1000);

    // Fetch filtered & paginated articles from DB
    const query = db('articles')
      .where('published_at', '>=', cutoffTime.toISOString()) // Filter by cutoff
      .orderBy('published_at', 'desc') // Sort newest first
      .limit(limit)
      .offset((Math.max(1, page) - 1) * limit); // SQL pagination

    const articles = await query;

    // Get total count (without pagination)
    const [{ count }] = await db('articles')
      .where('published_at', '>=', cutoffTime.toISOString())
      .count();

    const totalResults = parseInt(count, 10);
    const totalPages = Math.ceil(totalResults / limit);

    // Return structured response
    return {
      total_count: totalResults,
      total_pages: totalPages,
      current_page: page,
      articles,
    };
  } catch (error) {
    logger.error(`❌ Error fetching recent articles: ${error.message}`);
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
    // Retrieve the latest stored article's published date
    const latestPublishedAt = await db('articles')
      .max('published_at as maxPublishedAt')
      .first()
      .then((res) =>
        res?.maxPublishedAt ? new Date(res.maxPublishedAt) : null
      );

    // ✅ Remove duplicate URLs (keep only the first occurrence)
    const uniqueArticles = Object.values(
      articles.reduce((acc, article) => {
        acc[article.url] = article; // Uses URL as a unique key
        return acc;
      }, {})
    );

    if (uniqueArticles.length === 0) {
      logger.info('📭 No unique articles to insert.');
      return;
    }
    // ✅ Filter out older articles and format new ones
    const newArticles = filterNewArticles(
      uniqueArticles,
      latestPublishedAt,
      process.env.NODE_ENV === 'postman'
    ).map(formatArticle);

    if (!newArticles.length) {
      logger.info('📭 No new articles to insert.');
      return;
    }

    // ✅ Insert articles (all URLs are now unique)
    await insertArticles(newArticles);
    logger.info(`✅ Stored ${newArticles.length} new articles.`);
  } catch (error) {
    logger.error(`❌ Error fetching/storing articles: ${error.message}`);
  }
}

/**
 * Filters out articles that are too old or missing required fields.
 *
 * In production, this prevents inserting duplicate or outdated articles by comparing
 * each article's publishedAt date to the latest date already in the database.
 *
 * During testing (e.g. in Postman or automated tests), we often want predictable,
 * repeatable insert behavior — so the optional `bypass` flag disables the date check
 * and allows all valid articles through regardless of their publish time.
 *
 * @param {Array} articles - The array of article objects to filter
 * @param {Date|null} latestPublishedAt - The most recent publishedAt timestamp from DB
 * @param {Boolean} bypass - Optional flag to disable filtering by date (for tests/dev)
 * @returns {Array} Filtered array of articles to insert
 */
function filterNewArticles(articles, latestPublishedAt, bypass = false) {
  return articles.filter((article) => {
    if (!article.url || !article.publishedAt) return false;

    if (bypass) return true;

    return (
      !latestPublishedAt || new Date(article.publishedAt) > latestPublishedAt
    );
  });
}

/**
 * Formats API response articles to match the database schema.
 * @param {Object} article - Raw article from the API.
 * @returns {Object} - A formatted article ready for insertion.
 * @private
 */
function formatArticle(article) {
  return {
    title: truncateString(article.title, 255),
    description: truncateString(
      article.description || 'No description available',
      500
    ),
    url: truncateString(article.url, 500),
    url_to_image: truncateString(article.urlToImage || null, 500),
    published_at: article.publishedAt,
    author_name: truncateString(article.author || 'Unknown', 100),
    source_name: truncateString(article.source?.name || 'Unknown', 100),
  };
}
function truncateString(str, maxLength = 255) {
  return str?.length > maxLength ? str.substring(0, maxLength) : str;
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
