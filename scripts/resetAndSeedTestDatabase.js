import logger from '../src/loaders/logger.js';
import resetDatabase from './resetTestDatabase.js';
import seedDatabase from './generateTestData.js';

// Default to 'test' if NODE_ENV is not provided
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const env = process.env.NODE_ENV;

logger.info(`🚀 Resetting and seeding the "${env}" database...`);

// Run reset script
async function resetAndSeedDatabase() {
  try {
    logger.info(`🚀 Resetting and seeding the "${env}" database...`);
    await resetDatabase();
    logger.info(`✅ Database reset complete!`);
    logger.info(`🚀 Seeding database with test data for "${env}"...`);
    await seedDatabase();
    logger.info(`🎉 Database seeding complete!`);
    process.exit(0); // <- clean exit if running standalone
  } catch (error) {
    console.error(`❌ Error during reset and seed: ${error.message}`);
    process.exit(1);
  }
}
resetAndSeedDatabase();
