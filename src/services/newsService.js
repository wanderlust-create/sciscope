import axios from "axios";
import dotenv from "dotenv";
import logger from "../loaders/logger.js";

dotenv.config();

const axiosInstance = axios.create({
  timeout: 5000,
});

export async function fetchScienceNews() {
  const API_KEY = process.env.NEWS_API_KEY;
  const NEWS_URL = `https://newsapi.org/v2/top-headlines?country=us&category=science&apiKey=${API_KEY}`;

  try {
    const response = await axiosInstance.get(NEWS_URL, {
      validateStatus: () => true, // Prevents automatic Axios errors
    });

    if (response.status !== 200) {
      logger.error(`❌ API Error: ${response.status} - ${response.statusText}`);
      throw new Error("Failed to fetch news");
    }

    return response.data.articles || [];
  } catch (error) {
    logger.error(
      `❌ Error fetching news: ${error.response?.status} - ${error.response?.statusText || error.message}`,
    );
    throw new Error("Failed to fetch news");
  }
}

export default { fetchScienceNews };
