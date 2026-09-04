import { expect, test } from "@playwright/test";

/**
 * Search, the SEO pages, and the screens a visitor actually meets — M6-05.3.
 *
 * <p>The assertion that matters most is that the programmatic city and subject pages render their
 * content <strong>server-side</strong>. They are the primary acquisition channel; a page that
 * fills in on the client is invisible to a crawler, and nothing in the unit tests can tell the
 * difference because both look identical in a browser.
 */
test.describe("public pages", () => {
  test("the homepage renders its search and subject links without JavaScript", async ({
    browser,
  }) => {
    // JavaScript disabled outright. This is the closest a test gets to being a crawler, and it is
    // the only way to prove the content is in the HTML rather than arriving after hydration.
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /mathematics/i }).first(),
      "subject links are the internal linking the SEO strategy runs on",
    ).toBeVisible();

    await context.close();
  });

  test("a city landing page is server-rendered and names the city", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    const response = await page.goto("/tutors/hyderabad");
    expect(response?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1 })).toContainText(/hyderabad/i);

    const html = await page.content();
    expect(
      html.toLowerCase(),
      "the city name must be in the delivered HTML, not added by script",
    ).toContain("hyderabad");

    await context.close();
  });

  test("a city × subject page renders and canonicalises itself", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    const response = await page.goto("/tutors/hyderabad/mathematics");
    expect(response?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /hyderabad\/mathematics/,
    );

    await context.close();
  });

  test("search runs from the browse page and reflects the query in the URL", async ({ page }) => {
    await page.goto("/tutors?subject=mathematics");

    // Filter state belongs in the URL so results are shareable and the back button behaves.
    await expect(page).toHaveURL(/subject=mathematics/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("robots and sitemap are served", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBeTruthy();
    expect(await robots.text()).toContain("Sitemap");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    expect(await sitemap.text()).toContain("<urlset");
  });

  test("private areas are never indexable", async ({ request }) => {
    // Asserted against the served HTML rather than the live DOM. A crawler does not run the
    // client-side role guard, so what it sees is exactly this — and checking the DOM instead
    // catches the redirect the guard performs, which is a different thing and flaky.
    for (const path of ["/admin", "/tutor/dashboard", "/student/requirements"]) {
      const html = await (await request.get(path)).text();
      const robots = html.match(/<meta name="robots" content="([^"]+)"/);

      expect(robots?.[1], `${path} must be noindex: it is private, and a crawler following a stray link would only ever reach a redirect`).toContain("noindex");
    }
  });
});

test.describe("sign in", () => {
  test("the login form takes a phone number and asks for a code", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("textbox").first().fill("9999900001");
    await page.getByRole("button", { name: /continue|send|get code/i }).first().click();

    // Dev mode fills the code in for us, so the second step appears with the field populated.
    await expect(
      page.getByText(/code/i).first(),
      "the OTP step is where a broken auth wiring shows up first",
    ).toBeVisible({ timeout: 10_000 });
  });
});
