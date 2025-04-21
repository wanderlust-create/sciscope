import logger from '../src/loaders/logger.js';
// Default to 'test' if NODE_ENV is not provided
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

import { exec } from 'child_process';

const env = process.env.NODE_ENV;

logger.info(`🚀 Resetting and seeding the "${env}" database...`);

// Run reset script
exec(
  `NODE_ENV=${env} node scripts/resetTestDatabase.js`,
  (resetError, resetStdout, resetStderr) => {
    if (resetError) {
      console.error(
        `❌ Error resetting ${env} database: ${resetError.message}`
      );
      return;
    }
    console.log(resetStdout);
    if (resetStderr) console.error(resetStderr);

    // Then run the seed script
    exec(
      `NODE_ENV=${env} node scripts/generateTestData.js`,
      (seedError, seedStdout, seedStderr) => {
        if (seedError) {
          console.error(
            `❌ Error seeding ${env} database: ${seedError.message}`
          );
          return;
        }
        console.log(seedStdout);
        if (seedStderr) console.error(seedStderr);
      }
    );
  }
);
