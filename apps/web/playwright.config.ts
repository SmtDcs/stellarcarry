import { defineConfig, devices } from "@playwright/test";

// Screenshots + interaction tests. Screenshots are artifacts (./screenshots);
// interaction tests are real gates. Serves the production build via `next start`.
export default defineConfig({
  testDir: "./e2e",
  outputDir: "./.pw-output",
  reporter: "line",
  use: { baseURL: "http://localhost:4173", ...devices["Desktop Chrome"] },
  webServer: {
    command: "npm run start",
    url: "http://localhost:4173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
