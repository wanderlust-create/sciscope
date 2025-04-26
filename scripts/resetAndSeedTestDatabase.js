import logger from '../src/loaders/logger.js';
import resetDatabase from './resetTestDatabase.js';
import seedDatabase from './seedTestDatabase.js';

// Default to 'test' if NODE_ENV is not provided
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
const env = process.env.NODE_ENV;

async function resetAndSeedDatabase() {
  try {
    logger.info(`🚀 Resetting and seeding the "${env}" database...`);
    await resetDatabase();
    await seedDatabase();
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error during reset and seed: ${error.message}`);
    process.exit(1);
  }
}

resetAndSeedDatabase();
