export default {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  moduleFileExtensions: ['js', 'mjs', 'json'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js', '!src/tests/**', '!src/config/db.js'],
  clearMocks: true,
  verbose: true,
  transform: {},
};
