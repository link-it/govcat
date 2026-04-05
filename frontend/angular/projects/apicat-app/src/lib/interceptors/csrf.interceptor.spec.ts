import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CSRFInterceptor } from './csrf.interceptor';
import { HttpRequest, HttpHandler, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';

describe('CSRFInterceptor', () => {
  let interceptor: CSRFInterceptor;
  let mockHandler: HttpHandler;
  let mockTokenExtractor: any;

  beforeEach(() => {
    mockTokenExtractor = {
      getToken: vi.fn()
    };
    mockHandler = {
      handle: vi.fn().mockReturnValue(of(new HttpResponse({ status: 200 })))
    };
    interceptor = new CSRFInterceptor(mockTokenExtractor);
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('should add X-XSRF-TOKEN header when token exists', () => {
    mockTokenExtractor.getToken.mockReturnValue('csrf-token-123');
    const req = new HttpRequest('GET', '/api/test');

    interceptor.intercept(req, mockHandler);

    const handledReq = (mockHandler.handle as any).mock.calls[0][0] as HttpRequest<any>;
    expect(handledReq.headers.get('X-XSRF-TOKEN')).toBe('csrf-token-123');
  });

  it('should not add header when token is null', () => {
    mockTokenExtractor.getToken.mockReturnValue(null);
    const req = new HttpRequest('GET', '/api/test');

    interceptor.intercept(req, mockHandler);

    const handledReq = (mockHandler.handle as any).mock.calls[0][0] as HttpRequest<any>;
    expect(handledReq.headers.has('X-XSRF-TOKEN')).toBe(false);
  });

  it('should not overwrite existing X-XSRF-TOKEN header', () => {
    mockTokenExtractor.getToken.mockReturnValue('new-token');
    const req = new HttpRequest('GET', '/api/test');
    const reqWithHeader = req.clone({ headers: req.headers.set('X-XSRF-TOKEN', 'existing-token') });

    interceptor.intercept(reqWithHeader, mockHandler);

    const handledReq = (mockHandler.handle as any).mock.calls[0][0] as HttpRequest<any>;
    expect(handledReq.headers.get('X-XSRF-TOKEN')).toBe('existing-token');
  });

  it('should forward the request to the next handler', () => {
    mockTokenExtractor.getToken.mockReturnValue(null);
    const req = new HttpRequest('GET', '/api/test');

    interceptor.intercept(req, mockHandler);

    expect(mockHandler.handle).toHaveBeenCalled();
  });
});
