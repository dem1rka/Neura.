import { expect, test, type Page } from "@playwright/test";
import { gzipSync } from "node:zlib";

// A generated geometric volume; no patient data or downloaded medical images.
function nifti(dimensions = [32, 40, 24]) {
  const [nx, ny, nz] = dimensions;
  const buffer = Buffer.alloc(352 + nx * ny * nz);
  buffer.writeInt32LE(348, 0);
  [3, nx, ny, nz, 1, 1, 1, 1].forEach((value, index) =>
    buffer.writeInt16LE(value, 40 + index * 2),
  );
  buffer.writeInt16LE(2, 70); // UINT8
  buffer.writeInt16LE(8, 72);
  [1, 1, 2, 3, 1, 1, 1, 1].forEach((value, index) =>
    buffer.writeFloatLE(value, 76 + index * 4),
  );
  buffer.writeFloatLE(352, 108);
  buffer.writeFloatLE(1, 112);
  buffer[123] = 2; // millimetres
  buffer.writeInt16LE(1, 254); // sform
  [1, 0, 0, -nx / 2, 0, 2, 0, -ny, 0, 0, 3, -nz * 1.5].forEach((value, index) =>
    buffer.writeFloatLE(value, 280 + index * 4),
  );
  buffer.write("n+1\0", 344, "ascii");
  for (let z = 0; z < nz; z++)
    for (let y = 0; y < ny; y++)
      for (let x = 0; x < nx; x++) {
        const radius =
          ((x - nx / 2) / (nx * 0.4)) ** 2 +
          ((y - ny / 2) / (ny * 0.4)) ** 2 +
          ((z - nz / 2) / (nz * 0.4)) ** 2;
        buffer[352 + x + nx * (y + ny * z)] =
          radius < 1 ? Math.round(60 + 160 * (1 - radius)) : 0;
      }
  return buffer;
}
const first = {
  name: "synthetic_0051456.nii",
  mimeType: "application/octet-stream",
  buffer: nifti(),
};
const second = {
  name: "synthetic_0051457.nii.gz",
  mimeType: "application/gzip",
  buffer: gzipSync(nifti([24, 28, 20])),
};

async function openViewer(page: Page) {
  await page.goto("/mri");
  await expect(
    page.getByText("Каждая деталь — часть целого", { exact: true }),
  ).toBeVisible({ timeout: 30_000 });
}

test("loads NIfTI and gzip, changes rendering, matches CSV and records only successful views", async ({
  page,
}) => {
  const errors: string[] = [];
  const uploads: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.method() === "POST" || request.method() === "PUT")
      uploads.push(request.url());
  });
  await openViewer(page);
  await page.getByLabel("Выберите МРТ-файлы").setInputFiles([first, second]);
  await expect(page.getByText("32 × 40 × 24", { exact: true })).toBeVisible();
  await expect(page.getByText("1 × 2 × 3 mm", { exact: true })).toBeVisible();
  await expect(page.getByText("UINT8", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Срез X")).toBeEnabled();
  await page.locator(".mri-affine summary").click();
  await expect(page.locator(".mri-matrix > div")).toHaveCount(4);
  const canvas = page.locator(".mri-canvas-host canvas");
  const mpr = await canvas.screenshot();
  await page.getByRole("button", { name: "Аксиальный", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Аксиальный", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const axial = await canvas.screenshot();
  expect(Buffer.compare(mpr, axial)).not.toBe(0);
  await page.getByLabel("Срез Z").fill("5");
  await expect(page.getByLabel("Срез Z")).toHaveValue("5");
  expect(Buffer.compare(axial, await canvas.screenshot())).not.toBe(0);
  for (const name of ["Сагиттальный", "Корональный"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(
      page.getByRole("button", { name, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  }
  await page.getByLabel("Яркость").fill("30");
  await page.getByLabel("Контраст").fill("1.5");
  await page.getByLabel("Цветовая схема").selectOption("viridis");
  await page
    .getByRole("button", { name: "Объёмный просмотр", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Объёмный просмотр", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Сбросить настройки", exact: true })
    .click();
  await expect(page.getByLabel("Яркость")).toHaveValue("0");
  await expect(page.getByLabel("Цветовая схема")).toHaveValue("gray");
  await page
    .getByLabel("Выберите CSV-файл")
    .setInputFiles({
      name: "phenotype.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        "\ufeffsub_id,dx_group,age_at_scan,sex,site_id\n51456,1,12,1,TEST_A\n51457,2,13,2,TEST_B\n",
      ),
    });
  await expect(page.getByText("Записей: 2", { exact: true })).toBeVisible();
  await expect(page.getByText("TEST_A", { exact: true })).toBeVisible();
  await page.getByLabel("SUB_ID", { exact: true }).fill("0051457");
  await expect(page.getByText("TEST_B", { exact: true })).toBeVisible();
  await expect(page.getByText("Женский", { exact: true })).toBeVisible();
  // Editing phenotype matching must not trigger a scan reload/history entry.
  await expect(page.getByText("32 × 40 × 24", { exact: true })).toBeVisible();
  await page
    .locator(".mri-file-list button")
    .filter({ hasText: second.name })
    .click();
  await expect(page.getByText("24 × 28 × 20", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Три плоскости", exact: true })
    .click();
  await page.screenshot({
    path: "test-results/mri-loaded-light.png",
    fullPage: true,
  });
  const history = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("neura.v1.mri") || "[]"),
  );
  expect(history).toHaveLength(2);
  for (const entry of history) {
    expect(Object.keys(entry).sort()).toEqual([
      "completedAt",
      "id",
      "simulated",
      "source",
    ]);
    expect(entry.simulated).toBe(false);
  }
  await page
    .getByRole("button", { name: `Убрать файл ${second.name}`, exact: true })
    .click();
  await expect(page.getByText("32 × 40 × 24", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Обзор", exact: true }).click();
  await expect(
    page.getByText("Локальный просмотр МРТ", { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Просмотр МРТ LAB", exact: true })
    .click();
  await expect(
    page.getByText("Каждая деталь — часть целого", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".mri-file-list")).toHaveCount(0);
  await expect(page.locator(".mri-canvas-host canvas")).toHaveCount(1);
  expect(uploads).toEqual([]);
  expect(errors).toEqual([]);
});

test("recovers from invalid imports and removing a volume during loading", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openViewer(page);
  await page
    .getByLabel("Выберите МРТ-файлы")
    .setInputFiles([
      {
        name: "notes.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("invalid"),
      },
      first,
    ]);
  await expect(page.getByRole("alert")).toContainText("notes.txt");
  await expect(page.getByText("32 × 40 × 24", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: `Убрать файл ${first.name}`, exact: true })
    .click();
  await page
    .getByLabel("Выберите МРТ-файлы")
    .setInputFiles({
      name: "broken.nii",
      mimeType: "application/octet-stream",
      buffer: Buffer.alloc(400),
    });
  await expect(
    page.getByText("Не удалось открыть снимок", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Убрать файл broken.nii", exact: true })
    .click();
  await expect(
    page.getByText("Каждая деталь — часть целого", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Выберите CSV-файл")
    .setInputFiles({
      name: "wrong.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("AGE,SEX\n12,1\n"),
    });
  await expect(
    page.getByText("В CSV не найден обязательный столбец SUB_ID.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel("Выберите МРТ-файлы").setInputFiles([first, second]);
  await page
    .getByRole("button", { name: `Убрать файл ${first.name}`, exact: true })
    .click();
  await page
    .getByRole("button", { name: `Убрать файл ${second.name}`, exact: true })
    .click();
  await expect(
    page.getByText("Каждая деталь — часть целого", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Срез X")).toBeDisabled();
  await page.getByLabel("Выберите МРТ-файлы").setInputFiles(second);
  await expect(page.getByText("24 × 28 × 20", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("shares Neura theme and languages and fits a mobile screen", async ({
  page,
}) => {
  await openViewer(page);
  await page.screenshot({
    path: "test-results/mri-empty-light.png",
    fullPage: true,
  });
  await page.getByLabel("Выберите МРТ-файлы").setInputFiles(first);
  await expect(page.getByText("32 × 40 × 24", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Тёмная тема", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({
    path: "test-results/mri-loaded-dark.png",
    fullPage: true,
  });
  await page.locator(".language-control select").selectOption("en");
  await expect(
    page.getByRole("heading", {
      name: "MRI. From the whole to the details.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText("32 × 40 × 24", { exact: true })).toBeVisible();
  await page.locator(".language-control select").selectOption("kk");
  await expect(
    page.getByRole("heading", {
      name: "МРТ. Тұтас бейнеден бөлшектерге.",
      exact: true,
    }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/mri-mobile-dark.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.locator(".language-control select").selectOption("ru");
  await page.getByRole("button", { name: "Светлая тема", exact: true }).click();
  await page.screenshot({
    path: "test-results/mri-mobile-light.png",
    fullPage: true,
  });
});

test("other Neura pages still open", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const route of [
    "/",
    "/dashboard",
    "/game",
    "/game/report",
    "/questionnaire",
    "/questionnaire/report",
    "/about",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1, h2").first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Страница не найдена");
  }
  expect(errors).toEqual([]);
});
