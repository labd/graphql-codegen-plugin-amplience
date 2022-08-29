/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  moduleDirectories: ['./node_modules', __dirname],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': 'babel-jest',
  },
  testMatch: ['<rootDir>/test/**/*.test.{ts,tsx,js}'],
}
