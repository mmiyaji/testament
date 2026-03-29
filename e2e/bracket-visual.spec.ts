import { test, expect } from "@playwright/test";

test.describe("ブラケット接続線の確認", () => {
  test("4人シングルエリミネーション - ブラケット表示", async ({ page }) => {
    await page.goto("/");
    // デフォルト8人→4人にする（4行削除）
    await page.getByPlaceholder("1行に1人ずつ").fill("プレイヤー1\nプレイヤー2\nプレイヤー3\nプレイヤー4");
    // シャッフルOFF
    await page.getByText("シャッフル ON").click();
    await page.getByRole("button", { name: "トーナメント生成" }).click();

    await expect(page.getByText("シングルエリミネーション").first()).toBeVisible();
    await page.screenshot({ path: "test-results/bracket-4players.png", fullPage: true });
  });

  test("8人シングルエリミネーション - ブラケット表示", async ({ page }) => {
    await page.goto("/");
    // デフォルトで8人入っている
    // シャッフルOFF
    await page.getByText("シャッフル ON").click();
    await page.getByRole("button", { name: "トーナメント生成" }).click();

    await expect(page.getByText("シングルエリミネーション").first()).toBeVisible();
    await page.screenshot({ path: "test-results/bracket-8players.png", fullPage: true });
  });

  test("8人シングルエリミネーション - 試合進行後", async ({ page }) => {
    await page.goto("/");
    // シャッフルOFF
    await page.getByText("シャッフル ON").click();
    await page.getByRole("button", { name: "トーナメント生成" }).click();

    await expect(page.getByText("シングルエリミネーション").first()).toBeVisible();

    // 1回戦を全部消化（プレイヤー1,3,5,7を勝たせる）
    await page.getByRole("button", { name: "プレイヤー1" }).first().click();
    await page.getByRole("button", { name: "プレイヤー3" }).first().click();
    await page.getByRole("button", { name: "プレイヤー5" }).first().click();
    await page.getByRole("button", { name: "プレイヤー7" }).first().click();

    await page.screenshot({ path: "test-results/bracket-8players-progress.png", fullPage: true });
  });
});
