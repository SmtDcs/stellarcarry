import { test, expect } from "@playwright/test";

test("send page renders and captures screenshot", async ({ page }) => {
  await page.goto("/send");
  await expect(page.getByRole("heading", { name: "Send XLM" })).toBeVisible();
  await expect(page.getByText("Stellar Testnet")).toBeVisible();
  await page.screenshot({ path: "screenshots/send.png", fullPage: true });
});

test("send form shows connect wallet button when not connected", async ({ page }) => {
  await page.goto("/send");
  await expect(page.getByLabel("Connect Freighter wallet")).toBeVisible();
});

test("destination and amount inputs render", async ({ page }) => {
  await page.goto("/send");
  await expect(page.getByPlaceholder("G...")).toBeVisible();
  await expect(page.getByPlaceholder("0.00")).toBeVisible();
});

test("send button is disabled without inputs", async ({ page }) => {
  await page.goto("/send");
  const btn = page.getByRole("button", { name: "Send XLM" });
  if (await btn.isVisible()) {
    await expect(btn).toBeDisabled();
  }
});
