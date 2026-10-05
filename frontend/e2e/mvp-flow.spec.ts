import { expect, test } from "@playwright/test";
import path from "node:path";

const menuPdf = path.join(__dirname, "fixtures/menu.pdf");
const notesFile = path.join(__dirname, "fixtures/notes.txt");

test("a group goes from creating a party to one restaurant order", async ({
  page,
  browser,
}) => {
  // Any error in the browser console fails the test.
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });

  // --- Leader creates a party ---
  await page.goto("/");
  await expect(page).toHaveTitle(/ORDO/);
  await expect(page.getByText("Server status: online")).toBeVisible();
  await page.getByLabel("Party name").fill("Friday Dinner");
  await page.getByRole("button", { name: "Create party" }).click();
  await expect(page).toHaveURL(/\/party\/[A-Z0-9]{6}$/);
  await expect(
    page.getByRole("heading", { name: "Friday Dinner" }),
  ).toBeVisible();

  // --- Upload: a wrong file type is rejected with a clear message ---
  await page.getByLabel(/Upload the restaurant menu/).setInputFiles(notesFile);
  await page.getByRole("button", { name: "Upload menu" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Please upload a PDF file",
  );

  // The browser logs that expected 400 response; ignore it.
  browserErrors.length = 0;

  // --- Upload the real menu and review the parsed result ---
  await page.getByLabel(/Upload the restaurant menu/).setInputFiles(menuPdf);
  await page.getByRole("button", { name: "Upload menu" }).click();
  await expect(page.getByRole("heading", { name: "Starters" })).toBeVisible();
  await expect(page.getByText("Chickpea, tahini, lemon")).toBeVisible();
  await expect(page.getByText("£15.00")).toBeVisible();

  // --- Edit: rename an item, delete one, add a missing one ---
  await page.getByRole("button", { name: "Edit Coke" }).click();
  await page.getByLabel("Name").first().fill("Cola");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Cola", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Delete Lahmacun" }).click();
  await expect(page.getByText("Lahmacun")).toHaveCount(0);

  const addForm = page
    .getByRole("button", { name: "Add item" })
    .locator("xpath=ancestor::form");
  await addForm.getByLabel("Name").fill("Baklava");
  await addForm.getByLabel("Price").fill("4.50");
  await addForm.getByLabel("Category").fill("Desserts");
  await addForm.getByRole("button", { name: "Add item" }).click();
  await expect(page.getByRole("heading", { name: "Desserts" })).toBeVisible();

  // --- Confirm and share ---
  await page.getByRole("button", { name: "Confirm menu" }).click();
  await expect(page.getByText(/Your menu is confirmed/)).toBeVisible();
  const joinLink = await page.locator("code").innerText();
  expect(joinLink).toMatch(/\/join\/[A-Z0-9]{6}$/);

  // --- Guests join in their own browsers ---
  async function guestOrders(name: string, lines: [string, number][]) {
    const context = await browser.newContext();
    const guest = await context.newPage();
    await guest.goto(joinLink);
    await guest.getByLabel("Your name").fill(name);
    await guest.getByRole("button", { name: "Join party" }).click();
    await expect(
      guest.getByRole("heading", { name: "Starters" }),
    ).toBeVisible();
    for (const [item, quantity] of lines) {
      for (let i = 0; i < quantity; i++) {
        await guest.getByRole("button", { name: `Add one ${item}` }).click();
      }
    }
    return { context, guest };
  }

  const ahmet = await guestOrders("Ahmet", [
    ["Adana Kebab", 2],
    ["Hummus", 1],
  ]);
  await expect(ahmet.guest.getByText("Total: £36.50")).toBeVisible();
  await ahmet.guest.getByRole("button", { name: "Submit order" }).click();
  await expect(
    ahmet.guest.getByText("Order submitted successfully."),
  ).toBeVisible();

  // Reloading shows the submitted order, not an empty menu.
  await ahmet.guest.reload();
  await expect(
    ahmet.guest.getByText("Order submitted successfully."),
  ).toBeVisible();

  const mehmet = await guestOrders("Mehmet", [
    ["Adana Kebab", 3],
    ["Cola", 4],
  ]);
  await mehmet.guest.getByRole("button", { name: "Submit order" }).click();
  await expect(
    mehmet.guest.getByText("Order submitted successfully."),
  ).toBeVisible();

  // A third guest joins but has not ordered yet.
  const ertug = await guestOrders("Ertug", []);

  // --- Leader sees everything (the page refreshes by itself) ---
  const orders = page.locator("section", {
    has: page.getByRole("heading", { name: "Orders" }),
  });
  await expect(orders.getByText("2 of 3 submitted")).toBeVisible({
    timeout: 15000,
  });
  await expect(orders.getByText("£36.50")).toBeVisible();
  await expect(orders.getByText("£55.00")).toBeVisible();
  await expect(orders.getByText("Not submitted")).toBeVisible();
  await expect(orders.getByText("Group total: £91.50")).toBeVisible();

  const restaurant = page.locator("section", {
    has: page.getByRole("heading", { name: "Restaurant order" }),
  });
  await expect(restaurant.getByText("Adana Kebab")).toBeVisible();
  await expect(restaurant.getByText("× 5")).toBeVisible();
  await expect(restaurant.getByText("× 4")).toBeVisible();
  await expect(restaurant.getByText("10 items · £91.50")).toBeVisible();

  for (const { context } of [ahmet, mehmet, ertug]) await context.close();
  expect(browserErrors).toEqual([]);
});

test("shows clear errors for bad links and an unreachable guest page", async ({
  page,
}) => {
  await page.goto("/join/NOPE00");
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Invalid join code",
  );

  await page.goto("/party/NOPE00");
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Invalid join code",
  );
});

test("the layout fits a phone screen", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto("/");
  await page.getByLabel("Party name").fill("Phone Party");
  await page.getByRole("button", { name: "Create party" }).click();
  await page.getByLabel(/Upload the restaurant menu/).setInputFiles(menuPdf);
  await page.getByRole("button", { name: "Upload menu" }).click();
  await expect(page.getByRole("heading", { name: "Starters" })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("shows an error when the server is down", async ({ page }) => {
  await page.route("**/health", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Unable to reach the ORDO server.",
  );
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});
