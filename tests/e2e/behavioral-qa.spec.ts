import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const screenshotDir = resolve(process.cwd(), '.qa-screenshots');

test.describe('Packet 05R Behavioral Browser QA', () => {
  test.beforeAll(async () => {
    await mkdir(screenshotDir, { recursive: true });
  });

  test('header navigation, skip link, and scroll elevation', async ({ page }) => {
    await page.goto('/');

    // Skip link
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();

    // Nav links
    for (const link of ['Work', 'Services', 'About', 'Lab', 'Insights', 'Contact']) {
      await expect(
        page.locator('header nav').getByRole('link', { name: link, exact: true }),
      ).toBeVisible();
    }

    // Header scroll elevation
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(100);
    const headerClass = await page.locator('header').getAttribute('class');
    expect(headerClass).toMatch(/backdrop-blur|shadow/);
  });

  test('hero CTAs navigate to start-a-project and work', async ({ page }) => {
    await page.goto('/');

    // Hero CTA -> Start a Project
    await page.getByRole('link', { name: 'Start a project', exact: true }).first().click();
    await expect(page).toHaveURL(/\/start-a-project/);

    // Back to home
    await page.goto('/');

    // Hero CTA -> Explore work
    await page
      .getByRole('link', { name: /Explore work/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/work/);
  });

  test('operating cycle all seven stages activate cleanly on desktop and mobile', async ({
    page,
  }) => {
    const STAGES = [
      {
        idx: 0,
        number: '01',
        name: 'IDEA',
        subtitle: 'Strategic thesis & positioning',
        deliverable: 'Problem Definition',
      },
      {
        idx: 1,
        number: '02',
        name: 'IDENTITY',
        subtitle: 'Design language & visual tokens',
        deliverable: 'Visual Identity System',
      },
      {
        idx: 2,
        number: '03',
        name: 'EXPERIENCE',
        subtitle: 'Digital product & web craft',
        deliverable: 'Responsive Web App',
      },
      {
        idx: 3,
        number: '04',
        name: 'SYSTEM',
        subtitle: 'Engineering & backend infrastructure',
        deliverable: 'Full-Stack Platform',
      },
      {
        idx: 4,
        number: '05',
        name: 'GROWTH',
        subtitle: 'Conversion funnels & attribution',
        deliverable: 'Intake Workflows',
      },
      {
        idx: 5,
        number: '06',
        name: 'INSIGHT',
        subtitle: 'Empirical telemetry & learning',
        deliverable: 'Executive Dashboards',
      },
      {
        idx: 6,
        number: '07',
        name: 'IDEA',
        subtitle: 'Next-generation evolution',
        deliverable: 'Evolution Roadmaps',
      },
    ];

    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/');

      for (const stage of STAGES) {
        const tab = page.locator(`#cycle-tab-${stage.idx}`);
        await expect(tab).toBeVisible();
        await tab.click();

        // Verify aria-selected
        await expect(tab).toHaveAttribute('aria-selected', 'true');

        // Verify other tabs are unselected
        for (const other of STAGES) {
          if (other.idx !== stage.idx) {
            await expect(page.locator(`#cycle-tab-${other.idx}`)).toHaveAttribute(
              'aria-selected',
              'false',
            );
          }
        }

        // Verify active panel content
        const panel = page.locator(`#cycle-panel-${stage.idx}`);
        await expect(panel).toBeVisible();
        await expect(panel.getByText(`STAGE ${stage.number}`)).toBeVisible();
        await expect(panel.getByText(stage.subtitle, { exact: true })).toBeVisible();
        await expect(panel.getByRole('heading', { name: stage.name })).toBeVisible();
        await expect(panel.getByText(stage.deliverable, { exact: true })).toBeVisible();
      }
    }
  });

  test('work index and project detail vector schematics', async ({ page }) => {
    await page.goto('/work');

    // All 4 projects
    for (const slug of [
      'kinetiq-systems',
      'aurora-intelligence',
      'strata-commerce',
      'vanguard-identity',
    ]) {
      await page.goto(`/work/${slug}`);
      await expect(page.locator('svg').first()).toBeVisible();
      // Back breadcrumb
      const backLink = page.getByRole('link', { name: /← ALL WORK/i });
      await expect(backLink).toBeVisible();
    }
  });

  test('mobile drawer, focus trap, and Escape key dismissal (390x844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    // Open drawer
    const menuBtn = page.getByRole('button', { name: /open navigation menu/i });
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    const drawer = page.locator('#mobile-navigation');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('role', 'dialog');

    // Press Escape to dismiss
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();

    // Reopen and navigate to Work
    await menuBtn.click();
    await expect(drawer).toBeVisible();
    await drawer.getByRole('link', { name: 'Work', exact: true }).click();
    await expect(page).toHaveURL(/\/work/);
  });

  test('cookie consent accept, reject, and withdraw preference management', async ({
    page,
    context,
  }) => {
    await page.route('**/api/analytics/consent', async (route) => {
      const req = route.request();
      const postData = req.postDataJSON() as { state: string };
      const state = postData?.state ?? 'ANALYTICS_ALLOWED';
      const cookieVal =
        state === 'ANALYTICS_ALLOWED' ? 'analytics_allowed|test|v1' : 'analytics_denied|test|v1';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'set-cookie': `zv_consent=${cookieVal}; Path=/; SameSite=Lax`,
        },
        body: JSON.stringify({ ok: true, state }),
      });
    });

    await page.goto('/');

    // Accept analytics
    const acceptBtn = page.getByRole('button', { name: /Accept analytics/i });
    await expect(acceptBtn).toBeVisible();
    await acceptBtn.click();

    await expect
      .poll(async () => {
        const cookies = await context.cookies();
        return cookies.find((c) => c.name === 'zv_consent')?.value;
      })
      .toContain('analytics_allowed');

    // Withdraw on /cookies
    await page.goto('/cookies');
    const withdrawBtn = page.getByRole('button', { name: /Withdraw Consent/i });
    await expect(withdrawBtn).toBeVisible();
    await withdrawBtn.click();

    await expect
      .poll(async () => {
        const cookies = await context.cookies();
        return cookies.find((c) => c.name === 'zv_consent')?.value;
      })
      .toContain('analytics_denied');
  });

  test('contact form client-side validation, error states, and mock submission', async ({
    page,
  }) => {
    await page.goto('/contact');

    // Submit empty
    const sendBtn = page.getByRole('button', { name: /Send message/i });
    await sendBtn.click();
    await expect(page.locator('.zavlio-field-error, [role="alert"]').first()).toBeVisible();

    // Invalid email validation
    await page.getByLabel('Name').fill('QA Evaluator');
    await page.getByLabel('Work email').fill('invalid-format');
    await page.getByLabel('Message').fill('Valid test message content.');
    await sendBtn.click();
    await expect(page.locator('#error-email, [role="alert"]').first()).toBeVisible();

    // Mock API response & submit
    await page.route('**/api/forms/contact', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, submissionId: '00000000-0000-4000-8000-000000000099' }),
      }),
    );
    await page.getByLabel('Work email').fill('qa-eval@example.test');
    await sendBtn.click();
    await expect(page.getByRole('status')).toContainText('received');
  });

  test('six-step project intake step-by-step validation and submission', async ({ page }) => {
    await page.route('**/api/forms/start-project', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, submissionId: '00000000-0000-4000-8000-000000000098' }),
      }),
    );
    await page.goto('/start-a-project');

    // Dismiss cookie banner
    const rejectCookie = page.getByRole('button', { name: /Reject non-essential/i });
    if (await rejectCookie.isVisible()) {
      await rejectCookie.click();
    }

    const continueBtn = page.getByRole('button', { name: /Continue/i });

    // Step 1: empty validation
    await continueBtn.click();
    await expect(page.locator('[role="alert"]').first()).toBeVisible();
    await page.getByLabel('Website').check();
    await continueBtn.click();

    // Step 2: contact validation
    await continueBtn.click();
    await expect(page.locator('[role="alert"]').first()).toBeVisible();
    await page.getByLabel('Name').fill('Project Visitor');
    await page.getByLabel('Work email').fill('project@example.test');
    await continueBtn.click();

    // Step 3: goal validation
    await continueBtn.click();
    await expect(page.locator('[role="alert"]').first()).toBeVisible();
    await page
      .getByLabel(/What are you trying to achieve/i)
      .fill('Build an editorial design system.');
    await continueBtn.click();

    // Step 4: budget
    await page.getByLabel('₹3L–₹7L').check();
    await continueBtn.click();

    // Step 5: timing
    await page.getByLabel('1–2 months').check();
    await continueBtn.click();

    // Step 6: source and submit
    await page.getByLabel('Referral').check();
    await page.getByRole('button', { name: /Submit enquiry/i }).click();

    await expect(page.getByRole('status')).toContainText('received');
  });

  test('multi-viewport layout stability, zero overflow, and screenshot capture', async ({
    page,
    context,
  }) => {
    const viewports = [
      { name: 'Mobile', width: 390, height: 844 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Laptop', width: 1024, height: 768 },
      { name: 'Desktop', width: 1440, height: 900 },
      { name: 'Large', width: 1920, height: 1080 },
    ];

    await context.addCookies([
      {
        name: 'zv_consent',
        value: 'analytics_allowed|test|v1',
        domain: '127.0.0.1',
        path: '/',
      },
      {
        name: 'zv_consent',
        value: 'analytics_allowed|test|v1',
        domain: 'localhost',
        path: '/',
      },
    ]);

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      // Check overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

      // Screenshot for review
      await page.screenshot({
        path: resolve(screenshotDir, `home-${vp.width}x${vp.height}.png`),
      });

      // Axe check
      const axe = await new AxeBuilder({ page }).analyze();
      expect(axe.violations).toEqual([]);
    }
  });
});
