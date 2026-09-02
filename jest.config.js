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
  testPathIgnorePatterns: ["<rootDir>/cypress/", "<rootDir>/coverage/", "<rootDir>/build/", "<rootDir>/node_modules/", "<rootDir>/.claude/"],
  // Git worktrees under .claude/worktrees are full copies of the repo: without this the haste map
  // sees every package and manual mock twice and refuses to resolve `@citeck/records-core`.
  modulePathIgnorePatterns: ["<rootDir>/.claude/"],
  moduleDirectories: ["node_modules", "src"],
  testMatch: ["**/__tests__/**/*.+(ts|tsx|js)", "**/?(*.)+(spec|test).+(ts|tsx|js)"],
  moduleNameMapper: {
    "\\.(css|scss)$": "<rootDir>/src/__mocks__/style.mock.js",
    "\\.(png|jpg)$": "<rootDir>/src/__mocks__/image.mock.js",
    "^(.*)\\?worker$": "<rootDir>/src/__mocks__/worker.mock.js",
    "@/(.*)$": "<rootDir>/src/$1",
    "bpmn-js*": "<rootDir>/src/mock.js",
    "BPMN*": "<rootDir>/src/mock.js",
    "diagram-js*": "<rootDir>/src/mock.js",
    "react-markdown": "<rootDir>/src/__mocks__/react-markdown.mock.js",
    "remark-gfm": "<rootDir>/src/__mocks__/remark-gfm.mock.js",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "scss", "png", "node"],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json",
    },
  },
};
