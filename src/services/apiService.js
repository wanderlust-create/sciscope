import axios from 'axios';
import dotenv from 'dotenv';
import logger from '../loaders/logger.js';

dotenv.config();

const API_KEY = process.env.NEWS_API_KEY;
const BASE_URL = 'https://newsapi.org/v2';

/**
 * Constructs a NewsAPI URL with keyword parameters.
 * @param {string} endpoint - API endpoint ('top-headlines' or 'everything').
 * @param {Object} params - keyword parameters for the request.
 * @returns {string} - Fully formatted API URL.
 */
const getNewsApiUrl = (endpoint, params = {}) =>
  `${BASE_URL}/${endpoint}?${new URLSearchParams({ apiKey: API_KEY, ...params })}`;

/**
 * Fetches top science news headlines.
 * @returns {Promise<Object>} - NewsAPI response containing articles.
 */
export const fetchScienceNews = () =>
  fetchArticles(
    getNewsApiUrl('top-headlines', { country: 'us', category: 'science' }),
    'science news'
  );

/**
 * Fetches news articles based on a search keyword.
 * @param {string} keyword - Search keyword(s).
 * @param {number} [pageSize=10] - Number of results to fetch.
 * @returns {Promise<Object>} - NewsAPI response containing articles.
 */
export const searchNewsByKeyword = (keyword, pageSize = 10) => {
  if (!keyword)
    throw new Error('Keyword parameter is required for searching news.');

  return fetchArticles(
    getNewsApiUrl('everything', {
      q: encodeURIComponent(keyword),
      language: 'en',
      pageSize,
    }),
    `search keyword: "${keyword}" with pageSize: ${pageSize}`
  );
};

/**
 * Executes an API request and validates the response.
 * @param {string} url - API request URL.
 * @param {string} context - Description of the request for logging.
 * @returns {Promise<Object>} - Parsed response from NewsAPI.
 */
export const fetchArticles = async (url, context) => {
  try {
    logger.info(`📡 Fetching ${context} from News API...`);
    const response = await axios.get(url, { validateStatus: () => true });

    if (response.status === 401) {
      const errorMessage = 'Invalid API key. Please verify your NEWS_API_KEY.';
      logger.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage); // ✅ Preserve the specific error message
    }
    if (response.status !== 200 && response.status !== 'ok') {
      const errorMessage = `Failed to fetch ${context}. API responded with ${response.status}`;
      logger.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }

    const data = response.data || response;

    if (!data || data.status !== 'ok' || !Array.isArray(data.articles)) {
      logger.error(`❌ Malformed API response for ${context}:`, data);
      throw new Error(
        `Failed to fetch ${context}. Unexpected response format.`
      );
    }

    if (!data.articles.length)
      logger.warn(`⚠️ No articles returned from News API for ${context}.`);

    return data;
  } catch (error) {
    logger.error(`❌ Error fetching ${context}: ${error.message}`);

    // ✅ Only overwrite errors that are NOT already API-specific
    if (
      !error.message.includes('Invalid API key') &&
      !error.message.includes('API responded with') &&
      !error.message.includes('Unexpected response format')
    ) {
      throw new Error(`Failed to fetch ${context}`);
    }

    throw error; // ✅ Preserve the original error message
  }
};

export default { fetchScienceNews, searchNewsByKeyword, fetchArticles };
