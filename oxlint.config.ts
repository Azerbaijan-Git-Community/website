import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["typescript", "nextjs", "unicorn", "import"],
  categories: {
    suspicious: "warn",
  },
  rules: {
    eqeqeq: "warn",
    "no-underscore-dangle": ["warn", { allow: ["_count", "_sum", "_avg", "_min", "_max"] }],
    "no-throw-literal": "warn",
    "import/no-unassigned-import": "off",
    "unicorn/prefer-node-protocol": "warn",
    "typescript/consistent-type-imports": "warn",
  },
});
