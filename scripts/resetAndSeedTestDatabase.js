import { exec } from 'child_process';

console.log('🚀 Resetting and seeding the test database...');

// Run reset script first
exec(
  'NODE_ENV=test node scripts/resetTestDatabase.js',
  (resetError, resetStdout, resetStderr) => {
    if (resetError) {
      console.error(`❌ Error resetting test database: ${resetError.message}`);
      return;
    }
    console.log(resetStdout);
    if (resetStderr) console.error(resetStderr);

    // After reset completes, run the seed script
    exec(
      'NODE_ENV=test node scripts/generateTestData.js',
      (seedError, seedStdout, seedStderr) => {
        if (seedError) {
          console.error(`❌ Error seeding test database: ${seedError.message}`);
          return;
        }
        console.log(seedStdout);
        if (seedStderr) console.error(seedStderr);
      }
    );
  }
);
