import { test, expect } from "@playwright/test";

test("home renders and captures screenshot", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Post a request" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse travelers" })).toBeVisible();
  // Scroll through the page so whileInView animations trigger (else below-the-fold
  // content stays at opacity:0 and is invisible in the fullPage screenshot).
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y < h; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "screenshots/home.png", fullPage: true });
});

test("primary buttons are interactive", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Post a request" }).click();
  await expect(page).toHaveURL("/post");
  await page.goto("/");
  await page.getByRole("link", { name: "Browse travelers" }).click();
  await expect(page).toHaveURL("/travelers");
});
