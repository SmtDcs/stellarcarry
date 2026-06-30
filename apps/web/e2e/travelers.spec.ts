import { test, expect } from "@playwright/test";

test("travelers page renders and captures screenshot", async ({ page }) => {
  await page.goto("/travelers");
  await expect(page.getByRole("heading", { name: "Travelers", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add traveler" })).toBeVisible();
  // Scroll through the page so whileInView animations trigger
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y < h; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "screenshots/travelers.png", fullPage: true });
});

test("traveler cards render with seed data", async ({ page }) => {
  await page.goto("/travelers");
  await expect(page.getByText("24 of 24 travelers")).toBeVisible();
  await expect(page.getByText("TR → DE")).toHaveCount(6);
});

test("filters narrow the directory", async ({ page }) => {
  await page.goto("/travelers");
  await expect(page.getByText("24 of 24 travelers")).toBeVisible();
  // 10 of 24 travelers have reputation >= 90.
  await page.getByTestId("filter-rep-90").click();
  await expect(page.getByText("10 of 24 travelers")).toBeVisible();
  // Search narrows to a single carrier by account.
  await page.getByTestId("filter-rep-0").click();
  await page.getByTestId("filter-search").fill("GTRAV3");
  await expect(page.getByText("1 of 24 travelers")).toBeVisible();
});

test("add traveler form opens and closes", async ({ page }) => {
  await page.goto("/travelers");
  await page.getByRole("button", { name: "Add traveler" }).click();
  await expect(page.getByRole("textbox", { name: "From country" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "To country" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Travel day" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Capacity (g)" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Reputation (0–100)" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("textbox", { name: "From country" })).not.toBeVisible();
});

test("add traveler submits and shows new card", async ({ page }) => {
  await page.goto("/travelers");
  await page.getByRole("button", { name: "Add traveler" }).click();
  await page.getByRole("textbox", { name: "From country" }).fill("US");
  await page.getByRole("textbox", { name: "To country" }).fill("JP");
  await page.getByRole("textbox", { name: "Travel day" }).fill("30");
  await page.getByRole("textbox", { name: "Capacity (g)" }).fill("2000");
  await page.getByRole("textbox", { name: "Reputation (0–100)" }).fill("95");
  await page.getByRole("button", { name: "Add traveler" }).click();
  // Adding a traveler grows the directory count from 24 to 25.
  await expect(page.getByText("25 of 25 travelers")).toBeVisible();
});
