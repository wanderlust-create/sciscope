import axios from 'axios';
import db from '../src/config/db.js';

export default async function globalTeardown() {
  console.log('🔻 Running global teardown...');

  try {
    // Cancel any pending axios requests
    axios.CancelToken.source().cancel('Test cleanup');

    // Ensure database connections are fully closed
    await db.destroy();
    console.log('✅ Database connection closed.');
  } catch (error) {
    console.error('❌ Error during teardown:', error);
  }
}
