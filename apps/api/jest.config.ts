import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  testPathIgnorePatterns: ['.*\\.integration\\.spec\\.ts$', 'setup\\.integration\\.ts'],
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s', '!**/*.module.ts', '!main.ts', '!swagger.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};

export default config;
