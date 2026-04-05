import { test, expect } from '../fixtures/base.fixture';
import { setupApiMocks } from '../helpers/api-mock.helper';

test.describe('Anonymous Browsing', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test('should load the application and show catalog', async ({ page }) => {
    await page.goto('/');
    // Anonymous access is enabled, should reach servizi or redirect
    await expect(page).toHaveURL(/\/(servizi|dashboard|_home)/, { timeout: 15000 });
  });

  test('should display the header', async ({ page, layoutPage }) => {
    await page.goto('/');
    await page.waitForURL(/\/(servizi|dashboard|_home)/, { timeout: 15000 });
    await layoutPage.expectHeaderVisible();
  });

  test('should show servizi catalog page', async ({ serviziPage }) => {
    await serviziPage.goto();
    await serviziPage.expectServiziPage();
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Remove anonymous access for this test
    await page.route('**/assets/config/app-config.json', async route => {
      const response = await route.fetch();
      const body = await response.json();
      body.AppConfig.ANONYMOUS_ACCESS = false;
      body.AppConfig.AUTH_SETTINGS.AUTH_USER = true;
      body.AppConfig.AUTH_SETTINGS.AUTOLOGIN = false;
      await route.fulfill({ body: JSON.stringify(body) });
    });

    await page.goto('/adesioni');
    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });
});
