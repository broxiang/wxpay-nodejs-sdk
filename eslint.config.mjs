import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    ignores: ["dist/", "node_modules/", "coverage/"],
  },
  {
    files: ["src/**/*.ts"],
    extends: [
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-extraneous-class": "off",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true },
      ],
    },
  },
  {
    files: ["*.config.ts"],
    extends: [
      ...tseslint.configs.strict,
      ...tseslint.configs.stylistic,
    ],
  },
  {
    files: ["tests/**/*.ts"],
    extends: [
      ...tseslint.configs.strict,
      ...tseslint.configs.stylistic,
    ],
    rules: {
      "@typescript-eslint/no-extraneous-class": "off",
    },
  },
);
