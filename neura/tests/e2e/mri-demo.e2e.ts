import { expect, test } from "@playwright/test";

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

test("opens the included MPRAGE on a touch screen without a local file", async ({
  page,
}) => {
  test.setTimeout(90_000);
  // Phones accessing a PC over HTTP do not expose crypto.randomUUID.
  await page.addInitScript(() =>
    Object.defineProperty(crypto, "randomUUID", { value: undefined }),
  );
  const errors: string[] = [];
  let downloads = 0;
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.url().endsWith("/demo/mprage.nii.gz")) downloads++;
  });
  await page.goto("/mri");
  const demoButton = page.getByRole("button", {
    name: "Открыть демо",
    exact: true,
  });
  await expect(demoButton).toBeInViewport();
  await expect(page.locator(".mri-demo-banner")).toContainText("3,3 МБ");
  await demoButton.tap();
  await expect(page.getByText("128 × 256 × 256", { exact: true })).toBeVisible({
    timeout: 45_000,
  });
  await expect(page.locator(".mri-viewer-heading .pill")).toHaveText("ДЕМО");
  await expect(page.locator(".mri-touch-hint")).toBeVisible();
  await expect(page.locator(".mri-mouse-hint")).toBeHidden();
  const viewer = await page.locator(".mri-content").boundingBox();
  const imports = await page.locator(".mri-sidebar").boundingBox();
  expect(viewer!.y).toBeLessThan(imports!.y);
  await page.getByRole("button", { name: "Аксиальный", exact: true }).tap();
  const canvas = page.locator(".mri-canvas-host canvas");
  const initial = await canvas.screenshot();
  const slider = page.getByLabel("Срез Z");
  const before = await slider.inputValue();
  await slider.tap({ position: { x: 18, y: 18 } });
  await expect(slider).not.toHaveValue(before);
  expect(Buffer.compare(initial, await canvas.screenshot())).not.toBe(0);
  await page
    .getByRole("button", { name: "Объёмный просмотр", exact: true })
    .tap();
  await expect(
    page.getByRole("button", { name: "Объёмный просмотр", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await canvas.scrollIntoViewIfNeeded();
  const beforeRotation = await canvas.screenshot();
  const bounds = (await canvas.boundingBox())!;
  const touch = await page.context().newCDPSession(page);
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      {
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height / 2,
        id: 0,
      },
    ],
  });
  for (let step = 1; step <= 8; step++) {
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: bounds.x + bounds.width / 2 + step * 8,
          y: bounds.y + bounds.height / 2 + step * 3,
          id: 0,
        },
      ],
    });
  }
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await touch.detach();
  expect(Buffer.compare(beforeRotation, await canvas.screenshot())).not.toBe(0);
  await page.screenshot({ path: "test-results/mri-demo-mobile-3d.png" });
  await page.getByRole("button", { name: "Три плоскости", exact: true }).tap();
  await page.getByLabel("Срез Z").fill("127");
  await page.getByLabel("Яркость").fill("10");
  await expect(page.getByLabel("Яркость")).toHaveValue("10");
  await page
    .getByRole("button", { name: "Сбросить настройки", exact: true })
    .tap();
  await demoButton.tap();
  await expect(page.locator(".mri-file-list li")).toHaveCount(1);
  expect(downloads).toBe(1);
  await expect(page.locator(".mri-viewer-card")).toBeInViewport();
  await page.screenshot({ path: "test-results/mri-demo-mobile-mpr.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const history = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("neura.v1.mri") || "[]"),
  );
  expect(history).toHaveLength(1);
  expect(history[0]).toMatchObject({ source: "example", simulated: false });
  expect(errors).toEqual([]);
});

test("can retry a failed demo download", async ({ page }) => {
  let requests = 0;
  await page.route("**/demo/mprage.nii.gz", async (route) => {
    if (++requests === 1)
      await route.fulfill({ status: 503, body: "Unavailable" });
    else await route.continue();
  });
  await page.goto("/mri");
  await page.getByRole("button", { name: "Открыть демо", exact: true }).tap();
  await expect(page.getByRole("alert")).toContainText(
    "Не удалось загрузить демо",
  );
  await expect(page.locator(".mri-file-list li")).toHaveCount(0);
  await page.getByRole("button", { name: "Открыть демо", exact: true }).tap();
  await expect(page.getByText("128 × 256 × 256", { exact: true })).toBeVisible({
    timeout: 45_000,
  });
  await expect(page.locator(".mri-demo-error")).toHaveCount(0);
});
