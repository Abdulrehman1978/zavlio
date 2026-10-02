import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('homepage renders without fatal client errors or detectable accessibility violations', async ({
  page,
}) => {
  const fatalErrors: string[] = [];
  page.on('pageerror', (error) => fatalErrors.push(error.message));
  await page.goto('/');
  await expect(page.getByText('ZAVLIO')).toBeVisible();
  await expect(page.getByRole('heading', { name: "Build what's next." })).toBeVisible();
  expect(fatalErrors).toEqual([]);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
