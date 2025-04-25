process.env.NODE_ENV = process.env.NODE_ENV || 'test';

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load the correct .env file first
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, `../.env.${process.env.NODE_ENV}`),
});

// ✅ Now import other things that depend on env vars
import logger from '../src/loaders/logger.js';
import knex from '../src/config/db.js';

const dbName =
  knex.context?.client?.config?.connection?.database ||
  '(unable to determine DB name)';
logger.info(`🔍 Connected to database: ${dbName}`);

export default async function resetTestDatabase() {
  logger.info(`🚀 Resetting database for environment: ${process.env.NODE_ENV}`);

  try {
    await knex.raw(
      'TRUNCATE TABLE bookmark_group_assignments, user_bookmarks, bookmark_groups, articles, users RESTART IDENTITY CASCADE;'
    );

    logger.info('✅ Database reset complete!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}
