import { test, expect } from "@playwright/test";

test("生成ボタンのスタイル確認", async ({ page }) => {
  await page.goto("/");
  const btn = page.getByRole("button", { name: "トーナメント生成" });
  await expect(btn).toBeVisible();
  
  const box = await btn.boundingBox();
  console.log("Button boundingBox:", JSON.stringify(box));
  
  const styles = await btn.evaluate((el) => {
    const cs = window.getComputedStyle(el);
    return {
      height: cs.height,
      fontSize: cs.fontSize,
      paddingTop: cs.paddingTop,
      paddingBottom: cs.paddingBottom,
      display: cs.display,
      alignItems: cs.alignItems,
      lineHeight: cs.lineHeight,
    };
  });
  console.log("Button computed styles:", JSON.stringify(styles, null, 2));
  
  // ボタンの高さが56px(h-14)以上であること
  expect(box!.height).toBeGreaterThanOrEqual(50);
});
