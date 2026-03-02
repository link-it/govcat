import { type Locator, type Page, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly statsCards: Locator;
  readonly charts: Locator;
  readonly pendingActions: Locator;

  constructor(page: Page) {
    this.page = page;
    this.statsCards = page.locator('.stats-card, .dashboard-card, .card');
    this.charts = page.locator('ngx-charts-bar-vertical, ngx-charts-pie-chart, .chart-container');
    this.pendingActions = page.locator('.pending-actions, app-pending-action');
  }

  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
  }

  async expectDashboardPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dashboard/);
  }
}
