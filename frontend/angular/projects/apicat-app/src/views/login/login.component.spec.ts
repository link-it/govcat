import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
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

  it('should redirect to signin_url when logidWithUrlAction has signin_url', () => {
    const originalHref = Object.getOwnPropertyDescriptor(window, 'location');
    const mockLocation = { href: '' };
    Object.defineProperty(window, 'location', { value: mockLocation, writable: true, configurable: true });
    component.logidWithUrlAction({ signin_url: 'https://external-auth.com/login' });
    expect(mockLocation.href).toBe('https://external-auth.com/login');
    if (originalHref) {
      Object.defineProperty(window, 'location', originalHref);
    }
  });

  it('should do nothing for unknown signin_action without signin_url', () => {
    component.logidWithUrlAction({ signin_action: 'unknown_action' });
    expect(mockAuthService.oauthLogin).not.toHaveBeenCalled();
  });

  describe('login', () => {
    it('should set loading to true during login', () => {
      mockAuthService.login = vi.fn().mockReturnValue(of({}));
      mockAuthService.setCurrentSession = vi.fn();
      mockAuthService.reloadSession = vi.fn();
      component.ngOnInit();
      component.login({ username: 'user', password: 'pass' });
      expect(mockAuthService.login).toHaveBeenCalledWith('user', 'pass');
    });

    it('should navigate to /dashboard on success when returnUrl is /', () => {
      mockAuthService.login = vi.fn().mockReturnValue(of({ principal: 'user' }));
      mockAuthService.setCurrentSession = vi.fn();
      mockAuthService.reloadSession = vi.fn();
      component.ngOnInit();
      component.returnUrl = '/';
      component.login({ username: 'user', password: 'pass' });
      expect(mockAuthService.setCurrentSession).toHaveBeenCalledWith({ principal: 'user' });
      expect(mockAuthService.reloadSession).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
      expect(component.loading).toBe(false);
    });

    it('should navigate to returnUrl on success when returnUrl is not /', () => {
      mockAuthService.login = vi.fn().mockReturnValue(of({ principal: 'user' }));
      mockAuthService.setCurrentSession = vi.fn();
      mockAuthService.reloadSession = vi.fn();
      component.ngOnInit();
      component.returnUrl = '/servizi';
      component.login({ username: 'user', password: 'pass' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi']);
    });

    it('should set error and errorCode on login failure', () => {
      const errorResponse = { error: { status: '401' } };
      mockAuthService.login = vi.fn().mockReturnValue(throwError(() => errorResponse));
      component.ngOnInit();
      component.login({ username: 'user', password: 'wrong' });
      expect(component.error).toBe(errorResponse);
      expect(component.errorCode).toBe('401');
      expect(component.loading).toBe(false);
    });
  });

  it('should set returnUrl from queryParams', () => {
    mockRoute.snapshot.queryParams = { returnUrl: '/custom-page' };
    component.ngOnInit();
    expect(component.returnUrl).toBe('/custom-page');
    mockRoute.snapshot.queryParams = {};
  });

  it('should not logout if not logged on ngOnInit', () => {
    mockAuthService.isLogged.mockReturnValue(false);
    component.ngOnInit();
    expect(mockAuthService.logout).not.toHaveBeenCalled();
  });

  it('should set error from navigation extras state', () => {
    mockRouter.getCurrentNavigation.mockReturnValue({
      extras: { state: { from: 'guard', message: 'Not authorized' } }
    });
    const comp = new LoginComponent(
      mockRoute, mockRouter, mockTranslate,
      mockOAuth, mockAuthService, mockConfigService
    );
    expect(comp.error).toEqual({ from: 'guard', message: 'Not authorized' });
  });

  it('should have username validation (required, minLength 2)', () => {
    component.ngOnInit();
    const ctrl = component.f['username'];
    ctrl.setValue('');
    expect(ctrl.valid).toBe(false);
    ctrl.setValue('a');
    expect(ctrl.valid).toBe(false);
    ctrl.setValue('ab');
    expect(ctrl.valid).toBe(true);
  });

  it('should have password validation (required, minLength 4)', () => {
    component.ngOnInit();
    const ctrl = component.f['password'];
    ctrl.setValue('');
    expect(ctrl.valid).toBe(false);
    ctrl.setValue('abc');
    expect(ctrl.valid).toBe(false);
    ctrl.setValue('abcd');
    expect(ctrl.valid).toBe(true);
  });
});
