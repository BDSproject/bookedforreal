import { expect, test } from "@playwright/test";

test("home page is localized and has hreflang", async ({ page }) => {
  await page.goto("/fr");

  await expect(page).toHaveTitle(/Bookedforreal/);
  await expect(page.locator("h1")).toContainText("Réservez votre coupe en 3 clics");

  // hreflang alternates (fr, en, x-default) present in <head>.
  const hrefLangs = await page
    .locator('link[rel="alternate"]')
    .evaluateAll((links) => links.map((l) => l.getAttribute("hreflang")));
  expect(hrefLangs).toContain("fr");
  expect(hrefLangs).toContain("en");
  expect(hrefLangs).toContain("x-default");
});

test("salon mini-site renders Schema.org JSON-LD", async ({ page }) => {
  await page.goto("/fr/s/paris-marais");

  await expect(page.locator("h1")).toContainText("Barber Shop Marais");
  await expect(page.locator('script[type="application/ld+json"]').first()).toBeAttached();

  const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(jsonLd).toContain("BarberShop");
});

// Full critical flow: register → booking → dashboard.
// Unskip once the dashboard/booking UI (PROMPT 5) is implemented.
test.skip("register → booking → dashboard", async ({ page }) => {
  await page.goto("/fr/auth/register");
  await page.getByLabel("Nom du salon").fill("E2E Salon");
  await page.getByLabel("Email").fill(`e2e-${Date.now()}@test.local`);
  await page.getByLabel("Mot de passe").fill("StrongPass123!");
  await page.getByRole("button", { name: "Créer mon salon" }).click();

  // … booking flow (service → date/time → contact) …

  // … dashboard (sidebar, appointments list, stats) …
});
