import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { Tools } from '@linkit/components';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  const mockRouter = { navigate: vi.fn() } as any;
  const fb = new FormBuilder();
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: {
        Layout: { dashboard: { enabled: false } },
        Profile: { showEmail: true },
      }
    }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockTools = {} as any;
  const mockApiService = {
    getList: vi.fn().mockReturnValue(of({ utente: { id_utente: '1', nome: 'N' }, settings: {} })),
    getDetails: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    putElementRelated: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockAuthService = {
    getCurrentSession: vi.fn().mockReturnValue({}),
    getSettings: vi.fn().mockReturnValue({}),
    saveSettings: vi.fn(),
    isGestore: vi.fn().mockReturnValue(false),
  } as any;
  const mockUtils = { GetErrorMsg: vi.fn().mockReturnValue('error') } as any;
  const mockModalService = { show: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    Tools.Configurazione = { utente: {} } as any;
    component = new ProfileComponent(
      mockRouter, fb, mockConfigService, mockTools,
      mockApiService, mockAuthService, mockUtils, mockModalService, mockTranslate
    );
  });

  afterEach(() => {
    Tools.Configurazione = null;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ProfileComponent.Name).toBe('ProfileComponent');
  });

  it('should have default values', () => {
    expect(component.isProfile).toBe(true);
    expect(component.isEdit).toBe(false);
    expect(component.saving).toBe(false);
    expect(component.spin).toBe(true);
  });

  it('should return isGestore from authService', () => {
    expect(component.isGestore).toBe(false);
    mockAuthService.isGestore.mockReturnValue(true);
    expect(component.isGestore).toBe(true);
  });

  it('should return mostraEmail from config', () => {
    expect(component.mostraEmail).toBe(true);
  });

  it('should set error messages', () => {
    component._setErrorMessages(true);
    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
    component._setErrorMessages(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoResults');
  });

  it('should navigate on breadcrumb', () => {
    component.onBreadcrumb({ url: '/test' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/test']);
  });

  it('should enable edit mode', () => {
    component.onEdit();
    expect(component.isEdit).toBe(true);
    expect(component.error).toBe(false);
  });

  it('should cancel edit mode', () => {
    component.profile = { nome: 'Test' };
    component.isEdit = true;
    component.onCancelEdit();
    expect(component.isEdit).toBe(false);
  });

  it('should show profile and settings tabs', () => {
    component._showProfile();
    expect(component.isProfile).toBe(true);
    component._showSettings();
    expect(component.isProfile).toBe(false);
  });

  it('should prepare body for update', () => {
    component.profile = { email: 'old@test.it', email_aziendale: 'biz@test.it' };
    const body = component.prepareBodyUpdate({
      nome: 'N', cognome: 'C', telefono: '123',
      telefono_aziendale: '456', email: 'new@test.it', note: ''
    });
    expect(body.nome).toBe('N');
    expect(body.email).toBe('new@test.it');
  });

  it('should toggle notifications', () => {
    component.profile = { id_utente: '1' };
    component._initServerForm({});
    component.toggleAllNotifications(false);
    expect(component._formSettingsSettings.get('emetti_per_tipi')!.value).toEqual([]);
    component.toggleAllNotifications(true);
    expect(component._formSettingsSettings.get('emetti_per_tipi')!.value.length).toBeGreaterThan(0);
  });

  it('should check isValueSelected', () => {
    component.profile = { id_utente: '1' };
    component._initServerForm({});
    expect(component.isValueSelected('emetti_per_tipi', 'comunicazione')).toBe(true);
  });

  it('should toggle value', () => {
    component.profile = { id_utente: '1' };
    component._initServerForm({});
    component.toggleValue('emetti_per_tipi', 'comunicazione', false);
    expect(component.isValueSelected('emetti_per_tipi', 'comunicazione')).toBe(false);
    component.toggleValue('emetti_per_tipi', 'comunicazione', true);
    expect(component.isValueSelected('emetti_per_tipi', 'comunicazione')).toBe(true);
  });

  it('should set avatar fallback on error', () => {
    const event = { target: { src: '' } };
    component.onAvatarError(event);
    expect(event.target.src).toBe('./assets/images/avatar.png');
  });

});
