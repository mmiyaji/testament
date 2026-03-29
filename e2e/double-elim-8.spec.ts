import { test, expect } from "@playwright/test";

test("8人ダブルエリミネーション - 全フロー", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.getByText("シャッフル ON").click();
  await page.getByText("ダブルエリミネーション").click();
  await page.getByRole("button", { name: "トーナメント生成" }).click();

  await expect(page.getByText("ダブルエリミネーション").first()).toBeVisible();

  // WR1: 1vs2→1, 3vs4→3, 5vs6→5, 7vs8→7
  await page.getByRole("button", { name: "プレイヤー1" }).first().click();
  await page.getByRole("button", { name: "プレイヤー3" }).first().click();
  await page.getByRole("button", { name: "プレイヤー5" }).first().click();
  await page.getByRole("button", { name: "プレイヤー7" }).first().click();

  await page.screenshot({ path: "test-results/de8-wr1-done.png", fullPage: false });

  // WR2: 1vs3→1, 5vs7→5
  await page.getByRole("button", { name: "プレイヤー1" }).and(page.locator(":not([disabled])")).first().click();
  await page.getByRole("button", { name: "プレイヤー5" }).and(page.locator(":not([disabled])")).first().click();

  await page.screenshot({ path: "test-results/de8-wr2-done.png", fullPage: false });

  // WF: 1vs5→1
  await page.getByRole("button", { name: "プレイヤー1" }).and(page.locator(":not([disabled])")).first().click();

  await page.screenshot({ path: "test-results/de8-wf-done.png", fullPage: false });

  // Losersタブ
  await page.getByText("敗者側").click();
  await page.screenshot({ path: "test-results/de8-losers-initial.png", fullPage: false });

  // LR1: 2vs4→2, 6vs8→6
  await page.getByRole("button", { name: "プレイヤー2" }).and(page.locator(":not([disabled])")).first().click();
  await page.getByRole("button", { name: "プレイヤー6" }).and(page.locator(":not([disabled])")).first().click();

  await page.screenshot({ path: "test-results/de8-lr1-done.png", fullPage: false });

  // LR2: 2vsWR2敗者(3), 6vsWR2敗者(7)
  // WR2敗者: 3と7がLR2に落ちているはず
  await page.screenshot({ path: "test-results/de8-lr2-before.png", fullPage: false });

  await page.getByRole("button", { name: "プレイヤー2" }).and(page.locator(":not([disabled])")).first().click();
  await page.getByRole("button", { name: "プレイヤー6" }).and(page.locator(":not([disabled])")).first().click();

  await page.screenshot({ path: "test-results/de8-lr2-done.png", fullPage: false });

  // LR3: 2vs6
  await page.getByRole("button", { name: "プレイヤー2" }).and(page.locator(":not([disabled])")).first().click();

  await page.screenshot({ path: "test-results/de8-lr3-done.png", fullPage: false });

  // LR4: 2vsWF敗者(5)
  await page.getByRole("button", { name: "プレイヤー2" }).and(page.locator(":not([disabled])")).first().click();

  await page.screenshot({ path: "test-results/de8-lr4-done.png", fullPage: false });

  // GF
  await page.getByText("グランドファイナル").click();
  await page.getByRole("button", { name: "プレイヤー1" }).and(page.locator(":not([disabled])")).first().click();

  await expect(page.getByText("優勝")).toBeVisible();
  await page.screenshot({ path: "test-results/de8-finished.png", fullPage: false });
});
