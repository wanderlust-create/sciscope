import articleSearchService from '../services/articleSearchService.js';
import logger from '../loaders/logger.js';

/**
 * Handles searching for articles.
 * Delegates logic to articleSearchService.js.
 * @param {Object} req - Express request object with search query.
 * @param {Object} res - Express response object.
 */
export async function searchArticles(req, res) {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required.' });
    }

    const articles = await articleSearchService.searchArticles(query);
    res.status(200).json(articles);
  } catch (error) {
    logger.error(`❌ Error searching articles: ${error.message}`, {
      stack: error.stack,
    });

    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export default { searchArticles };
