/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  moduleDirectories: ['./node_modules', __dirname],
  setupFilesAfterEnv: [`<rootDir>/jest.setup.js`],
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/*.test.{ts,tsx,js}'],
}
