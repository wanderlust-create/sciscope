import newsApiService from '../services/newsApiService.js';

/**
 * Fetches the latest science news from the API.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export async function getScienceNews(req, res) {
  try {
    const news = await newsApiService.fetchScienceNews();
    res.status(200).json(news);
  } catch (error) {
    console.error('❌ Error fetching science news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
}

export default { getScienceNews };
