import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Tools } from '@linkit/components';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  const mockRoute = {
    snapshot: { queryParams: {} },
  } as any;
  const mockRouter = {
    getCurrentNavigation: vi.fn().mockReturnValue(null),
    navigate: vi.fn(),
  } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockOAuth = {} as any;
  const mockAuthService = {
    isLogged: vi.fn().mockReturnValue(false),
    logout: vi.fn(),
    oauthLogin: vi.fn(),
  } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: {
        ANONYMOUS_ACCESS: true,
        AUTH_SETTINGS: { AUTH_USER: false, OTHER_AUTHS: [] },
        Layout: { Login: { title: 'Title', logo: 'logo.png', header: 'header.png' } }
      }
    }),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    Tools.MultiSnackbarDestroyAll = vi.fn();
    component = new LoginComponent(
      mockRoute, mockRouter, mockTranslate,
      mockOAuth, mockAuthService, mockConfigService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should read config on construction', () => {
    expect(component.ANONYMOUS_ACCESS).toBe(true);
    expect(component.AUTH_USER).toBe(false);
    expect(component.OTHER_AUTHS).toEqual([]);
  });

  it('should init form on ngOnInit', () => {
    component.ngOnInit();
    expect(component._formGroup.contains('username')).toBe(true);
    expect(component._formGroup.contains('password')).toBe(true);
  });

  it('should set title and logo on ngOnInit', () => {
    component.ngOnInit();
    expect(component._title).toBe('Title');
    expect(component._logo).toBe('./assets/images/logo.png');
  });

  it('should logout if already logged on ngOnInit', () => {
    mockAuthService.isLogged.mockReturnValue(true);
    component.ngOnInit();
    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should return form controls via f getter', () => {
    component.ngOnInit();
    expect(component.f['username']).toBeDefined();
  });

  it('should close alert', () => {
    component.error = { msg: 'err' };
    component.errorCode = '401';
    component._closeAlert();
    expect(component.error).toBeNull();
    expect(component.errorCode).toBe('');
  });

  it('should navigate to / on backToAnonymous', () => {
    component.backToAnonymous();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should call oauthLogin on logidWithUrlAction with oauth action', () => {
    component.logidWithUrlAction({ signin_action: 'oauth' });
    expect(mockAuthService.oauthLogin).toHaveBeenCalled();
  });
});
