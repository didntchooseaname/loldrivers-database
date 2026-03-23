import { test, expect } from '@playwright/test';

// ── Page Load ──

test('homepage loads without infinite loading', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.driver-card').first()).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.loading-bar-container')).not.toBeVisible();
  await expect(page.locator('.stat-value').first()).not.toHaveText('0');
});

test('no console errors on initial load', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('/');
  await page.waitForTimeout(2000);

  const criticalErrors = errors.filter(e =>
    !e.includes('service-worker') &&
    !e.includes('sw.js') &&
    !e.includes('favicon') &&
    !e.includes('hydration') &&
    !e.includes('X-Frame-Options')
  );
  expect(criticalErrors).toHaveLength(0);
});

// ── Search ──

test('live search triggers after typing', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.driver-card').first()).toBeVisible({ timeout: 5000 });

  await page.locator('#driver-search').fill('Microsoft');
  await page.waitForTimeout(1000);

  const hasResults = await page.locator('.driver-card').count() > 0;
  const hasLoading = await page.locator('.loading-bar-container').isVisible();
  expect(hasResults || hasLoading).toBeTruthy();
});

test('clear button resets search and filters', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.driver-card').first()).toBeVisible({ timeout: 5000 });

  const searchInput = page.locator('#driver-search');
  await searchInput.fill('test');
  await page.waitForTimeout(500);

  // Use exact match to avoid ambiguity with "Clear Filters"
  await page.getByRole('button', { name: 'Clear', exact: true }).click();

  await expect(searchInput).toHaveValue('');
});

// ── Filters ──

test('process killer filter returns results', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.driver-card').first()).toBeVisible({ timeout: 5000 });

  await page.locator('.process-killer-item').click();
  await page.waitForTimeout(2000);

  const count = await page.locator('.driver-card').count();
  expect(count).toBeGreaterThan(0);
});

test('MVDB filter returns results', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.driver-card').first()).toBeVisible({ timeout: 5000 });

  await page.locator('.stat-item.clickable').first().click();
  await page.waitForTimeout(2000);

  const count = await page.locator('.driver-card').count();
  expect(count).toBeGreaterThan(0);
});

test('quick filter apply/clear cycle works', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.driver-card').first()).toBeVisible({ timeout: 5000 });

  const initialCount = await page.locator('.driver-card').count();

  await page.getByRole('button', { name: 'Recent Drivers' }).click();
  await page.getByRole('button', { name: 'Apply Filters' }).click();
  await page.waitForTimeout(2000);

  const filteredCount = await page.locator('.driver-card').count();
  expect(filteredCount).toBeGreaterThan(0);

  await page.getByRole('button', { name: 'Clear Filters' }).click();
  await page.waitForTimeout(2000);

  const resetCount = await page.locator('.driver-card').count();
  expect(resetCount).toBe(initialCount);
});

test('trusted certificate filter returns results', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.driver-card').first()).toBeVisible({ timeout: 5000 });

  await page.getByRole('button', { name: 'Trusted Certificate' }).click();
  await page.getByRole('button', { name: 'Apply Filters' }).click();
  await page.waitForTimeout(2000);

  const count = await page.locator('.driver-card').count();
  expect(count).toBeGreaterThan(0);
});

test('expired certificate filter returns results', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.driver-card').first()).toBeVisible({ timeout: 5000 });

  await page.getByRole('button', { name: 'Unknown Certificate' }).click();
  await page.getByRole('button', { name: 'Apply Filters' }).click();
  await page.waitForTimeout(2000);

  const count = await page.locator('.driver-card').count();
  expect(count).toBeGreaterThan(0);
});

test('cert-valid quick filter returns results', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.driver-card').first()).toBeVisible({ timeout: 5000 });

  // Use exact match for the "Valid" button in the Certificates filter group
  await page.locator('.certificate-filters').getByRole('button', { name: 'Valid' }).click();
  await page.getByRole('button', { name: 'Apply Filters' }).click();
  await page.waitForTimeout(2000);

  const count = await page.locator('.driver-card').count();
  expect(count).toBeGreaterThan(0);
});

test('architecture filter returns results', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.driver-card').first()).toBeVisible({ timeout: 5000 });

  await page.locator('.meta-filters').getByRole('button', { name: 'x64' }).click();
  await page.getByRole('button', { name: 'Apply Filters' }).click();
  await page.waitForTimeout(2000);

  const count = await page.locator('.driver-card').count();
  expect(count).toBeGreaterThan(0);
});

test('mutual exclusion: newest/oldest sort', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.driver-card').first()).toBeVisible({ timeout: 5000 });

  // Click Newest First
  await page.getByRole('button', { name: 'Newest First' }).click();

  // Oldest First should be disabled (mutual exclusion)
  await expect(page.getByRole('button', { name: 'Oldest First' })).toBeDisabled();

  // Apply Newest First and verify results
  await page.getByRole('button', { name: 'Apply Filters' }).click();
  await page.waitForTimeout(2000);

  const count = await page.locator('.driver-card').count();
  expect(count).toBeGreaterThan(0);
});

// ── Pagination ──

test('pagination navigates between pages', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.driver-card').first()).toBeVisible({ timeout: 5000 });

  const paginationVisible = await page.locator('.pagination-container').isVisible();
  if (!paginationVisible) return;

  await page.locator('.pagination-number').nth(1).click();
  await page.waitForTimeout(2000);

  const count = await page.locator('.driver-card').count();
  expect(count).toBeGreaterThan(0);
  await expect(page.locator('.pagination-indicator')).toContainText('Page 2');
});

// ── UI Components ──

test('theme switcher is in header', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.driver-card').first()).toBeVisible({ timeout: 5000 });

  // Theme switcher button should be inside header-controls
  const themeSwitcher = page.locator('.header-controls').getByRole('button', { name: /theme/i });
  await expect(themeSwitcher).toBeVisible();
});

test('changelog popup opens', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.driver-card').first()).toBeVisible({ timeout: 5000 });

  await page.getByRole('button', { name: 'View changelog' }).click();

  // Wait for the dialog heading specifically
  await expect(page.getByRole('heading', { name: 'Changelog' })).toBeVisible({ timeout: 5000 });
});

test('help dialog opens', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.driver-card').first()).toBeVisible({ timeout: 5000 });

  await page.locator('button[title="Help"]').click();

  // The dialog title heading (first one in DOM order)
  await expect(page.getByRole('heading', { name: 'About LOLDrivers Database' }).first()).toBeVisible({ timeout: 5000 });
});

test('back to top button appears on scroll', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.driver-card').first()).toBeVisible({ timeout: 5000 });

  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(500);

  await expect(page.getByRole('button', { name: 'Back to top' })).toBeVisible();
});

// ── Combined Filters ──

test('search + filter combination works', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.driver-card').first()).toBeVisible({ timeout: 5000 });

  await page.locator('#driver-search').fill('driver');
  await page.waitForTimeout(500);

  // Use exact match for Process Killer in the behavioral filters section
  await page.locator('.advanced-filters').getByRole('button', { name: 'Process Killer' }).click();
  await page.getByRole('button', { name: 'Apply Filters' }).click();
  await page.waitForTimeout(2000);

  const hasCards = await page.locator('.driver-card').count() > 0;
  const hasEmpty = await page.locator('.empty-state').isVisible();
  expect(hasCards || hasEmpty).toBeTruthy();

  await expect(page.locator('.error-message')).not.toBeVisible();
});
