module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  overrides: [
    {
      files: ["*.js"],
      rules: {
        "@typescript-eslint/no-this-alias": "off",
        "@typescript-eslint/no-loss-of-precision": "off",
      },
    },
    {
      files: ["tests/**/*", "__tests__/**/*"],
      env: {
        jest: true,
      },
    },
  ],
  settings: {
    react: {
      version: "detect",
    },
  },
  extends: [
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "plugin:prettier/recommended",
  ],
  plugins: ["jsx-a11y", "sort-keys-fix", "header"],
  rules: {
    "import/no-named-as-default-member": ["off"],
    "react/jsx-key": ["off"],
    "react/no-render-return-value": ["off"],
    "react/display-name": ["off"],
    "import/no-named-as-default": 0,
    "@typescript-eslint/no-explicit-any": ["off"],
    "@typescript-eslint/no-empty-function": ["off"],
    "@typescript-eslint/ban-ts-comment": [
      "warn",
      {
        "ts-ignore": "allow",
        "ts-expect-error": "allow",
        "ts-nocheck": "warn",
        "ts-check": "warn",
      },
    ],
    "import/order": [
      "warn",
      {
        groups: [["builtin", "external"], "internal", "parent", "sibling", "index", "object", "type"],
        pathGroups: [
          {
            pattern: "**/*.css",
            group: "internal",
            position: "after",
          },
          {
            pattern: "**/*.scss",
            group: "internal",
            position: "after",
          },
        ],
        pathGroupsExcludedImportTypes: ["builtin"],
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
        },
      },
    ],
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "off",
    "react/prop-types": "off",
    "prettier/prettier": [
      "warn",
      {
        endOfLine: "auto",
        singleQuote: true,
        trailingComma: "none",
        arrowParens: "avoid",
      },
    ],
    "import/no-unresolved": "off",
  },
};
