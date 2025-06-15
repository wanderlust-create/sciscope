export default {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  moduleFileExtensions: ['js', 'mjs', 'json'],
  testMatch: ['**/tests/**/*.test.js'],
  reporters: ['default', 'jest-summary-reporter'],
  collectCoverage: false,
  collectCoverageFrom: ['src/**/*.js', '!src/tests/**', '!src/config/db.js'],
  clearMocks: true,
  verbose: true,
  transform: {},
};
