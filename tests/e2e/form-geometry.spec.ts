import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const HEIGHT = 44;
const QUERY_LABEL = "Title, author or ISBN";

type Box = { x: number; width: number; height: number };
type FieldShape = {
  box: Box;
  style: { radius: number; border: number; fontSize: number; background: string };
};

async function readField(page: Page, label: string) {
  const field = page.getByLabel(label, { exact: true });
  await expect(field).toBeVisible();
  const measured = await field.boundingBox();
  if (!measured) throw new Error(`No box for ${label}`);
  const style = await field.evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      radius: Number.parseFloat(computed.borderTopLeftRadius),
      border: Number.parseFloat(computed.borderTopWidth),
      fontSize: Number.parseFloat(computed.fontSize),
      background: computed.backgroundColor,
    };
  });
  const box: Box = { x: measured.x, width: measured.width, height: measured.height };
  return { field, box, style };
}

function expectSharedFieldShape({ box, style }: FieldShape, minimumFontSize = 15) {
  expect(box.height).toBeGreaterThanOrEqual(HEIGHT);
  expect(style.radius).toBeGreaterThan(0);
  expect(style.border).toBeGreaterThan(0);
  expect(style.fontSize).toBeGreaterThanOrEqual(minimumFontSize);
  expect(style.background).toBe("rgb(255, 255, 255)");
}

test("demo catalogue search keeps the shared control geometry at desktop width", async ({
  page,
}) => {
  await page.goto("/?demo=1#/search");
  const { field, box, style } = await readField(page, QUERY_LABEL);

  expectSharedFieldShape({ box, style });
  expect(box.width).toBeGreaterThanOrEqual(240);
  await expect(field).toHaveAttribute("placeholder", QUERY_LABEL);

  await field.fill("Meditations");
  await expect(field).toHaveValue("Meditations");
  await expect(page.getByText("1 match", { exact: true })).toBeVisible();
});

test("demo catalogue search still fits a phone without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 720 });
  await page.goto("/?demo=1#/search");
  const { box, style } = await readField(page, QUERY_LABEL);

  // 16px on small screens stops iOS from zooming the page when the field takes focus.
  expectSharedFieldShape({ box, style }, 16);
  expect(box.width).toBeGreaterThanOrEqual(240);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(360);
});

test("account catalogue search reuses the same control geometry", async ({ signedInPage }) => {
  const { field, box, style } = await readField(signedInPage, QUERY_LABEL);

  expectSharedFieldShape({ box, style });
  expect(box.width).toBeGreaterThanOrEqual(240);
  await expect(field).toHaveAttribute("placeholder", QUERY_LABEL);
});
