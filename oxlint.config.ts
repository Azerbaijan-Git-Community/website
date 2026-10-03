import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["typescript", "nextjs", "unicorn", "import", "jsx-a11y", "react", "react-perf", "vitest"],
  categories: {
    suspicious: "warn",
  },
  options: {
    typeAware: true,
    typeCheck: true,
  },
  rules: {
    eqeqeq: "warn",
    "no-underscore-dangle": ["warn", { allow: ["_count", "_sum", "_avg", "_min", "_max"] }],
    "no-throw-literal": "warn",
    "import/no-unassigned-import": [
      "warn",
      {
        allow: [
          "**/globals.css",
          "**/env.server",
          "dotenv/config",
          "server-only",
          "@testing-library/jest-dom/vitest",
          "./shared",
        ],
      },
    ],
    "unicorn/prefer-node-protocol": "warn",
    "react/react-in-jsx-scope": "off",
    "typescript/consistent-type-imports": "warn",
  },
});
