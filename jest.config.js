/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'], // Tests are inside the `tests` folder
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testTimeout: 60000
};
