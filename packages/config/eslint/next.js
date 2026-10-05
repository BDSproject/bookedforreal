/**
 * Shared ESLint config for the Next.js web app.
 * Consumed via a relative path, e.g. `"extends": "../../packages/config/eslint/next.js"`.
 *
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
  extends: ["next/core-web-vitals"],
};
