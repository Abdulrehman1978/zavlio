import { expect, test } from '@playwright/test';

test('analytics remains consent-gated and issues only anonymous browser identity', async ({
  page,
}) => {
  let consentCalls = 0;
  const eventBodies: unknown[] = [];
  await page.route('**/api/analytics/consent', async (route) => {
    consentCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'set-cookie':
          'zv_consent=analytics_allowed%7C00000000-0000-4000-8000-000000000008%7C2026-09-v1; Path=/; Max-Age=15552000; SameSite=Lax',
      },
      body: JSON.stringify({ ok: true }),
    });
  });
  await page.route('**/api/analytics/events', async (route) => {
    eventBodies.push(route.request().postDataJSON());
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({ accepted: 1 }),
    });
  });

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Accept analytics' })).toBeVisible();
  expect(eventBodies).toHaveLength(0);
  await page.getByRole('button', { name: 'Accept analytics' }).click();
  await expect.poll(() => consentCalls).toBe(1);
  await expect
    .poll(async () => (await page.context().cookies()).some((cookie) => cookie.name === 'zv_vid'))
    .toBe(true);
  // The real endpoint sets this preference cookie; keep the mocked route equivalent.
  await page.evaluate(() => {
    document.cookie = 'zv_consent=analytics_allowed|test|2026-09-v1; Path=/';
  });

  await page.goto('/crm');
  await page.goto('/');
  await expect.poll(() => eventBodies.length).toBeGreaterThan(0);
  const payload = eventBodies.at(-1) as { events?: Array<{ pagePath?: string }> };
  expect(payload.events?.every((event) => event.pagePath !== '/crm')).toBe(true);
});
