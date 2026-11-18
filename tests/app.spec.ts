import { test, expect, type Page } from '@playwright/test';

const cards = (page: Page) => page.locator('.driver-card');
const resultsCount = (page: Page) => page.locator('.results-count');
const filters = (page: Page) => page.getByRole('navigation', { name: 'Filters' }).first();

async function open(page: Page, path = '/') {
  await page.goto(path);
  await expect(cards(page).first()).toBeVisible();
}

test.describe('page load', () => {
  test('renders the catalog with live counters', async ({ page }) => {
    await open(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hunt vulnerable Windows drivers');
    await expect(page.locator('.stat-value').first()).not.toHaveText('0');
    expect(await cards(page).count()).toBe(24);
  });

  test('has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    await open(page);
    await page.waitForLoadState('networkidle');
    expect(errors.filter((e) => !/favicons|service-worker|sw\.js/i.test(e))).toEqual([]);
  });

  test('server-renders a shared search URL', async ({ page }) => {
    const response = await page.request.get('/?q=RTCore64');
    const html = await response.text();
    expect(html).toContain('matching');
    await open(page, '/?q=RTCore64');
    await expect(resultsCount(page)).toContainText('RTCore64');
    await expect(cards(page).first()).toContainText(/rtcore64/i);
  });

  test('shows the real catalog sync date from data/sync.json', async ({ page, request }) => {
    const stats = await (await request.get('/api/stats')).json();
    const syncedAt = new Date(stats.stats.catalogSync.synced_at);
    await open(page);
    const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(syncedAt);
    await expect(page.locator('.sync-badge')).toContainText(`synced ${day}`);
  });

  test('redirects the legacy changelog route', async ({ page }) => {
    await page.goto('/changelog');
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('search', () => {
  test('runs live as you type and syncs the URL', async ({ page }) => {
    await open(page);
    await page.locator('#driver-search').fill('RTCore64');
    await expect(resultsCount(page)).toContainText('matching');
    await expect(page).toHaveURL(/q=RTCore64/);
    await expect(cards(page).first()).toContainText(/rtcore64/i);
  });

  test('clears with the clear button and Escape', async ({ page }) => {
    await open(page);
    const input = page.locator('#driver-search');
    await input.fill('gdrv');
    await page.getByRole('button', { name: 'Clear search' }).first().click();
    await expect(input).toHaveValue('');
    await input.fill('gdrv');
    await input.press('Escape');
    await expect(input).toHaveValue('');
  });

  test('suggestion chips run a search', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: 'ZwTerminateProcess', exact: true }).click();
    await expect(page.locator('#driver-search')).toHaveValue('ZwTerminateProcess');
    await expect(resultsCount(page)).toContainText('matching');
  });

  test('slash focuses the search field', async ({ page }) => {
    await open(page);
    await page.locator('body').click({ position: { x: 5, y: 300 } });
    await page.keyboard.press('/');
    await expect(page.locator('#driver-search')).toBeFocused();
  });

  test('shows an empty state with recovery actions', async ({ page }) => {
    await open(page);
    await page.locator('#driver-search').fill('zzzz-no-such-driver-zzzz');
    await expect(page.locator('.empty-state')).toBeVisible();
    await page.getByRole('button', { name: 'Clear search and filters' }).click();
    await expect(cards(page).first()).toBeVisible();
  });
});

test.describe('filters', () => {
  test('process killer counter toggles its filter', async ({ page }) => {
    await open(page);
    const toggle = page.getByRole('button', { name: 'Filter by Process killers' });
    await toggle.click();
    await expect(page.getByRole('button', { name: 'Remove Process killers filter' })).toHaveAttribute('aria-pressed', 'true');
    await expect(cards(page).first()).toContainText(/killer/i);
  });

  test('MVDB passed facet only returns passed drivers', async ({ page }) => {
    await open(page);
    await filters(page).getByRole('checkbox', { name: /MVDB passed/ }).click();
    await expect(page).toHaveURL(/hvci=true/);
    await expect(cards(page).first().getByText('MVDB passed')).toBeVisible();
    await expect(cards(page).getByText('MVDB blocked')).toHaveCount(0);
  });

  test('certificate options are mutually exclusive', async ({ page }) => {
    await open(page);
    const valid = filters(page).getByRole('radio', { name: /^Valid/ });
    const expired = filters(page).getByRole('radio', { name: /^Expired/ });
    await valid.click();
    await expect(valid).toHaveAttribute('aria-checked', 'true');
    await expired.click();
    await expect(expired).toHaveAttribute('aria-checked', 'true');
    await expect(valid).toHaveAttribute('aria-checked', 'false');
    await expect(cards(page).first().getByText('Expired cert')).toBeVisible();
  });

  test('architecture filter returns results', async ({ page }) => {
    await open(page);
    await filters(page).getByRole('radio', { name: /^x86/ }).click();
    await expect(page).toHaveURL(/architecture=I386/);
    await expect(cards(page).first()).toContainText('x86');
  });

  test('behavior filters combine with search', async ({ page }) => {
    await open(page);
    await page.locator('#driver-search').fill('driver');
    await filters(page).getByRole('checkbox', { name: /Process killer/ }).click();
    await expect(page.locator('.active-filters')).toContainText('Process killer');
    const hasCards = (await cards(page).count()) > 0;
    const isEmpty = await page.locator('.empty-state').isVisible();
    expect(hasCards || isEmpty).toBeTruthy();
  });

  test('chips remove filters and Clear all resets everything', async ({ page }) => {
    await open(page);
    await filters(page).getByRole('checkbox', { name: /Debug bypass/ }).click();
    await page.getByRole('button', { name: 'Remove Debug bypass' }).click();
    await expect(page).not.toHaveURL(/debug-bypass/);
    await filters(page).getByRole('checkbox', { name: /Registry access/ }).click();
    await page.locator('#driver-search').fill('asus');
    await page.getByRole('button', { name: 'Clear all' }).click();
    await expect(page.locator('#driver-search')).toHaveValue('');
    await expect(page.locator('.active-filters')).toHaveCount(0);
  });

  test('VirusTotal bands filter results and stay exclusive', async ({ page }) => {
    await open(page);
    const none = filters(page).getByRole('radio', { name: /^No detections/ });
    const unscanned = filters(page).getByRole('radio', { name: /^Not scanned yet/ });
    await unscanned.click();
    await expect(page).toHaveURL(/vt=unscanned/);
    await none.click();
    await expect(unscanned).toHaveAttribute('aria-checked', 'false');
    await expect(page).toHaveURL(/vt=none/);
  });

  test('sort menu orders results', async ({ page }) => {
    await open(page);
    await page.getByLabel('Sort results').selectOption('newest-first');
    await expect(page).toHaveURL(/newest-first=true/);
    await expect(cards(page).first()).toBeVisible();
  });
});

test.describe('results', () => {
  test('pagination moves between pages', async ({ page }) => {
    await open(page);
    const first = await cards(page).first().locator('h3').innerText();
    await page.getByRole('button', { name: 'Page 2' }).click();
    await expect(page.locator('.pagination-indicator')).toContainText('Page 2 of');
    await expect(cards(page).first().locator('h3')).not.toHaveText(first);
  });

  test('detail panel loads the full record', async ({ page }) => {
    await open(page, '/?q=RTCore64');
    const name = await cards(page).first().locator('.driver-card__open').innerText();
    await cards(page).first().locator('.driver-card__open').click();
    const sheet = page.getByRole('dialog');
    await expect(sheet.getByRole('heading', { name })).toBeVisible();
    await expect(sheet.getByRole('heading', { name: 'Hashes' })).toBeVisible();
    await expect(sheet.getByRole('heading', { name: /Imported functions/ })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
  });

  test('glossary tooltips explain badges', async ({ page }) => {
    await open(page);
    await cards(page).first().locator('.status-badge').first().hover();
    await expect(page.getByRole('tooltip')).toContainText(/Blocklist/i);
  });
});

test.describe('dialogs and header', () => {
  test('help dialog opens', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: 'Help' }).click();
    await expect(page.getByRole('heading', { name: 'About this database' })).toBeVisible();
  });

  test('changelog dialog opens', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: 'View changelog' }).click();
    await expect(page.getByRole('heading', { name: 'Changelog' })).toBeVisible();
  });

  test('terms dialog opens from the footer', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: 'Terms & license' }).click();
    await expect(page.getByRole('heading', { name: 'Terms & license' })).toBeVisible();
  });

  test('theme switcher lives in the header', async ({ page }) => {
    await open(page);
    await expect(page.locator('.header-controls').getByRole('button', { name: /theme/i })).toBeVisible();
  });
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('has no horizontal overflow and opens the filter sheet', async ({ page }) => {
    await open(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await page.getByRole('button', { name: /^Filters/ }).click();
    await page.getByRole('dialog').getByRole('checkbox', { name: /MVDB passed/ }).click();
    await page.getByRole('button', { name: /^Show .* results$/ }).click();
    await expect(page).toHaveURL(/hvci=true/);
  });
});

test.describe('api', () => {
  test('MVDB verdicts never report unchecked samples as blocked', async ({ request }) => {
    const { stats } = await (await request.get('/api/stats')).json();
    expect(stats.hvciCompatible + stats.mvdbBlockedDrivers + stats.mvdbUncheckedDrivers).toBe(stats.total);
  });

  test('list endpoint returns slim, capped pages', async ({ request }) => {
    const res = await request.get('/api/drivers?limit=5000');
    const body = await res.json();
    expect(body.drivers.length).toBeLessThanOrEqual(100);
    expect(body.drivers[0].ImportedFunctions).toBeUndefined();
    expect(body.drivers[0]._summary).toBe(true);
  });

  test('detail endpoint returns the full record and rejects bad keys', async ({ request }) => {
    const list = await (await request.get('/api/drivers?q=RTCore64&limit=1')).json();
    const sha = list.drivers[0].SHA256;
    const detail = await (await request.get(`/api/drivers/${sha}`)).json();
    expect(detail.driver.SHA256).toBe(sha);
    expect(Array.isArray(detail.driver.ImportedFunctions)).toBe(true);
    expect((await request.get('/api/drivers/not-a-real-key')).status()).toBe(404);
    expect((await request.get('/api/drivers/%3Cscript%3E')).status()).toBe(400);
  });

  test('VirusTotal buckets partition the catalog', async ({ request }) => {
    const { stats } = await (await request.get('/api/stats')).json();
    const sum = Object.values(stats.vtBuckets as Record<string, number>).reduce((a, b) => a + b, 0);
    expect(sum).toBe(stats.total);
    const scanned = await (await request.get('/api/drivers?vt=none&limit=1')).json();
    if (scanned.total > 0) expect(scanned.drivers[0]._vt.m + scanned.drivers[0]._vt.s).toBe(0);
  });

  test('cache clearing is no longer exposed', async ({ request }) => {
    const body = await (await request.get('/api/stats?clearCache=true')).json();
    expect(body.message).toBeUndefined();
    expect(body.stats.total).toBeGreaterThan(0);
  });
});
