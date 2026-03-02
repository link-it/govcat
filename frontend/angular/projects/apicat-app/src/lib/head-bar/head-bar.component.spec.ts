import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Tools } from '../services/tools.service';
import { Language } from '../classes/language';
import { MenuAction } from '../classes/menu-action';
import { HeadBarComponent } from './head-bar.component';

describe('HeadBarComponent', () => {
  let component: HeadBarComponent;

  beforeEach(() => {
    vi.clearAllMocks();
    Tools.USER_LOGGED = null;
    component = new HeadBarComponent();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component.title).toBe('');
    expect(component.logo).toBe('');
    expect(component.anonymous).toBe(true);
    expect(component.login).toBe(false);
    expect(component.loginLabel).toBe('Login');
    expect(component._username).toBe('');
    expect(component.loggedIn).toBe(false);
    expect(component._showLanguageMenu).toBe(true);
    expect(component._showNotifications).toBe(false);
    expect(component._notificationsCounter).toBe(0);
  });

  it('should return content-block false when USER_LOGGED is null', () => {
    Tools.USER_LOGGED = null;
    expect(component.headContentClass).toBe(false);
  });

  it('should return content-block true when USER_LOGGED is set', () => {
    Tools.USER_LOGGED = { nome: 'Test' } as any;
    expect(component.headContentClass).toBe(true);
  });

  it('should return headBarClass with content-block-slim when not logged', () => {
    Tools.USER_LOGGED = null;
    const cls = component.__headBarClass();
    expect(cls['container-fluid']).toBe(true);
    expect(cls['content-block-slim']).toBe(true);
  });

  it('should return headBarClass without content-block-slim when logged', () => {
    Tools.USER_LOGGED = { nome: 'Test' } as any;
    const cls = component.__headBarClass();
    expect(cls['content-block-slim']).toBe(false);
  });

  it('should change language and emit event', () => {
    const spy = vi.spyOn(component._changeLang, 'emit');
    component._showLanguageMenu = true;
    const lang = new Language({ language: 'English', alpha2Code: 'en', alpha3Code: 'eng' });
    component._changeLanguage(lang);
    expect(component._currentLanguage).toBe('eng');
    expect(spy).toHaveBeenCalledWith({ language: lang });
  });

  it('should not change language when showLanguageMenu is false', () => {
    const spy = vi.spyOn(component._changeLang, 'emit');
    component._showLanguageMenu = false;
    component._currentLanguage = 'ita';
    const lang = new Language({ language: 'English', alpha2Code: 'en', alpha3Code: 'eng' });
    component._changeLanguage(lang);
    expect(component._currentLanguage).toBe('ita');
    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit menu action', () => {
    const spy = vi.spyOn(component._menuAction, 'emit');
    const action = new MenuAction({ title: 'Logout', action: 'logout' });
    component._onMenuAction(action);
    expect(spy).toHaveBeenCalledWith({ menu: action });
  });

  it('should emit menu app action when enabled', () => {
    const spy = vi.spyOn(component._menuAppAction, 'emit');
    const action = new MenuAction({ title: 'Settings', action: 'settings', enabled: true });
    component._onMenuAppAction(action);
    expect(spy).toHaveBeenCalledWith({ menu: action });
  });

  it('should not emit menu app action when disabled', () => {
    const spy = vi.spyOn(component._menuAppAction, 'emit');
    const action = new MenuAction({ title: 'Settings', action: 'settings' });
    action.enabled = false;
    component._onMenuAppAction(action);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should set avatar fallback on error', () => {
    const event = { target: { src: '' } };
    component.onAvatarError(event);
    expect(event.target.src).toBe('./assets/images/avatar.png');
  });

  it('should have default notification and login menus', () => {
    expect(component._notificationMenu.action).toBe('notifications');
    expect(component._loginMenu.action).toBe('login');
  });
});
