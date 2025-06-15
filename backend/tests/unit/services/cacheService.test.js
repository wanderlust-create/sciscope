import { jest } from '@jest/globals';
import db from '../../../src/config/db.js';
import logger from '../../../src/loaders/logger.js';
import {
  delCache,
  flushCache,
  getCache,
  setCache,
} from '../../../src/services/cacheService.js';

afterAll(async () => {
  await db.destroy();
});

describe('CacheService', () => {
  beforeEach(() => {
    flushCache(); // Ensure clean state for each test
    jest.clearAllMocks(); // Reset mocks before each test
  });

  it('should store and retrieve a cached value', () => {
    setCache('testKey', 'testValue', 600);
    const value = getCache('testKey');
    expect(value).toBe('testValue');
  });

  it('should return null for expired or missing keys', async () => {
    setCache('expiredKey', 'someValue', 1);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // expired key
    expect(getCache('expiredKey')).toBeNull();
    // key that does not exist returns null instead of an error
    expect(getCache('nonExistentKey')).toBeNull();
  });

  it('should delete a key from cache', () => {
    setCache('keyToDelete', 'deleteMe', 600);
    delCache('keyToDelete');
    expect(getCache('keyToDelete')).toBeNull();
  });

  it('should log when fetching from cache vs. making a fresh call', () => {
    const spy = jest.spyOn(logger, 'info').mockImplementation(() => {}); // ✅ Mock logger

    setCache('logKey', 'logValue', 600);
    getCache('logKey'); // Should log cache hit
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('⚡ Cache Hit: logKey')
    );

    getCache('missKey'); // Should log cache miss
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('❌ Cache Miss: missKey')
    );

    spy.mockRestore();
  });
});
