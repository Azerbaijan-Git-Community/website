import { defineConfig } from "react-doctor/api";

export default defineConfig({
  ignore: {
    files: ["lighthouserc.cjs", "**/action-helpers.ts", "**/schema-guards.ts"],
  },
  rules: {
    "react-doctor/build-pipeline-secret-boundary": "off",
    "react-doctor/no-fetch-response-used-without-status-check": "off",
  },
});
