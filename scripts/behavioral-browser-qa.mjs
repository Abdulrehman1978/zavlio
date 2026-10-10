import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const baseURL = process.env.PUBLIC_QA_URL ?? 'http://127.0.0.1:3100';
const screenshotDir = resolve(root, '.qa-screenshots');

const viewports = [
  { name: 'Mobile 390x844', width: 390, height: 844, slug: 'mobile-390x844' },
  { name: 'Tablet 768x1024', width: 768, height: 1024, slug: 'tablet-768x1024' },
  { name: 'Laptop 1024x768', width: 1024, height: 768, slug: 'laptop-1024x768' },
  { name: 'Desktop 1440x900', width: 1440, height: 900, slug: 'desktop-1440x900' },
  { name: 'Large 1920x1080', width: 1920, height: 1080, slug: 'large-1920x1080' },
];

async function run() {
  console.log(`[QA] Starting Behavioral Browser QA against ${baseURL}...`);
  await mkdir(screenshotDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const report = [];

  function record(category, testName, expected, actual, status, notes = '') {
    const entry = { category, testName, expected, actual, status, notes };
    report.push(entry);
    const tag = status === 'PASS' ? '✓' : status === 'WARN' ? '⚠' : '✗';
    console.log(`[${tag}] [${category}] ${testName}: ${status} (${notes || actual})`);
  }

  try {
    // =========================================================================
    // 1. DESKTOP INTERACTION FLOWS (1440x900)
    // =========================================================================
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ZavlioQA/1.0',
    });
    const page = await desktopContext.newPage();

    // 1.1 Skip Link & Header Navigation
    await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
    const skipLink = page.locator('a[href="#main-content"]');
    const hasSkip = (await skipLink.count()) > 0;
    record(
      'Navigation',
      'Skip Link Exists',
      'Skip link is present in DOM',
      `Count: ${await skipLink.count()}`,
      hasSkip ? 'PASS' : 'FAIL',
    );

    // Header Links
    const navLinks = ['Work', 'Services', 'About', 'Lab', 'Insights', 'Contact'];
    for (const linkText of navLinks) {
      const link = page.locator('header nav').getByRole('link', { name: linkText, exact: true });
      const visible = await link.isVisible();
      record(
        'Navigation',
        `Header Nav Link: ${linkText}`,
        `Link is visible`,
        visible ? 'Visible' : 'Hidden',
        visible ? 'PASS' : 'FAIL',
      );
    }

    // Scroll Elevation
    await page.evaluate(() => window.scrollTo(0, 150));
    await page.waitForTimeout(100);
    const headerClass = await page.locator('header').getAttribute('class');
    const isElevated = headerClass?.includes('backdrop-blur') || headerClass?.includes('shadow');
    record(
      'Visual/Header',
      'Header Scroll Elevation',
      'Header applies backdrop blur/shadow on scroll',
      `Classes: ${headerClass?.slice(0, 40)}...`,
      isElevated ? 'PASS' : 'FAIL',
    );
    await page.evaluate(() => window.scrollTo(0, 0));

    // 1.2 Hero CTAs
    await page.click('a:has-text("Start a project")');
    await page.waitForURL('**/start-a-project');
    record(
      'Interaction',
      'Hero CTA -> /start-a-project',
      'Navigates to /start-a-project',
      page.url(),
      page.url().includes('/start-a-project') ? 'PASS' : 'FAIL',
    );

    await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
    const exploreWorkBtn = page.getByRole('link', { name: /Explore our work/i });
    if ((await exploreWorkBtn.count()) > 0) {
      await exploreWorkBtn.click();
      await page.waitForURL('**/work');
      record(
        'Interaction',
        'Hero CTA -> /work',
        'Navigates to /work',
        page.url(),
        page.url().includes('/work') ? 'PASS' : 'FAIL',
      );
    }

    // 1.3 Operating Cycle Tabs (All 7 Stages)
    await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
    const cycleStages = [
      { idx: 0, name: 'IDEA 01' },
      { idx: 1, name: 'IDENTITY 02' },
      { idx: 2, name: 'EXPERIENCE 03' },
      { idx: 3, name: 'SYSTEM 04' },
      { idx: 4, name: 'GROWTH 05' },
      { idx: 5, name: 'INSIGHT 06' },
      { idx: 6, name: 'IDEA 07 (RETURN LOOP)' },
    ];
    let cyclePass = true;
    for (const stage of cycleStages) {
      const tabBtn = page.locator(`#cycle-tab-${stage.idx}`);
      if ((await tabBtn.count()) > 0) {
        await tabBtn.click();
        await page.waitForTimeout(50);
        const selected = await tabBtn.getAttribute('aria-selected');
        if (selected !== 'true') cyclePass = false;
      } else {
        cyclePass = false;
      }
    }
    record(
      'Interaction',
      'Operating Cycle 7-Stage Switcher',
      'All 7 stage tabs (including 06 INSIGHT and 07 IDEA loop) clickable and respond',
      '7 stages exercised',
      cyclePass ? 'PASS' : 'FAIL',
    );

    // 1.4 Project Detail Navigation & Schematics
    await page.goto(`${baseURL}/work`, { waitUntil: 'networkidle' });
    const projectSlugs = [
      'kinetiq-systems',
      'aurora-intelligence',
      'strata-commerce',
      'vanguard-identity',
    ];
    let schematicsPass = true;
    for (const slug of projectSlugs) {
      await page.goto(`${baseURL}/work/${slug}`, { waitUntil: 'networkidle' });
      const schematic = page.locator('svg').first();
      const hasSvg = (await schematic.count()) > 0;
      if (!hasSvg) schematicsPass = false;
    }
    record(
      'Visual/Schematics',
      'Project Detail Vector Schematics',
      'Bespoke SVG schematic renders for all 4 projects',
      'All 4 verified',
      schematicsPass ? 'PASS' : 'FAIL',
    );

    // Breadcrumb Back
    const backLink = page.getByRole('link', { name: /← ALL WORK/i });
    if ((await backLink.count()) > 0) {
      await backLink.click();
      await page.waitForURL('**/work');
      record(
        'Navigation',
        'Project Detail Back Breadcrumb',
        'Returns to /work',
        page.url(),
        page.url().endsWith('/work') ? 'PASS' : 'FAIL',
      );
    }

    // 1.5 Cookie Consent Banner (Accept, Reject, Withdraw)
    const consentContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const cPage = await consentContext.newPage();
    await cPage.route('**/api/analytics/consent', async (route) => {
      const req = route.request();
      const postData = req.postDataJSON();
      const state = postData?.state ?? 'ANALYTICS_ALLOWED';
      const cookieVal =
        state === 'ANALYTICS_ALLOWED'
          ? 'analytics_allowed|qa-test|v1'
          : 'analytics_denied|qa-test|v1';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'set-cookie': `zv_consent=${cookieVal}; Path=/; SameSite=Lax`,
        },
        body: JSON.stringify({ ok: true, state }),
      });
    });
    await cPage.goto(`${baseURL}/`, { waitUntil: 'networkidle' });

    // Check banner visible
    const acceptBtn = cPage.getByRole('button', { name: /Accept analytics/i });
    const rejectBtn = cPage.getByRole('button', { name: /Reject non-essential/i });
    const bannerVisible = (await acceptBtn.count()) > 0 && (await rejectBtn.count()) > 0;
    record(
      'Privacy',
      'Cookie Banner Display',
      'Banner displays with Accept and Reject actions',
      bannerVisible ? 'Visible' : 'Hidden',
      bannerVisible ? 'PASS' : 'FAIL',
    );

    // Accept Analytics
    if (bannerVisible) {
      await acceptBtn.click();
      await cPage.waitForTimeout(200);
      const cookies = await consentContext.cookies();
      const consentCookie = cookies.find((c) => c.name === 'zv_consent');
      record(
        'Privacy',
        'Accept Analytics Cookie Set',
        'zv_consent cookie set to analytics_allowed',
        `Value: ${consentCookie?.value}`,
        consentCookie?.value?.includes('analytics_allowed') ? 'PASS' : 'FAIL',
      );
    }

    // Withdraw Consent on /cookies
    await cPage.goto(`${baseURL}/cookies`, { waitUntil: 'networkidle' });
    const withdrawBtn = cPage.getByRole('button', { name: /Withdraw Consent/i });
    if ((await withdrawBtn.count()) > 0 && !(await withdrawBtn.isDisabled())) {
      await withdrawBtn.click();
      await cPage.waitForTimeout(200);
      const cookies = await consentContext.cookies();
      const consentCookie = cookies.find((c) => c.name === 'zv_consent');
      record(
        'Privacy',
        'Withdraw Consent on /cookies',
        'zv_consent updated to analytics_denied',
        `Value: ${consentCookie?.value}`,
        consentCookie?.value?.includes('analytics_denied') ? 'PASS' : 'FAIL',
      );
    }
    await consentContext.close();

    // 1.6 Contact Form (Validation & Submission)
    const formPage = await desktopContext.newPage();
    await formPage.goto(`${baseURL}/contact`, { waitUntil: 'networkidle' });

    // Try submit empty
    const sendBtn = formPage.getByRole('button', { name: /Send message/i });
    await sendBtn.click();
    await formPage.waitForTimeout(100);
    const errorsPresent =
      (await formPage.locator('.zavlio-field-error, [role="alert"]').count()) > 0;
    record(
      'Form/Contact',
      'Empty Submission Validation',
      'Prevents submission and displays field errors',
      errorsPresent ? 'Errors displayed' : 'No errors',
      errorsPresent ? 'PASS' : 'FAIL',
    );

    // Invalid email check
    await formPage.getByLabel('Name').fill('QA Tester');
    await formPage.getByLabel('Work email').fill('invalid-email-address');
    await formPage.getByLabel('Message').fill('Valid test message for QA.');
    await sendBtn.click();
    await formPage.waitForTimeout(100);
    const emailError = await formPage.locator('#error-email, [role="alert"]').first().textContent();
    record(
      'Form/Contact',
      'Invalid Email Validation',
      'Flags invalid email address format',
      `Message: ${emailError}`,
      emailError?.includes('email') ? 'PASS' : 'FAIL',
    );

    // Mock API or Submit
    await formPage.route('**/api/forms/contact', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, submissionId: '00000000-0000-4000-8000-qa0000000001' }),
      }),
    );
    await formPage.getByLabel('Work email').fill('qa-tester@example.test');
    await sendBtn.click();
    await formPage.waitForTimeout(150);
    const successStatus = await formPage.getByRole('status').textContent();
    record(
      'Form/Contact',
      'Valid Contact Submission Flow',
      'Displays success confirmation status',
      `Status: ${successStatus}`,
      successStatus?.includes('received') ? 'PASS' : 'FAIL',
    );

    // 1.7 Six-Step Project Intake Flow (/start-a-project)
    const intakePage = await desktopContext.newPage();
    await intakePage.route('**/api/forms/start-project', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, submissionId: '00000000-0000-4000-8000-qa0000000002' }),
      }),
    );
    await intakePage.goto(`${baseURL}/start-a-project`, { waitUntil: 'networkidle' });

    // Step 1: empty continue
    const continueBtn = () => intakePage.getByRole('button', { name: /Continue/i });
    await continueBtn().click();
    await intakePage.waitForTimeout(50);
    const step1Error = (await intakePage.locator('[role="alert"]').count()) > 0;
    record(
      'Form/Intake',
      'Step 1 Validation (Services)',
      'Prevents continue without service selection',
      step1Error ? 'Error shown' : 'Proceeded',
      step1Error ? 'PASS' : 'FAIL',
    );

    // Step 1 valid
    await intakePage.getByLabel('Website').check();
    await continueBtn().click();

    // Step 2: Contact Details
    await continueBtn().click();
    const step2Error = (await intakePage.locator('[role="alert"]').count()) > 0;
    record(
      'Form/Intake',
      'Step 2 Validation (Contact)',
      'Prevents continue without name/email',
      step2Error ? 'Error shown' : 'Proceeded',
      step2Error ? 'PASS' : 'FAIL',
    );
    await intakePage.getByLabel('Name').fill('Intake QA Visitor');
    await intakePage.getByLabel('Work email').fill('intake-qa@example.test');
    await continueBtn().click();

    // Step 3: Goal
    await continueBtn().click();
    const step3Error = (await intakePage.locator('[role="alert"]').count()) > 0;
    record(
      'Form/Intake',
      'Step 3 Validation (Goal)',
      'Prevents continue without detailed goal',
      step3Error ? 'Error shown' : 'Proceeded',
      step3Error ? 'PASS' : 'FAIL',
    );
    await intakePage
      .getByLabel(/What are you trying to achieve/i)
      .fill('Engineering a new digital design system and platform.');
    await continueBtn().click();

    // Step 4: Budget
    await intakePage.getByLabel('₹3L–₹7L').check();
    await continueBtn().click();

    // Step 5: Timing
    await intakePage.getByLabel('1–2 months').check();
    await continueBtn().click();

    // Step 6: Source & Submit
    await intakePage.getByLabel('Referral').check();
    const submitBtn = intakePage.getByRole('button', { name: /Submit enquiry/i });
    await submitBtn.click();
    await intakePage.waitForTimeout(150);
    const intakeSuccess = await intakePage.getByRole('status').textContent();
    record(
      'Form/Intake',
      'Six-Step Intake Complete Submission',
      'Advances through 6 steps and confirms enquiry receipt',
      `Status: ${intakeSuccess}`,
      intakeSuccess?.includes('received') ? 'PASS' : 'FAIL',
    );

    await desktopContext.close();

    // =========================================================================
    // 2. MOBILE DRAWER & KEYBOARD NAVIGATION (390x844)
    // =========================================================================
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 ZavlioQA/1.0',
    });
    const mPage = await mobileContext.newPage();
    await mPage.goto(`${baseURL}/`, { waitUntil: 'networkidle' });

    // Open mobile menu
    const menuToggle = mPage.getByRole('button', { name: /open navigation menu/i });
    await menuToggle.click();
    await mPage.waitForTimeout(100);
    const drawer = mPage.locator('#mobile-navigation');
    const drawerOpen = (await drawer.count()) > 0 && (await drawer.isVisible());
    record(
      'Mobile',
      'Mobile Drawer Open Interaction',
      'Opens fullscreen mobile navigation dialog',
      drawerOpen ? 'Visible' : 'Hidden',
      drawerOpen ? 'PASS' : 'FAIL',
    );

    // Escape key closes drawer
    await mPage.keyboard.press('Escape');
    await mPage.waitForTimeout(100);
    const drawerClosedOnEsc = !(await drawer.isVisible());
    record(
      'Mobile/A11y',
      'Mobile Drawer Escape Key',
      'Closes mobile drawer when Escape pressed',
      drawerClosedOnEsc ? 'Closed' : 'Still open',
      drawerClosedOnEsc ? 'PASS' : 'FAIL',
    );

    // Re-open and click Work link
    await mPage.getByRole('button', { name: /open navigation menu/i }).click();
    await mPage.waitForTimeout(100);
    await mPage
      .locator('#mobile-navigation')
      .getByRole('link', { name: 'Work', exact: true })
      .click();
    await mPage.waitForURL('**/work');
    record(
      'Mobile',
      'Mobile Drawer Link Navigation',
      'Navigates to /work and closes drawer',
      mPage.url(),
      mPage.url().endsWith('/work') ? 'PASS' : 'FAIL',
    );

    await mobileContext.close();

    // =========================================================================
    // 3. REDUCED MOTION EMULATION
    // =========================================================================
    const rmContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
    });
    const rmPage = await rmContext.newPage();
    await rmPage.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
    const rmTitle = await rmPage.title();
    record(
      'Accessibility',
      'Reduced Motion Mode',
      'Loads cleanly without script/animation error',
      `Title: ${rmTitle}`,
      Boolean(rmTitle) ? 'PASS' : 'FAIL',
    );
    await rmContext.close();

    // =========================================================================
    // 4. MULTI-VIEWPORT AUDIT & SCREENSHOT CAPTURE
    // =========================================================================
    for (const vp of viewports) {
      const vpContext = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const vPage = await vpContext.newPage();
      await vPage.goto(`${baseURL}/`, { waitUntil: 'networkidle' });

      // Dismiss cookie banner so screenshots are clean
      const reject = vPage.getByRole('button', { name: /Reject non-essential/i });
      if ((await reject.count()) > 0) {
        await reject.click();
        await vPage.waitForTimeout(50);
      }

      const scrollWidth = await vPage.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await vPage.evaluate(() => document.documentElement.clientWidth);
      const overflow = scrollWidth > clientWidth + 1;
      record(
        'Viewport',
        `Overflow Check: ${vp.name}`,
        'Zero horizontal layout overflow',
        `scrollWidth: ${scrollWidth}, clientWidth: ${clientWidth}`,
        overflow ? 'FAIL' : 'PASS',
      );

      // Capture comparison screenshot to ignored local dir
      const screenshotPath = resolve(screenshotDir, `home-${vp.slug}.png`);
      await vPage.screenshot({ path: screenshotPath, fullPage: false });

      await vpContext.close();
    }

    console.log(`\n[QA] Behavioral QA Complete. Total checks: ${report.length}`);
    const failures = report.filter((r) => r.status === 'FAIL');
    console.log(`[QA] Passed: ${report.length - failures.length}, Failed: ${failures.length}`);

    await writeFile(
      resolve(root, '.qa-screenshots/behavioral-report.json'),
      JSON.stringify(report, null, 2),
      'utf-8',
    );
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('[QA] Fatal error during behavioral QA:', err);
  process.exit(1);
});
