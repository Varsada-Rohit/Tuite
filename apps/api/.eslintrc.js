/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ['@tuite/eslint-config/nestjs'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
