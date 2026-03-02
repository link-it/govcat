import { type Locator, type Page, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorAlert: Locator;
  readonly anonymousButton: Locator;
  readonly logo: Locator;
  readonly title: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('button[type="submit"]');
    this.errorAlert = page.locator('.flash-alert');
    this.anonymousButton = page.locator('button').filter({ hasText: /anonima|anonymous/i });
    this.logo = page.locator('.login-page img').first();
    this.title = page.locator('h1').first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/login');
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectLoginPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/auth\/login/);
  }

  async expectErrorVisible(): Promise<void> {
    await expect(this.errorAlert).toBeVisible();
  }

  async backToAnonymous(): Promise<void> {
    await this.anonymousButton.click();
  }
}
