import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OAuthInterceptor } from './oauth.interceptor';
import { HttpRequest, HttpHandler, HttpHeaders, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

describe('OAuthInterceptor', () => {
  let interceptor: OAuthInterceptor;
  let mockConfigService: any;
  let mockAuthStorage: any;
  let mockErrorHandler: any;
  let mockModuleConfig: any;
  let mockHandler: HttpHandler;

  beforeEach(() => {
    mockConfigService = {
      getConfiguration: vi.fn().mockReturnValue({
        AppConfig: {
          GOVAPI: { HOST: '/api/v1' },
          AUTH_SETTINGS: { OAUTH: { BackdoorSpid: false } }
        }
      })
    };
    mockAuthStorage = {
      getItem: vi.fn()
    };
    mockErrorHandler = {
      handleError: vi.fn(err => { throw err; })
    };
    mockModuleConfig = null;

    mockHandler = {
      handle: vi.fn().mockReturnValue(of(new HttpResponse({ status: 200 })))
    };

    interceptor = new OAuthInterceptor(mockConfigService, mockAuthStorage, mockErrorHandler, mockModuleConfig);
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('should add Bearer token when access_token exists', () => {
    mockAuthStorage.getItem.mockReturnValue('my-token-123');
    const req = new HttpRequest('GET', '/api/v1/servizi');

    interceptor.intercept(req, mockHandler);

    const handledReq = (mockHandler.handle as any).mock.calls[0][0] as HttpRequest<any>;
    expect(handledReq.headers.get('Authorization')).toBe('Bearer my-token-123');
  });

  it('should pass through without token when no access_token', () => {
    mockAuthStorage.getItem.mockReturnValue(null);
    const req = new HttpRequest('GET', '/api/v1/servizi');

    interceptor.intercept(req, mockHandler);

    const handledReq = (mockHandler.handle as any).mock.calls[0][0] as HttpRequest<any>;
    expect(handledReq.headers.has('Authorization')).toBe(false);
  });

  it('should skip config JSON requests', () => {
    mockAuthStorage.getItem.mockReturnValue('my-token');
    const req = new HttpRequest('GET', '/assets/config/app-config.json');

    interceptor.intercept(req, mockHandler);

    const handledReq = (mockHandler.handle as any).mock.calls[0][0] as HttpRequest<any>;
    expect(handledReq.headers.has('Authorization')).toBe(false);
  });

  it('should skip when BackdoorSpid is enabled', () => {
    mockConfigService.getConfiguration.mockReturnValue({
      AppConfig: {
        GOVAPI: { HOST: '/api/v1' },
        AUTH_SETTINGS: { OAUTH: { BackdoorSpid: true } }
      }
    });
    interceptor = new OAuthInterceptor(mockConfigService, mockAuthStorage, mockErrorHandler, mockModuleConfig);

    mockAuthStorage.getItem.mockReturnValue('my-token');
    const req = new HttpRequest('GET', '/api/v1/servizi');

    interceptor.intercept(req, mockHandler);

    const handledReq = (mockHandler.handle as any).mock.calls[0][0] as HttpRequest<any>;
    expect(handledReq.headers.has('Authorization')).toBe(false);
  });

  it('should handle errors via errorHandler', () => {
    mockAuthStorage.getItem.mockReturnValue('my-token');
    const error = new Error('Unauthorized');
    (mockHandler.handle as any).mockReturnValue(throwError(() => error));
    mockErrorHandler.handleError.mockReturnValue(throwError(() => error));

    const req = new HttpRequest('GET', '/api/v1/servizi');
    let caughtError: any;
    interceptor.intercept(req, mockHandler).subscribe({
      error: (err: any) => { caughtError = err; }
    });
    expect(mockErrorHandler.handleError).toHaveBeenCalledWith(error);
    expect(caughtError).toBe(error);
  });

  it('should handle null config gracefully', () => {
    mockConfigService.getConfiguration.mockReturnValue(null);
    interceptor = new OAuthInterceptor(mockConfigService, mockAuthStorage, mockErrorHandler, mockModuleConfig);

    mockAuthStorage.getItem.mockReturnValue('my-token');
    const req = new HttpRequest('GET', '/some/url');

    interceptor.intercept(req, mockHandler);
    const handledReq = (mockHandler.handle as any).mock.calls[0][0] as HttpRequest<any>;
    expect(handledReq.headers.get('Authorization')).toBe('Bearer my-token');
  });
});
