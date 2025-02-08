const { knexSnakeCaseMappers } = require("objection");
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

const config = {
  development: {
    client: "postgresql",
    connection: {
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: path.resolve(__dirname, "../../src/db/migrations"),
      tableName: "knex_migrations",
    },
    // No seed data yet
    // seeds: {
    //   directory: "src/db/seeds",
    // },
    ...knexSnakeCaseMappers(),
  },
  test: {
    client: "postgresql",
    connection: {
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 5432,
      database: process.env.TEST_DB_NAME || "sciscope_test_db",
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
    migrations: {
      directory: path.resolve(__dirname, "../../src/db/migrations"),
      tableName: "knex_migrations",
    },
    // Commented out for now
    // seeds: {
    //   directory: "src/db/seeds",
    // },
    ...knexSnakeCaseMappers(),
  },
};

module.exports = config;
