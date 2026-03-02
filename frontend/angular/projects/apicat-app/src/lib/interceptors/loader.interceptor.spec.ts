import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoaderInterceptor } from './loader.interceptor';
import { HttpRequest, HttpHandler, HttpResponse, HttpSentEvent } from '@angular/common/http';
import { of } from 'rxjs';

describe('LoaderInterceptor', () => {
  let interceptor: LoaderInterceptor;
  let mockHandler: HttpHandler;
  let mockPageloaderService: any;

  beforeEach(() => {
    mockPageloaderService = {
      showLoader: vi.fn(),
      hideLoader: vi.fn()
    };
    mockHandler = {
      handle: vi.fn()
    };
    interceptor = new LoaderInterceptor(mockPageloaderService);
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('should hide loader on HttpResponse', () => {
    const response = new HttpResponse({ status: 200 });
    (mockHandler.handle as any).mockReturnValue(of(response));

    const req = new HttpRequest('GET', '/api/test');
    interceptor.intercept(req, mockHandler).subscribe();

    expect(mockPageloaderService.hideLoader).toHaveBeenCalled();
  });

  it('should show loader on non-HttpResponse events', () => {
    const sentEvent: HttpSentEvent = { type: 0 };
    (mockHandler.handle as any).mockReturnValue(of(sentEvent));

    const req = new HttpRequest('GET', '/api/test');
    interceptor.intercept(req, mockHandler).subscribe();

    expect(mockPageloaderService.showLoader).toHaveBeenCalled();
  });

  it('should show then hide loader for full request cycle', () => {
    const sentEvent: HttpSentEvent = { type: 0 };
    const response = new HttpResponse({ status: 200 });
    (mockHandler.handle as any).mockReturnValue(of(sentEvent, response));

    const req = new HttpRequest('GET', '/api/test');
    interceptor.intercept(req, mockHandler).subscribe();

    expect(mockPageloaderService.showLoader).toHaveBeenCalled();
    expect(mockPageloaderService.hideLoader).toHaveBeenCalled();
  });

  it('should return the event', () => {
    const response = new HttpResponse({ status: 200, body: { data: 'test' } });
    (mockHandler.handle as any).mockReturnValue(of(response));

    const req = new HttpRequest('GET', '/api/test');
    let result: any;
    interceptor.intercept(req, mockHandler).subscribe(event => {
      result = event;
    });

    expect(result).toBe(response);
  });
});
