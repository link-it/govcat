import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TimeoutInterceptor, DEFAULT_TIMEOUT } from './timeout.interceptor';
import { HttpRequest, HttpHandler, HttpResponse, HttpHeaders } from '@angular/common/http';
import { of } from 'rxjs';

describe('TimeoutInterceptor', () => {
  let interceptor: TimeoutInterceptor;
  let mockHandler: HttpHandler;
  const defaultTimeout = 30000;

  beforeEach(() => {
    mockHandler = {
      handle: vi.fn().mockReturnValue(of(new HttpResponse({ status: 200 })))
    };
    interceptor = new TimeoutInterceptor(defaultTimeout);
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('should use default timeout when no timeout header', () => {
    const req = new HttpRequest('GET', '/api/test');
    interceptor.intercept(req, mockHandler);

    expect(mockHandler.handle).toHaveBeenCalled();
  });

  it('should use timeout from header when provided', () => {
    const req = new HttpRequest('GET', '/api/test');
    const reqWithTimeout = req.clone({ headers: req.headers.set('timeout', '5000') });

    interceptor.intercept(reqWithTimeout, mockHandler);

    const handledReq = (mockHandler.handle as any).mock.calls[0][0] as HttpRequest<any>;
    expect(handledReq.headers.has('timeout')).toBe(false);
  });

  it('should remove timeout header from request', () => {
    const req = new HttpRequest('GET', '/api/test');
    const reqWithTimeout = req.clone({ headers: req.headers.set('timeout', '10000') });

    interceptor.intercept(reqWithTimeout, mockHandler);

    const handledReq = (mockHandler.handle as any).mock.calls[0][0] as HttpRequest<any>;
    expect(handledReq.headers.has('timeout')).toBe(false);
  });

  it('should pass request to next handler', () => {
    const req = new HttpRequest('GET', '/api/test');
    interceptor.intercept(req, mockHandler);

    expect(mockHandler.handle).toHaveBeenCalledWith(req);
  });

  it('should export DEFAULT_TIMEOUT injection token', () => {
    expect(DEFAULT_TIMEOUT).toBeTruthy();
  });
});
