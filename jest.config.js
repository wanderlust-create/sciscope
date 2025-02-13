export default {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/src/tests/setupTests.js"],
  moduleFileExtensions: ["js", "mjs", "json"],
  testMatch: ["**/src/tests/**/*.test.js"],
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.js", "!src/tests/**"],
  clearMocks: true, // Reset mocks between tests
  verbose: true, // Show detailed test results
  forceExit: true, // Prevent Jest from hanging
  transform: {}, // Disable Jest’s default transform (CommonJS)
};
// This Jest configuration file is set up to run tests in a Node environment
