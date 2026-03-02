import { type Locator, type Page, expect } from '@playwright/test';

export class ServiziPage {
  readonly page: Page;
  readonly serviziList: Locator;
  readonly serviziCards: Locator;
  readonly searchInput: Locator;
  readonly totalBadge: Locator;
  readonly emptyMessage: Locator;
  readonly spinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.serviziList = page.locator('ui-item-row, lnk-card');
    this.serviziCards = page.locator('lnk-card');
    this.searchInput = page.locator('.gl-filtered-search-term-input');
    this.totalBadge = page.locator('.gp-badge, .badge-muted').first();
    this.emptyMessage = page.locator('ui-box-message');
    this.spinner = page.locator('ui-box-spinner');
  }

  async goto(): Promise<void> {
    await this.page.goto('/servizi');
  }

  async expectServiziPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/servizi/);
  }

  async expectItemsVisible(): Promise<void> {
    await expect(this.serviziList.first()).toBeVisible();
  }

  async getItemCount(): Promise<number> {
    return await this.serviziList.count();
  }

  async clickItem(index: number): Promise<void> {
    await this.serviziList.nth(index).click();
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.emptyMessage).toBeVisible();
  }

  async expectLoading(): Promise<void> {
    await expect(this.spinner).toBeVisible();
  }
}
