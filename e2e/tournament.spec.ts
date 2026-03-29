import { test, expect } from "@playwright/test";

const PLAYERS = "Alice\nBob\nCharlie\nDave";

async function fillPlayers(page: import("@playwright/test").Page) {
  await page.getByPlaceholder("1行に1人ずつ").fill(PLAYERS);
}

async function selectMode(page: import("@playwright/test").Page, label: string) {
  await page.getByText(label).click();
}

test.describe("トップページ", () => {
  test("タイトルが表示される", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Testament")).toBeVisible();
    await expect(page.getByText("簡易トーナメント生成ツール")).toBeVisible();
  });

  test("サンプルデータを追加できる", async ({ page }) => {
    await page.goto("/");
    // デフォルトで8人入っている
    await expect(page.getByText("8 人")).toBeVisible();
    // +追加で9人目
    await page.getByRole("button", { name: "+ 追加" }).click();
    await expect(page.getByText("9 人")).toBeVisible();
  });
});

test.describe("シングルエリミネーション", () => {
  test("生成して勝者を選択できる", async ({ page }) => {
    await page.goto("/");
    await fillPlayers(page);
    await selectMode(page, "シングルエリミネーション");
    await page.getByRole("button", { name: "トーナメント生成" }).click();

    await expect(page.getByText("シングルエリミネーション").first()).toBeVisible();

    // 1回戦の試合が表示される
    await expect(page.getByText("VS").first()).toBeVisible();
  });

  test("結果を取消できる", async ({ page }) => {
    await page.goto("/");
    await fillPlayers(page);
    await page.getByText("シャッフル ON").click();
    await selectMode(page, "シングルエリミネーション");
    await page.getByRole("button", { name: "トーナメント生成" }).click();

    // Alice をクリックして勝たせる
    const aliceBtn = page.getByRole("button", { name: "Alice" }).first();
    await aliceBtn.click();

    // 取消ボタンが表示される
    const undoBtn = page.getByText("取消").first();
    await expect(undoBtn).toBeVisible();

    // 取消
    await undoBtn.click();

    // 取消ボタンが消える（該当試合の結果がクリアされた）
    await expect(page.getByText("取消")).not.toBeVisible();
  });
});

test.describe("ラウンドロビン", () => {
  test("生成して全試合が表示される", async ({ page }) => {
    await page.goto("/");
    await fillPlayers(page);
    await selectMode(page, "ラウンドロビン（総当り）");
    await page.getByRole("button", { name: "トーナメント生成" }).click();

    await expect(page.getByText("ラウンドロビン（総当り）").first()).toBeVisible();
    await expect(page.getByText("順位表")).toBeVisible();

    // 4人の総当りは6試合
    const vsCount = await page.getByText("VS").count();
    expect(vsCount).toBe(6);
  });

  test("勝者を選択すると順位表が更新される", async ({ page }) => {
    await page.goto("/");
    await fillPlayers(page);
    await page.getByText("シャッフル ON").click();
    await selectMode(page, "ラウンドロビン（総当り）");
    await page.getByRole("button", { name: "トーナメント生成" }).click();

    // 最初の試合で Alice を勝たせる
    const aliceBtn = page.getByRole("button", { name: "Alice" }).first();
    await aliceBtn.click();

    // 順位表で Alice が 3pts
    const row = page.locator("tr").filter({ hasText: "Alice" });
    await expect(row.getByText("3")).toBeVisible();
  });

  test("引き分けが記録できる", async ({ page }) => {
    await page.goto("/");
    await fillPlayers(page);
    await page.getByText("シャッフル ON").click();
    await selectMode(page, "ラウンドロビン（総当り）");
    await page.getByRole("button", { name: "トーナメント生成" }).click();

    await page.getByText("引分").first().click();
    await expect(page.getByText("引き分け").first()).toBeVisible();
  });

  test("結果を取消できる", async ({ page }) => {
    await page.goto("/");
    await fillPlayers(page);
    await page.getByText("シャッフル ON").click();
    await selectMode(page, "ラウンドロビン（総当り）");
    await page.getByRole("button", { name: "トーナメント生成" }).click();

    const aliceBtn = page.getByRole("button", { name: "Alice" }).first();
    await aliceBtn.click();

    await page.getByText("取消").first().click();

    // 順位表の Alice が 0pts に戻る
    const row = page.locator("tr").filter({ hasText: "Alice" });
    await expect(row.getByText("0").first()).toBeVisible();
  });
});

test.describe("スイス式", () => {
  test("生成してラウンドが進行する", async ({ page }) => {
    await page.goto("/");
    await fillPlayers(page);
    await page.getByText("シャッフル ON").click();
    await selectMode(page, "スイス式");
    await page.getByRole("button", { name: "トーナメント生成" }).click();

    await expect(page.getByText("スイス式").first()).toBeVisible();
    // R1/2 が表示される（4人→2ラウンド）
    await expect(page.getByText("R1/2")).toBeVisible();
  });
});

test.describe("とことん対戦", () => {
  test("生成して試合が自動追加される", async ({ page }) => {
    await page.goto("/");
    await fillPlayers(page);
    await page.getByText("シャッフル ON").click();
    await selectMode(page, "とことん対戦");
    await page.getByRole("button", { name: "トーナメント生成" }).click();

    await expect(page.getByText("とことん対戦").first()).toBeVisible();
    await expect(page.locator("span", { hasText: "#1" })).toBeVisible();

    // 最初の試合の勝者を選ぶ
    await page.getByRole("button", { name: "Alice" }).first().click();

    // 次の試合 #2 が生成される
    await expect(page.locator("span", { hasText: "#2" })).toBeVisible();
  });

  test("結果を取消すると以降の試合が消える", async ({ page }) => {
    await page.goto("/");
    await fillPlayers(page);
    await page.getByText("シャッフル ON").click();
    await selectMode(page, "とことん対戦");
    await page.getByRole("button", { name: "トーナメント生成" }).click();

    // 1試合目を消化
    await page.getByRole("button", { name: "Alice" }).first().click();
    await expect(page.locator("span", { hasText: "#2" })).toBeVisible();

    // 2試合目を消化（未決着の試合のボタンをクリック）
    const undecidedButtons = page.locator("button:not([disabled])").filter({ hasNotText: /取消|引分|シャッフル|最初|トーナメント/ });
    await undecidedButtons.first().click();
    await expect(page.locator("span", { hasText: "#3" })).toBeVisible();

    // 最初の取消ボタンを押す（#1の結果を取消）
    await page.getByRole("button", { name: "取消" }).last().click();

    // #2, #3 が消えて #1 だけ残る
    await expect(page.locator("span", { hasText: "#2" })).not.toBeVisible();
  });
});

test.describe("最初に戻る", () => {
  test("トーナメント画面から入力画面に戻れる", async ({ page }) => {
    await page.goto("/");
    await fillPlayers(page);
    await page.getByRole("button", { name: "トーナメント生成" }).click();

    await page.getByText("最初に戻る").click();
    await expect(page.getByText("参加者を入力")).toBeVisible();
  });
});
