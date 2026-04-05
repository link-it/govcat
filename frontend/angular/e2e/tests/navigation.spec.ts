import { test, expect } from '../fixtures/base.fixture';
import { setupApiMocks } from '../helpers/api-mock.helper';
import { injectSession, gestoreSession, referenteSession } from '../helpers/session.helper';

test.describe('Navigation - Gestore', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await injectSession(page, gestoreSession);
  });

  test('should navigate to servizi', async ({ page }) => {
    await page.goto('/servizi');
    await expect(page).toHaveURL(/\/servizi/);
  });

  test('should navigate to adesioni', async ({ page }) => {
    await page.goto('/adesioni');
    await expect(page).toHaveURL(/\/adesioni/);
  });

  test('should navigate to dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should navigate to soggetti (admin)', async ({ page }) => {
    await page.goto('/soggetti');
    await expect(page).toHaveURL(/\/soggetti/);
  });

  test('should navigate to organizzazioni (admin)', async ({ page }) => {
    await page.goto('/organizzazioni');
    await expect(page).toHaveURL(/\/organizzazioni/);
  });

  test('should navigate to utenti (admin)', async ({ page }) => {
    await page.goto('/utenti');
    await expect(page).toHaveURL(/\/utenti/);
  });

  test('should navigate to domini (admin)', async ({ page }) => {
    await page.goto('/domini');
    await expect(page).toHaveURL(/\/domini/);
  });

  test('should navigate to client (admin)', async ({ page }) => {
    await page.goto('/client');
    await expect(page).toHaveURL(/\/client/);
  });

  test('should redirect unknown paths to servizi', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await expect(page).toHaveURL(/\/servizi/, { timeout: 10000 });
  });
});

test.describe('Navigation - Referente', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await injectSession(page, referenteSession);
  });

  test('should access servizi', async ({ page }) => {
    await page.goto('/servizi');
    await expect(page).toHaveURL(/\/servizi/);
  });

  test('should access adesioni', async ({ page }) => {
    await page.goto('/adesioni');
    await expect(page).toHaveURL(/\/adesioni/);
  });

  test('should access profile', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/profile/);
  });
});
