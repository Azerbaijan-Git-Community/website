import { defineConfig } from "react-doctor/api";

export default defineConfig({
  ignore: {
    files: ["lighthouserc.cjs", "**/action-helpers.ts", "**/schema-guards.ts"],
  },
  rules: {
    "react-doctor/build-pipeline-secret-boundary": "off",
  },
});
