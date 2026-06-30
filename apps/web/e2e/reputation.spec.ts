import { test, expect } from "@playwright/test";

async function scrollToTriggerAnimations(page: import("@playwright/test").Page) {
  await page.evaluate(async () => {
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const h = document.body.scrollHeight;
    for (let y = 0; y < h; y += 400) {
      window.scrollTo(0, y);
      await delay(120);
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1200);
}

const BASE = "http://localhost:4173";

test("reputation page renders and captures screenshot", async ({ page }) => {
  await page.goto(`${BASE}/reputation`);
  await expect(page.getByRole("heading", { name: "Reputation" })).toBeVisible();
  await scrollToTriggerAnimations(page);
  await page.screenshot({ path: "screenshots/reputation.png", fullPage: true });
});

test("reputation page shows key stats", async ({ page }) => {
  await page.goto(`${BASE}/reputation`);
  await expect(page.getByRole("heading", { name: "Reputation" })).toBeVisible();
  // Departure board shows score, deliveries, earned
  await expect(page.getByText("SCORE")).toBeVisible();
  await expect(page.getByText("DELIVERIES")).toBeVisible();
  await expect(page.getByText("EARNED")).toBeVisible();
  // Address shown in passport page
  await expect(page.getByText("GDM7JQ2BL3A6S4K7MGZQMH2YMFSJHZSN5TPDP3DQOXHSOWYM43EFJXK2")).toBeVisible();
});

test("reputation page shows passport page with stamps", async ({ page }) => {
  await page.goto(`${BASE}/reputation`);
  // Passport page should be visible
  await expect(page.getByRole("region", { name: "Passport page" })).toBeVisible();
  // Stamps render as img roles with "Passport stamp:" in aria-label
  await expect(page.getByRole("img", { name: /Passport stamp:/ })).toHaveCount(5);
  // DE stamps (2x TR→DE deliveries) — use exact country match to avoid substring "DE" in "DELIVERED"
  await expect(page.getByRole("img", { name: /^Passport stamp: DE\b/ })).toHaveCount(2);
  // JP stamps
  await expect(page.getByRole("img", { name: /^Passport stamp: JP\b/ })).toHaveCount(1);
  // GB stamps
  await expect(page.getByRole("img", { name: /^Passport stamp: GB\b/ })).toHaveCount(1);
  // US stamps
  await expect(page.getByRole("img", { name: /^Passport stamp: US\b/ })).toHaveCount(1);
});

test("reputation page status stamps are rendered", async ({ page }) => {
  await page.goto(`${BASE}/reputation`);
  // DELIVERED stamps (released + delivered)
  await expect(page.getByText("DELIVERED")).toHaveCount(4);
  // REFUNDED stamp
  await expect(page.getByText("REFUNDED")).toBeVisible();
});

test("reputation page nav link works", async ({ page }) => {
  await page.goto(`${BASE}/`);
  await page.getByRole("link", { name: "Reputation" }).click();
  await expect(page).toHaveURL("/reputation");
  await expect(page.getByRole("heading", { name: "Reputation" })).toBeVisible();
});

test("reputation page accessible from other pages via navbar", async ({ page }) => {
  await page.goto(`${BASE}/travelers`);
  await page.getByRole("link", { name: "Reputation" }).click();
  await expect(page).toHaveURL("/reputation");
  await expect(page.getByRole("heading", { name: "Reputation" })).toBeVisible();
});
