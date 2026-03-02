import { type Locator, type Page, expect } from '@playwright/test';

export class AdesioniPage {
  readonly page: Page;
  readonly adesioniList: Locator;
  readonly searchInput: Locator;
  readonly totalBadge: Locator;
  readonly emptyMessage: Locator;
  readonly spinner: Locator;
  readonly addButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.adesioniList = page.locator('ui-item-row');
    this.searchInput = page.locator('.gl-filtered-search-term-input');
    this.totalBadge = page.locator('.gp-badge, .badge-muted').first();
    this.emptyMessage = page.locator('ui-box-message');
    this.spinner = page.locator('ui-box-spinner');
    this.addButton = page.locator('button').filter({ hasText: /nuova adesione|new subscription/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/adesioni');
  }

  async expectAdesioniPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/adesioni/);
  }

  async expectItemsVisible(): Promise<void> {
    await expect(this.adesioniList.first()).toBeVisible();
  }

  async getItemCount(): Promise<number> {
    return await this.adesioniList.count();
  }
}
