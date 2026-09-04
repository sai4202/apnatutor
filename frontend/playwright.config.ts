import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests — M6-05.
 *
 * <h2>What these are for, and what they are not</h2>
 *
 * The backend suite already covers the money rules in depth: the ledger, the cap, the replay path,
 * the refund. Repeating that here would be slower and no more convincing. What only a browser can
 * tell us is whether the pieces are wired together — whether a person can actually get from a
 * search box to a paid unlock without a route, a form field or a fetch being wrong.
 *
 * So these are few, they are about journeys rather than rules, and each one fails for a reason that
 * unit tests structurally cannot see.
 *
 * <h2>Running them</h2>
 *
 * Both servers must be up, with the backend in dev mode (the OTP is fixed and returned in the
 * response, which is what makes signing in scriptable) and the demo data loaded:
 *
 * ```
 * cd backend;  .\mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--apnatutor.demo.seed=true"
 * cd frontend; npm run test:e2e
 * ```
 *
 * The frontend is started by Playwright itself; the backend is not, because it needs a database and
 * a warm JVM, and a webServer block that silently starts one would hide a genuinely broken
 * environment behind a two-minute timeout.
 */
export default defineConfig({
  testDir: "./e2e",
  // Serial. These share one database and one demo dataset, and a tutor's credit balance is
  // global state — two tests unlocking in parallel would spend each other's credits.
  workers: 1,
  fullyParallel: false,
  // A flaky end-to-end test that passes on retry teaches everyone to re-run rather than to look.
  retries: 0,
  timeout: 30_000,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // The traffic this product actually gets. A layout that works on a desktop and breaks on a
    // mid-range Android phone is a broken product here, not a minor regression (M6-01).
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],

  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
