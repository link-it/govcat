import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { ServiziPage } from '../pages/servizi.page';
import { AdesioniPage } from '../pages/adesioni.page';
import { DashboardPage } from '../pages/dashboard.page';
import { LayoutPage } from '../pages/layout.page';
import { injectSession, gestoreSession, referenteSession, type UserSession } from '../helpers/session.helper';
import { setupApiMocks } from '../helpers/api-mock.helper';

type GovCatFixtures = {
  loginPage: LoginPage;
  serviziPage: ServiziPage;
  adesioniPage: AdesioniPage;
  dashboardPage: DashboardPage;
  layoutPage: LayoutPage;
  authenticatedPage: ReturnType<typeof createAuthHelper>;
  apiMocks: void;
};

function createAuthHelper(injectFn: typeof injectSession) {
  return {
    asGestore: async (page: import('@playwright/test').Page) => injectFn(page, gestoreSession),
    asReferente: async (page: import('@playwright/test').Page) => injectFn(page, referenteSession),
    withSession: async (page: import('@playwright/test').Page, session: UserSession) => injectFn(page, session),
  };
}

export const test = base.extend<GovCatFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  serviziPage: async ({ page }, use) => {
    await use(new ServiziPage(page));
  },
  adesioniPage: async ({ page }, use) => {
    await use(new AdesioniPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  layoutPage: async ({ page }, use) => {
    await use(new LayoutPage(page));
  },
  authenticatedPage: async ({}, use) => {
    await use(createAuthHelper(injectSession));
  },
  apiMocks: [async ({ page }, use) => {
    await setupApiMocks(page);
    await use();
  }, { auto: false }],
});

export { expect } from '@playwright/test';
