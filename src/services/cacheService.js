import NodeCache from 'node-cache';
import logger from '../loaders/logger.js';

// ⚡ Set up cache with 1-hour TTL (3600 seconds)
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 300 });

/**
 * Store a value in cache
 * @param {string} key - The cache key
 * @param {any} value - The value to store
 * @param {number} [ttl] - Optional custom TTL in seconds
 */
export const setCache = (key, value, ttl = 900) => {
  const success = cache.set(key, value, ttl);
  if (success) logger.info(`🟢 Cached: ${key} (TTL: ${ttl}s)`);
  return success;
};

/**
 * Retrieve a value from cache
 * @param {string} key - The cache key
 * @returns {any|null} - Cached value or null if not found
 */
export const getCache = (key) => {
  const value = cache.get(key);
  if (value) {
    logger.info(`⚡ Cache Hit: ${key}`);
    return value;
  }
  logger.info(`❌ Cache Miss: ${key}`);
  return null;
};

/**
 * Remove a specific key from cache
 * @param {string} key - The cache key
 */
export const delCache = (key) => {
  const success = cache.del(key);
  if (success) logger.info(`🗑️ Cache Deleted: ${key}`);
};

/**
 * Flush all cache entries
 */
export const flushCache = () => {
  cache.flushAll();
  logger.info('🗑️ Cache Fully Cleared');
};

/**
 * Get cache stats for debugging
 */
export const getCacheStats = () => {
  return cache.getStats();
};

export default {
  setCache,
  getCache,
  delCache,
  flushCache,
  getCacheStats,
};
