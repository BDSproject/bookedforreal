/**
 * Shared ESLint config for Node.js TypeScript packages (api, db, types, i18n, ui).
 * Consumed via a relative path, e.g. `"extends": "../../packages/config/eslint/base.js"`.
 *
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
  env: {
    es2022: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  ignorePatterns: ["dist", "node_modules", ".next", ".expo"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  },
};
