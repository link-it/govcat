import { describe, it, expect, beforeEach } from 'vitest';
import { SafeUrlPipe } from './safe-url.pipe';

describe('SafeUrlPipe', () => {
  let pipe: SafeUrlPipe;
  let mockSanitizer: any;

  beforeEach(() => {
    mockSanitizer = {
      bypassSecurityTrustResourceUrl: (value: string) => ({ changingThisBreaksApplicationSecurity: value })
    };
    pipe = new SafeUrlPipe(mockSanitizer);
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should call bypassSecurityTrustResourceUrl with the value', () => {
    const result: any = pipe.transform('https://example.com/image.png');
    expect(result.changingThisBreaksApplicationSecurity).toBe('https://example.com/image.png');
  });

  it('should handle empty string', () => {
    const result: any = pipe.transform('');
    expect(result.changingThisBreaksApplicationSecurity).toBe('');
  });

  it('should handle data URIs', () => {
    const dataUri = 'data:image/png;base64,iVBORw0KGgo=';
    const result: any = pipe.transform(dataUri);
    expect(result.changingThisBreaksApplicationSecurity).toBe(dataUri);
  });
});
