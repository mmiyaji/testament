import { test, expect } from "@playwright/test";

test.describe("ダブルエリミネーション", () => {
  test("4人 - 全フロー確認", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    await page.getByPlaceholder("1行に1人ずつ").fill("Alice\nBob\nCharlie\nDave");
    await page.getByText("シャッフル ON").click();
    await page.getByText("ダブルエリミネーション").click();
    await page.getByRole("button", { name: "トーナメント生成" }).click();

    await expect(page.getByText("ダブルエリミネーション").first()).toBeVisible();

    // WR1: Alice vs Bob → Alice勝ち
    await page.getByRole("button", { name: "Alice" }).first().click();
    // WR1: Charlie vs Dave → Charlie勝ち
    await page.getByRole("button", { name: "Charlie" }).first().click();

    await page.screenshot({ path: "test-results/de-4-wr1-done.png", fullPage: false });

    // WF: Alice vs Charlie → Alice勝ち（enabledなAliceボタンを探す）
    await page.getByRole("button", { name: "Alice" }).and(page.locator(":not([disabled])")).first().click();

    await page.screenshot({ path: "test-results/de-4-wf-done.png", fullPage: false });

    // Losersタブ
    await page.getByText("敗者側").click();
    await page.screenshot({ path: "test-results/de-4-losers-before.png", fullPage: false });

    // LR1: Bob vs Dave → Bob勝ち
    await page.getByRole("button", { name: "Bob" }).and(page.locator(":not([disabled])")).first().click();
    await page.screenshot({ path: "test-results/de-4-lr1-done.png", fullPage: false });

    // LR2: Bob vs Charlie(WF敗者) → Bob勝ち
    await page.getByRole("button", { name: "Bob" }).and(page.locator(":not([disabled])")).first().click();
    await page.screenshot({ path: "test-results/de-4-lr2-done.png", fullPage: false });

    // GFタブ
    await page.getByText("グランドファイナル").click();
    await page.screenshot({ path: "test-results/de-4-gf-before.png", fullPage: false });

    // GF: Alice vs Bob → Alice勝ち
    await page.getByRole("button", { name: "Alice" }).and(page.locator(":not([disabled])")).first().click();

    await expect(page.getByText("優勝")).toBeVisible();
    await page.screenshot({ path: "test-results/de-4-finished.png", fullPage: false });
  });

  test("8人 - 初期ブラケット構造", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    await page.getByText("シャッフル ON").click();
    await page.getByText("ダブルエリミネーション").click();
    await page.getByRole("button", { name: "トーナメント生成" }).click();

    await page.screenshot({ path: "test-results/de-8-winners.png", fullPage: false });

    await page.getByText("敗者側").click();
    await page.screenshot({ path: "test-results/de-8-losers.png", fullPage: false });
  });
});
