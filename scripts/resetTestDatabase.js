process.env.NODE_ENV = process.env.NODE_ENV || 'test';
import logger from '../src/loaders/logger.js';

import knex from '../src/config/db.js';
const dbName =
  knex.context?.client?.config?.connection?.database ||
  '(unable to determine DB name)';
logger.info(`🔍 Connected to database: ${dbName}`);

async function resetTestDatabase() {
  logger.info(`🚀 Resetting database for environment: ${process.env.NODE_ENV}`);

  try {
    await knex.raw(
      'TRUNCATE TABLE user_bookmarks, articles, users RESTART IDENTITY CASCADE;'
    );

    logger.info('✅ Database reset complete!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}
resetTestDatabase();
