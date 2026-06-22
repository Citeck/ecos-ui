/* eslint-disable prettier/prettier */
/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  displayName: "test",
  testEnvironment: "jest-environment-jsdom",
  workerIdleMemoryLimit: "512MB",
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
    "^(.*)\\?worker$": "<rootDir>/src/__mocks__/worker.mock.js",
    "^@citeck/records-core$": "<rootDir>/packages/records-core/src/index.ts",
    "^@citeck/records-core/(.*)$": "<rootDir>/packages/records-core/src/$1",
    "^@citeck/records-predicates$": "<rootDir>/packages/records-predicates/src/index.ts",
    "^@citeck/records-predicates/(.*)$": "<rootDir>/packages/records-predicates/src/$1",
    "^@citeck/constants$": "<rootDir>/packages/constants/src/index.ts",
    "^@citeck/constants/(.*)$": "<rootDir>/packages/constants/src/$1",
    "^@/constants$": "<rootDir>/packages/constants/src/index.ts",
    // These bpmn/diagram mocks MUST precede the "@/(.*)$" catch-all. The heavy
    // bpmn-js/diagram-js modeler code is stubbed in jsdom tests by matching the
    // "BPMN"/"bpmn-js"/"diagram-js" substring in the import path. Components used to
    // be imported via relative paths (e.g. "../ModelEditor/BPMNModeler/modules"),
    // which fell through to these stubs. Now that cross-folder imports use the "@/"
    // alias, the catch-all would resolve the real module first unless these come first.
    "bpmn-js*": "<rootDir>/src/mock.js",
    "BPMN*": "<rootDir>/src/mock.js",
    "diagram-js*": "<rootDir>/src/mock.js",
    "@/(.*)$": "<rootDir>/src/$1",
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
