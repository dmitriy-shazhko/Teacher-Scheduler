// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // templates/ — экспортированные макеты дизайна (референс), не код приложения
    ignores: ["dist/*", "templates/*"],
  }
]);
