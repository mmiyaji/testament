import { test } from "@playwright/test";

test("ボタン周辺のスクリーンショット", async ({ page }) => {
  await page.goto("/");
  await page.screenshot({ path: "design-mockups/app-current.png", fullPage: true });
});
