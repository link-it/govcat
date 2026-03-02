import { test, expect } from '../fixtures/base.fixture';
import { setupApiMocks, mockProfile } from '../helpers/api-mock.helper';

test.describe('Login', () => {
  test('should show the login page', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.expectLoginPage();
    await expect(loginPage.title).toBeVisible();
  });

  test('should show anonymous access button when configured', async ({ loginPage }) => {
    await loginPage.goto();
    await expect(loginPage.anonymousButton).toBeVisible();
  });

  test('should navigate back to catalog from anonymous button', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.backToAnonymous();
    await expect(loginPage.page).toHaveURL(/\/(servizi|dashboard|_home)/);
  });

  test('should show login form with username and password when AUTH_USER enabled', async ({ page }) => {
    // Override app-config to enable AUTH_USER
    await page.route('**/assets/config/app-config.json', async route => {
      const response = await route.fetch();
      const body = await response.json();
      body.AppConfig.AUTH_SETTINGS.AUTH_USER = true;
      body.AppConfig.AUTH_SETTINGS.LOGIN_ENABLED = true;
      await route.fulfill({ body: JSON.stringify(body) });
    });

    await page.goto('/auth/login');
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Enable AUTH_USER with BackdoorOAuth so isLogged() returns true after login
    await page.route('**/assets/config/app-config.json', async route => {
      const response = await route.fetch();
      const body = await response.json();
      body.AppConfig.AUTH_SETTINGS.AUTH_USER = true;
      body.AppConfig.AUTH_SETTINGS.LOGIN_ENABLED = true;
      body.AppConfig.AUTH_SETTINGS.OAUTH = { BackdoorOAuth: true };
      await route.fulfill({ body: JSON.stringify(body) });
    });
    await setupApiMocks(page);

    await page.goto('/auth/login');
    await page.locator('#username').fill('admin');
    await page.locator('#password').fill('admin123');
    await page.locator('button[type="submit"]').click();

    // Should redirect to dashboard after login
    await expect(page).toHaveURL(/\/(dashboard|servizi|_home)/, { timeout: 15000 });
  });

  test('should show error on failed login', async ({ page }) => {
    // Enable AUTH_USER
    await page.route('**/assets/config/app-config.json', async route => {
      const response = await route.fetch();
      const body = await response.json();
      body.AppConfig.AUTH_SETTINGS.AUTH_USER = true;
      body.AppConfig.AUTH_SETTINGS.LOGIN_ENABLED = true;
      body.AppConfig.ANONYMOUS_ACCESS = false;
      await route.fulfill({ body: JSON.stringify(body) });
    });

    // Mock failed login
    await page.route('/govcat-api/api/v1/profile', route =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ status: 401, title: 'Unauthorized' })
      })
    );

    await page.goto('/auth/login');
    await page.locator('#username').fill('wrong');
    await page.locator('#password').fill('wrong123');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.flash-alert')).toBeVisible({ timeout: 5000 });
  });
});
