import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpImgSrcPipe, ImageParams } from './http-img-src.pipe';
import { of, throwError } from 'rxjs';

describe('HttpImgSrcPipe', () => {
  let pipe: HttpImgSrcPipe;
  let mockHttpClient: any;
  let mockSanitizer: any;
  let mockCdr: any;

  beforeEach(() => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/mock-blob');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    mockHttpClient = {
      get: vi.fn().mockReturnValue(of({ body: new Blob(['test'], { type: 'image/png' }) }))
    };
    mockSanitizer = {
      bypassSecurityTrustUrl: vi.fn((url: string) => ({ changingThisBreaksApplicationSecurity: url }))
    };
    mockCdr = {
      markForCheck: vi.fn()
    };

    HttpImgSrcPipe.invalidateCache('');
    pipe = new HttpImgSrcPipe(mockHttpClient, mockSanitizer, mockCdr);
  });

  afterEach(() => {
    pipe.ngOnDestroy();
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return error image path when path is empty', () => {
    const image: ImageParams = { path: '' };
    const result = pipe.transform(image);

    expect(typeof result).toBe('string');
    expect((result as string).startsWith('data:image/svg+xml;base64,')).toBe(true);
  });

  it('should return sanitized value after HTTP resolves synchronously', () => {
    const image: ImageParams = { path: '/api/images/1' };
    const result = pipe.transform(image);

    // Mock HTTP returns synchronously, so latestValue is already set as a SafeUrl object
    expect(result).toBeTruthy();
    expect(mockSanitizer.bypassSecurityTrustUrl).toHaveBeenCalledWith('blob:http://localhost/mock-blob');
  });

  it('should trigger HTTP request with the image path', () => {
    const image: ImageParams = { path: '/api/images/1' };
    pipe.transform(image);

    expect(mockHttpClient.get).toHaveBeenCalledWith(
      '/api/images/1',
      { observe: 'response', responseType: 'blob' }
    );
  });

  it('should handle custom width and height', () => {
    const image: ImageParams = { path: '', width: '200px', height: '150px' };
    const result = pipe.transform(image) as string;

    // SVG should contain the custom dimensions
    const decoded = atob(result.replace('data:image/svg+xml;base64,', ''));
    expect(decoded).toContain('200px');
    expect(decoded).toContain('150px');
  });

  it('should use default dimensions when not provided', () => {
    const image: ImageParams = { path: '' };
    const result = pipe.transform(image) as string;

    const decoded = atob(result.replace('data:image/svg+xml;base64,', ''));
    expect(decoded).toContain('100%');
    expect(decoded).toContain('auto');
  });

  it('should cleanup on destroy', () => {
    const image: ImageParams = { path: '/api/images/1' };
    pipe.transform(image);

    expect(() => pipe.ngOnDestroy()).not.toThrow();
  });

  it('should handle HTTP error gracefully', () => {
    mockHttpClient.get.mockReturnValue(throwError(() => new Error('Network error')));

    const image: ImageParams = { path: '/api/images/1' };
    pipe.transform(image);

    // Should not throw, error is handled internally
    expect(pipe).toBeTruthy();
  });

  it('should export ImageParams type', () => {
    const params: ImageParams = { path: '/test', width: '100px', height: '50px' };
    expect(params.path).toBe('/test');
    expect(params.width).toBe('100px');
    expect(params.height).toBe('50px');
  });
});
