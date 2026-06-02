import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Relax no-explicit-any to warning (not error) for rapid development
      // Real issues tracked via @typescript-eslint/no-unused-vars and strict tsconfig
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;