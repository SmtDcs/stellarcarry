import { test, expect } from "@playwright/test";

test("kit gallery renders and captures screenshot", async ({ page }) => {
  await page.goto("/kit");
  await expect(page.getByRole("heading", { name: /Departures.*Design Kit/i })).toBeVisible();

  // Scroll through the page so whileInView animations trigger
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y < h; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1200);

  // Verify all sections render
  await expect(page.getByText("Brand")).toBeVisible();
  await expect(page.getByText("FlightArc")).toBeVisible();
  await expect(page.getByText("StarMapRoute")).toBeVisible();
  await expect(page.getByText("BoardingPassCard")).toBeVisible();
  await expect(page.getByText("DepartureBoard")).toBeVisible();
  await expect(page.getByText("PassportStamp")).toBeVisible();
  await expect(page.getByText("PassportPage")).toBeVisible();
  await expect(page.getByText("VaultSeal")).toBeVisible();

  await page.screenshot({ path: "screenshots/kit-gallery.png", fullPage: true });
});
