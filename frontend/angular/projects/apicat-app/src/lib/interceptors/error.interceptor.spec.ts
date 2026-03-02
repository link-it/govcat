import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorInterceptor, DISABLE_GLOBAL_EXCEPTION_HANDLING, SKIP_AUTH_REFRESH } from './error.interceptor';
import { HttpRequest, HttpHandler, HttpResponse, HttpErrorResponse, HttpContext } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Tools } from '../services/tools.service';

describe('ErrorInterceptor', () => {
  let interceptor: ErrorInterceptor;
  let mockRouter: any;
  let mockTranslate: any;
  let mockPageloaderService: any;
  let mockConfigService: any;
  let mockOAuthService: any;
  let mockHandler: HttpHandler;

  beforeEach(() => {
    mockRouter = {
      navigate: vi.fn()
    };
    mockTranslate = {
      instant: vi.fn().mockReturnValue('Unauthorized')
    };
    mockPageloaderService = {
      showLoader: vi.fn(),
      hideLoader: vi.fn()
    };
    mockConfigService = {
      getConfiguration: vi.fn().mockReturnValue({
        AppConfig: {
          AUTH_SETTINGS: { OAUTH: { BackdoorOAuth: false, EnableRefreshOn401: true } },
          ANONYMOUS_ACCESS: false
        }
      })
    };
    mockOAuthService = {
      getRefreshToken: vi.fn().mockReturnValue('refresh-token'),
      refreshToken: vi.fn().mockResolvedValue({}),
      getAccessToken: vi.fn().mockReturnValue('new-access-token'),
      tokenEndpoint: 'https://auth.example.com/oauth/token'
    };
    mockHandler = {
      handle: vi.fn().mockReturnValue(of(new HttpResponse({ status: 200 })))
    };

    vi.spyOn(Tools, 'OnError').mockImplementation(() => {});

    interceptor = new ErrorInterceptor(
      mockRouter, mockTranslate, mockPageloaderService, mockConfigService, mockOAuthService
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('should pass through successful requests', () => {
    const req = new HttpRequest('GET', '/api/test');
    let result: any;
    interceptor.intercept(req, mockHandler).subscribe(event => {
      result = event;
    });
    expect(result).toBeInstanceOf(HttpResponse);
  });

  it('should export DISABLE_GLOBAL_EXCEPTION_HANDLING token', () => {
    expect(DISABLE_GLOBAL_EXCEPTION_HANDLING).toBeTruthy();
  });

  it('should export SKIP_AUTH_REFRESH token', () => {
    expect(SKIP_AUTH_REFRESH).toBeTruthy();
  });

  it('should skip error handling when DISABLE_GLOBAL_EXCEPTION_HANDLING is true', () => {
    const context = new HttpContext().set(DISABLE_GLOBAL_EXCEPTION_HANDLING, true);
    const req = new HttpRequest('GET', '/api/test', { context });
    const error = new HttpErrorResponse({ status: 500 });
    (mockHandler.handle as any).mockReturnValue(throwError(() => error));

    interceptor.intercept(req, mockHandler).subscribe({
      error: (err: any) => {
        // The error should propagate without being processed
        expect(err).toBe(error);
      }
    });

    expect(mockPageloaderService.hideLoader).not.toHaveBeenCalled();
  });

  it('should handle 401 error with token refresh', async () => {
    const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
    (mockHandler.handle as any)
      .mockReturnValueOnce(throwError(() => error))
      .mockReturnValueOnce(of(new HttpResponse({ status: 200 })));

    const req = new HttpRequest('GET', '/api/test');
    let result: any;
    interceptor.intercept(req, mockHandler).subscribe(event => {
      result = event;
    });

    // refreshToken returns a Promise, so we need to flush microtasks
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockOAuthService.refreshToken).toHaveBeenCalled();
    expect(result).toBeInstanceOf(HttpResponse);
  });

  it('should add Bearer token to retried request after refresh', async () => {
    const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
    (mockHandler.handle as any)
      .mockReturnValueOnce(throwError(() => error))
      .mockReturnValueOnce(of(new HttpResponse({ status: 200 })));

    const req = new HttpRequest('GET', '/api/test');
    interceptor.intercept(req, mockHandler).subscribe();

    // refreshToken returns a Promise, so we need to flush microtasks
    await new Promise(resolve => setTimeout(resolve, 0));

    const retriedReq = (mockHandler.handle as any).mock.calls[1][0] as HttpRequest<any>;
    expect(retriedReq.headers.get('Authorization')).toBe('Bearer new-access-token');
  });

  it('should redirect to login when no refresh token', () => {
    mockOAuthService.getRefreshToken.mockReturnValue(null);
    const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized', url: '/api/test' });
    (mockHandler.handle as any).mockReturnValue(throwError(() => error));

    const req = new HttpRequest('GET', '/api/test');
    let caughtError: any;
    interceptor.intercept(req, mockHandler).subscribe({
      error: (err: any) => { caughtError = err; }
    });

    expect(caughtError).toBeTruthy();
    expect(Tools.OnError).toHaveBeenCalled();
    expect(mockPageloaderService.hideLoader).toHaveBeenCalled();
  });

  it('should redirect to login when OAuth is not enabled', () => {
    mockConfigService.getConfiguration.mockReturnValue({
      AppConfig: {
        AUTH_SETTINGS: { OAUTH: { BackdoorOAuth: true } },
        ANONYMOUS_ACCESS: false
      }
    });
    interceptor = new ErrorInterceptor(
      mockRouter, mockTranslate, mockPageloaderService, mockConfigService, mockOAuthService
    );

    const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized', url: '/api/test' });
    (mockHandler.handle as any).mockReturnValue(throwError(() => error));

    const req = new HttpRequest('GET', '/api/test');
    let caughtError: any;
    interceptor.intercept(req, mockHandler).subscribe({
      error: (err: any) => { caughtError = err; }
    });

    expect(caughtError).toBeTruthy();
  });

  it('should redirect to login when anonymous access is enabled', () => {
    mockConfigService.getConfiguration.mockReturnValue({
      AppConfig: {
        AUTH_SETTINGS: { OAUTH: {} },
        ANONYMOUS_ACCESS: true
      }
    });
    interceptor = new ErrorInterceptor(
      mockRouter, mockTranslate, mockPageloaderService, mockConfigService, mockOAuthService
    );

    const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized', url: '/api/test' });
    (mockHandler.handle as any).mockReturnValue(throwError(() => error));

    const req = new HttpRequest('GET', '/api/test');
    let caughtError: any;
    interceptor.intercept(req, mockHandler).subscribe({
      error: (err: any) => { caughtError = err; }
    });

    expect(caughtError).toBeTruthy();
  });

  it('should redirect to login when EnableRefreshOn401 is false', () => {
    mockConfigService.getConfiguration.mockReturnValue({
      AppConfig: {
        AUTH_SETTINGS: { OAUTH: { EnableRefreshOn401: false } },
        ANONYMOUS_ACCESS: false
      }
    });
    interceptor = new ErrorInterceptor(
      mockRouter, mockTranslate, mockPageloaderService, mockConfigService, mockOAuthService
    );

    const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized', url: '/api/test' });
    (mockHandler.handle as any).mockReturnValue(throwError(() => error));

    const req = new HttpRequest('GET', '/api/test');
    let caughtError: any;
    interceptor.intercept(req, mockHandler).subscribe({
      error: (err: any) => { caughtError = err; }
    });

    expect(caughtError).toBeTruthy();
  });

  it('should handle 403 errors', () => {
    const error = new HttpErrorResponse({ status: 403, statusText: 'Forbidden', url: '/api/test' });
    (mockHandler.handle as any).mockReturnValue(throwError(() => error));

    const req = new HttpRequest('GET', '/api/test');
    let caughtError: any;
    interceptor.intercept(req, mockHandler).subscribe({
      error: (err: any) => { caughtError = err; }
    });

    expect(Tools.OnError).toHaveBeenCalled();
    expect(mockPageloaderService.hideLoader).toHaveBeenCalled();
    expect(caughtError).toBeTruthy();
  });

  it('should handle 500 errors', () => {
    const error = new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error', url: '/api/test' });
    (mockHandler.handle as any).mockReturnValue(throwError(() => error));

    const req = new HttpRequest('GET', '/api/test');
    let caughtError: any;
    interceptor.intercept(req, mockHandler).subscribe({
      error: (err: any) => { caughtError = err; }
    });

    expect(mockPageloaderService.hideLoader).toHaveBeenCalled();
    expect(caughtError.message).toBeTruthy();
  });

  it('should skip auth refresh for token endpoint URLs', () => {
    const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized', url: 'https://auth.example.com/oauth/token' });
    (mockHandler.handle as any).mockReturnValue(throwError(() => error));

    const req = new HttpRequest('GET', 'https://auth.example.com/oauth/token');
    let caughtError: any;
    interceptor.intercept(req, mockHandler).subscribe({
      error: (err: any) => { caughtError = err; }
    });

    expect(caughtError).toBeTruthy();
    expect(mockOAuthService.refreshToken).not.toHaveBeenCalled();
  });

  it('should skip auth refresh for config JSON URLs', () => {
    const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized', url: '/assets/app-config.json' });
    (mockHandler.handle as any).mockReturnValue(throwError(() => error));

    const req = new HttpRequest('GET', '/assets/app-config.json');
    let caughtError: any;
    interceptor.intercept(req, mockHandler).subscribe({
      error: (err: any) => { caughtError = err; }
    });

    expect(mockOAuthService.refreshToken).not.toHaveBeenCalled();
  });

  it('should skip auth refresh when SKIP_AUTH_REFRESH context is set', () => {
    const context = new HttpContext().set(SKIP_AUTH_REFRESH, true);
    const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized', url: '/api/test' });
    (mockHandler.handle as any).mockReturnValue(throwError(() => error));

    const req = new HttpRequest('GET', '/api/test', { context });
    let caughtError: any;
    interceptor.intercept(req, mockHandler).subscribe({
      error: (err: any) => { caughtError = err; }
    });

    expect(mockOAuthService.refreshToken).not.toHaveBeenCalled();
  });

  it('should work without OAuthService (null)', () => {
    interceptor = new ErrorInterceptor(
      mockRouter, mockTranslate, mockPageloaderService, mockConfigService, null as any
    );

    const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized', url: '/api/test' });
    (mockHandler.handle as any).mockReturnValue(throwError(() => error));

    const req = new HttpRequest('GET', '/api/test');
    let caughtError: any;
    interceptor.intercept(req, mockHandler).subscribe({
      error: (err: any) => { caughtError = err; }
    });

    expect(caughtError).toBeTruthy();
  });

  it('should redirect to login when refresh fails', async () => {
    mockOAuthService.refreshToken.mockRejectedValue(new Error('Refresh failed'));
    const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized', url: '/api/test' });
    (mockHandler.handle as any).mockReturnValue(throwError(() => error));

    const req = new HttpRequest('GET', '/api/test');
    let caughtError: any;
    interceptor.intercept(req, mockHandler).subscribe({
      error: (err: any) => { caughtError = err; }
    });

    // refreshToken returns a Promise, so we need to flush microtasks
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(caughtError).toBeTruthy();
    expect(Tools.OnError).toHaveBeenCalled();
  });

  it('should handle null AppConfig gracefully', () => {
    mockConfigService.getConfiguration.mockReturnValue(null);
    interceptor = new ErrorInterceptor(
      mockRouter, mockTranslate, mockPageloaderService, mockConfigService, mockOAuthService
    );

    const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized', url: '/api/test' });
    (mockHandler.handle as any).mockReturnValue(throwError(() => error));

    const req = new HttpRequest('GET', '/api/test');
    let caughtError: any;
    interceptor.intercept(req, mockHandler).subscribe({
      error: (err: any) => { caughtError = err; }
    });

    expect(caughtError).toBeTruthy();
  });
});
