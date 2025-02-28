import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import db from '../src/config/db.js';
import logger from '../src/loaders/logger.js';

dotenv.config();

beforeAll(async () => {
  logger.info('🧹 Clearing test data...');
  await db('articles').del();
  await db('user_bookmarks').del();
  await db('bookmark_group_assignments').del();
});

jest.setTimeout(30000);
