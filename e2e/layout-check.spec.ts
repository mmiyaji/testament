import { test, expect } from "@playwright/test";

test("トーナメント表示 - 初期状態", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.getByText("シャッフル ON").click();
  await page.getByRole("button", { name: "トーナメント生成" }).click();
  await expect(page.getByText("シングルエリミネーション").first()).toBeVisible();
  await page.screenshot({ path: "test-results/layout-initial.png", fullPage: true });
});
