import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('contact form succeeds after analytics rejection', async ({ page }) => {
  let analyticsEvents = 0;
  await page.route('**/api/analytics/consent', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    }),
  );
  await page.route('**/api/analytics/events', async (route) => {
    analyticsEvents += 1;
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({ accepted: 0 }),
    });
  });
  await page.route('**/api/forms/contact', (route) =>
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, submissionId: '00000000-0000-4000-8000-000000000001' }),
    }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Reject non-essential' }).click();
  await page.goto('/contact');
  await page.getByLabel('Name').fill('Contact Visitor');
  await page.getByLabel('Work email').fill('contact@example.test');
  await page.getByLabel('Message').fill('I would like to discuss a new website.');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByRole('status')).toContainText('received');
  expect(analyticsEvents).toBe(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('start a project completes the six accessible steps', async ({ page }) => {
  await page.route('**/api/analytics/consent', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    }),
  );
  await page.route('**/api/forms/start-project', (route) =>
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, submissionId: '00000000-0000-4000-8000-000000000002' }),
    }),
  );
  await page.goto('/start-a-project');
  await page.getByRole('button', { name: 'Reject non-essential' }).click();
  await page.getByLabel('Website').check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Name').fill('Project Visitor');
  await page.getByLabel('Work email').fill('project@example.test');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page
    .getByLabel('What are you trying to achieve?')
    .fill('Create a clearer digital product experience.');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('₹3L–₹7L').check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('1–2 months').check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Referral').check();
  await page.getByRole('button', { name: 'Submit enquiry' }).click();
  await expect(page.getByRole('status')).toContainText('received');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
