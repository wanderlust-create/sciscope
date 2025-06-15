import axios from 'axios';
import db from '../src/config/db.js';

export default async function globalTeardown() {
  if (process.env.SKIP_DB_RESET === 'true') {
    console.log('⚡️ Skipping global DB teardown...');
    return;
  }

  console.log('🔻 Running global teardown...');
  try {
    axios.CancelToken.source().cancel('Test cleanup');
    await db.destroy();
    console.log('✅ Database connection closed.');
  } catch (error) {
    console.error('❌ Error during teardown:', error);
  }
}
