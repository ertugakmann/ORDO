import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import path from "node:path";

const menuPdf = path.join(__dirname, "fixtures/menu.pdf");

test("main screens have no automatically detectable accessibility problems", async ({
  page,
  browser,
}) => {
  async function checkAccessibility(label: string, target = page) {
    const results = await new AxeBuilder({ page: target })
      .withTags(["wcag2a", "wcag2aa"])
      // The Next.js dev overlay is not part of the app.
      .exclude("nextjs-portal")
      .analyze();
    const problems = results.violations.map(
      (v) => `${label}: ${v.id} (${v.nodes.length}) ${v.help}`,
    );
    expect(problems).toEqual([]);
  }

  await page.goto("/");
  await expect(page.getByText("Server status: online")).toBeVisible();
  await checkAccessibility("home");

  await page.getByLabel("Party name").fill("Friday Dinner");
  await page.getByRole("button", { name: "Create party" }).click();
  await page.getByLabel(/Upload the restaurant menu/).setInputFiles(menuPdf);
  await page.getByRole("button", { name: "Upload menu" }).click();
  await expect(page.getByRole("heading", { name: "Starters" })).toBeVisible();
  await checkAccessibility("menu review");

  await page.getByRole("button", { name: "Confirm menu" }).click();
  await expect(page.getByText(/Your menu is confirmed/)).toBeVisible();
  await checkAccessibility("leader page");

  const joinLink = await page.locator("code").first().innerText();
  const guest = await (await browser.newContext()).newPage();
  await guest.goto(joinLink);
  await checkAccessibility("join form", guest);

  await guest.getByLabel("Your name").fill("Ahmet");
  await guest.getByRole("button", { name: "Join party" }).click();
  await expect(guest.getByRole("heading", { name: "Starters" })).toBeVisible();
  await guest.getByRole("button", { name: "Add one Hummus" }).click();
  await checkAccessibility("guest menu", guest);
});
