import { defineConfig } from "react-doctor/api";

export default defineConfig({
  ignore: {
    files: ["lighthouserc.cjs", "**/action-helpers.ts"],
  },
});
