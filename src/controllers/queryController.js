import logger from '../loaders/logger.js';
import queryService from '../services/queryService.js';

/**
 * Handles searching for articles.
 * Delegates logic to articleSearchService.js.
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

export default { getNewsByQuery };
