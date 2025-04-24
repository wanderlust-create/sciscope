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
const getNewsApiUrl = (endpoint, params = {}) => {
  const apiKeyUsed = process.env.NEWS_API_KEY || API_KEY; // Ensure the key is taken from process.env

  return `${BASE_URL}/${endpoint}?${new URLSearchParams({ apiKey: apiKeyUsed, ...params })}`;
};

/**
 * Fetches top science news headlines.
 * @returns {Promise<Object>} - NewsAPI response containing articles.
 */
export const fetchScienceNews = () => {
  return fetchArticles(
    getNewsApiUrl('everything', {
      q: 'science OR physics OR astronomy OR climate OR AI OR space OR medicine',
      language: 'en',
      sortBy: 'publishedAt',
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Past 7 days only
      pageSize: 50, // Fetch a limited number
    }),
    'science news'
  );
};

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
    `keyword: "${keyword}" with pageSize: ${pageSize}`
  );
};

/**
 * Executes an API request and validates the response.
 * @param {string} url - API request URL.
 * @param {string} context - Description of the request for logging.
 * @returns {Promise<Object>} - Parsed response from NewsAPI.
 */
export const fetchArticles = async (
  url,
  context,
  retries = 3,
  delay = 1000
) => {
  try {
    logger.info(`📡 Fetching ${context} from News API...`);
    const response = await axios.get(url, { validateStatus: () => true });

    // ✅ Handle 401 Unauthorized (Invalid API Key)
    if (response.status === 401) {
      const errorMessage = 'Invalid API key. Please verify your NEWS_API_KEY.';
      logger.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }

    // ✅ Handle 429 Rate Limit Exceeded (Too Many Requests)
    if (response.status === 429 && retries > 0) {
      logger.warn(
        `⚠️ Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`
      );
      await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before retrying
      return fetchArticles(url, context, retries - 1, delay * 2); // Exponential backoff
    }

    // ✅ Handle Other API Errors
    if (response.status !== 200 && response.status !== 'ok') {
      const errorMessage = `Failed to fetch ${context}. API responded with ${response.status}`;
      logger.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }

    const data = response.data || response;

    if (!Array.isArray(data.articles)) {
      logger.error(`❌ Malformed API response for ${context}:`, data);
      throw new Error(
        `Failed to fetch ${context}. Unexpected response format.`
      );
    }

    if (!data.articles.length) {
      logger.warn(`⚠️ No articles returned from News API for ${context}.`);
    }

    return data;
  } catch (error) {
    logger.error(`❌ Error fetching ${context}: ${error.message}`);

    // ✅ If it's not a known API error, overwrite the message
    if (
      !error.message.includes('Invalid API key') &&
      !error.message.includes('API responded with')
    ) {
      throw new Error(`Failed to fetch ${context}. ${error.message}`);
    }

    throw error;
  }
};

export default { fetchScienceNews, searchNewsByKeyword, fetchArticles };
