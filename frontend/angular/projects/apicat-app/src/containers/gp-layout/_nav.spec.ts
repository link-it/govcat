import { describe, it, expect } from 'vitest';
import { navItemsDashboardMenu, navItemsMainMenu, navItemsAdministratorMenu, navNotificationsMenu } from './_nav';

describe('_nav menu definitions', () => {
  it('navItemsDashboardMenu should have dashboard entry', () => {
    expect(navItemsDashboardMenu.length).toBe(1);
    expect(navItemsDashboardMenu[0].path).toBe('dashboard');
    expect(navItemsDashboardMenu[0].url).toBe('/dashboard');
    expect(navItemsDashboardMenu[0].permission).toBe('DASHBOARD_PENDING');
    expect(navItemsDashboardMenu[0].counter).toBe('dashboard');
  });

  it('navItemsMainMenu should have servizi and adesioni', () => {
    expect(navItemsMainMenu.length).toBe(2);
    expect(navItemsMainMenu[0].path).toContain('servizi');
    expect(navItemsMainMenu[0].children?.length).toBe(2);
    expect(navItemsMainMenu[1].path).toBe('adesioni');
  });

  it('navNotificationsMenu should have notifications entry', () => {
    expect(navNotificationsMenu.length).toBe(1);
    expect(navNotificationsMenu[0].path).toBe('notifications');
    expect(navNotificationsMenu[0].permission).toBe('NOTIFICATIONS');
    expect(navNotificationsMenu[0].counter).toBe('notifications');
  });

  it('navItemsAdministratorMenu should have configuration section', () => {
    expect(navItemsAdministratorMenu.length).toBe(2);
    expect(navItemsAdministratorMenu[0].divider).toBe(true);
    expect(navItemsAdministratorMenu[1].permission).toBe('ADMINISTRATOR');
    expect(navItemsAdministratorMenu[1].children!.length).toBeGreaterThan(5);
  });

  it('administrator menu children should include expected items', () => {
    const children = navItemsAdministratorMenu[1].children!;
    const paths = children.map(c => c.path);
    expect(paths).toContain('monitoraggio');
    expect(paths).toContain('gruppi');
    expect(paths).toContain('domini');
    expect(paths).toContain('soggetti');
    expect(paths).toContain('organizzazioni');
    expect(paths).toContain('utenti');
    expect(paths).toContain('classi-utente');
    expect(paths).toContain('tassonomie');
    expect(paths).toContain('pdnd');
  });

  it('all menu items should have valid labels', () => {
    const allItems = [...navItemsDashboardMenu, ...navItemsMainMenu, ...navNotificationsMenu, ...navItemsAdministratorMenu];
    allItems.forEach(item => {
      expect(item.label).toBeTruthy();
    });
  });
});
