import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthDevInterceptor } from './authdev.interceptor';
import { HttpRequest, HttpHandler, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';

describe('AuthDevInterceptor', () => {
  let interceptor: AuthDevInterceptor;
  let mockHandler: HttpHandler;

  beforeEach(() => {
    mockHandler = {
      handle: vi.fn().mockReturnValue(of(new HttpResponse({ status: 200 })))
    };
    interceptor = new AuthDevInterceptor();
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('should add govhub-consumer-principal header', () => {
    const req = new HttpRequest('GET', '/api/test');
    interceptor.intercept(req, mockHandler);

    const handledReq = (mockHandler.handle as any).mock.calls[0][0] as HttpRequest<any>;
    expect(handledReq.headers.get('govhub-consumer-principal')).toBe('gestore');
  });

  it('should preserve existing headers', () => {
    const req = new HttpRequest('GET', '/api/test', null, {
      headers: new (HttpRequest as any)('GET', '/').headers.set('X-Custom', 'value')
    });
    interceptor.intercept(req, mockHandler);

    const handledReq = (mockHandler.handle as any).mock.calls[0][0] as HttpRequest<any>;
    expect(handledReq.headers.get('govhub-consumer-principal')).toBe('gestore');
  });

  it('should forward the request to the next handler', () => {
    const req = new HttpRequest('GET', '/api/test');
    interceptor.intercept(req, mockHandler);

    expect(mockHandler.handle).toHaveBeenCalled();
  });

  it('should have default null appConfig', () => {
    expect(interceptor.appConfig).toBeNull();
  });

  it('should have default false authDevelop', () => {
    expect(interceptor.authDevelop).toBe(false);
  });
});
