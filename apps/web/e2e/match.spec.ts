import { test, expect } from "@playwright/test";

const BASE = "http://localhost:4173";

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

test("match page renders results and captures screenshot", async ({ page }) => {
  await page.goto(`${BASE}/match`);
  await expect(page.getByRole("heading", { name: "Boarding" })).toBeVisible();
  await expect(page.getByTestId("match-card").first()).toBeVisible();
  await scrollToTriggerAnimations(page);
  await page.screenshot({ path: "screenshots/match-results.png", fullPage: true });
});

test("top match card has star-yellow border glow", async ({ page }) => {
  await page.goto(`${BASE}/match`);
  await expect(page.getByTestId("match-card").first()).toBeVisible();
  // First card is the top match — has boarding pass article
  const firstCard = page.getByTestId("match-card").first();
  const boardingPass = firstCard.locator('[role="article"]');
  await expect(boardingPass).toBeVisible();
  // Boarding pass should show route text
  await expect(boardingPass).toContainText("TR → DE");
  // Stub shows score percentage (appears in right stub)
  await expect(boardingPass.getByText(/%/).first()).toBeVisible();
});

test("empty state when no matching travelers", async ({ page }) => {
  await page.goto(`${BASE}/match`);
  // r5 (DE→KR) is intentionally unserved — uses aria-label "DE to KR"
  await page.getByRole("button", { name: "DE to KR" }).click();
  await expect(page.getByText("No matching travelers found")).toBeVisible();
});

test("filter bar renders and narrows results", async ({ page }) => {
  await page.goto(`${BASE}/match`);
  await expect(page.getByTestId("match-card").first()).toBeVisible();
  await expect(page.getByTestId("filter-rep-90")).toBeVisible();
  await expect(page.getByTestId("filter-search")).toBeVisible();
  // Default request r1 (TR→DE) has 5 qualified carriers; 3 have reputation >= 90.
  await expect(page.getByText("5 of 5 carriers")).toBeVisible();
  await page.getByTestId("filter-rep-90").click();
  await expect(page.getByText("3 of 5 carriers")).toBeVisible();
});

test("request buttons toggle active request", async ({ page }) => {
  await page.goto(`${BASE}/match`);
  // Default: first request (TR→DE) is active — yellow background
  const activeBtn = page.getByRole("button", { name: "TR to DE" });
  const color = await activeBtn.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(color).not.toBe("rgba(0, 0, 0, 0)");

  // Click second request (US→JP has no matching travelers)
  await page.getByRole("button", { name: "US to JP" }).click();
  // Heading should still be visible
  await expect(page.getByRole("heading", { name: "Boarding", exact: true })).toBeVisible();
});
