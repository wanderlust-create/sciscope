import logger from '../loaders/logger.js';
import newsService from '../services/newsService.js';

/**
 * Fetches the latest science news from the API.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export async function getScienceNews(req, res) {
  try {
    const news = await newsService.processNewsRequest();
    res.status(200).json(news);
  } catch (error) {
    logger.error(`❌ Error fetching science news: ${error.message}`, {
      stack: error.stack,
    });

    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export default { getScienceNews };
