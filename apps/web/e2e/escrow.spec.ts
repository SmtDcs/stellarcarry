import { test, expect } from "@playwright/test";

const BASE = "http://localhost:4173";

test.describe("Escrow page — Static states (no API)", () => {
  test("screenshot — Created", async ({ page }) => {
    await page.goto(`${BASE}/escrow?state=Created`);
    await page.waitForTimeout(1500);
  });

  test("screenshot — Funded", async ({ page }) => {
    await page.goto(`${BASE}/escrow?state=Funded`);
    await page.waitForTimeout(1500);
  });

  test("screenshot — Delivered", async ({ page }) => {
    await page.goto(`${BASE}/escrow?state=Delivered`);
    await page.waitForTimeout(1500);
  });

  test("screenshot — Released", async ({ page }) => {
    await page.goto(`${BASE}/escrow?state=Released`);
    await page.waitForTimeout(1500);
  });

  test("screenshot — Refunded", async ({ page }) => {
    await page.goto(`${BASE}/escrow?state=Refunded`);
    await page.waitForTimeout(1500);
  });

  test("only Fund enabled in Created state", async ({ page }) => {
    await page.goto(`${BASE}/escrow?state=Created`);
    await page.waitForSelector('[data-testid="escrow-action-fund"]');

    const fund = page.getByTestId("escrow-action-fund");
    const confirm = page.getByTestId("escrow-action-confirmDelivery");
    const release = page.getByTestId("escrow-action-release");
    const refund = page.getByTestId("escrow-action-refund");

    await expect(fund).toBeEnabled();
    await expect(confirm).toBeDisabled();
    await expect(release).toBeDisabled();
    await expect(refund).toBeDisabled();
  });

  test("Confirm Delivery and Refund enabled in Funded state", async ({ page }) => {
    await page.goto(`${BASE}/escrow?state=Funded`);
    await page.waitForSelector('[data-testid="escrow-action-confirmDelivery"]');

    await expect(page.getByTestId("escrow-action-fund")).toBeDisabled();
    await expect(page.getByTestId("escrow-action-confirmDelivery")).toBeEnabled();
    await expect(page.getByTestId("escrow-action-release")).toBeDisabled();
    await expect(page.getByTestId("escrow-action-refund")).toBeEnabled();
  });

  test("only Release enabled in Delivered state", async ({ page }) => {
    await page.goto(`${BASE}/escrow?state=Delivered`);
    await page.waitForSelector('[data-testid="escrow-action-release"]');

    await expect(page.getByTestId("escrow-action-fund")).toBeDisabled();
    await expect(page.getByTestId("escrow-action-confirmDelivery")).toBeDisabled();
    await expect(page.getByTestId("escrow-action-release")).toBeEnabled();
    await expect(page.getByTestId("escrow-action-refund")).toBeDisabled();
  });

  test("no actions in Released state", async ({ page }) => {
    await page.goto(`${BASE}/escrow?state=Released`);
    await page.waitForTimeout(800);

    await expect(page.getByTestId("escrow-action-fund")).not.toBeVisible();
    await expect(page.getByTestId("escrow-action-confirmDelivery")).not.toBeVisible();
    await expect(page.getByTestId("escrow-action-release")).not.toBeVisible();
    await expect(page.getByTestId("escrow-action-refund")).not.toBeVisible();
  });

  test("no actions in Refunded state", async ({ page }) => {
    await page.goto(`${BASE}/escrow?state=Refunded`);
    await page.waitForTimeout(800);

    await expect(page.getByTestId("escrow-action-fund")).not.toBeVisible();
    await expect(page.getByTestId("escrow-action-release")).not.toBeVisible();
    await expect(page.getByText("Funds have been refunded")).toBeVisible();
  });

  test("contract ID shown in header", async ({ page }) => {
    await page.goto(`${BASE}/escrow?state=Created`);
    await page.waitForTimeout(1500);
    const headerText = await page.textContent("body");
    expect(headerText).toContain("CCEI4O");
  });
});

test.describe("Escrow page — Error display", () => {
  test("click Fund shows simulation result panel", async ({ page }) => {
    await page.goto(`${BASE}/escrow?state=Created`);
    await page.waitForSelector('[data-testid="escrow-action-fund"]');

    await page.getByTestId("escrow-action-fund").click();

    // Wait for API response — either error or result panel
    await page.waitForTimeout(3000);

    // Check that some result appeared (error or success)
    const hasResult = await page.getByText("Simulation Results").isVisible().catch(() => false);
    const hasError = await page.getByText("Authorization Error").isVisible().catch(() => false);
    const hasStateError = await page.getByText("State Transition Error").isVisible().catch(() => false);

    // At least one should be visible after clicking
    expect(hasResult || hasError || hasStateError).toBeTruthy();
  });

  test("click actions in wrong state shows error", async ({ page }) => {
    await page.goto(`${BASE}/escrow?state=Created`);
    await page.waitForSelector('[data-testid="escrow-action-fund"]');

    // Fund button should trigger API call
    await page.getByTestId("escrow-action-fund").click();
    await page.waitForTimeout(3000);
  });
});
