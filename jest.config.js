/* eslint-disable prettier/prettier */
/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  displayName: "test",
  testEnvironment: "jest-environment-jsdom",
  preset: "ts-jest/presets/js-with-ts-esm",
  transform: {
    "^.+\\.[t|j]sx?$": "babel-jest",
  },
  setupFilesAfterEnv: ["<rootDir>src/setupTests.ts"],
  testPathIgnorePatterns: ["<rootDir>/cypress/", "<rootDir>/coverage/", "<rootDir>/build/", "<rootDir>/node_modules/"],
  moduleDirectories: ["node_modules", "src"],
  testMatch: ["**/__tests__/**/*.+(ts|tsx|js)", "**/?(*.)+(spec|test).+(ts|tsx|js)"],
  moduleNameMapper: {
    "\\.(css|scss)$": "<rootDir>/src/__mocks__/style.mock.js",
    "\\.(png|jpg)$": "<rootDir>/src/__mocks__/image.mock.js",
    "@/(.*)$": "<rootDir>/src/$1",
    "bpmn-js*": "<rootDir>/src/mock.js",
    "BPMN*": "<rootDir>/src/mock.js",
    "diagram-js*": "<rootDir>/src/mock.js",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "scss", "png", "node"],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json",
    },
  },
};
