import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccessoComponent } from './accesso.component';

describe('AccessoComponent', () => {
  let component: AccessoComponent;
  const mockRoute = {} as any;
  const mockRouter = { navigate: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockOAuth = {
    getIdentityClaims: vi.fn().mockReturnValue({ given_name: 'Test' }),
    getGrantedScopes: vi.fn().mockReturnValue([]),
    authorizationHeader: vi.fn().mockReturnValue('Bearer token'),
    getIdToken: vi.fn().mockReturnValue('id-token'),
    getAccessToken: vi.fn().mockReturnValue('access-token'),
    refreshToken: vi.fn(),
  } as any;
  const mockAuthService = {} as any;
  const mockApiService = {} as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: {
        AUTH_SETTINGS: { SHOW_USER_REGISTRATION: false },
        Layout: { Login: { title: 'Title', logo: 'logo.png', header: 'header.png' } }
      }
    }),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new AccessoComponent(
      mockRoute, mockRouter, mockTranslate, mockOAuth,
      mockAuthService, mockApiService, mockConfigService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should read config on construction', () => {
    expect(component.config).toBeDefined();
    expect(component.showUserRegistration).toBe(false);
  });

  it('should have default values', () => {
    expect(component.loading).toBe(false);
    expect(component.error).toBeNull();
    expect(component._ms).toBe(1500);
  });

  it('should return userName from claims', () => {
    component.claims = { given_name: 'Mario' };
    expect(component.userName).toBe('Mario');
  });

  it('should return null when no claims', () => {
    component.claims = null;
    expect(component.userName).toBeNull();
  });

  it('should return idToken from oauth', () => {
    expect(component.idToken).toBe('id-token');
  });

  it('should return accessToken from oauth', () => {
    expect(component.accessToken).toBe('access-token');
  });

  it('should close alert', () => {
    component.error = { message: 'err' };
    component.errorCode = '500';
    component._closeAlert();
    expect(component.error).toBeNull();
    expect(component.errorCode).toBe('');
  });

  it('should navigate to home on gotoHome', () => {
    component.gotoHome();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should call oauth refreshToken', () => {
    component.refresh();
    expect(mockOAuth.refreshToken).toHaveBeenCalled();
  });
});
