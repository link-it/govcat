import { test, expect } from '../fixtures/base.fixture';
import { setupApiMocks } from '../helpers/api-mock.helper';
import { injectSession, gestoreSession } from '../helpers/session.helper';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await injectSession(page, gestoreSession);
  });

  test('should load the dashboard page', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.expectDashboardPage();
  });

  test('should display dashboard content', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    // Wait for content to render
    await page.waitForTimeout(2000);

    // Dashboard should have some content rendered
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });
});
