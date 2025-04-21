import dotenv from 'dotenv';
import { knexSnakeCaseMappers } from 'objection';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect if running in GitHub Actions
const isCI = process.env.GITHUB_ACTIONS === 'true';
const nodeEnv = process.env.NODE_ENV || 'development';

// Dynamically determine the correct .env file
let envPath;

if (isCI) {
  envPath = path.resolve(__dirname, '../../.env');
} else {
  const specificPath = path.resolve(__dirname, `../../.env.${nodeEnv}`);
  envPath = fs.existsSync(specificPath)
    ? specificPath
    : path.resolve(__dirname, '../../.env');
}

dotenv.config({ path: envPath });
console.log(`✅ Loaded env file: ${envPath}`);

const config = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
    pool: { min: 2, max: 10 },
    migrations: {
      directory: path.resolve(__dirname, '../../db/migrations'),
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: path.resolve(__dirname, '../../db/seeds'),
    },
    ...knexSnakeCaseMappers(),
  },
  test: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.TEST_DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
    migrations: {
      directory: path.resolve(__dirname, '../../db/migrations'),
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: path.resolve(__dirname, '../../db/seeds'),
    },
    ...knexSnakeCaseMappers(),
  },
  postman: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
    migrations: {
      directory: path.resolve(__dirname, '../../db/migrations'),
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: path.resolve(__dirname, '../../db/seeds'),
    },
    ...knexSnakeCaseMappers(),
  },
};

export default config;
