/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  moduleDirectories: ['./node_modules', __dirname],
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/*.test.{ts,tsx,js}'],
}
