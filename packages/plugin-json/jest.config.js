module.exports = {
  moduleDirectories: ['node_modules', __dirname],
  moduleFileExtensions: ['ts', 'js'],
  moduleNameMapper: {},
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  testMatch: ['<rootDir>/test/**/*.test.{ts,tsx,js}'],
  modulePathIgnorePatterns: ['<rootDir>/node_modules', '<rootDir>/dist'],
  restoreMocks: true,
  clearMocks: true,
  resetMocks: true,
}
