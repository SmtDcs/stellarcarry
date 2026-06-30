import { test, expect } from "@playwright/test";

test("post page renders and captures screenshot", async ({ page }) => {
  await page.goto("/post");
  await expect(page.getByRole("heading", { name: "Post a request" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "From country" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "To country" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Item weight (g)" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Reward (XLM)" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Deadline (day)" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Post request" })).toBeVisible();
  await page.waitForTimeout(1500);
  // Scroll through the page so whileInView animations trigger
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y < h; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "screenshots/post.png", fullPage: true });
});

test("post form validation shows inline errors", async ({ page }) => {
  await page.goto("/post");
  await page.getByRole("button", { name: "Post request" }).click();
  await expect(page.getByText("From country is required")).toBeVisible();
  await expect(page.getByText("To country is required")).toBeVisible();
  await expect(page.getByText("Weight is required")).toBeVisible();
  await expect(page.getByText("Reward is required")).toBeVisible();
  await expect(page.getByText("Deadline is required")).toBeVisible();
});

test("post form submits successfully with valid data", async ({ page }) => {
  await page.goto("/post");
  await page.getByRole("textbox", { name: "From country" }).fill("TR");
  await page.getByRole("textbox", { name: "To country" }).fill("DE");
  await page.getByRole("textbox", { name: "Item weight (g)" }).fill("500");
  await page.getByRole("textbox", { name: "Reward (XLM)" }).fill("5");
  await page.getByRole("textbox", { name: "Deadline (day)" }).fill("100");
  await page.getByRole("button", { name: "Post request" }).click();
  await expect(page.getByText("Request posted!")).toBeVisible();
  await expect(page.getByRole("button", { name: "Post another request" })).toBeVisible();
});

test("post form can reset after success", async ({ page }) => {
  await page.goto("/post");
  await page.getByRole("textbox", { name: "From country" }).fill("TR");
  await page.getByRole("textbox", { name: "To country" }).fill("DE");
  await page.getByRole("textbox", { name: "Item weight (g)" }).fill("500");
  await page.getByRole("textbox", { name: "Reward (XLM)" }).fill("5");
  await page.getByRole("textbox", { name: "Deadline (day)" }).fill("100");
  await page.getByRole("button", { name: "Post request" }).click();
  await expect(page.getByText("Request posted!")).toBeVisible();
  await page.getByRole("button", { name: "Post another request" }).click();
  await expect(page.getByRole("heading", { name: "Post a request" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Post request" })).toBeVisible();
});
