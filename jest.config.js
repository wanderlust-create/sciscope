module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/src/tests/setupTests.js"],
  moduleFileExtensions: ["js", "json"],
  testMatch: ["**/src/tests/**/*.test.js"],
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.js", "!src/tests/**"],
  clearMocks: true, // Reset mocks between tests
  verbose: true, // Show detailed test results
  forceExit: true, // Prevent Jest from hanging
};
