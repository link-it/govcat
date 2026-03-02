import { type Locator, type Page, expect } from '@playwright/test';

export class LayoutPage {
  readonly page: Page;
  readonly header: Locator;
  readonly sidebar: Locator;
  readonly userMenu: Locator;
  readonly headerTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header.navbar, .navbar-gitlab');
    this.sidebar = page.locator('app-gp-sidebar, .sidebar');
    this.userMenu = page.locator('.user-menu, .navbar-nav .dropdown');
    this.headerTitle = page.locator('.navbar-brand, .header-brand-title');
  }

  async navigateTo(path: string): Promise<void> {
    await this.page.goto(path);
  }

  async expectHeaderVisible(): Promise<void> {
    await expect(this.header).toBeVisible();
  }

  getSidebarLink(text: string): Locator {
    return this.sidebar.locator(`a, button`).filter({ hasText: text });
  }

  async clickSidebarLink(text: string): Promise<void> {
    await this.getSidebarLink(text).click();
  }

  async expectUrl(path: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(path));
  }
}
