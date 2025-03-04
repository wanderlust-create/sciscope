import logger from '../loaders/logger.js';
import dbService from '../services/dbService.js';
import queryService from '../services/queryService.js';

/**
 * Handles searching for articles.
 * Delegates logic to queryService.js.
 * @param {Object} req - Express request object with search query.
 * @param {Object} res - Express response object.
 */
export async function getNewsByQuery(req, res) {
  logger.info(req.body);
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required.' });
    }

    const articles = await queryService.processQueryRequest(query);
    res.status(200).json(articles);
  } catch (error) {
    logger.error(`❌ Error searching articles: ${error.message}`, {
      stack: error.stack,
    });

    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Retrieves a single article by ID.
 * @param {Object} req - Express request object containing the article ID in params.
 * @param {Object} res - Express response object for sending the article or an error.
 */
export const getArticleById = async (req, res) => {
  const { id } = req.params;
  try {
    const article = await dbService.getArticleById(id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found.' });
    }
    return res.status(200).json(article);
  } catch (error) {
    logger.error(`❌ Error fetching article by ID: ${error.message}`, {
      stack: error.stack,
    });
    return res
      .status(500)
      .json({ error: error.message || 'Internal Server Error' });
  }
};

export default { getNewsByQuery, getArticleById };
