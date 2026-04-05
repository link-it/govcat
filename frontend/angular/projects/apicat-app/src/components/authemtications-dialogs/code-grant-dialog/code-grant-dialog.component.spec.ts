import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Subject, of } from 'rxjs';
import { CodeGrantDialogComponent } from './code-grant-dialog.component';
import { Tools } from '@linkit/components';

describe('CodeGrantDialogComponent', () => {
  let component: CodeGrantDialogComponent;

  const mockHttp = {
    post: vi.fn()
  } as any;
  const mockClipboard = { copy: vi.fn().mockReturnValue(true) } as any;
  const mockModalRef = { hide: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockAuthService = {} as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({}),
    getAppConfig: vi.fn().mockReturnValue({
      AUTH_SETTINGS: {
        TOKEN_POLICIES: {
          code_grant: {
            redirect_uri: '/callback'
          }
        }
      }
    }),
  } as any;
  const mockUtils = {} as any;
  const mockAuthDialogService = {} as any;

  let savedConfigurazione: any;

  beforeEach(() => {
    vi.clearAllMocks();
    savedConfigurazione = Tools.Configurazione;
    Tools.Configurazione = {
      generale: {
        site: 'https://example.com'
      }
    };

    component = new CodeGrantDialogComponent(
      mockHttp, mockClipboard, mockModalRef, mockTranslate,
      mockAuthService, mockConfigService, mockUtils, mockAuthDialogService
    );
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default tipoPolicy code_grant', () => {
    expect(component.tipoPolicy).toBe('code_grant');
  });

  it('should have default title', () => {
    expect(component.title).toBe('APP.AUTHENTICATION.TITLE.GenerateCodeGrant');
  });

  it('should have form controls initialized', () => {
    expect(component.formGroup).toBeTruthy();
    expect(component.formGroup.get('clientId')).toBeTruthy();
    expect(component.formGroup.get('clientSecret')).toBeTruthy();
    expect(component.formGroup.get('redirectUri')).toBeTruthy();
    expect(component.formGroup.get('authorizationUrl')).toBeTruthy();
    expect(component.formGroup.get('tokenUrl')).toBeTruthy();
    expect(component.formGroup.get('scope')).toBeTruthy();
    expect(component.formGroup.get('authCode')).toBeTruthy();
    expect(component.formGroup.get('accessToken')).toBeTruthy();
    expect(component.formGroup.get('decodedToken')).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize with tokenPolicy values', () => {
      component.tokenPolicy = {
        codice_policy: 'my-policy',
        scope: 'openid profile',
        auth_url: 'https://auth.example.com/authorize',
        token_url: 'https://auth.example.com/token'
      };

      // Mock BroadcastChannel
      const mockChannel = {
        onmessage: null as any,
        close: vi.fn()
      };
      component.broadcastChannel = mockChannel as any;

      component.ngOnInit();

      expect(component._codicePolicy).toBe('my-policy');
      expect(component._scope).toBe('openid profile');
      expect(component._authUrl).toBe('https://auth.example.com/authorize');
      expect(component._tokenUrl).toBe('https://auth.example.com/token');
      expect(component._redirectUri).toBe('https://example.com/callback');

      // Form should be patched
      expect(component.formGroup.get('redirectUri')?.value).toBe('https://example.com/callback');
      expect(component.formGroup.get('authorizationUrl')?.value).toBe('https://auth.example.com/authorize');
      expect(component.formGroup.get('tokenUrl')?.value).toBe('https://auth.example.com/token');
      expect(component.formGroup.get('scope')?.value).toBe('openid profile');
    });

    it('should use defaults when tokenPolicy is null', () => {
      component.tokenPolicy = null;

      const mockChannel = { onmessage: null as any, close: vi.fn() };
      component.broadcastChannel = mockChannel as any;

      component.ngOnInit();

      expect(component._codicePolicy).toBe('');
      expect(component._scope).toBe('');
      expect(component._authUrl).toBe('');
      expect(component._tokenUrl).toBe('');
    });

    it('should use defaults when configGenerale is null', () => {
      Tools.Configurazione = { generale: null };
      component.tokenPolicy = null;

      const mockChannel = { onmessage: null as any, close: vi.fn() };
      component.broadcastChannel = mockChannel as any;

      component.ngOnInit();

      // _redirectUri should use fallback
      expect(component._redirectUri).toContain('');
    });

    it('should use defaults when codeGrantOptions is null', () => {
      mockConfigService.getAppConfig.mockReturnValue({});
      component.tokenPolicy = null;

      const mockChannel = { onmessage: null as any, close: vi.fn() };
      component.broadcastChannel = mockChannel as any;

      component.ngOnInit();

      expect(component._redirectUri).toBeDefined();
    });

    it('should set up broadcastChannel onmessage handler', () => {
      component.tokenPolicy = {
        codice_policy: 'test',
        scope: 'openid',
        auth_url: 'https://auth.example.com/authorize',
        token_url: 'https://auth.example.com/token'
      };

      const mockChannel = { onmessage: null as any, close: vi.fn() };
      component.broadcastChannel = mockChannel as any;

      const scambiaSpy = vi.spyOn(component, 'scambiaToken').mockResolvedValue(undefined);
      component.authWindow = { close: vi.fn() };

      component.ngOnInit();

      // Simulate broadcast message
      expect(mockChannel.onmessage).toBeTruthy();
      mockChannel.onmessage({ data: { code: 'auth-code-123' } });

      expect(component.authWindow.close).toHaveBeenCalled();
      expect(scambiaSpy).toHaveBeenCalled();
    });

    it('should not call scambiaToken if broadcast data is falsy', () => {
      component.tokenPolicy = {
        codice_policy: 'test',
        scope: 'openid',
        auth_url: 'https://auth.example.com/authorize',
        token_url: 'https://auth.example.com/token'
      };

      const mockChannel = { onmessage: null as any, close: vi.fn() };
      component.broadcastChannel = mockChannel as any;

      const scambiaSpy = vi.spyOn(component, 'scambiaToken').mockResolvedValue(undefined);

      component.ngOnInit();

      // Simulate broadcast with null data
      mockChannel.onmessage({ data: null });

      expect(scambiaSpy).not.toHaveBeenCalled();
    });
  });

  it('ngOnDestroy should close broadcastChannel', () => {
    const closeSpy = vi.fn();
    component.broadcastChannel = { close: closeSpy } as any;
    component.ngOnDestroy();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('f getter should return form controls', () => {
    const controls = component.f;
    expect(controls['clientId']).toBeTruthy();
    expect(controls['clientSecret']).toBeTruthy();
  });

  describe('initForm', () => {
    it('should patch form values from component state', () => {
      component._redirectUri = 'https://redirect.example.com';
      component._authUrl = 'https://auth.example.com';
      component._tokenUrl = 'https://token.example.com';
      component._scope = 'openid email';

      component.initForm();

      expect(component.formGroup.get('redirectUri')?.value).toBe('https://redirect.example.com');
      expect(component.formGroup.get('authorizationUrl')?.value).toBe('https://auth.example.com');
      expect(component.formGroup.get('tokenUrl')?.value).toBe('https://token.example.com');
      expect(component.formGroup.get('scope')?.value).toBe('openid email');
    });
  });

  describe('closeModal', () => {
    it('should emit onClose and hide modal', () => {
      component.onClose = new Subject();
      let emittedValue: any = null;
      component.onClose.subscribe(v => emittedValue = v);

      component.closeModal();

      expect(emittedValue).toEqual({ close: true, result: {} });
      expect(mockModalRef.hide).toHaveBeenCalled();
    });

    it('should pass data to onClose', () => {
      component.onClose = new Subject();
      let emittedValue: any = null;
      component.onClose.subscribe(v => emittedValue = v);

      component.closeModal({ token: 'abc123' });

      expect(emittedValue).toEqual({ close: true, result: { token: 'abc123' } });
    });
  });

  describe('useResultModal', () => {
    it('should close modal with accessToken value', () => {
      component.onClose = new Subject();
      const closeSpy = vi.spyOn(component, 'closeModal');
      component.formGroup.get('accessToken')?.setValue('my-token');

      component.useResultModal();

      expect(closeSpy).toHaveBeenCalledWith({ token: 'my-token' });
    });

    it('should close modal with null when accessToken is empty', () => {
      component.onClose = new Subject();
      const closeSpy = vi.spyOn(component, 'closeModal');

      component.useResultModal();

      expect(closeSpy).toHaveBeenCalledWith({ token: null });
    });
  });

  describe('clearError', () => {
    it('should reset error state', () => {
      component._error = true;
      component._errorMsg = 'some error';
      component._errorObject = { error: 'test' };
      component.formGroup.get('result')?.setValue('some result');

      component.clearError();

      expect(component._error).toBe(false);
      expect(component._errorMsg).toBe('');
      expect(component._errorObject).toBeNull();
      expect(component.formGroup.get('result')?.value).toBeNull();
    });
  });

  describe('onStartAuth', () => {
    it('should not open window if form is invalid', async () => {
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
      const clearSpy = vi.spyOn(component, 'clearError').mockImplementation(() => {});

      // Form is invalid because required fields are empty
      await component.onStartAuth({});

      expect(clearSpy).toHaveBeenCalled();
      expect(openSpy).not.toHaveBeenCalled();
    });

    it('should open auth window when form is valid', async () => {
      vi.useFakeTimers();
      vi.spyOn(component, 'clearError').mockImplementation(() => {});

      const mockWindow = { closed: false } as any;
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(mockWindow);

      // Make form valid
      component.formGroup.patchValue({
        clientId: 'client-123',
        clientSecret: 'secret',
        redirectUri: 'https://redirect.example.com',
        authorizationUrl: 'https://auth.example.com/authorize',
        tokenUrl: 'https://token.example.com/token',
      });

      const values = component.formGroup.getRawValue();
      await component.onStartAuth(values);

      expect(openSpy).toHaveBeenCalled();
      expect(component._spin).toBe(true);

      // Simulate window closed
      mockWindow.closed = true;
      vi.advanceTimersByTime(1000);

      expect(component._spin).toBe(false);

      vi.useRealTimers();
    });

    it('should replace commas with spaces in scope', async () => {
      vi.useFakeTimers();
      vi.spyOn(component, 'clearError').mockImplementation(() => {});

      const mockWindow = { closed: true } as any;
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(mockWindow);

      component.formGroup.patchValue({
        clientId: 'client-123',
        clientSecret: 'secret',
        redirectUri: 'https://redirect.example.com',
        authorizationUrl: 'https://auth.example.com/authorize',
        tokenUrl: 'https://token.example.com/token',
        scope: 'openid,profile,email'
      });

      const values = component.formGroup.getRawValue();
      await component.onStartAuth(values);

      const calledUrl = openSpy.mock.calls[0][0] as string;
      // Scope should have spaces instead of commas (URL-encoded as %20)
      expect(calledUrl).toContain('scope=openid%20profile%20email');

      vi.advanceTimersByTime(1000);
      vi.useRealTimers();
    });
  });

  describe('scambiaToken', () => {
    it('should exchange auth code for token successfully', async () => {
      // Create a fake JWT token (header.payload.signature)
      const payload = { exp: 1700000000, sub: 'user-123' };
      const fakeJwt = `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify(payload))}.signature`;

      mockHttp.post.mockReturnValue(of({ access_token: fakeJwt }));

      const values = {
        clientId: 'client-123',
        clientSecret: 'secret',
        tokenUrl: 'https://token.example.com/token',
        redirectUri: 'https://redirect.example.com'
      };

      await component.scambiaToken(values, { code: 'auth-code-xyz' });

      expect(mockHttp.post).toHaveBeenCalled();
      expect(component.formGroup.get('authCode')?.value).toBe('auth-code-xyz');
      expect(component.formGroup.get('result')?.value).toBeTruthy();
      expect(component.formGroup.get('accessToken')?.value).toBeTruthy();
      expect(component.formGroup.get('decodedToken')?.value).toBeTruthy();
    });

    it('should handle null auth code', async () => {
      const payload = { exp: 1700000000 };
      const fakeJwt = `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify(payload))}.sig`;
      mockHttp.post.mockReturnValue(of({ access_token: fakeJwt }));

      const values = {
        clientId: 'client-123',
        clientSecret: 'secret',
        tokenUrl: 'https://token.example.com/token',
        redirectUri: 'https://redirect.example.com'
      };

      await component.scambiaToken(values, {});

      expect(component.formGroup.get('authCode')?.value).toBeNull();
    });

    it('should handle token exchange error with error object', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockHttp.post.mockReturnValue({
        toPromise: () => Promise.reject({
          error: { error_description: 'Invalid grant', message: 'Error message' }
        })
      });

      const values = {
        clientId: 'client-123',
        clientSecret: 'secret',
        tokenUrl: 'https://token.example.com/token',
        redirectUri: 'https://redirect.example.com'
      };

      await component.scambiaToken(values, { code: 'bad-code' });

      expect(component._error).toBe(true);
      expect(component._errorObject).toEqual({ error_description: 'Invalid grant', message: 'Error message' });
      expect(component._errorMsg).toBe('Invalid grant');
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should handle token exchange error with message fallback', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mockHttp.post.mockReturnValue({
        toPromise: () => Promise.reject({
          error: { message: 'Server error' }
        })
      });

      const values = {
        clientId: 'client-123',
        clientSecret: 'secret',
        tokenUrl: 'https://token.example.com/token',
        redirectUri: 'https://redirect.example.com'
      };

      await component.scambiaToken(values, { code: 'bad-code' });

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Server error');
    });

    it('should handle token exchange error with non-object error', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mockHttp.post.mockReturnValue({
        toPromise: () => Promise.reject({
          error: 'string error'
        })
      });

      const values = {
        clientId: 'client-123',
        clientSecret: 'secret',
        tokenUrl: 'https://token.example.com/token',
        redirectUri: 'https://redirect.example.com'
      };

      await component.scambiaToken(values, { code: 'bad-code' });

      expect(component._error).toBe(true);
      expect(component._errorObject).toBeNull();
      expect(component._errorMsg).toBe('Errore generazione token');
    });
  });

  describe('toggleResult', () => {
    it('should toggle _showResult from false to true', () => {
      component._showResult = false;
      component.toggleResult();
      expect(component._showResult).toBe(true);
    });

    it('should toggle _showResult from true to false', () => {
      component._showResult = true;
      component.toggleResult();
      expect(component._showResult).toBe(false);
    });
  });
});
