import { test } from "@playwright/test";

test("シャッフルチェックボックス周辺", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: /シャッフル/ });
  await toggle.screenshot({ path: "design-mockups/shuffle-area.png" });
  
  const styles = await toggle.evaluate((el) => {
    const cs = window.getComputedStyle(el);
    return { display: cs.display, alignItems: cs.alignItems, gap: cs.gap };
  });
  console.log("Label styles:", JSON.stringify(styles));
  
  const box = await toggle.boundingBox();
  console.log("Toggle box:", JSON.stringify(box));
});
